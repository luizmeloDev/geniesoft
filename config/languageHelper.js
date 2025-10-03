const i18n = require('i18n');
const logger = require('./logger');

/**
 * Auxiliar de Idioma para o Bot do WhatsApp
 */
class LanguageHelper {
  constructor() {
    this.defaultLanguage = 'pt';
    this.supportedLanguages = ['id', 'en', 'pt'];
  }

  /**
   * Obtém a preferência de idioma do usuário do banco de dados
   * @param {string} phone - Número de telefone do usuário
   * @returns {string} Código do idioma
   */
  async getUserLanguage(phone) {
    try {
      // Carregamento lento para evitar dependência circular
      const billingManager = require('./billing');
      const customer = await billingManager.getCustomerByPhone(phone);
      
      if (customer && customer.language && this.supportedLanguages.includes(customer.language)) {
        return customer.language;
      }
      
      return this.defaultLanguage;
    } catch (error) {
      logger.error('Erro ao obter o idioma do usuário:', error);
      return this.defaultLanguage;
    }
  }

  /**
   * Define a preferência de idioma do usuário
   * @param {string} phone - Número de telefone do usuário  
   * @param {string} language - Código do idioma
   */
  async setUserLanguage(phone, language) {
    try {
      if (!this.supportedLanguages.includes(language)) {
        throw new Error(`Idioma não suportado: ${language}`);
      }

      // Carregamento lento para evitar dependência circular
      const billingManager = require('./billing');
      await billingManager.updateCustomerLanguage(phone, language);
      
      return true;
    } catch (error) {
      logger.error('Erro ao definir o idioma do usuário:', error);
      return false;
    }
  }

  /**
   * Obtém mensagem localizada para o WhatsApp
   * @param {string} key - Chave de tradução
   * @param {string} phone - Número de telefone do usuário
   * @param {Object} params - Parâmetros para interpolação
   * @returns {string} Mensagem localizada
   */
  async getLocalizedMessage(key, phone, params = {}) {
    try {
      const userLang = await this.getUserLanguage(phone);
      i18n.setLocale(userLang);
      
      return i18n.__(key, params);
    } catch (error) {
      logger.error('Erro ao obter a mensagem localizada:', error);
      i18n.setLocale(this.defaultLanguage);
      return i18n.__(key, params);
    }
  }

  /**
   * Obtém mensagem localizada com um idioma específico
   * @param {string} key - Chave de tradução
   * @param {string} language - Código do idioma
   * @param {Object} params - Parâmetros para interpolação
   * @returns {string} Mensagem localizada
   */
  getMessageWithLanguage(key, language, params = {}) {
    try {
      const lang = this.supportedLanguages.includes(language) ? language : this.defaultLanguage;
      i18n.setLocale(lang);
      
      return i18n.__(key, params);
    } catch (error) {
      logger.error('Erro ao obter mensagem com idioma:', error);
      i18n.setLocale(this.defaultLanguage);
      return i18n.__(key, params);
    }
  }

  /**
   * Middleware para rotas da web para definir o idioma do usuário
   */
  webMiddleware() {
    return async (req, res, next) => {
      try {
        let userLanguage = this.defaultLanguage;

        // Prioridade: parâmetro de consulta > sessão > banco de dados do cliente > padrão
        if (req.query && req.query.lang && this.supportedLanguages.includes(req.query.lang)) {
          userLanguage = req.query.lang;
          if (req.session) {
            req.session.lang = userLanguage;
          }
        } else if (req.session && req.session.lang && this.supportedLanguages.includes(req.session.lang)) {
          userLanguage = req.session.lang;
        } else if (req.session && req.session.customer && req.session.customer.phone) {
          try {
            userLanguage = await this.getUserLanguage(req.session.customer.phone);
            if (req.session) {
              req.session.lang = userLanguage;
            }
          } catch (error) {
            // Recorre silenciosamente ao idioma padrão para evitar logs de spam
            userLanguage = this.defaultLanguage;
          }
        }

        // Define a localidade i18n para esta solicitação
        if (req.setLocale) {
          req.setLocale(userLanguage);
        }
        res.locals.currentLanguage = userLanguage;
        
        next();
      } catch (error) {
        logger.error('Erro no middleware de idioma:', error);
        if (req.setLocale) {
          req.setLocale(this.defaultLanguage);
        }
        res.locals.currentLanguage = this.defaultLanguage;
        next();
      }
    };
  }

  /**
   * Obtém a lista de idiomas suportados
   * @returns {Array} Array de códigos de idioma suportados
   */
  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  /**
   * Verifica se o idioma é suportado
   * @param {string} language - Código do idioma para verificar
   * @returns {boolean} Verdadeiro se for suportado
   */
  isLanguageSupported(language) {
    return this.supportedLanguages.includes(language);
  }
}

module.exports = new LanguageHelper();