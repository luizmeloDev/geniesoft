const { syncAllData } = require('../config/typesenseManager');
const logger = require('../config/logger');

async function runSync() {
  logger.info('Iniciando script de sincronização com o Typesense...');
  
  try {
    const result = await syncAllData();
    logger.info('Sincronização concluída com sucesso!');
    logger.info(`Clientes indexados: ${result.customers.indexed}`);

    if (!result.customers.success) {
      logger.warn('Ocorreram erros ao indexar alguns clientes. Verifique os logs para mais detalhes.');
    }

  } catch (error) {
    logger.error('Ocorreu um erro durante a sincronização com o Typesense:', error);
    process.exit(1); // Sair com código de erro
  }

  process.exit(0); // Sair com sucesso
}

runSync();
