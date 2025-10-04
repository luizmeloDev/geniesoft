# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [Não Lançado]

### Adicionado
- **Tradução Completa do Painel Administrativo**:
  - A página de **Detalhes do Cliente** (`customer-detail.ejs`) foi completamente reescrita e traduzida para o português, corrigindo a estrutura e a lógica de exibição de dados.
  - A página de **Gerenciamento de Planos** (`packages.ejs`) foi totalmente traduzida, incluindo modais e formatação de moeda.
  - As páginas de **Gerenciamento de Técnicos e Cobradores** (`technicians.ejs`, `collectors.ejs`, e `collector-form.ejs`) foram verificadas e traduzidas para garantir uma experiência de usuário consistente em português.

### Corrigido
- **Erro de Inicialização:** Corrigido um erro crítico (`Cannot find module '../config/database'`) no módulo de busca (`routes/search.js`) ajustando a forma como o banco de dados é conectado. A aplicação agora deve iniciar corretamente.
