# Geniesoft ISP

O Geniesoft ISP é um sistema de gestão de provedores de internet (ISP) que integra um gateway de pagamento via WhatsApp com o GenieACS para provisionamento, além de recursos para gestão de clientes, faturamento e suporte técnico. O sistema é compatível com Mikrotik (PPPoE e Hotspot).

## Funcionalidades

- **Dashboard de Análise de Rede:** A página inicial do admin é um centro de análise que exibe a saúde da rede, utilização de ODPs, status dos cabos e alertas em tempo real.
- **Mapa da Rede Interativo com Busca:** Visualize toda a sua infraestrutura de rede, incluindo clientes, ONUs, ODPs e cabos. A nova barra de pesquisa permite localizar clientes instantaneamente por nome, CPF, telefone ou código.
- **Gerenciamento de Instalações:** Uma seção completa para agendar, atribuir e acompanhar as instalações de novos clientes, com filtros por status, cliente e data.
- **Gestão de Clientes:** Cadastro, edição e consulta de informações de clientes.
- **Faturamento:** Geração e controle de faturas, com pagamentos online e baixa automática.
- **Gateway WhatsApp:** Notificações, autoatendimento e pagamentos diretamente pelo WhatsApp.
- **Integração GenieACS:** Provisionamento automático de equipamentos.
- **Suporte a Mikrotik:** Gestão de usuários PPPoE e Hotspot.
- **Painel Administrativo Aprimorado:** Interface para administradores, técnicos e atendentes, agora com um menu de navegação totalmente reorganizado, traduzido para o português e mais intuitivo.
- **Portal do Cliente:** Área para o cliente consultar faturas e informações.

## Como Usar

### Fluxo Básico para Administradores

1.  **Gestão de Instalações:**
    -   Acesse a seção **"Instalações"** para agendar um novo serviço.
    -   Clique em **"Nova Instalação"**, preencha os dados do cliente (ou selecione um existente) e atribua a um técnico.
    -   Acompanhe o status da instalação (Pendente, Em Andamento, Concluída) no painel.

2.  **Visualização da Rede:**
    -   Utilize o **"Mapa da Rede"** para obter uma visão geográfica completa de sua infraestrutura.
    -   Use a barra de busca para localizar rapidamente clientes, ODPs ou ONUs pelo nome, código ou outras informações.

3.  **Gestão de Faturamento:**
    -   O sistema gera as faturas automaticamente com base nos pacotes de cada cliente.
    -   Os clientes podem pagar via gateway do WhatsApp, e a baixa é processada automaticamente no sistema.
    -   Acesse a área de **"Faturamento"** para consultar o status dos pagamentos.

4.  **Monitoramento e Suporte:**
    -   Monitore a saúde geral da rede através do **"Dashboard"** principal.
    -   Em caso de inadimplência, suspenda ou restaure serviços de clientes diretamente pelo painel, com integração automática ao Mikrotik.

## Últimas Atualizações

- **Correção no Formulário de Instalação:** Resolvido o bug que impedia a criação de novas instalações. O botão "Novo Cliente" agora funciona, exibindo os campos necessários, e a busca por clientes existentes foi implementada, garantindo que os dados do cliente sejam enviados corretamente.
- **Tradução Completa e Correções:**
    - **Scripts de Teste:** Todos os scripts de teste (`test-voucher-webhook-simple.js`, `test-voucher-payment.js`, `test-rxpower-extraction.js`) foram traduzidos para o português para facilitar a depuração e o desenvolvimento.
    - **Visualização de Mapa:** Adicionada a opção de visualização com imagens de satélite do Google Maps na seção "Mapa da Rede".

## Instalação e Configuração (Brasil)

Siga os passos abaixo para configurar e executar o projeto em seu ambiente para o Brasil.

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 14 ou superior)
- [NPM](https://www.npmjs.com/) (geralmente instalado com o Node.js)
- **Opcional:** [Docker](https://www.docker.com/) (para a busca com Typesense)

### Passos

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/luizmeloDev/geniesoft.git
    cd geniesoft
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente (para o Brasil):**
    ```bash
    cp settings.pt-br.template.json settings.json
    ```
    Edite o arquivo `settings.json` e preencha com suas informações (IP do servidor, chaves de API, etc.).

4.  **Configure o banco de dados (Primeira Instalação):**
    ```bash
    node scripts/new-server-setup.js
    ```
    > **IMPORTANTE:** Este comando deve ser executado apenas na primeira vez. 

5.  **Inicie o servidor:**
    - Para produção:
      ```bash
      npm start
      ```
    - Para desenvolvimento:
      ```bash
      npm run dev
      ```

6.  **Acesse a aplicação:**
    A aplicação estará disponível em `http://localhost:3000`.

## Histórico de Alterações

Para um registro detalhado, veja o arquivo [CHANGELOG.md](CHANGELOG.md).

## Contribuição

Contribuições são bem-vindas! Abra uma *issue* ou envie um *pull request*.
