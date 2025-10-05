# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [Não Lançado]

### Adicionado
- **Tradução Completa do Painel Administrativo**:
  - A página de **Detalhes do Cliente** (`customer-detail.ejs`) foi completamente reescrita e traduzida para o português, corrigindo a estrutura e a lógica de exibição de dados.
  - A página de **Gerenciamento de Planos** (`packages.ejs`) foi totalmente traduzida, incluindo modais e formatação de moeda.
  - As páginas de **Gerenciamento de Técnicos e Cobradores** (`technicians.ejs`, `collectors.ejs`, e `collector-form.ejs`) foram verificadas e traduzidas para garantir uma experiência de usuário consistente em português.
  - A página de **Configurações do Sistema** (`adminSetting.ejs`) foi totalmente traduzida para o português, incluindo todos os rótulos, descrições e comandos.

### Corrigido
- **Erro de Inicialização:** Corrigido um erro crítico (`Cannot find module '../config/database'`) no módulo de busca (`routes/search.js`) ajustando a forma como o banco de dados é conectado. A aplicação agora deve iniciar corretamente.
- **Erro no Painel de Faturamento:** Corrigido um erro de referência (`currentPage is not defined`) que impedia a renderização da página. A variável `currentPage` agora é passada corretamente, permitindo que a navegação móvel funcione como esperado.
- **Ajuste do Menu Lateral:** O link "Configurações" no menu lateral foi corrigido para apontar para a rota `/admin/settings`, garantindo que o link funcione corretamente.
