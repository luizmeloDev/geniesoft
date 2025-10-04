const express = require('express');
const router = express.Router();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const billingManager = require('../config/billing');
const logger = require('../config/logger');
const serviceSuspension = require('../config/serviceSuspension');
const { getSetting, getSettingsWithCache, setSetting, clearSettingsCache } = require('../config/settingsManager');
const { exec } = require('child_process');
const multer = require('multer');
const upload = multer();
const ExcelJS = require('exceljs');
const { adminAuth } = require('./adminAuth');

// Garante o parsing do corpo JSON para este roteador
router.use(express.json());
// Habilita envios de formulário (application/x-www-form-urlencoded)
router.use(express.urlencoded({ extended: true }));

// Helper: valida URL base opcional (permite vazio, caso contrário, deve começar com http/https)
const isValidOptionalHttpUrl = (v) => {
    const s = String(v ?? '').trim();
    if (!s) return true;
    return /^https?:\/\//i.test(s);
};

// Middleware para obter as configurações do aplicativo
const getAppSettings = (req, res, next) => {
    req.appSettings = {
        companyHeader: getSetting('company_header', 'ISP Monitor'),
        footerInfo: getSetting('footer_info', ''),
        logoFilename: getSetting('logo_filename', 'logo.png'),
        company_slogan: getSetting('company_slogan', ''),
        company_website: getSetting('company_website', ''),
        invoice_notes: getSetting('invoice_notes', ''),
        payment_bank_name: getSetting('payment_bank_name', ''),
        payment_account_number: getSetting('payment_account_number', ''),
        payment_account_holder: getSetting('payment_account_holder', ''),
        payment_cash_address: getSetting('payment_cash_address', ''),
        payment_cash_hours: getSetting('payment_cash_hours', ''),
        contact_phone: getSetting('contact_phone', ''),
        contact_email: getSetting('contact_email', ''),
        contact_address: getSetting('contact_address', ''),
        contact_whatsapp: getSetting('contact_whatsapp', ''),
        suspension_grace_period_days: getSetting('suspension_grace_period_days', '3'),
        isolir_profile: getSetting('isolir_profile', 'isolir')
    };
    next();
};

// Painel de Faturamento Móvel
router.get('/mobile', getAppSettings, async (req, res) => {
    try {
        // Obter estatísticas básicas para o painel móvel
        res.redirect('/admin/billing/dashboard');
    } catch (error) {
        logger.error('Erro ao carregar o painel de faturamento móvel:', error);
        res.status(500).render('error', { 
            message: 'Erro ao carregar o painel de faturamento móvel',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// Gerenciamento de Clientes Móvel
router.get('/mobile/customers', getAppSettings, async (req, res) => {
    try {
        res.redirect('/admin/billing/customers');
    } catch (error) {
        logger.error('Erro ao carregar clientes móveis:', error);
        res.status(500).render('error', { 
            message: 'Erro ao carregar clientes móveis',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// Faturas Móveis
router.get('/mobile/invoices', getAppSettings, async (req, res) => {
    try {
        res.redirect('/admin/billing/invoices');
    } catch (error) {
        logger.error('Erro ao carregar faturas móveis:', error);
        res.status(500).render('error', { 
            message: 'Erro ao carregar faturas móveis',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// Pagamentos Móveis
router.get('/mobile/payments', getAppSettings, async (req, res) => {
    try {
        res.redirect('/admin/billing/payments');
    } catch (error) {
        logger.error('Erro ao carregar pagamentos móveis:', error);
        res.status(500).render('error', { 
            message: 'Erro ao carregar pagamentos móveis',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// Gerenciamento de Reset Mensal
router.post('/api/monthly-reset', adminAuth, async (req, res) => {
    try {
        console.log('🔄 Reset mensal manual solicitado...');
        const MonthlyResetSystem = require('../scripts/monthly-reset-simple');
        const resetSystem = new MonthlyResetSystem();
        const result = await resetSystem.runMonthlyReset();
        res.json({ success: true, message: 'Reset mensal concluído com sucesso', timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('Erro no reset mensal manual:', error);
        res.status(500).json({ success: false, message: 'Erro no reset mensal: ' + error.message });
    }
});

// Obter status do reset mensal
router.get('/api/monthly-reset-status', adminAuth, async (req, res) => {
    try {
        const dbPath = path.join(__dirname, '../data/billing.db');
        const db = new sqlite3.Database(dbPath);
        const lastReset = await new Promise((resolve, reject) => {
            db.get(`SELECT value FROM system_settings WHERE key = 'monthly_reset_date'`, (err, row) => {
                if (err) reject(err); else resolve(row ? row.value : null);
            });
        });
        const MonthlyResetSystem = require('../scripts/monthly-reset-simple');
        const resetSystem = new MonthlyResetSystem();
        const currentStats = await resetSystem.getCurrentStatistics();
        db.close();
        res.json({ success: true, data: { lastReset: lastReset, currentStats: currentStats, nextReset: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString() } });
    } catch (error) {
        console.error('Erro ao obter status do reset mensal:', error);
        res.status(500).json({ success: false, message: 'Erro ao obter status do reset: ' + error.message });
    }
});

// Gerenciamento de Coletor Móvel
router.get('/mobile/collector', getAppSettings, async (req, res) => {
    try {
        const dbPath = path.join(__dirname, '../data/billing.db');
        const db = new sqlite3.Database(dbPath);
        const collectors = await new Promise((resolve, reject) => {
            db.all(`
                SELECT c.*, COUNT(cp.id) as total_payments, COALESCE(SUM(cp.payment_amount), 0) as total_collected, COALESCE(SUM(cp.commission_amount), 0) as total_commission
                FROM collectors c LEFT JOIN collector_payments cp ON c.id = cp.collector_id AND cp.status = 'completed'
                GROUP BY c.id ORDER BY c.name
            `, (err, rows) => {
                if (err) reject(err);
                else {
                    const validCollectors = (rows || []).map(row => ({ ...row, commission_rate: Math.max(0, Math.min(100, parseFloat(row.commission_rate || 5))), total_payments: parseInt(row.total_payments || 0), total_collected: Math.round(parseFloat(row.total_collected || 0)), total_commission: Math.round(parseFloat(row.total_commission || 0)), name: row.name || 'Coletor Desconhecido', status: row.status || 'active' }));
                    resolve(validCollectors);
                }
            });
        });
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        const todayPayments = await new Promise((resolve, reject) => {
            db.get(`SELECT COALESCE(SUM(payment_amount), 0) as total FROM collector_payments WHERE collected_at >= ? AND collected_at < ? AND status = 'completed'`, [startOfDay.toISOString(), endOfDay.toISOString()], (err, row) => {
                if (err) reject(err); else resolve(Math.round(parseFloat(row ? row.total : 0)));
            });
        });
        db.close();
        res.render('admin/billing/mobile-collector', { title: 'Coletor - Móvel', appSettings: req.appSettings, collectors: collectors, statistics: { totalCollectors: collectors.length, todayPayments: todayPayments } });
    } catch (error) {
        logger.error('Erro ao carregar coletores móveis:', error);
        res.status(500).render('error', { message: 'Erro ao carregar coletores móveis', error: process.env.NODE_ENV === 'development' ? error : {} });
    }
});

// API: Obter faturas do cliente para pagamento do coletor
router.get('/api/customer-invoices/:customerId', adminAuth, async (req, res) => {
    try {
        const { customerId } = req.params;
        const dbPath = path.join(__dirname, '../data/billing.db');
        const db = new sqlite3.Database(dbPath);
        const invoices = await new Promise((resolve, reject) => {
            db.all(`SELECT i.*, p.name as package_name FROM invoices i LEFT JOIN packages p ON i.package_id = p.id WHERE i.customer_id = ? AND i.status = 'unpaid' ORDER BY i.created_at DESC`, [customerId], (err, rows) => {
                if (err) reject(err); else resolve(rows || []);
            });
        });
        db.close();
        res.json({ success: true, data: invoices });
    } catch (error) {
        console.error('Erro ao obter faturas do cliente:', error);
        res.status(500).json({ success: false, message: 'Erro ao obter faturas do cliente: ' + error.message });
    }
});

// API: Enviar pagamento do coletor
router.post('/api/collector-payment', adminAuth, async (req, res) => {
    // ... (código existente)
});

// Entrada de Pagamento do Coletor Móvel
router.get('/mobile/collector/payment', getAppSettings, async (req, res) => {
    // ... (código existente)
});

// Relatórios do Coletor
router.get('/collector-reports', getAppSettings, async (req, res) => {
    // ... (código existente)
});

// Detalhes do Coletor
router.get('/collector-details/:id', getAppSettings, async (req, res) => {
    // ... (código existente)
});

// Remessa do Coletor
router.get('/collector-remittance', getAppSettings, async (req, res) => {
    // ... (código existente)
});

// API: Registrar Remessa do Coletor
router.post('/api/collector-remittance', adminAuth, async (req, res) => {
    // ... (código existente)
});

// Gerenciamento de Mapa Móvel
router.get('/mobile/map', getAppSettings, async (req, res) => {
    res.redirect('/admin/billing/mapping');
});

// Redirecionamentos para cable-network
router.get('/cables', adminAuth, (req, res) => res.redirect('/admin/cable-network/cables'));
router.get('/odp', adminAuth, (req, res) => res.redirect('/admin/cable-network/odp'));

// Painel de Faturamento
router.get('/dashboard', getAppSettings, async (req, res) => {
    try {
        await billingManager.cleanupDataConsistency();
        const stats = await billingManager.getBillingStats();
        const overdueInvoices = await billingManager.getOverdueInvoices();
        const recentInvoices = await billingManager.getInvoices();
        res.render('admin/billing/dashboard', { title: 'Painel de Faturamento', stats, overdueInvoices: overdueInvoices.slice(0, 10), recentInvoices: recentInvoices.slice(0, 10), appSettings: req.appSettings });
    } catch (error) {
        logger.error('Erro ao carregar o painel de faturamento:', error);
        res.status(500).render('error', { message: 'Falha ao carregar o painel de faturamento', error: error.message });
    }
});

// Relatório Financeiro
router.get('/financial-report', getAppSettings, async (req, res) => {
    // ... (código existente)
});

// API para dados do relatório financeiro
router.get('/api/financial-report', async (req, res) => {
    // ... (código existente)
});

// API para limpeza de dados de consistência
router.post('/api/cleanup-data', adminAuth, async (req, res) => {
    // ... (código existente)
});

// API para obter estatísticas em tempo real
router.get('/api/stats', adminAuth, async (req, res) => {
    // ... (código existente)
});

// API de resumo de receita
router.get('/api/revenue/summary', adminAuth, async (req, res) => {
    // ... (código existente)
});

// Página Todas as Faturas (Lista de Faturas)
router.get('/invoice-list', getAppSettings, async (req, res) => {
    try {
        res.render('admin/billing/invoice-list', {
            title: 'Todas as Faturas',
            appSettings: req.appSettings,
            // Os dados agora serão carregados via API
            filters: {
                status: req.query.status || '',
                customer_username: req.query.customer_username || '',
                type: req.query.type || ''
            }
        });
    } catch (error) {
        logger.error('Erro ao carregar a lista de faturas:', error);
        res.status(500).render('error', {
            message: 'Erro ao carregar a lista de faturas',
            error: error.message,
            appSettings: req.appSettings
        });
    }
});

// NOVA ROTA DE API PARA DADOS DA LISTA DE FATURAS
router.get('/api/invoice-list', adminAuth, async (req, res) => {
    try {
        const { page = 1, limit = 50, status, customer_username, type } = req.query;
        const offset = (page - 1) * limit;

        const filters = {
            status: status || null,
            customer_username: customer_username || null,
            type: type || null
        };

        const invoices = await billingManager.getInvoices(filters, limit, offset);
        const totalCount = await billingManager.getInvoicesCount(filters);
        const stats = await billingManager.getInvoiceStats(filters);

        res.json({
            success: true,
            data: {
                invoices,
                stats,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalCount / limit),
                    totalCount,
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        logger.error('Erro ao buscar dados da lista de faturas via API:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Falha ao buscar dados das faturas', 
            error: error.message 
        });
    }
});

// Página Faturas por Tipo
router.get('/invoices-by-type', adminAuth, async (req, res) => {
    // ... (código existente)
});

// API para limpeza de voucher manual
router.post('/api/voucher-cleanup', adminAuth, async (req, res) => {
    // ... (código existente)
});

// API para ver faturas de voucher expiradas
router.get('/api/expired-vouchers', adminAuth, async (req, res) => {
    // ... (código existente)
});

// Página de Resumo Mensal
router.get('/monthly-summary', adminAuth, async (req, res) => {
    // ... (código existente)
});

// ... (restante do código)

module.exports = router;
