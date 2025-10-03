const express = require('express');
const router = express.Router();
const { typesenseClient, isTypesenseEnabled } = require('../config/typesenseClient');
const logger = require('../config/logger');

// Rota de busca principal
router.get('/', async (req, res) => {
  if (!isTypesenseEnabled()) {
    return res.status(503).json({ error: 'Serviço de busca não está habilitado.' });
  }

  const { q } = req.query; // Termo de busca

  if (!q) {
    return res.status(400).json({ error: 'O parâmetro de busca \'q\' é obrigatório.' });
  }

  const searchParameters = {
    q,
    query_by: 'search_terms', // Pesquisar nos campos definidos
    per_page: 50, // Limitar a 50 resultados
  };

  try {
    const searchResults = await typesenseClient.collections('locations').documents().search(searchParameters);
    
    const results = searchResults.hits.map(hit => {
        const doc = hit.document;
        const details = JSON.parse(doc.details || '{}');
        return {
            id: doc.id,
            type: doc.type,
            name: doc.name,
            location: doc.location,
            ...details
        };
    });

    res.json(results);

  } catch (error) {
    logger.error('[TYPESENSE_SEARCH] Erro ao buscar:', error);
    res.status(500).json({ error: 'Ocorreu um erro ao processar a sua busca.' });
  }
});

module.exports = router;
