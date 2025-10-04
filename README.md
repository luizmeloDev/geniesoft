# Geniesoft ISP

O Geniesoft ISP é um sistema de gestão de provedores de internet (ISP) que integra um gateway de pagamento via WhatsApp com o GenieACS para provisionamento, além de recursos para gestão de clientes, faturamento e suporte técnico. O sistema é compatível com Mikrotik (PPPoE e Hotspot).

## Funcionalidades

- **Gestão de Clientes:** Cadastro, edição e consulta de informações de clientes.
- **Faturamento:** Geração e controle de faturas, com pagamentos online e baixa automática.
- **Gateway WhatsApp:** Notificações, autoatendimento e pagamentos diretamente pelo WhatsApp.
- **Integração GenieACS:** Provisionamento automático de equipamentos.
- **Suporte a Mikrotik:** Gestão de usuários PPPoE e Hotspot.
- **Painel Administrativo:** Interface para administradores, técnicos e atendentes.
- **Portal do Cliente:** Área para o cliente consultar faturas e informações.

## Instalação e Configuração

Siga os passos abaixo para configurar e executar o projeto em seu ambiente.

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
    O comando a seguir instalará todas as bibliotecas necessárias.
    ```bash
    npm install
    ```
    > **Nota sobre o `sqlite3`:** Este projeto utiliza o `sqlite3`. A instalação pode falhar se você não tiver as ferramentas de compilação C++ necessárias em seu sistema. Se o `npm install` falhar com um erro relacionado ao `sqlite3`, instale-o separadamente com o comando `npm install sqlite3` e veja o guia no arquivo `SQLITE3_FIX_README.md`.

3.  **Configure as variáveis de ambiente:**
    Copie o arquivo de exemplo `settings.server.template.json` para `settings.json`.
    ```bash
    cp settings.server.template.json settings.json
    ```
    Para um início rápido, você não precisa alterar nada, pois ele já está configurado para usar um banco de dados SQLite local. No futuro, você pode editar este arquivo para configurar chaves de API do WhatsApp, GenieACS, etc.

4.  **Configure o banco de dados (Primeira Instalação):**
    Execute o script `new-server-setup.js` para criar o banco de dados e popular com dados iniciais (planos, clientes de exemplo, etc.) em português.
    ```bash
    node scripts/new-server-setup.js
    ```
    > **IMPORTANTE:** Este comando deve ser executado apenas na primeira vez. Se o script falhar por qualquer motivo e você precisar executá-lo novamente, primeiro você **DEVE** limpar o banco de dados executando `node scripts/complete-reset.js`.

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

### Configuração Avançada (Opcional)

#### Busca com Typesense

Para habilitar a funcionalidade de busca avançada (pesquisa por cliente, PPPoE, ODP, etc.), é necessário instalar e configurar o **Typesense**.

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

## Download

Você pode baixar o código-fonte do projeto diretamente através [deste link](build/archive/geniesoft-isp-source.tar.gz).
