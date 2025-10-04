# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [Não Lançado]

### Corrigido
- **Erro de Inicialização:** Corrigido um erro crítico (`Cannot find module '../config/database'`) no módulo de busca (`routes/search.js`) ajustando a forma como o banco de dados é conectado. A aplicação agora deve iniciar corretamente.
