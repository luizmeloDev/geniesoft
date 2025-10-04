const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/billing.db'); // Conexão direta com o banco de dados
const { typesenseClient, isTypesenseEnabled } = require('../config/typesenseClient');
const logger = require('../config/logger');

// Rota de busca de cliente para o mapa
router.get('/api/clients/search', (req, res) => {
    const { type, value } = req.query;

    if (!type || !value) {
        return res.status(400).json({ success: false, message: 'Parâmetros de busca \'type\' e \'value\' são obrigatórios.' });
    }

    let column = '';
    switch (type) {
        case 'name':
            column = 'name';
            break;
        case 'cpf':
            column = 'cpf';
            break;
        case 'phone':
            column = 'phone';
            break;
        case 'code':
            column = 'id'; // Assumindo que 'código do cliente' é o ID
            break;
        default:
            return res.status(400).json({ success: false, message: 'Tipo de busca inválido.' });
    }

    const query = `SELECT id, name, address, latitude, longitude FROM db_clientes WHERE ${column} LIKE ? LIMIT 1`;
    const searchValue = type === 'name' ? `%${value}%` : value;

    db.get(query, [searchValue], (err, row) => {
        if (err) {
            logger.error(`[DB_SEARCH_CLIENT] Erro ao buscar cliente: ${err.message}`);
            return res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
        }

        if (row) {
            res.json({ success: true, client: row });
        } else {
            res.status(404).json({ success: false, message: 'Cliente não encontrado.' });
        }
    });
});

// Rota de busca geral (Typesense)
router.get('/', async (req, res) => {
    if (!isTypesenseEnabled()) {
        return res.status(503).json({ error: 'Serviço de busca não está habilitado.' });
    }

    const { q } = req.query;
    if (!q) {
        return res.status(400).json({ error: 'O parâmetro de busca \'q\' é obrigatório.' });
    }

    const searchParameters = {
        q,
        query_by: 'search_terms',
        per_page: 50,
    };

    try {
        const searchResults = await typesenseClient.collections('locations').documents().search(searchParameters);
        const results = searchResults.hits.map(hit => {
            const doc = hit.document;
            const details = JSON.parse(doc.details || '{}');
            return { id: doc.id, type: doc.type, name: doc.name, location: doc.location, ...details };
        });
        res.json(results);
    } catch (error) {
        logger.error('[TYPESENSE_SEARCH] Erro ao buscar:', error);
        res.status(500).json({ error: 'Ocorreu um erro ao processar a sua busca.' });
    }
});

module.exports = router;
