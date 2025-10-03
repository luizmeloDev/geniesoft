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

## Instalação e Configuração

Siga os passos abaixo para configurar e executar o projeto em seu ambiente de desenvolvimento.

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 14 ou superior)
- [NPM](https://www.npmjs.com/) (geralmente instalado com o Node.js)
- **Opcional:** [Docker](https://www.docker.com/products/docker-desktop/) (para a busca com Typesense)

### Passos

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/luizmeloDev/geniesoft.git
    cd geniesoft
    ```

2.  **Instale as dependências:**
    O comando `npm install` irá instalar todas as bibliotecas necessárias.
    ```bash
    npm install
    ```
    > **Nota:** O projeto utiliza `sqlite3`. Dependendo do seu sistema operacional e da versão do Node.js, a instalação pode exigir ferramentas de compilação C++. Se encontrar erros durante a instalação do `sqlite3`, consulte o arquivo `SQLITE3_FIX_README.md` para obter guias de solução de problemas.

3.  **Configure as variáveis de ambiente:**
    Copie o arquivo `settings.server.template.json` para `settings.json`. O sistema já vem configurado para usar um banco de dados SQLite (`database.sqlite`), então, para um início rápido, você não precisa alterar as configurações de banco de dados.
    ```bash
    cp settings.server.template.json settings.json
    ```
    Posteriormente, ajuste este arquivo para configurar as chaves de API do WhatsApp, GenieACS, e outros serviços.

4.  **Configure o banco de dados:**
    Execute o script de setup para criar o arquivo de banco de dados SQLite e aplicar as migrações iniciais.
    ```bash
    node scripts/setup-database.js
    ```

5.  **Inicie o servidor:**
    - Para produção:
      ```bash
      npm start
      ```
    - Para desenvolvimento (com reinício automático ao salvar alterações):
      ```bash
      npm run dev
      ```

6.  **Acesse a aplicação:**
    Após iniciar, a aplicação estará disponível em `http://localhost:3000` (ou na porta que você configurou em `settings.json`).

### Configuração Avançada (Opcional)

#### Busca com Typesense

Para habilitar a funcionalidade de busca avançada no mapa (pesquisa por cliente, PPPoE, ODP, etc.), é necessário instalar e configurar o **Typesense**.

**a. Instale e execute o Typesense via Docker:**
A maneira mais simples de executar o Typesense é usando Docker. Substitua `your-secret-api-key` por uma chave segura.
```bash
docker run -p 8108:8108 -v/tmp/typesense-data:/data typesense/typesense:0.24.1 --data-dir /data --api-key=your-secret-api-key --enable-cors
```

**b. Configure o `settings.json`:**
Certifique-se de que a seção `typesense` no seu arquivo `settings.json` está habilitada e configurada com a `apiKey` que você definiu no comando do Docker.
```json
"typesense": {
  "enabled": true,
  "host": "localhost",
  "port": 8108,
  "protocol": "http",
  "apiKey": "your-secret-api-key"
}
```
**c. Sincronize os dados:**
Após configurar, execute o script para indexar os dados existentes no Typesense.
```bash
node scripts/sync-typesense.js
```

## Contribuição

Contribuições são bem-vindas! Se você deseja melhorar o projeto, por favor, abra uma *issue* para discutir a sua ideia ou envie um *pull request* com as suas alterações.
