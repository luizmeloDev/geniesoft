# Bill Padlock - Sistema Integrado de Gerenciamento de ISP

[![Estrelas do GitHub](https://img.shields.io/github/stars/alijayanet/gembok-bill)](https://github.com/alijayanet/gembok-bill/stargazers)
[![Girks do GitHub](https://img.shields.io/github/forks/alijayanet/gembok-bill)](https://github.com/alijayanet/gembok-bill/network)
[![Problemas do GitHub](https://img.shields.io/github/issues/alijayanet/gembok-bill)](https://github.com/alijayanet/gembok-bill/issues)
[![Licença do GitHub](https://img.shields.io/github/license/alijayanet/gembok-bill)](https://github.com/alijayanet/gembok-bill/blob/main/LICENSE)

## 📋 Descrição do aplicativo

**Gembok Bill** é um sistema integrado de gerenciamento RTRWNet que combina o WhatsApp Gateway com um portal de administração web para gerenciamento abrangente de serviços de internet. Este aplicativo foi desenvolvido especificamente para a RTRWNet, que requer uma solução completa para gerenciamento de clientes, faturamento, monitoramento e notificações.

### 🎯 Principais recursos

- ** 🔧 WhatsApp Bot Gateway** - Interface de comando via WhatsApp com controle de acesso baseado em funções
- ** 🌐 Administração do Portal Web** - Painel de administração completo com sistema de controle de versão
- ** 💳 Sistema Integrado de Faturamento** - Gestão de faturamento e pagamentos
- ** 💳 Gateway de pagamento** - Integração Midtrans, Xendit, Tripay
- ** 📊 GenieACS Management** - Monitoramento e gerenciamento de dispositivos ONU/ONT
- ** 🛠️ Gerenciamento Mikrotik** - Gerenciamento PPPoE e Hotspot
- ** 📱 Portal do Cliente** - Autoatendimento para clientes
- ** 📈 Monitoramento em tempo real** - PPPoE, RX Power e sistema com gráficos separados
- ** 🔔 Notificações Automáticas ** - Notificações do WhatsApp
- ** 📋 Sistema de Tickets de Problemas ** - Solução de problemas via WhatsApp e web
- ** 👥 Controle de acesso baseado em funções** - Superadministrador, Administrador, Técnico, Cliente
- ** 📱 Comandos do WhatsApp** - Relatório de problemas, gerenciamento de PPPoE, informações de versão
- ** 🎨 UI aprimorada** - Separação de gráficos de tráfego, suporte para alta largura de banda, limpeza de configurações de administrador

---

## 📱 Comandos do WhatsApp

### 👑 **Comandos de administrador** *(Superadministrador e Administrador)*
- **`admin`** - Menu de ajuda somente para administradores
- **`checkstatus [número]`** - Verificar status do cliente por número
- **`gantissid [número] [novo_ssid]`** - Alterar SSID do WiFi do cliente
- **`reboot [número]`** - Reiniciar dispositivo do cliente
- **`status`** - Verificar status do sistema e da conexão
- **`reiniciar`** - Reiniciar o serviço WhatsApp
- **`versão`** - Mostrar informações da versão do aplicativo
- **`info`** - Mostrar informações completas do sistema

### 🔧 **Comandos do Técnico** *(Administrador e Técnico)*
- **`técnico`** - Menu de ajuda especial do técnico
- **`problema`** - Ver lista de relatórios de problemas
- **`status [id]`** - Verifique o status de um relatório de interrupção específico
- **`atualizar [id] [status] [nota]`** - Atualizar status do relatório
- **`concluído [id] [nota]`** - Marcar o relatório como completo
- **`addpppoe [usuário] [senha] [perfil] [ip] [info]`** - Adicionar usuário PPPoE
- **`editpppoe [usuário] [campo] [valor]`** - Edite o campo de usuário PPPoE
- **`delpppoe [usuário] [motivo]`** - Excluir usuário PPPoE
- **`pppoe [filtro]`** - Listar todos os usuários PPPoE
- **`checkpppoe [usuário]`** - Verificar o status do usuário PPPoE
- **`restartpppoe [usuário]`** - Reinicie a conexão do usuário PPPoE

### 👤 **Comandos do Cliente** *(Todos os Usuários)*
- **`menu`** - Menu geral para todos os usuários
- **`faturamento`** - Menu de ajuda para recursos de faturamento
- **`checkstatus [número]`** - Verificar status do cliente (limitado)
- **`versão`** - Mostrar informações da versão do aplicativo

### 📚 **Comandos de ajuda**
- **`help trouble`** - Ajuda para o recurso de relatório de problemas
- **`help pppoe`** - Ajuda para o recurso de gerenciamento PPPoE

---

## 🚀 Instalação

### Requisitos do sistema

- **Node.js** v18+ (v20+ recomendado)
- **npm** ou fio
- Acesso à API **GenieACS**
- Acesso à API do **Mikrotik**
- Número do **WhatsApp** para bot
- **Banco de dados SQLite** (integrado)

### 1. Repositório Clonar

```bash
# Instale o git se ele ainda não estiver lá
apt instalar git curl -y

# Repositório clone
clone do git https://github.com/alijayanet/gembok-bill
cd cadeado-bill
```

### 2. Instalar Dependências

```bash
# Instalar todas as dependências
instalação npm
```
Se os problemas persistirem, tente uma reconstrução manual:
```bash
npm reconstruir sqlite3
```
Ou instale com build da fonte para o servidor Linux
```bash
npm install sqlite3 --build-from-source
```

### 3. Configurações de configuração

Edite o arquivo `settings.json` com a seguinte configuração:

```json
{
"app_version": "2.1.0",
"version_name": "WhatsApp Modular + Sistema de Funções",
"version_date": "2025-01-27",
"version_notes": "Adicionada função de técnico, relatório de problemas e comandos PPPoE do WhatsApp",
"número_da_compilação": "20250127.001",
"nome_do_aplicativo": "GEMBOK",
"company_header": "GEMBOK",
"footer_info": "Informações do Hubungi: 081947215703",
  
"admins.0": "6281947215703",
"admin_enabled": "verdadeiro",
"admin_username": "admin",
"admin_password": "admin",
  
"technician_numbers.0": "6283807665111",
"technician_numbers.1": "6282218094111",
"technician_group_id": "120363029715729111@g.us",
  
  "genieacs_url": "http://192.168.8.89:7557",
"genieacs_username": "admin",
  "genieacs_password": "administrador",
  
"mikrotik_host": "192.168.8.1",
"mikrotik_port": "8728",
"mikrotik_user": "administrador",
"mikrotik_password": "administrador",
"interface_principal": "ether1-ISP",
"pppoe_monitor_enable": "verdadeiro",
  
"whatsapp_session_path": "./sessão-whatsapp",
"whatsapp_keep_alive": "verdadeiro",
"whatsapp_restart_on_error": "verdadeiro",
"whatsapp_log_level": "silencioso",
  
"pppoe_monitor_interval": "60000",
"pppoe_notifications.enabled": "verdadeiro",
"pppoe_notifications.loginNotifications": "verdadeiro",
"pppoe_notifications.logoutNotifications": "verdadeiro",
"pppoe_notifications.includeOfflineList": "verdadeiro",
"pppoe_notifications.maxOfflineListCount": "20",
"pppoe_notifications.monitorInterval": "60000",
  
"rx_power_warning": "-40",
"rx_power_critical": "-45",
"rx_power_notification_enable": "verdadeiro",
"rx_power_notification_interval": "300000",
  
"customerPortalOtp": "falso",
"otp_length": "4",
"otp_expiry_minutes": "5",
  
"porta_do_servidor": "3003",
"server_host": "host local",
"secret_key": "gembok-digital-rede",
"intervalo_de_reconexão": "5000",
"log_level": "informações",
"nome_do_arquivo_do_logotipo": "logotipo.png",
"gateway de pagamento": {
"ativo": "midtrans",
"midtrans": {
"habilitado": verdadeiro,
"produção": falso,
"id_do_comerciante": "G123456789",
"client_key": "SB-Mid-client-123456789",
"server_key": "SB-Mid-server-123456789"
},
"xendit": {
"habilitado": falso,
"produção": falso,
"api_key": "xnd_public_development_123456789",
"token_de_retorno_de_chamada": "xnd_token_de_retorno_de_chamada_123456789"
},
"tripay": {
"habilitado": falso,
"produção": falso,
"api_key": "DEV-123456789",
"chave_privada": "chave_privada_123456789",
"código_do_comerciante": "T12345"
}
},
"contas_de_pagamento": {
"transferência bancária": {
"bank_name": "Banco BRI",
"número_da_conta": "1234-5678-9012-3456",
"nome_da_conta": "GEMBOK"
},
"dinheiro": {
"office_address": "Jl. Contoh No. 123, Kota, Provinsi",
"office_hours": "08:00 - 17:00 WIB"
}
}
}
```

### 4. Configuração do banco de dados

```bash
# Execute o script para configurar o banco de dados de cobrança
scripts de nó/add-payment-gateway-tables.js
```

### 5. Executando o aplicativo

**Modo de desenvolvimento:**
```bash
npm executar dev
```

**Modo de produção:**
```bash
npm start
```

**Com PM2:**
```bash
# Instale o PM2 se ele não estiver lá
npm instalar -g pm2

# Inicie o aplicativo
pm2 start app.js --nome cadeado-conta

# Monitor de aplicação
monitor pm2

# Ver registros
pm2 registra cadeado-bill
```

### 6. Configurar o WhatsApp Bot

1. **Prepare 2 números de WhatsApp:**
- 1 número para bot (irá escanear o código QR)
- 1 número para admin (para enviar comandos)

2. **Leia o código QR** que aparece no terminal para fazer login no bot do WhatsApp.

3. **Teste com comando**: `status` ou `menu`

---

## 🌐 Acesso ao Portal Web

- **Portal do Cliente**: `http://ipserver:3003`
- **Painel de administração**: `http://ipserver:3003/admin/login`
- **Login de administrador**: Nome de usuário e senha configurados em `settings.json`

---

## 💳 Sistema de cobrança

### Recursos de cobrança

- ** 📊 Painel de faturamento** - Estatísticas em tempo real
- ** 👥 Gerenciamento de clientes** - CRUD do cliente com nome de usuário PPPoE
- ** 📦 Gerenciamento de Pacotes** - Pacotes de internet com preços
- ** 📄 Gerenciamento de faturas** - Crie, edite e exclua faturas
- ** 💰 Gerenciamento de Pagamentos** - Rastreamento de pagamentos
- ** 🔄 Fatura Automática** - Gere faturas automáticas
- ** 💳 Gateway de pagamento** - Integração Midtrans, Xendit, Tripay
- ** 📱 Notificações do WhatsApp** - Notificações de contas e pagamentos

### Gateway de pagamento

O aplicativo oferece suporte a 3 gateways de pagamento populares na Indonésia:

1. **Midtrans** - O gateway de pagamento mais popular
2. **Xendit** - Gateway de pagamento empresarial
3. **Tripay** - Gateway de pagamento local

**Configuração do gateway de pagamento:**
1. Acesse `/admin/billing/payment-settings`
2. Selecione o gateway ativo
3. Insira as chaves de API
4. Teste a conexão
5. Habilite o modo de produção

---

## 🔧 Comandos do bot do WhatsApp

### Pedidos para clientes
- `menu` - Exibe o menu de ajuda
- `status` - Verificar status do dispositivo
- `refresh` - Atualizar dados do dispositivo
- `gantiwifi [nome]` - Alterar nome do WiFi
- `gantipass [senha]` - Alterar senha do WiFi
- `info` - Informações do serviço
- `speedtest` - Teste de velocidade da Internet

### Comandos para Admin

#### Comandos GenieACS
- `devices` - Lista de dispositivos
- `cekall` - Verificar todos os dispositivos
- `check [número]` - Verificar status da ONU
- `checkstatus [número]` - Verificar status do cliente
- `admincheck [número]` - Verificar dispositivo de administração
- `gantissid [número] [ssid]` - Alterar SSID
- `gantipass [número] [senha]` - Alterar senha
- `reboot [número]` - Reiniciar ONU
- `redefinição de fábrica [número]` - Redefinição de fábrica
- `refresh` - Atualizar dados do dispositivo
- `tag [número] [tag]` - Adicionar tag do cliente
- `desmarcar [número] [tag]` - Remover tag
- `tags [número]` - Ver tags
- `addtag [device_id] [número]` - Adicionar tag do dispositivo
- `addppoe_tag [pppoe_id] [número]` - Adicionar tag com id pppoe
- `adminssid [número] [ssid]` - Alteração de SSID do administrador
- `adminrestart [número]` - ONU de reinicialização do administrador
- `adminfactory [número]` - Redefinição de fábrica do administrador
- `confirmar redefinição de fábrica do administrador [número]` - Confirmar redefinição de fábrica

#### Comandos Mikrotik
- `interfaces` - Lista de interfaces
- `interface [nome]` - Detalhes da interface
- `enableif [nome]` - Habilitar interface
- `disableif [nome]` - Desabilita interface
- `ipaddress` - endereço IP
- `routes` - Tabela de roteamento
- `dhcp` - concessões DHCP
- `ping [ip] [contagem]` - Teste de ping
- `logs [tópicos] [contagem]` - Logs do Mikrotik
- `firewall [cadeia]` - Estado do firewall
- `users` - Listar todos os usuários
- `perfis [tipo]` - Lista de perfis
- `identidade [nome]` - Informações do roteador
- `clock` - Hora do roteador
- `recurso` - Informações sobre o recurso
- `reboot` - Reinicie o roteador
- `confirmar reinicialização` - Confirmar reinicialização

#### Gerenciamento de Hotspot e PPPoE
- `vcr [usuário] [perfil] [número]` - Criar voucher
- `hotspot` - O hotspot do usuário está ativo
- `pppoe` - Usuário PPPoE ativo
- `offline` - O usuário PPPoE está offline
- `addhotspot [usuário] [senha] [perfil]` - Adicionar usuário
- `addpppoe [usuário] [senha] [perfil] [ip]` - Adicionar PPPoE
- `setprofile [usuário] [perfil]` - Alterar perfil
- `delhotspot [nome de usuário]` - Excluir usuário do hotspot
- `delpppoe [nome de usuário]` - Excluir usuário PPPoE
- `addpppoe_tag [usuário] [número]` - Adicionar tag PPPoE
- `membro [nome de usuário] [perfil] [número]` - Adicionar membro
- `list` - Listar todos os usuários
- `remove [nome de usuário]` - Remover usuário (genérico)
- `addadmin [número]` - Adicionar número de administrador
- `removeadmin [número]` - Remover número do administrador

#### Sistema e Administração
- `otp [número]` - Enviar OTP
- `status` - Status do sistema
- `logs` - Logs do aplicativo
- `restart` - Reiniciar o aplicativo
- `recurso de depuração` - Recurso de depuração
- `checkgroup` - Verificar status do grupo
- `setadmin [número]` - Define o número do administrador
- `settechnician [número]` - Define o número do técnico
- `setheader [texto]` - Definir cabeçalho da mensagem
- `setfooter [texto]` - Definir rodapé da mensagem
- `setgenieacs [url] [usuário] [senha]` - Definir GenieACS
- `setmikrotik [host] [porta] [usuário] [senha]` - Set Mikrotik
- `admin` - Menu de administração
- `help` - Comando help
- `sim` - Confirme sim
- `não/não/cancelar` - Confirmar não
- `addwan [interface]` - Adicionar WAN

#### WiFi e serviços
- `info wifi` - Informações de WiFi do cliente
- `info` - Informações do serviço
- `gantiwifi [ssid]` - Alterar nome do WiFi
- `gantipass [senha]` - Alterar senha do WiFi
- `speedtest` - Teste de velocidade
- `diagnostic` - Diagnóstico do dispositivo
- `history` - Histórico do dispositivo
- `menu` - Menu principal
- `redefinição de fábrica` - Redefinição de fábrica (cliente)
- `confirmar redefinição de fábrica` - Confirmar redefinição de fábrica

---

## 🛠️ Solução de problemas

### Problemas de grupo e números de técnicos

Se ocorrer um erro como:
```
Erro ao enviar mensagem: Erro: item não encontrado
Aviso: Ignorando número inválido do WhatsApp: 6283807665111
```

**Solução:**

1. **Execute o script de reparo automático:**
```bash
scripts de nó/fix-technician-config.js
```

2. **Verificar status do grupo:**
- Enviar comando do WhatsApp: `checkgroup`
- Exibirá o status do grupo e o número do técnico

3. **Correção manual:**
- Abra as configurações de administração
- Atualizar o número do técnico com o formato: `628xxxxxxxxxx`
- Certifique-se de que o ID do grupo esteja no formato: `120363029715729111@g.us`
- Adicionar bot ao grupo de técnicos

### Formato de número correto
- ✅ `628xxxxxxxxxxxx`
- ❌ `08xxxxxxxxxxxx`
- ❌ `+628xxxxxxxxxxxx`

### Formato correto do ID do grupo
- ✅ `120363029715729111@g.us`
- ❌ `120363029715729111`
- ❌ `grupo-120363029715729111`

### Problemas com o gateway de pagamento

1. **Chave de API inválida:**
- Certifique-se de que a chave da API esteja correta e ativa
- Verifique o status da conta no painel do gateway de pagamento
- Teste a conexão em `/admin/billing/payment-settings`

2. **Erro de Webhook:**
- Certifique-se de que o URL do webhook esteja correto
- Verifique o firewall e a porta
- Verificar assinatura no manipulador de webhook

---

## 📝 Atualizar registro

### 🆕 **v2.1.0 - WhatsApp Modular + Sistema de Funções** *(2025-01-27)*

#### ✨ **Novos recursos adicionados:**

##### 🔧 **Arquitetura Modular do WhatsApp**
- **Refatorando o módulo do WhatsApp:** Dividindo `whatsapp.js` (5923 linhas) em módulos menores e fáceis de manter
- **`whatsapp-core.js`:** Utilitários principais, validação de administrador e gerenciamento de estado
- **`whatsapp-commands.js`:** Manipuladores de comandos para todos os comandos do WhatsApp
- **`whatsapp-message-handlers.js`:** Roteamento de mensagens e controle de acesso baseado em funções
- **`whatsapp-new.js`:** Orquestrador principal para conexões e tratamento de eventos

##### 👥 **Controle de acesso baseado em função (RBAC)**
- **Super Admin:** Acesso total a todos os recursos
- **Admin:** Acesso aos recursos de administrador e técnico
- **Técnico:** Acesso especial aos recursos do técnico
- **Cliente:** Acesso limitado aos recursos do cliente

##### 📋 **Gerenciamento de relatórios de problemas do WhatsApp**
- Comando **Trouble`:** Visualizar uma lista de relatórios de problemas
- **Comando `status [id]`:** Verificar o status de um relatório específico
- **Comando `update [id] [status] [notes]`:** Atualiza o status do relatório
- **Comando `complete [id] [nota]`:** Marcar o relatório como completo
- **Comando `note [id] [note]`:** Adicione uma nota ao relatório
- Comando **`help trouble`:** Ajuda para o recurso de relatório de problemas

##### 🌐 **Gerenciamento de WhatsApp PPPoE**
- **Comando `addpppoe [usuário] [senha] [perfil] [ip] [info]`:** Adicionar um novo usuário PPPoE
- **Comando `editpppoe [usuário] [campo] [valor]`:** Editar campo de usuário PPPoE
- **Comando `delpppoe [usuário] [motivo]`:** Excluir usuário PPPoE
- **Comando `pppoe [filtro]`:** Lista todos os usuários PPPoE
- **Comando `checkpppoe [usuário]`:** Verificar status do usuário PPPoE
- **Comando `restartpppoe [usuário]`:** Reinicia a conexão do usuário PPPoE
- Comando **`help pppoe`:** Ajuda para recursos PPPoE

##### 🆘 **Menus de ajuda dedicados**
- **`admin`:** Menu de ajuda somente para administradores
- **`técnico`:** Menu de ajuda especial do técnico
- **`menu`:** Menu geral para todos os usuários
- **`faturamento`:** Menu de ajuda para recursos de faturamento

##### 📊 **Sistema de controle de versão**
- **Comandos do WhatsApp:**
  - `version`: Mostrar informações da versão do aplicativo
- `info`: Mostra informações completas do sistema
- **Exibição do administrador da Web:**
- Informações da versão na barra lateral do administrador
- Informações da versão no rodapé do aplicativo
- Nome da empresa e número de construção

##### 🎨 **Melhorias no administrador da Web**
- **Separação do gráfico de tráfego da Internet:**
- Gráficos de download separados (RX)
- Gráfico de Upload (TX) separado
- Gráfico de Visão Geral Combinado
- Suporta largura de banda >1Gbps e >500Mbps
- Status do tráfego: Ultra Alto, Muito Alto, Alto, Médio, Baixo, Inativo
- **Limpeza das configurações de administração:**
- Ocultar campos de informações da versão (já na barra lateral/rodapé)
- Ocultar campos técnicos/sensíveis
- Mantenha os números de administrador/técnico visíveis para fácil edição
- Alertas informativos para campos ocultos

##### 🏢 **Atualização da marca do aplicativo**
- **Nome da empresa:** Alterado de "ALIJAYA DIGITAL NETWORK" para "GEMBOK"
- **Nome do aplicativo:** "LOCK" (de settings.json)
- **Marca consistente** em todas as interfaces

#### 🔧 **Melhorias técnicas:**

##### 📁 **Alterações na estrutura do arquivo**
```
configuração/
├ ── whatsapp-core.js # Utilitários principais e validação
├ ── whatsapp-commands.js # Manipuladores de comandos
├ ── whatsapp-message-handlers.js # Roteamento de mensagens
├ ── whatsapp-new.js # Orquestrador principal
├ ── whatsapp-trouble-commands.js # Comandos de relatório de problemas
├ ── whatsapp-pppoe-commands.js # Comandos de gerenciamento PPPoE
├ ── version-utils.js # Utilitários de exibição de versão
├ ── help-messages.js # Definições de mensagens de ajuda
└── whatsapp.js # Original (backup)
```

##### 🎯 **Melhorias na qualidade do código**
- **Arquitetura Modular:** Cada módulo tem responsabilidades específicas
- **Injeção de dependência:** o núcleo do WhatsApp é injetado em manipuladores de comando
- **Tratamento de erros:** Tratamento e registro de erros aprimorados
- **Reutilização de código:** Funções que podem ser reutilizadas
- **Suporte de teste:** Testes isolados para cada módulo

##### 🔐 **Melhorias de segurança**
- **Validação de função:** Valide a função antes da execução do comando
- **Sanitização de entrada:** Sanitização de entrada para evitar injeção
- **Controle de acesso:** Pembatasan akses berdasarkan role

#### 📋 **Atualizações de configuração:**

##### ⚙️ **settings.json Novos Campos**
```json
{
"app_version": "2.1.0",
"version_name": "WhatsApp Modular + Sistema de Funções",
"version_date": "2025-01-27",
"version_notes": "Adicionada função de técnico, relatório de problemas e comandos PPPoE do WhatsApp",
"número_da_compilação": "20250127.001",
"nome_do_aplicativo": "GEMBOK",
"company_header": "GEMBOK",
"technician_numbers.0": "6283807665111",
"números_técnicos.1": "6282218094111"
}
```

##### 🔑 **Configuração de função**
- **Números de administradores:** `admins.0`, `admins.1`, `admins.2`
- **Números de técnicos:** `technician_numbers.0`, `technician_numbers.1`, `technician_numbers.2`
- **Detecção dinâmica de função:** Otomatis mendeteksi role berdasarkan nomor

#### 🚀 **Guia de Migração:**

##### 📥 **Para atualização da versão 2.0.0:**
1. **Backup** arquivo `whatsapp.js` yang lama
2. **Update** `settings.json` com o campo novo
3. **Reinicie** o aplicativo para usar o novo módulo.
4. **Teste** os recursos do WhatsApp e o administrador web

##### 🔄 **Reverter (se necessário):**
1. **Renomeie** `whatsapp.js` para `whatsapp-new.js`
2. **Renomeie** `whatsapp_backup.js` para `whatsapp.js`
3. **Reinicie** o aplicativo

#### 🧪 **Testes e Validação:**

##### ✅ **Comandos do WhatsApp testados:**
- Comandos de administração: `admin`, `checkstatus`, `gantissid`, `reboot`, `status`, `restart`
- Comandos do técnico: `technician`, `trouble`, `addpppoe`, `editpppoe`, `delpppoe`
- Comandos do cliente: `menu`, `billing`, `checkstatus`
- Comandos de versão: `version`, `info`

##### ✅ **Testado por administrador da Web:**
- Exibição da versão na barra lateral e rodapé
- Separação de gráficos de tráfego e suporte de alta largura de banda
- Limpeza das configurações de administração e visibilidade dos campos
- Controle de acesso baseado em funções

#### 📚 **Documentação adicionada:**
- **`docs/WHATSAPP_MODULAR_README.md`:** Guia completo para arquitetura modular
- **`docs/TROUBLE_REPORT_WHATSAPP.md`:** Documentação do recurso de relatório de problemas
- **`docs/PPPOE_WHATSAPP.md`:** Documentação do recurso de gerenciamento PPPoE
- **`docs/WEB_ADMIN_VERSIONING.md`:** Documentação do recurso de controle de versão

---

### 🆕 **v2.0.0 - Sistema Base** *(2025-01-20)*

#### ✨ **Recursos básicos:**
- WhatsApp Bot Gateway com comandos básicos
- Administração do portal da Web com painel
- Sistema Integrado de Faturamento
- Gateway de pagamento (Midtrans, Xendit, Tripay)
- Gestão GenieACS
- Gestão Mikrotik
- Portal do Cliente
- Monitoramento em tempo real
- Notificação automática
- Sistema de Tickets de Problemas

---

## 👥 Controle de acesso baseado em função (RBAC)

### 🔐 **Hierarquia de Funções**

#### 👑 **Superadministrador**
- **Acesso:** Todos os recursos do aplicativo
- **Comandos do WhatsApp:** Todos os comandos de administrador
- **Administrador da Web:** Acesso total a todas as páginas
- **Configuração:** Pode alterar todas as configurações

#### 👨 ‍ 💼 **Administrador**
- **Acesso:** Recursos de administrador e técnico
- **Comandos do WhatsApp:** Comandos de administrador + comandos de técnico
- **Administrador Web:** Acesso ao painel, faturamento, mikrotik, genieacs
- **Configuração:** Pode alterar as configurações operacionais

#### 🔧 **Técnico**
- **Acesso:** Recursos técnicos e de monitoramento
- **Comandos do WhatsApp:** Comandos do técnico + comandos básicos do cliente
- **Administrador da Web:** Acesso limitado (monitoramento, relatórios de problemas)
- **Configuração:** Acesso somente leitura às configurações

#### 👤 **Cliente**
- **Acesso:** Recursos limitados para clientes
- **Comandos do WhatsApp:** Comandos básicos do cliente
- **Administrador da Web:** Somente portal do cliente
- **Configuração:** Sem acesso

### 🔑 **Configuração de função**

#### **Números de administrador** *(settings.json)*
```json
{
"admins.0": "6281947215703", // Superadministrador
"admins.1": "6287764444430", // Administrador adicional 1
"admins.2": "6281234567890" // Administrador adicional 2
}
```

#### **Números de técnicos** *(settings.json)*
```json
{
"technician_numbers.0": "6283807665111", // Técnico 1
"technician_numbers.1": "6282218094111", // Técnico 2
"technician_numbers.2": "6281234567891" // Técnico 3
}
```

### 🚪 **Matriz de Controle de Acesso**

| Recurso | Superadministrador | Administrador | Técnico | Cliente |
|---------|-------------|-------|------------|----------|
| Comandos de administração do WhatsApp | ✅ | ✅ | ❌ | ❌ |
| Comandos do técnico do WhatsApp | ✅ | ✅ | ✅ | ❌ |
| Comandos do cliente do WhatsApp | ✅ | ✅ | ✅ | ✅ |
| Painel de administração da Web | ✅ | ✅ | ❌ | ❌ |
| Gestão de Faturamento | ✅ | ✅ | ❌ | ❌ |
| Gerenciamento Mikrotik | ✅ | ✅ | ❌ | ❌ |
| Gestão GenieACS | ✅ | ✅ | ❌ | ❌ |
| Gerenciamento de configurações | ✅ | ✅ | ❌ | ❌ |
| Gerenciamento de Relatórios de Problemas | ✅ | ✅ | ✅ | ❌ |
| Portal do Cliente | ✅ | ✅ | ✅ | ✅ |

---

## 📁 Estrutura da Aplicação

```
bloqueio de nota/
├ ── app.js # Arquivo principal do aplicativo
├ ── package.json # Dependências e scripts
├ ── settings.json # Aplicativo de configuração
├ ── config/ # Módulo de configuração
│ ├ ── whatsapp.js # Manipulador de bot do WhatsApp (original)
│ ├ ── whatsapp-new.js # Manipulador de bot do WhatsApp (modular)
│ ├ ── whatsapp-core.js # Utilitários principais e validação
│ ├ ── whatsapp-commands.js # Manipuladores de comandos
│ ├ ── whatsapp-message-handlers.js # Roteamento de mensagens
│ ├ ── whatsapp-trouble-commands.js # Comandos de relatório de problemas
│ ├ ── whatsapp-pppoe-commands.js # Comandos de gerenciamento PPPoE
│ ├ ── version-utils.js # Utilitários de exibição de versão
│ ├ ── help-messages.js # Definições de mensagens de ajuda
│ ├ ── genieacs.js # API GenieACS
│ ├ ── mikrotik.js#API Mikrotik
│ ├ ── billing.js # Sistema de faturamento
│ ├ ── paymentGateway.js # Gerenciador de gateway de pagamento
│ ├ ── logger.js # Sistema de registro
│ └── settingsManager.js # Gerenciamento de configurações
├ ── rotas/ # Rotas expressas
│ ├ ── adminAuth.js # Autenticação de administrador
│ ├ ── adminDashboard.js # Rotas do painel
│ ├ ── adminBilling.js # Gerenciamento de faturamento
│ ├ ── adminGenieacs.js # Gerenciamento GenieACS
│ ├ ── adminMikrotik.js#Gerenciamento Mikrotik
│ ├ ── adminHotspot.js # Gerenciamento de hotspot
│ ├ ── adminSetting.js # Gerenciamento de configurações
│ ├ ── customerPortal.js # Portal do cliente
│ ├ ── payment.js # Rotas de gateway de pagamento
│ └── troubleReport.js # Sistema de tickets de problemas
├ ── visualizações/ # modelos EJS
│ ├ ── admin/ # Visualizações do administrador
│ │ ├ ── faturamento/ # Páginas de faturamento
│ │ └── ...
│ ├ ── cliente/ # Visualizações do cliente
│ └── parciais/ # Componentes compartilhados
├ ── public/ # Arquivos estáticos
│ ├ ── css/
│ ├ ── js/
│ └── imagem/
├ ── data/ # Arquivos de banco de dados
├ ── logs/ # Arquivos de log
├ ── scripts/ # Scripts de utilitários
└── whatsapp-session/ # Arquivos de sessão do WhatsApp
```

---

## 🌐 Recursos de administração da Web

### 📊 **Melhorias no painel**

#### **Monitoramento de tráfego da Internet**
- **Gráficos de tráfego separados:**
- **Download (RX):** Grafik terpisah para download de tráfego
- **Upload (TX):** Grafik terpisah para upload de tráfego
- **Visão geral combinada:** Gráficos para visão geral
- **Suporte de alta largura de banda:**
- Suporte para > 1 Gbps e > 500 Mbps
- Escalonamento automático para largura de banda de alcance maior
- Formato automatizado: bps, Kbps, Mbps, Gbps
- **Indicadores de status de tráfego:**
- **Ultra Alto:** >1 Gbps (Vermelho)
- **Muito alto:** >500Mbps (Vermelho)
- **Alto:** >100Mbps (Laranja)
- **Médio:** >10Mbps (Azul)
- **Baixo:** >1Mbps (Cinza)
- **Inativo:** <1Mbps (Cinza)

#### **Exibição de informações da versão**
- **Painel de versão da barra lateral:**
- Número da versão e número da compilação
- Data de lançamento e informações da empresa
- Emblema da versão com estilo
- **Linha de versão do rodapé:**
- Nome da versão e informações de compilação
- Data de lançamento e notas
- Consistente com barra lateral

### ⚙️ **Gerenciamento de configurações de administração**

#### **Visibilidade de campo inteligente**
- **Campos visíveis:**
- Números de administrador e técnico
- Informações da empresa e marca
- Configurações operacionais
- Configurações de negócios
- **Campos ocultos:**
- Informações da versão (sudah ada di sidebar/footer)
- Configurações técnicas/internas
- Chaves de API e dados confidenciais
- Caminhos de arquivos do sistema

#### **Interface amigável**
- **Alertas informativos:** Explicação do motivo pelo qual o campo está oculto
- **Etiquetas de campo:** Etiquetas claras e informativas
- **Configurações categorizadas:** Agrupamento por função
- **Navegação fácil:** Interface intuitiva

### 🎨 **Melhorias na IU/UX**

#### **Design responsivo**
- **Mobile-First:** Otimizado para dispositivos móveis
- **Bootstrap 5:** Estrutura de IU moderna
- **CSS personalizado:** Estilo consistente
- **Integração de ícones:** Ícones Bootstrap para apelo visual

#### **Consistência da marca**
- **Nome da empresa:** Marca "PACK"
- **Esquema de cores:** Paleta de cores consistente
- **Tipografia:** Opções de fontes legíveis
- **Layout:** Interface limpa e organizada

---

## 🤝 Contribuição

Para contribuir com este projeto:

1. Repositório Fork
2. Crie um novo branch de recurso (`git checkout -b feature/AmazingFeature`)
3. Confirme as alterações (`git commit -m 'Add some AmazingFeature'`)
4. Enviar para a ramificação (`git push origin feature/AmazingFeature`)
5. Crie uma solicitação de pull

### Diretrizes de desenvolvimento

- Use ESLint para formatação de código
- Escrever testes unitários para novos recursos
- Atualizar documentação para alterações
- Siga os commits convencionais

---

## 📄 Licença

Distribuído sob a licença ISC. Consulte `LICENÇA` para mais informações.

---



## ⚠️ Isenção de responsabilidade

**Não se esqueça de configurar o arquivo `settings.json` antes de executar o aplicativo!**

Este aplicativo foi desenvolvido para uso por ISPs e requer configuração adequada para funcionar corretamente. Certifique-se de que todas as credenciais e configurações da API estejam corretas antes de implantar em produção.

---

**Modificado (https://github.com/luizmeloDev)**

