
const { typesenseClient, isTypesenseEnabled } = require('./typesenseClient');
const billing = require('./billing'); // Usaremos para buscar os dados
const logger = require('./logger');

// Nome da coleção no Typesense
const COLLECTION_NAME = 'locations';

// Definição do Schema para a coleção de clientes
const schema = {
  name: COLLECTION_NAME,
  fields: [
    { name: 'id', type: 'string' },
    { name: 'type', type: 'string', facet: true }, // Atualmente, apenas 'customer'
    { name: 'original_id', type: 'int64' },
    { name: 'name', type: 'string' },
    { name: 'search_terms', type: 'string[]' }, // Array de termos de busca (nome, pppoe, username)
    { name: 'location', type: 'geopoint' },
    { name: 'details', type: 'string' }, // JSON string com detalhes adicionais
  ],
  default_sorting_field: 'name',
};

/**
 * Inicializa o schema no Typesense. Cria a coleção se ela não existir.
 */
async function initializeSchema() {
  if (!isTypesenseEnabled() || !typesenseClient) {
    return;
  }

  try {
    const collections = await typesenseClient.collections().retrieve();
    const collectionExists = collections.some((c) => c.name === COLLECTION_NAME);

    if (!collectionExists) {
      logger.info(`[TYPESENSE] Coleção '${COLLECTION_NAME}' não encontrada. Criando...`);
      await typesenseClient.collections().create(schema);
      logger.info(`[TYPESENSE] Coleção '${COLLECTION_NAME}' criada com sucesso.`);
    } else {
      logger.info(`[TYPESENSE] Coleção '${COLLECTION_NAME}' já existe.`);
    }
  } catch (error) {
    logger.error('[TYPESENSE] Falha ao inicializar o schema:', error);
  }
}

/**
 * Busca e indexa todos os clientes no Typesense.
 */
async function indexCustomers() {
  if (!isTypesenseEnabled() || !typesenseClient) {
    return { success: false, message: 'Typesense não está habilitado.' };
  }

  try {
    const customers = await billing.getCustomers();
    if (!customers || customers.length === 0) {
      return { success: true, message: 'Nenhum cliente para indexar.', indexed: 0 };
    }

    const documents = customers
      .filter(c => c.latitude && c.longitude) // Indexar apenas clientes com coordenadas
      .map(customer => ({
        id: `customer-${customer.id}`,
        type: 'customer',
        original_id: customer.id,
        name: customer.name,
        search_terms: [customer.name, customer.pppoe_username, customer.username].filter(Boolean),
        location: [customer.latitude, customer.longitude],
        details: JSON.stringify({
          address: customer.address,
          status: customer.status,
          package: customer.package_name,
          phone: customer.phone
        }),
      }));

    if (documents.length === 0) {
      return { success: true, message: 'Nenhum cliente com coordenadas para indexar.', indexed: 0 };
    }

    logger.info(`[TYPESENSE] Indexando ${documents.length} clientes...`);
    const result = await typesenseClient.collections(COLLECTION_NAME).documents().import(documents, { action: 'upsert' });
    
    const successCount = result.filter(r => r.success).length;
    if (successCount < documents.length) {
        logger.warn(`[TYPESENSE] Alguns clientes não foram indexados. Sucesso: ${successCount}/${documents.length}`);
    }

    return { success: true, indexed: successCount };
  } catch (error) {
    logger.error('[TYPESENSE] Falha ao indexar clientes:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Executa a sincronização completa dos dados de clientes para o Typesense.
 */
async function syncAllData() {
  logger.info('[TYPESENSE] Iniciando sincronização de clientes...');
  await initializeSchema();
  const customerResult = await indexCustomers();
  logger.info('[TYPESENSE] Sincronização de clientes concluída.');
  return { customers: customerResult };
}

module.exports = {
  initializeSchema,
  indexCustomers,
  syncAllData,
};
