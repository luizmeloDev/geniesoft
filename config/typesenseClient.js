const Typesense = require('typesense');
const { getSettingsWithCache } = require('./settingsManager');

let client = null;
let typesenseConfig = {};

try {
    const settings = getSettingsWithCache();
    if (settings.typesense && settings.typesense.enabled) {
        typesenseConfig = settings.typesense;

        client = new Typesense.Client({
            nodes: [{
                host: typesenseConfig.host,
                port: typesenseConfig.port,
                protocol: typesenseConfig.protocol,
            }],
            apiKey: typesenseConfig.apiKey,
            connectionTimeoutSeconds: 2,
        });
        console.log('✅ [TYPESENSE] Cliente Typesense inicializado com sucesso.');
    } else {
        console.log('⚠️ [TYPESENSE] O Typesense está desativado nas configurações.');
    }
} catch (error) {
    console.error('❌ [TYPESENSE] Falha ao inicializar o cliente Typesense:', error);
}

module.exports = {
    typesenseClient: client,
    isTypesenseEnabled: () => typesenseConfig.enabled || false,
};