# Geniesoft ISP

O Geniesoft ISP é um sistema de gestão de provedores de internet (ISP) que integra um gateway de pagamento via WhatsApp com o GenieACS para provisionamento, além de recursos para gestão de clientes, faturamento e suporte técnico. O sistema é compatível com Mikrotik (PPPoE e Hotspot).

## Funcionalidades

- **Gestão de Clientes:** Cadastro, edição e consulta de informações de clientes.
- **Faturamento:** Geração e controle de faturas, com pagamentos online e baixa automática.
- **Gateway WhatsApp:** Notificações e pagamentos diretamente pelo WhatsApp.
- **Integração GenieACS:** Provisionamento automático de equipamentos.
- **Suporte a Mikrotik:** Gestão de usuários PPPoE e Hotspot.
- **Painel Administrativo:** Interface para administradores, técnicos e atendentes.
- **Portal do Cliente:** Área para o cliente consultar faturas e informações.

## Instalação

Siga os passos abaixo para configurar e executar o projeto em seu ambiente de desenvolvimento.

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 14 ou superior)
- [NPM](https://www.npmjs.com/) (geralmente instalado com o Node.js)

### Passos

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/geniesoft-isp.git
   cd geniesoft-isp
   ```

2. **Instale as dependências:**
   O comando `npm install` irá instalar todas as bibliotecas necessárias para o projeto.
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   Copie o arquivo `settings.server.template.json` para `settings.json` e preencha as informações do seu ambiente (banco de dados, APIs, etc.).
   ```bash
   cp settings.server.template.json settings.json
   ```

4. **Configure o banco de dados:**
   Execute o script de setup para criar as tabelas iniciais.
   ```bash
   node scripts/setup-database.js
   ```

5. **Inicie o servidor:**
   - Para produção:
     ```bash
     npm start
     ```
   - Para desenvolvimento (com reinício automático):
     ```bash
     npm run dev
     ```

Após iniciar, a aplicação estará disponível em `http://localhost:3000` (ou na porta que você configurou em `settings.json`).

## Contribuição

Contribuições são bem-vindas! Se você deseja melhorar o projeto, por favor, abra uma *issue* para discutir a sua ideia ou envie um *pull request* com as suas alterações.
