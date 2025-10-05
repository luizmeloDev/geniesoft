# Geniesoft ISP

O Geniesoft ISP é um sistema de gestão de provedores de internet (ISP) que integra um gateway de pagamento via WhatsApp com o GenieACS para provisionamento, além de recursos para gestão de clientes, faturamento e suporte técnico. O sistema é compatível com Mikrotik (PPPoE e Hotspot).

## Funcionalidades Principais

- **Painel Administrativo 100% em Português:** Toda a interface de administração, incluindo configurações, faturamento, gerenciamento de clientes, planos e técnicos, foi completamente traduzida para o português, oferecendo uma experiência de usuário unificada e intuitiva.
- **Dashboard de Análise de Rede:** A página inicial do admin é um centro de análise que exibe a saúde da rede, utilização de ODPs, status dos cabos e alertas em tempo real.
- **Mapa da Rede Interativo com Busca:** Visualize toda a sua infraestrutura de rede, incluindo clientes, ONUs, ODPs e cabos. A nova barra de pesquisa permite localizar clientes instantaneamente por nome, CPF, telefone ou código.
- **Gerenciamento de Instalações:** Uma seção completa para agendar, atribuir e acompanhar as instalações de novos clientes, com filtros por status, cliente e data.
- **Gestão de Clientes e Faturamento:** Cadastro, edição e consulta de informações de clientes. Geração e controle de faturas, com pagamentos online e baixa automática.
- **Ferramentas de Configuração de Rede:** A página de "Configurações" foi aprimorada com geradores de script para isolamento de clientes no Mikrotik, configuração de DNS para GenieACS, cálculo de redutor óptico e mais, agilizando tarefas técnicas complexas.
- **Gateway WhatsApp:** Notificações, autoatendimento e pagamentos diretamente pelo WhatsApp, com gestão de grupos e status da conexão diretamente no painel.
- **Integração GenieACS e Mikrotik:** Provisionamento automático de equipamentos e gestão de usuários PPPoE e Hotspot.
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

- **Tradução Completa:** Todo o painel administrativo foi traduzido para o português, incluindo as páginas de Clientes, Planos, Técnicos, Cobradores e Configurações do Sistema.
- **Correção de Bugs Críticos:** Resolvido o erro que impedia a inicialização do servidor (módulo de busca) e o erro de referência que quebrava o painel de faturamento.
- **Novas Ferramentas de Rede:** Adicionados geradores de script e calculadoras na página de configurações para facilitar a administração do Mikrotik e GenieACS.
- **Melhorias Gerais de Usabilidade:** Ajustes finos na interface, como a correção de links no menu e a reescrita de seções para maior clareza.

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

4.  **Configure o banco de dados:**
    ```bash
    node scripts/new-server-setup.js
    ```
    > **Nota:** Este script configura o banco de dados com dados iniciais (pacotes, admin padrão, etc.). Graças às últimas atualizações, ele é seguro para ser executado múltiplas vezes, pois apenas cria os dados que ainda não existem.

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