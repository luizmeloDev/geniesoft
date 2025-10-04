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

## Últimas Atualizações

- **Visualização de Mapa com Satélite:** Adicionada a opção de visualização de mapa com imagens de satélite do Google Maps na seção "Mapa da Rede". Agora é possível alternar entre o mapa padrão e o de satélite para uma melhor localização e planejamento.
- **Correção no Formulário de Instalação:** Corrigido um bug no formulário de criação de agendamentos de instalação que impedia a criação de novos agendamentos devido à falta dos campos de data e hora.

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
    O comando a seguir instalará todas as bibliotecas necessárias.
    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente (para o Brasil):**
    Use o template de configuração brasileiro para criar seu arquivo `settings.json`.
    ```bash
    cp settings.pt-br.template.json settings.json
    ```
    Edite o arquivo `settings.json` e preencha com suas informações (IP do servidor, chaves de API, etc.).

4.  **Configure o banco de dados (Primeira Instalação):**
    Execute o script `new-server-setup.js` para criar o banco de dados e popular com dados iniciais em português (planos, clientes de exemplo, etc.).
    ```bash
    node scripts/new-server-setup.js
    ```
    > **IMPORTANTE:** Este comando deve ser executado apenas na primeira vez. Se o script falhar e você precisar executá-lo novamente, primeiro **DEVE** limpar o banco de dados executando `node scripts/complete-reset.js`.

5.  **Inicie o servidor:**
    - Para produção (recomendado):
      ```bash
      npm start
      ```
    - Para desenvolvimento (com reinício automático ao salvar alterações):
      ```bash
      npm run dev
      ```

6.  **Acesse a aplicação:**
    Após iniciar, a aplicação estará disponível em `http://localhost:3000` (ou na porta que você configurou em `settings.json`).

## Histórico de Alterações

Para um registro detalhado de todas as mudanças, correções e novas funcionalidades, veja o arquivo [CHANGELOG.md](CHANGELOG.md).

## Contribuição

Contribuições são bem-vindas! Se você deseja melhorar o projeto, por favor, abra uma *issue* para discutir a sua ideia ou envie um *pull request* com as suas alterações.
