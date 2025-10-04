
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { adminAuth } = require('./adminAuth');
const { getSetting } = require('../config/settingsManager');
const logger = require('../config/logger');

// Conexão com o banco de dados
const dbPath = path.join(__dirname, '../data/billing.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        logger.error('Não foi possível conectar ao banco de dados', err);
    } else {
        logger.info('Conectado ao banco de dados de faturamento');
    }
});

const billingManager = require('../config/billing');


router.get('/', adminAuth, async (req, res) => {
    try {
        res.render('admin/installation-jobs', {
            title: 'Gerenciar Agendamentos de Instalação',
            user: req.user,
            settings: req.settings,
            page: 'installations'
        });
    } catch (error) {
        logger.error('Erro ao carregar agendamentos de instalação:', error);
        res.status(500).send('Erro Interno do Servidor');
    }
});


router.get('/create', adminAuth, async (req, res) => {
    try {
        const packages = await billingManager.getPackages();
        const technicians = await new Promise((resolve, reject) => {
            db.all('SELECT id, name, phone FROM technicians WHERE is_active = 1 ORDER BY name', (err, rows) => {
                if (err) reject(err); else resolve(rows);
            });
        });

        res.render('admin/installation-job-form', {
            title: 'Criar Novo Agendamento de Instalação',
            packages,
            technicians,
            job: null,
            user: req.user,
            settings: req.settings,
            page: 'installations'
        });
    } catch (error) {
        logger.error('Erro ao carregar formulário de criação:', error);
        res.status(500).send('Erro ao carregar o formulário.');
    }
});


router.post('/create', adminAuth, async (req, res) => {
    const {
        customer_id,
        newCustomerName,
        newCustomerPhone,
        newCustomerAddress,
        package_id,
        installation_date,
        installation_time,
        assigned_technician_id,
        priority,
        notes
    } = req.body;

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        let finalCustomerId = customer_id;

        const processJobCreation = () => {
            if (!finalCustomerId) {
                db.run('ROLLBACK');
                return res.status(400).json({ success: false, message: 'A identificação do cliente é obrigatória.' });
            }
            if (!package_id) {
                db.run('ROLLBACK');
                return res.status(400).json({ success: false, message: 'A seleção de um plano é obrigatória.' });
            }

            const jobData = {
                customer_id: finalCustomerId,
                package_id: package_id,
                installation_date: installation_date,
                installation_time: installation_time,
                assigned_technician_id: assigned_technician_id || null,
                status: 'pending',
                priority: priority || 'normal',
                notes: notes || '',
                created_by: req.user.username
            };

            const insertJobSql = `
                INSERT INTO installation_jobs (
                    customer_id, package_id, installation_date, installation_time, 
                    assigned_technician_id, status, priority, notes, created_at, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, DATETIME('now'), ?)
            `;

            db.run(insertJobSql, [
                jobData.customer_id, jobData.package_id, jobData.installation_date, jobData.installation_time,
                jobData.assigned_technician_id, jobData.status, jobData.priority, jobData.notes, jobData.created_by
            ], function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    logger.error('Falha ao criar agendamento:', err);
                    return res.status(500).json({ success: false, message: `Falha ao criar o agendamento: ${err.message}` });
                }
                db.run('COMMIT');
                res.json({ success: true, message: 'Agendamento de instalação criado com sucesso!' });
            });
        };

        if (!finalCustomerId && newCustomerName) {
            if (!newCustomerName || !newCustomerPhone || !newCustomerAddress) {
                db.run('ROLLBACK');
                return res.status(400).json({ success: false, message: 'Para novos clientes, nome, telefone e endereço são obrigatórios.' });
            }

            const insertCustomerSql = `
                INSERT INTO customers (name, phone, address, status, created_at, latitude, longitude)
                VALUES (?, ?, ?, 'pending_installation', DATETIME('now'), NULL, NULL)
            `;
            db.run(insertCustomerSql, [newCustomerName, newCustomerPhone, newCustomerAddress], function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    logger.error('Falha ao criar novo cliente:', err);
                    return res.status(500).json({ success: false, message: `Falha ao criar novo cliente: ${err.message}` });
                }
                finalCustomerId = this.lastID;
                processJobCreation();
            });
        } else {
            processJobCreation();
        }
    });
});


module.exports = router;
