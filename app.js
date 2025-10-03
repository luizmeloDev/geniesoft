const express = require('express');
const path = require('path');
const axios = require('axios');
const i18n = require('i18n');
const logger = require('./config/logger');
const whatsapp = require('./config/whatsapp');
const { monitorPPPoEConnections } = require('./config/mikrotik');
const fs = require('fs');
const session = require('express-session');
const { getSetting } = require('./config/settingsManager');

i18n.configure({
  locales: ['en', 'id', 'pt'],
  directory: path.join(__dirname, 'locales'),
  defaultLocale: 'pt',
  cookie: 'i18n',
  autoReload: true,
  objectNotation: true,
});

// Importar agendador de faturas
const invoiceScheduler = require('./config/scheduler');

// Importar configuração automática do GenieACS para desenvolvimento (DESABILITADO - usando interface web)
// const { autoGenieACSSetup } = require('./config/autoGenieACSSetup');

// Importar serviço de sincronização de técnicos para hot-reload
const technicianSync = {
    start() {
        const fs = require('fs');
        const sqlite3 = require('sqlite3').verbose();
        const { getSettingsWithCache } = require('./config/settingsManager');
        
        const db = new sqlite3.Database('./data/billing.db');
        
        const sync = () => {
            try {
                const settings = getSettingsWithCache();
                Object.keys(settings).filter(k => k.startsWith('technician_numbers.')).forEach(k => {
                    const phone = settings[k];
                    if (phone) {
                        db.run('INSERT OR IGNORE INTO technicians (phone, name, role, is_active, created_at) VALUES (?, ?, "technician", 1, datetime("now"))', 
                            [phone, `Tecnico ${phone.slice(-4)}`]);
                    }
                });
                console.log('📱 Números de técnicos sincronizados a partir de settings.json');
            } catch (e) {
                console.error('Erro de sincronização:', e.message);
            }
        };
        
        fs.watchFile('settings.json', { interval: 1000 }, sync);
        sync(); // Sincronização inicial
        console.log('🔄 Sincronização automática de técnicos ativada - alterações em settings.json atualizarão automaticamente os técnicos');
    }
};

// Iniciar serviço de sincronização de técnicos
technicianSync.start();

// Inicializar aplicação Express
const app = express();

// Importar rota adminAuth
const { router: adminAuthRouter, adminAuth } = require('./routes/adminAuth');

// Importar middleware para controle de acesso (deve ser importado antes de usar)
const { blockTechnicianAccess } = require('./middleware/technicianAccessControl');

// Middleware básico - Otimizado
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Arquivos estáticos com cache
app.use('/public', express.static(path.join(__dirname, 'public'), {
  maxAge: '1h', // Cache de arquivos estáticos por 1 hora
  etag: true
}));
app.use(session({
  secret: 'segredo-do-seu-portal', // Substitua por uma string aleatória segura
  resave: false,
  saveUninitialized: false, // Otimizado: não salva sessões vazias
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    httpOnly: true
  },
  name: 'admin_session' // Nome da sessão personalizada
}));

// Rota especial para login móvel (deve vir antes de todas as rotas de admin)
app.get('/admin/login/mobile', (req, res) => {
    try {
        const { getSettingsWithCache } = require('./config/settingsManager');
        const appSettings = getSettingsWithCache();
        
        console.log('🔍 Renderizando página de login móvel...');
        res.render('admin/mobile-login', { 
            error: null,
            success: null,
            appSettings: appSettings
        });
    } catch (error) {
        console.error('❌ Erro ao renderizar login móvel:', error);
        res.status(500).send('Erro ao carregar a página de login móvel');
    }
});

// Rota de teste para depuração
app.get('/admin/test', (req, res) => {
    res.json({ message: 'Rotas de admin funcionando!', timestamp: new Date().toISOString() });
});

// POST para login móvel
app.post('/admin/login/mobile', async (req, res) => {
    try {
        const { username, password, remember } = req.body;
        const { getSetting } = require('./config/settingsManager');
        
        const credentials = {
            username: getSetting('admin_username', 'admin'),
            password: getSetting('admin_password', 'admin')
        };

        if (!username || !password) {
            return res.render('admin/mobile-login', { 
                error: 'Nome de usuário e senha devem ser preenchidos!',
                success: null,
                appSettings: { companyHeader: 'ISP Monitor' }
            });
        }

        if (username === credentials.username && password === credentials.password) {
            req.session.isAdmin = true;
            req.session.adminUsername = username;

            if (remember) {
                req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 dias
            }

            // Redirecionar para o painel móvel
            res.redirect('/admin/billing/mobile');
        } else {
            res.render('admin/mobile-login', { 
                error: 'Nome de usuário ou senha incorretos!',
                success: null,
                appSettings: { companyHeader: 'ISP Monitor' }
            });
        }
    } catch (error) {
        console.error('Erro de login:', error);
        res.render('admin/mobile-login', { 
            error: 'Ocorreu um erro durante o login!',
            success: null,
            appSettings: { companyHeader: 'ISP Monitor' }
        });
    }
});

// Redirecionamento para login móvel
app.get('/admin/mobile', (req, res) => {
    res.redirect('/admin/login/mobile');
});

// Usar a rota adminAuth para /admin
app.use('/admin', adminAuthRouter);

// Importar e usar a rota adminDashboard
const adminDashboardRouter = require('./routes/adminDashboard');
app.use('/admin', blockTechnicianAccess, adminDashboardRouter);

// Importar e usar a rota adminGenieacs
const adminGenieacsRouter = require('./routes/adminGenieacs');
app.use('/admin', blockTechnicianAccess, adminGenieacsRouter);

// Importar e usar a rota adminMappingNew
const adminMappingNewRouter = require('./routes/adminMappingNew');
app.use('/admin', blockTechnicianAccess, adminMappingNewRouter);

// Importar e usar a rota adminMikrotik
const adminMikrotikRouter = require('./routes/adminMikrotik');
app.use('/admin', blockTechnicianAccess, adminMikrotikRouter);

// Importar e usar a rota adminHotspot
const adminHotspotRouter = require('./routes/adminHotspot');
app.use('/admin/hotspot', blockTechnicianAccess, adminHotspotRouter);

// Importar e usar a rota adminSetting
const { router: adminSettingRouter } = require('./routes/adminSetting');
app.use('/admin/settings', blockTechnicianAccess, adminAuth, adminSettingRouter);

// Importar e usar a rota configValidation
const configValidationRouter = require('./routes/configValidation');
app.use('/admin/config', blockTechnicianAccess, configValidationRouter);

// Importar e usar a rota adminTroubleReport
const adminTroubleReportRouter = require('./routes/adminTroubleReport');
app.use('/admin/trouble', blockTechnicianAccess, adminAuth, adminTroubleReportRouter);

// Importar e usar a rota adminBilling (movida para baixo para não interferir na rota de login)
const adminBillingRouter = require('./routes/adminBilling');
app.use('/admin/billing', blockTechnicianAccess, adminAuth, adminBillingRouter);

// Importar e usar a rota adminInstallationJobs
const adminInstallationJobsRouter = require('./routes/adminInstallationJobs');
app.use('/admin/installations', blockTechnicianAccess, adminAuth, adminInstallationJobsRouter);

// Importar e usar a rota adminTechnicians
const adminTechniciansRouter = require('./routes/adminTechnicians');
app.use('/admin/technicians', blockTechnicianAccess, adminAuth, adminTechniciansRouter);

// Importar e usar a rota agentAuth
const { router: agentAuthRouter } = require('./routes/agentAuth');
app.use('/agent', agentAuthRouter);

// Importar e usar a rota agent
const agentRouter = require('./routes/agent');
app.use('/agent', agentRouter);

// Importar e usar a rota adminAgents
const adminAgentsRouter = require('./routes/adminAgents');
app.use('/admin', blockTechnicianAccess, adminAuth, adminAgentsRouter);

// Importar e usar a rota adminVoucherPricing
const adminVoucherPricingRouter = require('./routes/adminVoucherPricing');
app.use('/admin/voucher-pricing', blockTechnicianAccess, adminAuth, adminVoucherPricingRouter);

// Importar e usar a rota adminCableNetwork
const adminCableNetworkRouter = require('./routes/adminCableNetwork');
app.use('/admin/cable-network', blockTechnicianAccess, adminAuth, adminCableNetworkRouter);

// Importar e usar a rota adminCollectors
const adminCollectorsRouter = require('./routes/adminCollectors');
app.use('/admin/collectors', blockTechnicianAccess, adminCollectorsRouter);

// Importar e usar a rota de gerenciamento de cache
const cacheManagementRouter = require('./routes/cacheManagement');
app.use('/admin/cache', blockTechnicianAccess, cacheManagementRouter);

// Importar e usar a rota de pagamento
const paymentRouter = require('./routes/payment');
app.use('/payment', paymentRouter);

// Importar e usar a rota testTroubleReport para depuração
const testTroubleReportRouter = require('./routes/testTroubleReport');
app.use('/test/trouble', testTroubleReportRouter);

// Importar e usar a rota de relatório de problemas para clientes
const troubleReportRouter = require('./routes/troubleReport');
app.use('/customer/trouble', troubleReportRouter);

// Importar e usar a rota pública de vouchers
const { router: publicVoucherRouter } = require('./routes/publicVoucher');
app.use('/voucher', publicVoucherRouter);

// Importar e usar a rota de ferramentas públicas
const publicToolsRouter = require('./routes/publicTools');
app.use('/tools', publicToolsRouter);

// Adicionar endpoint de webhook para pagamento de vouchers
app.use('/webhook/voucher', publicVoucherRouter);

// Importar e usar a rota da API do painel de tráfego
const apiDashboardRouter = require('./routes/apiDashboard');
app.use('/api', apiDashboardRouter);

// Constantes
const VERSION = '1.0.0';

// Variável global para armazenar o status da conexão do WhatsApp
// (Mantido, pois é um status de tempo de execução)
global.whatsappStatus = {
    connected: false,
    qrCode: null,
    phoneNumber: null,
    connectedSince: null,
    status: 'disconnected'
};

// REMOVER global.appSettings
// Garantir que o diretório da sessão do WhatsApp exista
const sessionDir = getSetting('whatsapp_session_path', './whatsapp-session');
if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
    logger.info(`Diretório da sessão do WhatsApp criado: ${sessionDir}`);
}

// Rota para verificação de saúde
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        version: VERSION,
        whatsapp: global.whatsappStatus.status
    });
});

// Rota para obter o status do WhatsApp
app.get('/whatsapp/status', (req, res) => {
    res.json({
        status: global.whatsappStatus.status,
        connected: global.whatsappStatus.connected,
        phoneNumber: global.whatsappStatus.phoneNumber,
        connectedSince: global.whatsappStatus.connectedSince
    });
});

// Redirecionar a raiz para o portal do cliente
app.get('/', (req, res) => {
  res.redirect('/customer/login');
});

// Importar módulos de monitoramento PPPoE
const pppoeMonitor = require('./config/pppoe-monitor');
const pppoeCommands = require('./config/pppoe-commands');

// Importar módulo de comandos GenieACS
const genieacsCommands = require('./config/genieacs-commands');

// Importar módulo de comandos MikroTik
const mikrotikCommands = require('./config/mikrotik-commands');

// Importar módulo RX Power Monitor
const rxPowerMonitor = require('./config/rxPowerMonitor');

// Adicionar view engine e estáticos
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
// Ícones de placeholder para evitar 404 antes que os ativos reais sejam carregados
try {
  const staticIcons = require('./routes/staticIcons');
  app.use('/', staticIcons);
} catch (e) {
  logger.warn('Rota staticIcons não carregada:', e.message);
}
// Montar portal do cliente
const customerPortal = require('./routes/customerPortal');
app.use('/customer', customerPortal);

// Montar portal de faturamento do cliente
const customerBillingRouter = require('./routes/customerBilling');
app.use('/customer/billing', customerBillingRouter);

// Importar e usar a rota do portal de técnicos
const { router: technicianAuthRouter } = require('./routes/technicianAuth');
app.use('/technician', technicianAuthRouter);
// Alias em português para técnico
app.use('/tecnico', technicianAuthRouter);

// Importar e usar a rota do painel de técnicos
const technicianDashboardRouter = require('./routes/technicianDashboard');
app.use('/technician', technicianDashboardRouter);
// Alias em português para painel de técnico
app.use('/tecnico', technicianDashboardRouter);

// Importar e usar a rota da rede de cabos do técnico
const technicianCableNetworkRouter = require('./routes/technicianCableNetwork');
app.use('/technician', technicianCableNetworkRouter);
// Alias em português para a rede de cabos do técnico
app.use('/tecnico', technicianCableNetworkRouter);

// Página de Isolamento - exibe informações de settings.json e resolve o nome automaticamente
app.get('/isolir', async (req, res) => {
    try {
        const { getSettingsWithCache, getSetting } = require('./config/settingsManager');
        const billingManager = require('./config/billing');

        const settings = getSettingsWithCache();
        const companyHeader = getSetting('company_header', 'GEMBOK');
        const adminWA = getSetting('admins.0', '6281234567890'); // formato 62...
        const adminDisplay = adminWA && adminWA.startsWith('62') ? ('0' + adminWA.slice(2)) : (adminWA || '-');

        // Resolver nome do cliente automaticamente: ordem de prioridade -> query.nome -> nome de usuário PPPoE -> sessão -> '-' 
        let customerName = (req.query.nome || req.query.name || '').toString().trim();
        if (!customerName) {
            // Tentar a partir do nome de usuário do cliente da sessão
            const sessionUsername = req.session && (req.session.customer_username || req.session.username);
            if (sessionUsername) {
                try {
                    const c = await billingManager.getCustomerByUsername(sessionUsername);
                    if (c && c.name) customerName = c.name;
                } catch {}
            }
        }
        if (!customerName) {
            // Tentar a partir do nome de usuário PPPoE (query pppoe / username)
            const qUser = (req.query.pppoe || req.query.username || '').toString().trim();
            if (qUser) {
                try {
                    const c = await billingManager.getCustomerByPPPoE(qUser);
                    if (c && c.name) customerName = c.name;
                } catch {}
            }
        }
        if (!customerName) {
            // Tentar a partir do número de telefone (query phone) como fallback
            const qPhone = (req.query.phone || req.query.nohp || '').toString().trim();
            if (qPhone) {
                try {
                    const c = await billingManager.getCustomerByPhone(qPhone);
                    if (c && c.name) customerName = c.name;
                } catch {}
            }
        }
        if (!customerName) customerName = 'Cliente';

        // Caminho do logotipo de settings.json (servido via padrão /public ou /storage)
        const logoFile = settings.logo_filename || 'logo.png';
        const logoPath = `/public/img/${logoFile}`;

        // Contas de pagamento de settings.json (transferência bancária e dinheiro)
        const paymentAccounts = settings.payment_accounts || {};

        res.render('isolir', {
            companyHeader,
            adminWA,
            adminDisplay,
            customerName: customerName.slice(0, 64),
            logoPath,
            paymentAccounts,
            encodeURIComponent
        });
    } catch (error) {
        console.error('Erro ao renderizar a página de isolamento:', error);
        res.status(500).send('Falha ao carregar a página de isolamento');
    }
});

// Importar e usar a rota do cobrador
const { router: collectorAuthRouter } = require('./routes/collectorAuth');
app.use('/collector', collectorAuthRouter);

// Importar e usar a rota do painel do cobrador
const collectorDashboardRouter = require('./routes/collectorDashboard');
app.use('/collector', collectorDashboardRouter);

// Inicializar monitoramento do WhatsApp e PPPoE
try {
    whatsapp.connectToWhatsApp().then(sock => {
        if (sock) {
            // Definir instância do sock para o whatsapp
            whatsapp.setSock(sock);

            // Definir instância do sock para o monitoramento PPPoE
            pppoeMonitor.setSock(sock);

            // Inicializar Comandos do WhatsApp do Agente
            const AgentWhatsAppIntegration = require('./config/agentWhatsAppIntegration');
            const agentWhatsApp = new AgentWhatsAppIntegration(whatsapp);
            agentWhatsApp.initialize();
            
            console.log('🤖 Comandos do WhatsApp do Agente inicializados');
            pppoeCommands.setSock(sock);

            // Definir instância do sock para os comandos GenieACS
            genieacsCommands.setSock(sock);

            // Definir instância do sock para os comandos MikroTik
            mikrotikCommands.setSock(sock);

            // Definir instância do sock para o RX Power Monitor
            rxPowerMonitor.setSock(sock);

            // Definir instância do sock para o relatório de problemas
            const troubleReport = require('./config/troubleReport');
            troubleReport.setSockInstance(sock);

            logger.info('WhatsApp conectado com sucesso');

            // Inicializar monitoramento PPPoE se o MikroTik estiver configurado
            if (getSetting('mikrotik_host') && getSetting('mikrotik_user') && getSetting('mikrotik_password')) {
                pppoeMonitor.initializePPPoEMonitoring().then(() => {
                    logger.info('Monitoramento PPPoE inicializado');
                }).catch(err => {
                    logger.error('Erro ao inicializar o monitoramento PPPoE:', err);
                });
            }

            // Inicializar Gerenciador de Intervalos (substitui sistemas de monitoramento individuais)
            try {
                const intervalManager = require('./config/intervalManager');
                intervalManager.initialize();
                logger.info('Gerenciador de Intervalos inicializado com todos os sistemas de monitoramento');
            } catch (err) {
                logger.error('Erro ao inicializar o Gerenciador de Intervalos:', err);
            }
        }
    }).catch(err => {
        logger.error('Erro ao conectar ao WhatsApp:', err);
    });

    // Iniciar monitoramento PPPoE antigo se configurado (fallback)
    if (getSetting('mikrotik_host') && getSetting('mikrotik_user') && getSetting('mikrotik_password')) {
        monitorPPPoEConnections().catch(err => {
            logger.error('Erro ao iniciar o monitoramento PPPoE legado:', err);
        });
    }
} catch (error) {
    logger.error('Erro ao inicializar os serviços:', error);
}

// Adicionar um atraso maior para reconectar ao WhatsApp
const RECONNECT_DELAY = 30000; // 30 segundos

// Função para iniciar o servidor apenas na porta configurada em settings.json
function startServer(portToUse) {
    // Garantir que a porta seja um número
    const port = parseInt(portToUse);
    if (isNaN(port) || port < 1 || port > 65535) {
        logger.error(`Porta inválida: ${portToUse}`);
        process.exit(1);
    }
    
    logger.info(`Iniciando o servidor na porta configurada: ${port}`);
    logger.info(`A porta foi obtida de settings.json - não há fallback para portas alternativas`);
    
    // Usar apenas a porta de settings.json, sem fallback
    try {
        const server = app.listen(port, () => {
            logger.info(`✅ Servidor iniciado com sucesso na porta ${port}`);
            logger.info(`🌐 Portal Web disponível em: http://localhost:${port}`);
            logger.info(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
            // Atualizar global.appSettings.port com a porta usada com sucesso
            // global.appSettings.port = port.toString(); // Remover isso
        }).on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                logger.error(`❌ ERRO: A porta ${port} já está em uso por outra aplicação!`);
                logger.error(`💡 Solução: Pare a aplicação que está usando a porta ${port} ou altere a porta em settings.json`);
                logger.error(`🔍 Verifique a aplicação que está usando a porta: netstat -ano | findstr :${port}`);
            } else {
                logger.error('❌ Erro ao iniciar o servidor:', err.message);
            }
            process.exit(1);
        });
    } catch (error) {
        logger.error(`❌ Ocorreu um erro ao iniciar o servidor:`, error.message);
        process.exit(1);
    }
}

// Iniciar o servidor com a porta de settings.json
const port = getSetting('server_port', 4555);
logger.info(`Tentando iniciar o servidor na porta configurada: ${port}`);

// Iniciar o servidor com a porta da configuração
startServer(port);

// Configuração automática do DNS GenieACS para desenvolvimento (DESABILITADO - usando interface web)
// setTimeout(async () => {
//     try {
//         logger.info('🚀 Iniciando configuração automática do DNS GenieACS para desenvolvimento...');
//         const result = await autoGenieACSSetup.runAutoSetup();
//         
//         if (result.success) {
//             logger.info('✅ Configuração automática do DNS GenieACS bem-sucedida');
//             if (result.data) {
//                 logger.info(`📋 IP do Servidor: ${result.data.serverIP}`);
//                 logger.info(`📋 URL do GenieACS: ${result.data.genieacsUrl}`);
//                 logger.info(`📋 Script do Mikrotik: ${result.data.mikrotikScript}`);
//             }
//         } else {
//             logger.warn(`⚠️  Configuração automática do DNS GenieACS: ${result.message}`);
//         }
//     } catch (error) {
//         logger.error('❌ Erro na configuração automática do DNS GenieACS:', error);
//     }
// }, 15000); // Atraso de 15 segundos após o início do servidor

// Adicionar comando para adicionar o número do cliente à tag GenieACS
const { addCustomerTag } = require('./config/customerTag');

// Exportar app para teste
module.exports = app;
