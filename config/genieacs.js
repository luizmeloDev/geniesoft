const axios = require('axios');
const { sendTechnicianMessage } = require('./sendMessage');
const mikrotik = require('./mikrotik');
const { getMikrotikConnection } = require('./mikrotik');
const { getSetting } = require('./settingsManager');
const cacheManager = require('./cacheManager');

// Helper para criar instância do axios dinamicamente
function getAxiosInstance() {
    const GENIEACS_URL = getSetting('genieacs_url', 'http://localhost:7557');
    const GENIEACS_USERNAME = getSetting('genieacs_username', 'acs');
    const GENIEACS_PASSWORD = getSetting('genieacs_password', '');
    return axios.create({
        baseURL: GENIEACS_URL,
        auth: {
            username: GENIEACS_USERNAME,
            password: GENIEACS_PASSWORD
        },
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
}

// Wrapper da API GenieACS
const genieacsApi = {
    async getDevices() {
        try {
            // Verifica o cache primeiro
            const cacheKey = 'genieacs:devices';
            const cachedData = cacheManager.get(cacheKey);
            
            if (cachedData) {
                console.log(`✅ Usando dados de dispositivos do cache (${cachedData.length} dispositivos)`);
                return cachedData;
            }

            console.log('🔍 Buscando dispositivos da API GenieACS...');
            const axiosInstance = getAxiosInstance();
            const response = await axiosInstance.get('/devices');
            const devices = response.data || [];
            
            console.log(`✅ Encontrados ${devices.length} dispositivos da API`);
            
            // Armazena a resposta no cache por 2 minutos
            cacheManager.set(cacheKey, devices, 2 * 60 * 1000);
            
            return devices;
        } catch (error) {
            console.error('❌ Erro ao obter dispositivos:', error.response?.data || error.message);
            throw error;
        }
    },

    async findDeviceByPhoneNumber(phoneNumber) {
        try {
            const axiosInstance = getAxiosInstance();
            // Busca o dispositivo pela tag que contém o número de telefone
            const response = await axiosInstance.get('/devices', {
                params: {
                    'query': JSON.stringify({
                        '_tags': phoneNumber
                    })
                }
            });

            if (response.data && response.data.length > 0) {
                return response.data[0]; // Retorna o primeiro dispositivo encontrado
            }

            // Se não encontrar pela tag, tenta buscar pelo nome de usuário PPPoE do faturamento
            try {
                const { billingManager } = require('./billing');
                const customer = await billingManager.getCustomerByPhone(phoneNumber);
                if (customer && customer.pppoe_username) {
                    console.log(`Dispositivo não encontrado pela tag do telefone, tentando nome de usuário PPPoE: ${customer.pppoe_username}`);
                    return await this.findDeviceByPPPoE(customer.pppoe_username);
                }
            } catch (billingError) {
                console.error(`Erro ao buscar cliente no faturamento para o telefone ${phoneNumber}:`, billingError.message);
            }

            throw new Error(`Nenhum dispositivo encontrado com o número de telefone: ${phoneNumber}`);
        } catch (error) {
            console.error(`Erro ao buscar dispositivo com o número de telefone ${phoneNumber}:`, error.response?.data || error.message);
            throw error;
        }
    },

    async findDeviceByPPPoE(pppoeUsername) {
        try {
            const axiosInstance = getAxiosInstance();
            
            // Caminhos dos parâmetros para o nome de usuário PPPoE
            const pppUsernamePaths = [
                'InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.1.Username',
                'InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.1.Username._value',
                'VirtualParameters.pppoeUsername',
                'VirtualParameters.pppUsername'
            ];
            
            // Cria a query para buscar o dispositivo pelo nome de usuário PPPoE
            const queryObj = { $or: [] };
            
            // Adiciona todos os caminhos possíveis à query
            for (const path of pppUsernamePaths) {
                const pathQuery = {};
                pathQuery[path] = pppoeUsername;
                queryObj.$or.push(pathQuery);
            }
            
            const queryJson = JSON.stringify(queryObj);
            const encodedQuery = encodeURIComponent(queryJson);
            
            // Busca o dispositivo no GenieACS
            const response = await axiosInstance.get(`/devices/?query=${encodedQuery}`);
            
            if (response.data && response.data.length > 0) {
                return response.data[0];
            }
            
            throw new Error(`Nenhum dispositivo encontrado com o nome de usuário PPPoE: ${pppoeUsername}`);
        } catch (error) {
            console.error(`Erro ao buscar dispositivo com o nome de usuário PPPoE ${pppoeUsername}:`, error.response?.data || error.message);
            throw error;
        }
    },

    async getDeviceByPhoneNumber(phoneNumber) {
        try {
            const device = await this.findDeviceByPhoneNumber(phoneNumber);
            if (!device) {
                throw new Error(`Nenhum dispositivo encontrado com o número de telefone: ${phoneNumber}`);
            }
            return await this.getDevice(device._id);
        } catch (error) {
            console.error(`Erro ao obter dispositivo pelo número de telefone ${phoneNumber}:`, error.message);
            throw error;
        }
    },

    async getDevice(deviceId) {
        try {
            const axiosInstance = getAxiosInstance();
            const response = await axiosInstance.get(`/devices/${encodeURIComponent(deviceId)}`);
            return response.data;
        } catch (error) {
            console.error(`Erro ao obter dispositivo ${deviceId}:`, error.response?.data || error.message);
            throw error;
        }
    },

    async setParameterValues(deviceId, parameters) {
        try {
            console.log('Definindo parâmetros para o dispositivo:', deviceId, parameters);
            const axiosInstance = getAxiosInstance();
            // Formata os valores dos parâmetros para o GenieACS
            const parameterValues = [];
            for (const [path, value] of Object.entries(parameters)) {
                // Lida com a atualização do SSID
                if (path.includes('SSID')) {
                    parameterValues.push(
                        ["InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID", value],
                        ["Device.WiFi.SSID.1.SSID", value]
                    );
                }
                // Lida com a atualização da senha do WiFi
                else if (path.includes('Password') || path.includes('KeyPassphrase')) {
                    parameterValues.push(
                        ["InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.PreSharedKey.1.KeyPassphrase", value],
                        ["InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.KeyPassphrase", value],
                        ["InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.PreSharedKey.1.PreSharedKey", value]
                    );
                }
                // Lida com outros parâmetros
                else {
                    parameterValues.push([path, value]);
                }
            }

            console.log('Valores de parâmetros formatados:', parameterValues);

            // Envia a tarefa para o GenieACS
            const task = {
                name: "setParameterValues",
                parameterValues: parameterValues
            };

            const response = await axiosInstance.post(
                `/devices/${encodeURIComponent(deviceId)}/tasks?connection_request`,
                task
            );

            console.log('Resposta da atualização de parâmetros:', response.data);

            // Envia a tarefa de atualização
            const refreshTask = {
                name: "refreshObject",
                objectName: "InternetGatewayDevice.LANDevice.1.WLANConfiguration.1"
            };

            const refreshResponse = await axiosInstance.post(
                `/devices/${encodeURIComponent(deviceId)}/tasks?connection_request`,
                refreshTask
            );

            console.log('Resposta da tarefa de atualização:', refreshResponse.data);

            return response.data;
        } catch (error) {
            console.error(`Erro ao definir parâmetros para o dispositivo ${deviceId}:`, error.response?.data || error.message);
            throw error;
        }
    },

    async reboot(deviceId) {
        try {
            const axiosInstance = getAxiosInstance();
            const task = {
                name: "reboot",
                timestamp: new Date().toISOString()
            };
            const response = await axiosInstance.post(
                `/devices/${encodeURIComponent(deviceId)}/tasks`,
                task
            );
            return response.data;
        } catch (error) {
            console.error(`Erro ao reiniciar dispositivo ${deviceId}:`, error.response?.data || error.message);
            throw error;
        }
    },

    async factoryReset(deviceId) {
        try {
            const axiosInstance = getAxiosInstance();
            const task = {
                name: "factoryReset",
                timestamp: new Date().toISOString()
            };
            const response = await axiosInstance.post(
                `/devices/${encodeURIComponent(deviceId)}/tasks`,
                task
            );
            return response.data;
        } catch (error) {
            console.error(`Erro ao resetar de fábrica o dispositivo ${deviceId}:`, error.response?.data || error.message);
            throw error;
        }
    },

    async addTagToDevice(deviceId, tag) {
        try {
            console.log(`Adicionando tag "${tag}" ao dispositivo: ${deviceId}`);
            const axiosInstance = getAxiosInstance();
            
            // Obtém o dispositivo primeiro para ver as tags existentes
            const device = await this.getDevice(deviceId);
            const existingTags = device._tags || [];
            
            // Verifica se a tag já existe
            if (existingTags.includes(tag)) {
                console.log(`Tag "${tag}" já existe no dispositivo ${deviceId}`);
                return { success: true, message: 'Tag já existe' };
            }
            
            // Adiciona a nova tag
            const newTags = [...existingTags, tag];
            
            // Atualiza o dispositivo com as novas tags
            const response = await axiosInstance.put(
                `/devices/${encodeURIComponent(deviceId)}`,
                {
                    _tags: newTags
                }
            );
            
            console.log(`Tag "${tag}" adicionada com sucesso ao dispositivo ${deviceId}`);
            return { success: true, message: 'Tag adicionada com sucesso' };
        } catch (error) {
            console.error(`Erro ao adicionar tag "${tag}" ao dispositivo ${deviceId}:`, error.response?.data || error.message);
            throw error;
        }
    },

    async removeTagFromDevice(deviceId, tag) {
        try {
            console.log(`Removendo tag "${tag}" do dispositivo: ${deviceId}`);
            const axiosInstance = getAxiosInstance();
            
            // Obtém o dispositivo primeiro para ver as tags existentes
            const device = await this.getDevice(deviceId);
            const existingTags = device._tags || [];
            
            // Verifica se a tag existe
            if (!existingTags.includes(tag)) {
                console.log(`Tag "${tag}" não existe no dispositivo ${deviceId}`);
                return { success: true, message: 'Tag não existe' };
            }
            
            // Remove a tag
            const newTags = existingTags.filter(t => t !== tag);
            
            // Atualiza o dispositivo com as tags filtradas
            const response = await axiosInstance.put(
                `/devices/${encodeURIComponent(deviceId)}`,
                {
                    _tags: newTags
                }
            );
            
            console.log(`Tag "${tag}" removida com sucesso do dispositivo ${deviceId}`);
            return { success: true, message: 'Tag removida com sucesso' };
        } catch (error) {
            console.error(`Erro ao remover tag "${tag}" do dispositivo ${deviceId}:`, error.response?.data || error.message);
            throw error;
        }
    },

    async getDeviceParameters(deviceId, parameterNames) {
        try {
            const axiosInstance = getAxiosInstance();
            const queryString = parameterNames.map(name => `query=${encodeURIComponent(name)}`).join('&');
            const response = await axiosInstance.get(`/devices/${encodeURIComponent(deviceId)}?${queryString}`);
            return response.data;
        } catch (error) {
            console.error(`Erro ao obter parâmetros para o dispositivo ${deviceId}:`, error.response?.data || error.message);
            throw error;
        }
    },

    async getDeviceInfo(deviceId) {
        try {
            console.log(`Obtendo informações do dispositivo para o ID: ${deviceId}`);
            const GENIEACS_URL = getSetting('genieacs_url', 'http://localhost:7557');
            const GENIEACS_USERNAME = getSetting('genieacs_username', 'acs');
            const GENIEACS_PASSWORD = getSetting('genieacs_password', '');
            // Obtendo detalhes do dispositivo
            const deviceResponse = await axios.get(`${GENIEACS_URL}/devices/${encodeURIComponent(deviceId)}`, {
                auth: {
                    username: GENIEACS_USERNAME,
                    password: GENIEACS_PASSWORD
                }
            });
            return deviceResponse.data;
        } catch (error) {
            console.error(`Erro ao obter informações do dispositivo para ${deviceId}:`, error.response?.data || error.message);
            throw error;
        }
    },

    async getVirtualParameters(deviceId) {
        try {
            const axiosInstance = getAxiosInstance();
            const response = await axiosInstance.get(`/devices/${encodeURIComponent(deviceId)}`);
            return response.data.VirtualParameters || {};
        } catch (error) {
            console.error(`Erro ao obter parâmetros virtuais para o dispositivo ${deviceId}:`, error.response?.data || error.message);
            throw error;
        }
    },
};

// Função para verificar o valor do RXPower de todos os dispositivos
async function monitorRXPower(threshold = -27) {
    try {
        console.log(`Iniciando monitoramento de RXPower com limiar de ${threshold} dBm`);
        
        // Busca todos os dispositivos
        const devices = await genieacsApi.getDevices();
        console.log(`Verificando RXPower para ${devices.length} dispositivos...`);
        
        // Busca dados PPPoE do Mikrotik
        console.log('Buscando dados PPPoE do Mikrotik...');
        const conn = await getMikrotikConnection();
        let pppoeSecrets = [];
        
        if (conn) {
            try {
                // Obtém todos os secrets PPPoE do Mikrotik
                pppoeSecrets = await conn.write('/ppp/secret/print');
                console.log(`Encontrados ${pppoeSecrets.length} secrets PPPoE`);
            } catch (error) {
                console.error('Erro ao obter secrets PPPoE:', error.message);
            }
        }
        
        const criticalDevices = [];
        
        // Verifica cada dispositivo
        for (const device of devices) {
            try {
                // Obtém o valor do RXPower
                const rxPowerPaths = [
                    'VirtualParameters.RXPower',
                    'VirtualParameters.redaman',
                    'InternetGatewayDevice.WANDevice.1.WANPONInterfaceConfig.RXPower',
                    'Device.XPON.Interface.1.Stats.RXPower'
                ];
                
                let rxPower = null;
                
                // Verifica cada caminho que pode conter o valor do RXPower
                for (const path of rxPowerPaths) {
                    // Extrai o valor usando o caminho que existe no dispositivo
                    if (getRXPowerValue(device, path)) {
                        rxPower = getRXPowerValue(device, path);
                        break;
                    }
                }
                
                // Se o rxPower for encontrado e estiver abaixo do limiar
                if (rxPower !== null && parseFloat(rxPower) < threshold) {
                    // Busca o nome de usuário PPPoE dos parâmetros do dispositivo
                    let pppoeUsername = "Desconhecido";
                    const serialNumber = getDeviceSerialNumber(device);
                    const deviceId = device._id;
                    const shortDeviceId = deviceId.split('-')[2] || deviceId;
                    
                    // Obtém o nome de usuário PPPoE dos parâmetros do dispositivo
                    pppoeUsername = 
                        device.InternetGatewayDevice?.WANDevice?.[1]?.WANConnectionDevice?.[1]?.WANPPPConnection?.[1]?.Username?._value ||
                        device.InternetGatewayDevice?.WANDevice?.[0]?.WANConnectionDevice?.[0]?.WANPPPConnection?.[0]?.Username?._value ||
                        device.VirtualParameters?.pppoeUsername?._value ||
                        "Desconhecido";
                    
                    // Se não for encontrado nos parâmetros do dispositivo, tenta buscar nos secrets PPPoE no Mikrotik
                    if (pppoeUsername === "Desconhecido") {
                        // Tenta encontrar um secret PPPoE relacionado a este dispositivo com base no comentário
                        const matchingSecret = pppoeSecrets.find(secret => {
                            if (!secret.comment) return false;
                            
                            // Verifica se o número de série ou o ID do dispositivo está no campo de comentário
                            return (
                                secret.comment.includes(serialNumber) || 
                                secret.comment.includes(shortDeviceId)
                            );
                        });
                        
                        if (matchingSecret) {
                            // Se encontrar um secret correspondente, usa o nome do secret como nome de usuário
                            pppoeUsername = matchingSecret.name;
                            console.log(`Nome de usuário PPPoE ${pppoeUsername} encontrado para o dispositivo ${shortDeviceId} a partir do secret PPPoE`);
                        }
                    } else {
                        console.log(`Nome de usuário PPPoE ${pppoeUsername} encontrado para o dispositivo ${shortDeviceId} a partir dos parâmetros do dispositivo`);
                    }
                    
                    // Se ainda não for encontrado, tenta buscar nas tags do dispositivo
                    if (pppoeUsername === "Desconhecido" && device._tags && Array.isArray(device._tags)) {
                        // Verifica se há uma tag que começa com "pppoe:" contendo o nome de usuário
                        const pppoeTag = device._tags.find(tag => tag.startsWith('pppoe:'));
                        if (pppoeTag) {
                            pppoeUsername = pppoeTag.replace('pppoe:', '');
                            console.log(`Nome de usuário PPPoE ${pppoeUsername} encontrado para o dispositivo ${shortDeviceId} a partir da tag`);
                        } else {
                            console.log(`Nome de usuário PPPoE não encontrado para o dispositivo ${shortDeviceId}, tags: ${JSON.stringify(device._tags)}`);
                        }
                    }
                    
                    const deviceInfo = {
                        id: device._id,
                        rxPower,
                        serialNumber: getDeviceSerialNumber(device),
                        lastInform: device._lastInform,
                        pppoeUsername: pppoeUsername
                    };
                    
                    criticalDevices.push(deviceInfo);
                    console.log(`Dispositivo com RXPower baixo: ${deviceInfo.id}, RXPower: ${rxPower} dBm, PPPoE: ${pppoeUsername}`);
                }
            } catch (deviceError) {
                console.error(`Erro ao verificar RXPower para o dispositivo ${device._id}:`, deviceError);
            }
        }
        
        // Se houver dispositivos com RXPower abaixo do limiar
        if (criticalDevices.length > 0) {
            // Cria a mensagem de aviso
            let message = `⚠️ *AVISO: ATENUAÇÃO ALTA* ⚠️\n\n`;
            message += `${criticalDevices.length} dispositivos têm um valor de RXPower acima de ${threshold} dBm:\n\n`;
            
            criticalDevices.forEach((device, index) => {
                message += `${index + 1}. ID: ${device.id.split('-')[2] || device.id}\n`;
                message += `   S/N: ${device.serialNumber}\n`;
                message += `   PPPoE: ${device.pppoeUsername}\n`;
                message += `   RXPower: ${device.rxPower} dBm\n`;
                message += `   Última Informação: ${new Date(device.lastInform).toLocaleString()}\n\n`;
            });
            
            message += `Por favor, verifique imediatamente para evitar a desconexão.`;
            
            // Envia a mensagem para o grupo de técnicos com prioridade alta
            await sendTechnicianMessage(message, 'high');
            console.log(`Mensagem de aviso de RXPower enviada para ${criticalDevices.length} dispositivos`);
        } else {
            console.log('Nenhum dispositivo com valor de RXPower abaixo do limiar');
        }
        
        return {
            success: true,
            criticalDevices,
            message: `${criticalDevices.length} dispositivos têm RXPower acima do limiar`
        };
    } catch (error) {
        console.error('Erro ao monitorar RXPower:', error);
        return {
            success: false,
            message: `Erro ao monitorar RXPower: ${error.message}`,
            error
        };
    }
}

// Função auxiliar para obter o valor do RXPower
function getRXPowerValue(device, path) {
    try {
        // Divide o caminho em partes
        const parts = path.split('.');
        let current = device;
        
        // Navega através das propriedades aninhadas
        for (const part of parts) {
            if (!current) return null;
            current = current[part];
        }
        
        // Verifica se é um objeto de parâmetro do GenieACS
        if (current && current._value !== undefined) {
            return current._value;
        }
        
        return null;
    } catch (error) {
        console.error(`Erro ao obter RXPower do caminho ${path}:`, error);
        return null;
    }
}

// Função auxiliar para obter o número de série do dispositivo
function getDeviceSerialNumber(device) {
    try {
        const serialPaths = [
            'DeviceID.SerialNumber',
            'InternetGatewayDevice.DeviceInfo.SerialNumber',
            'Device.DeviceInfo.SerialNumber'
        ];
        
        for (const path of serialPaths) {
            const parts = path.split('.');
            let current = device;
            
            for (const part of parts) {
                if (!current) break;
                current = current[part];
            }
            
            if (current && current._value !== undefined) {
                return current._value;
            }
        }
        
        // Fallback para o ID do dispositivo se o número de série não for encontrado
        if (device._id) {
            const parts = device._id.split('-');
            if (parts.length >= 3) {
                return parts[2];
            }
            return device._id;
        }
        
        return 'Desconhecido';
    } catch (error) {
        console.error('Erro ao obter número de série do dispositivo:', error);
        return 'Desconhecido';
    }
}

// Função para monitorar dispositivos inativos (offline)
async function monitorOfflineDevices(thresholdHours = null) {
    try {
        // Se thresholdHours não for fornecido, busca nas configurações
        if (thresholdHours === null) {
            thresholdHours = parseInt(getSetting('offline_device_threshold_hours', '24'));
        }
        console.log(`Iniciando monitoramento de dispositivos offline com limiar de ${thresholdHours} horas`);
        
        // Busca todos os dispositivos
        const devices = await genieacsApi.getDevices();
        console.log(`Verificando status de ${devices.length} dispositivos...`);
        
        const offlineDevices = [];
        const now = new Date();
        const thresholdMs = thresholdHours * 60 * 60 * 1000; // Converte horas para ms
        
        // Verifica cada dispositivo
        for (const device of devices) {
            try {
                if (!device._lastInform) {
                    console.log(`Dispositivo ${device._id} não possui lastInform`);
                    continue;
                }
                
                const lastInformTime = new Date(device._lastInform).getTime();
                const timeDiff = now.getTime() - lastInformTime;
                
                // Se o dispositivo não se comunicou dentro do tempo que excede o limiar
                if (timeDiff > thresholdMs) {
                    const pppoeUsername = device?.VirtualParameters?.pppoeUsername?._value ||
    device?.InternetGatewayDevice?.WANDevice?.[1]?.WANConnectionDevice?.[1]?.WANPPPConnection?.[1]?.Username?._value ||
    device?.InternetGatewayDevice?.WANDevice?.[0]?.WANConnectionDevice?.[0]?.WANPPPConnection?.[0]?.Username?._value ||
    (Array.isArray(device?._tags) ? (device._tags.find(tag => tag.startsWith('pppoe:'))?.replace('pppoe:', '')) : undefined) ||
    '-';
const deviceInfo = {
    id: device._id,
    serialNumber: getDeviceSerialNumber(device),
    pppoeUsername,
    lastInform: device._lastInform,
    offlineHours: Math.round(timeDiff / (60 * 60 * 1000) * 10) / 10 // Horas com 1 decimal
};
                    
                    offlineDevices.push(deviceInfo);
                    console.log(`Dispositivo offline: ${deviceInfo.id}, Offline por: ${deviceInfo.offlineHours} horas`);
                }
            } catch (deviceError) {
                console.error(`Erro ao verificar status para o dispositivo ${device._id}:`, deviceError);
            }
        }
        
        // Se houver dispositivos offline
        if (offlineDevices.length > 0) {
            // Cria a mensagem de aviso
            let message = `⚠️ *AVISO: DISPOSITIVO OFFLINE* ⚠️\n\n`;
            message += `${offlineDevices.length} dispositivos offline há mais de ${thresholdHours} horas:\n\n`;
            
            offlineDevices.forEach((device, index) => {
    message += `${index + 1}. ID: ${device.id.split('-')[2] || device.id}\n`;
    message += `   S/N: ${device.serialNumber}\n`;
    message += `   PPPoE: ${device.pppoeUsername || '-'}\n`;
    message += `   Offline por: ${device.offlineHours} horas\n`;
    message += `   Última Informação: ${new Date(device.lastInform).toLocaleString()}\n\n`;
});
            
            message += `Por favor, tome as medidas necessárias.`;
            
            // Envia a mensagem para o grupo de técnicos com prioridade média
            await sendTechnicianMessage(message, 'medium');
            console.log(`Mensagem de aviso de dispositivo offline enviada para ${offlineDevices.length} dispositivos`);
        } else {
            console.log('Nenhum dispositivo offline além do limiar');
        }
        
        return {
            success: true,
            offlineDevices,
            message: `${offlineDevices.length} dispositivos offline há mais de ${thresholdHours} horas`
        };
    } catch (error) {
        console.error('Erro ao monitorar dispositivos offline:', error);
        return {
            success: false,
            message: `Erro ao monitorar dispositivos offline: ${error.message}`,
            error
        };
    }
}

// Agenda o monitoramento - DESABILITADO (usando IntervalManager em vez disso)
// function scheduleMonitoring() { ... }

// ===== MELHORIAS: VERSÕES COM CACHE (Não altera as funções existentes) =====

/**
 * getDevices aprimorado com cache
 * Recorre à função original se o cache falhar
 */
async function getDevicesCached() {
    // Usa a mesma chave de cache do método getDevices
    const cacheKey = 'genieacs:devices';
    const cached = cacheManager.get(cacheKey);
    
    if (cached) {
        console.log(`📦 Usando dados de dispositivos do cache (${cached.length} dispositivos)`);
        return cached;
    }
    
    console.log('🔄 Buscando novos dados de dispositivos do GenieACS');
    const devices = await genieacsApi.getDevices();
    
    return devices; // getDevices já lida com o cache
}

/**
 * getDeviceInfo aprimorado com cache
 * Recorre à função original se o cache falhar
 */
async function getDeviceInfoCached(deviceId) {
    const cacheKey = `genieacs_device_${deviceId}`;
    const cached = cacheManager.get(cacheKey);
    
    if (cached) {
        console.log(`📦 Usando informações do dispositivo em cache para ${deviceId}`);
        return cached;
    }
    
    console.log(`🔄 Buscando novas informações do dispositivo para ${deviceId}`);
    const deviceInfo = await genieacsApi.getDeviceInfo(deviceId);
    
    // Cache por 2 minutos
    cacheManager.set(cacheKey, deviceInfo, 2 * 60 * 1000);
    
    return deviceInfo;
}

/**
 * Limpa o cache para um dispositivo específico
 * Útil quando há uma atualização no dispositivo
 */
function clearDeviceCache(deviceId = null) {
    try {
        if (deviceId) {
            cacheManager.clear(`genieacs_device_${deviceId}`);
            console.log(`🗑️ Cache limpo para o dispositivo ${deviceId}`);
        } else {
            // Limpa todo o cache relacionado ao GenieACS
            cacheManager.clear('genieacs_devices');
            console.log('🗑️ Cache de todos os dispositivos GenieACS limpo');
        }
    } catch (error) {
        console.error('Erro ao limpar o cache do dispositivo:', error);
        throw error;
    }
}

/**
 * Limpa todo o cache (para manutenção)
 */
function clearAllCache() {
    try {
        cacheManager.clearAll();
        console.log('🗑️ Todo o cache foi limpo');
    } catch (error) {
        console.error('Erro ao limpar todo o cache:', error);
        throw error;
    }
}

/**
 * Obtém estatísticas de cache para monitoramento
 */
function getCacheStats() {
    return cacheManager.getStats();
}

module.exports = {
    // Funções originais (não alteradas)
    getDevices: genieacsApi.getDevices,
    getDeviceInfo: genieacsApi.getDeviceInfo,
    findDeviceByPhoneNumber: genieacsApi.findDeviceByPhoneNumber,
    findDeviceByPPPoE: genieacsApi.findDeviceByPPPoE,
    getDeviceByPhoneNumber: genieacsApi.getDeviceByPhoneNumber,
    setParameterValues: genieacsApi.setParameterValues,
    reboot: genieacsApi.reboot,
    factoryReset: genieacsApi.factoryReset,
    addTagToDevice: genieacsApi.addTagToDevice,
    removeTagFromDevice: genieacsApi.removeTagFromDevice,
_SERVICE_                    getVirtualParameters: genieacsApi.getVirtualParameters,
    monitorRXPower,
    monitorOfflineDevices,
    
    // Funções aprimoradas com cache
    getDevicesCached,
    getDeviceInfoCached,
    clearDeviceCache,
    clearAllCache,
    getCacheStats
};
