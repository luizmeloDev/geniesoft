const express = require('express');
const path = require('path');
const i18n = require('i18n');
const logger = require('./config/logger');
const session = require('express-session');
const { getSetting } = require('./config/settingsManager');
const { initializeSchema } = require('./config/typesenseManager');
const { setActivePage } = require('./config/middleware');

i18n.configure({
  locales: ['en', 'id', 'pt'],
  directory: path.join(__dirname, 'locales'),
  defaultLocale: 'pt',
  cookie: 'i18n',
  autoReload: true,
  objectNotation: true,
});

const app = express();

initializeSchema();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/public', express.static(path.join(__dirname, 'public'), {
  maxAge: '1h',
  etag: true
}));

app.use(session({
  secret: getSetting('session_secret', 'a-very-secret-key'),
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true
  },
  name: 'admin_session'
}));

app.use(i18n.init);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use((req, res, next) => {
    res.locals.user = req.session.admin;
    res.locals.settings = getSetting();
    next();
});

app.use('/admin', setActivePage);

const { router: adminAuthRouter, adminAuth } = require('./routes/adminAuth');
const { blockTechnicianAccess } = require('./middleware/technicianAccessControl');

app.use('/admin', adminAuthRouter);

const adminRoutes = [
    { path: '/dashboard', router: './routes/adminDashboard' },
    { path: '/genieacs', router: './routes/adminGenieacs' },
    { path: '/mapping-new', router: './routes/adminMappingNew' },
    { path: '/mikrotik', router: './routes/adminMikrotik' },
    { path: '/hotspot', router: './routes/adminHotspot', subPath: true },
    { path: '/settings', router: './routes/adminSetting', auth: true, subPath: true, useBlock: true },
    { path: '/config', router: './routes/configValidation', useBlock: true },
    { path: '/trouble', router: './routes/adminTroubleReport', auth: true, useBlock: true },
    { path: '/billing', router: './routes/adminBilling', auth: true, useBlock: true },
    { path: '/installations', router: './routes/adminInstallationJobs', auth: true, useBlock: true },
    { path: '/technicians', router: './routes/adminTechnicians', auth: true, useBlock: true },
    { path: '/agents', router: './routes/adminAgents', auth: true, useBlock: true },
    { path: '/voucher-pricing', router: './routes/adminVoucherPricing', auth: true, useBlock: true },
    { path: '/cable-network', router: './routes/adminCableNetwork', auth: true, useBlock: true },
    { path: '/collectors', router: './routes/adminCollectors', useBlock: true },
    { path: '/cache', router: './routes/cacheManagement', useBlock: true }
];

adminRoutes.forEach(route => {
    const router = require(route.router);
    const args = [route.subPath ? route.path : `/admin${route.path}`];
    if (route.useBlock) args.push(blockTechnicianAccess);
    if (route.auth) args.push(adminAuth);
    args.push(route.subPath ? router.router : router);
    app.use.apply(app, args);
});

const otherRoutes = [
    { path: '/agent', router: './routes/agentAuth', property: 'router' },
    { path: '/agent', router: './routes/agent' },
    { path: '/payment', router: './routes/payment' },
    { path: '/test/trouble', router: './routes/testTroubleReport' },
    { path: '/customer/trouble', router: './routes/troubleReport' },
    { path: '/voucher', router: './routes/publicVoucher', property: 'router' },
    { path: '/tools', router: './routes/publicTools' },
    { path: '/webhook/voucher', router: './routes/publicVoucher', property: 'router' },
    { path: '/api', router: './routes/apiDashboard' },
    { path: '/api/search', router: './routes/search', auth: true },
    { path: '/', router: './routes/staticIcons' },
    { path: '/customer', router: './routes/customerPortal' },
    { path: '/customer/billing', router: './routes/customerBilling' },
    { path: '/technician', router: './routes/technicianAuth', property: 'router' },
    { path: '/tecnico', router: './routes/technicianAuth', property: 'router' },
    { path: '/technician', router: './routes/technicianDashboard' },
    { path: '/tecnico', router: './routes/technicianDashboard' },
    { path: '/technician', router: './routes/technicianCableNetwork' },
    { path: '/tecnico', router: './routes/technicianCableNetwork' },
    { path: '/collector', router: './routes/collectorAuth', property: 'router' },
    { path: '/collector', router: './routes/collectorDashboard' }
];

otherRoutes.forEach(route => {
    let router = require(route.router);
    if (route.property) router = router[route.property];
    const args = [route.path];
    if (route.auth) args.push(adminAuth);
    args.push(router);
    app.use.apply(app, args);
});

app.get('/', (req, res) => {
  res.redirect('/admin/login');
});

const PORT = getSetting('server_port', 4555);

app.listen(PORT, () => {
    logger.info(`✅ Servidor iniciado na porta ${PORT}`);
}).on('error', (err) => {
    logger.error(`❌ Erro ao iniciar o servidor: ${err.message}`);
    process.exit(1);
});

module.exports = app;
