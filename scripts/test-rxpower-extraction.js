/**
 * Script para testar a extração de RXPower do GenieACS
 */

const { getDevicesCached } = require('../config/genieacs');

console.log('🔍 Testando a extração de RXPower do GenieACS...\n');

// Função auxiliar para obter o valor de um parâmetro de um dispositivo GenieACS
function getParameterValue(device, parameterPath) {
    try {
        const parts = parameterPath.split('.');
        let current = device;
        
        for (const part of parts) {
            if (!current) return null;
            current = current[part];
        }
        
        // Verifica se é um objeto de parâmetro do GenieACS
        if (current && current._value !== undefined) {
            return current._value;
        }
        
        return current || null;
    } catch (error) {
        console.error(`Erro ao obter o parâmetro ${parameterPath}:`, error);
        return null;
    }
}

// Função auxiliar para obter o valor de RXPower com múltiplos caminhos
function getRXPowerValue(device) {
    try {
        // Caminhos que podem conter o valor de RXPower
        const rxPowerPaths = [
            'VirtualParameters.RXPower',
            'VirtualParameters.redaman',
            'InternetGatewayDevice.WANDevice.1.WANPONInterfaceConfig.RXPower',
            'Device.XPON.Interface.1.Stats.RXPower',
            'InternetGatewayDevice.WANDevice.1.WANPONInterfaceConfig.RXPower._value',
            'VirtualParameters.RXPower._value',
            'Device.XPON.Interface.1.Stats.RXPower._value'
        ];
        
        let rxPower = null;
        
        // Verifica cada caminho que pode conter o valor de RXPower
        for (const path of rxPowerPaths) {
            const value = getParameterValue(device, path);
            if (value !== null && value !== undefined && value !== '') {
                // Valida se o valor é um número
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    rxPower = value;
                    console.log(`📡 Encontrado RXPower: ${rxPower} dBm no caminho: ${path}`);
                    break;
                }
            }
        }
        
        return rxPower;
    } catch (error) {
        console.error('Erro ao obter RXPower:', error);
        return null;
    }
}

async function testRXPowerExtraction() {
    try {
        console.log('📡 Carregando dispositivos do GenieACS...');
        const devices = await getDevicesCached();
        
        console.log(`📊 Encontrados ${devices.length} dispositivos no GenieACS`);
        
        if (devices.length === 0) {
            console.log('⚠️ Nenhum dispositivo encontrado no GenieACS');
            return;
        }
        
        // Testar a extração de RXPower para os primeiros 5 dispositivos
        const devicesToTest = devices.slice(0, 5);
        
        console.log('\n🔍 Testando a extração de RXPower para os 5 primeiros dispositivos:');
        
        devicesToTest.forEach((device, index) => {
            console.log(`\n📡 Dispositivo ${index + 1}: ${device._id}`);
            
            // Depurar a estrutura do dispositivo
            console.log('📋 Chaves do dispositivo:', Object.keys(device));
            
            if (device.VirtualParameters) {
                console.log('📋 Chaves de VirtualParameters:', Object.keys(device.VirtualParameters));
            }
            
            if (device.InternetGatewayDevice) {
                console.log('📋 Chaves de InternetGatewayDevice:', Object.keys(device.InternetGatewayDevice));
            }
            
            // Testar a extração de RXPower
            const rxPower = getRXPowerValue(device);
            console.log(`📡 Resultado do RXPower: ${rxPower}`);
            
            // Testar caminhos individuais
            const paths = [
                'VirtualParameters.RXPower',
                'VirtualParameters.redaman',
                'InternetGatewayDevice.WANDevice.1.WANPONInterfaceConfig.RXPower',
                'Device.XPON.Interface.1.Stats.RXPower'
            ];
            
            paths.forEach(path => {
                const value = getParameterValue(device, path);
                console.log(`   ${path}: ${value}`);
            });
        });
        
        // Resumo
        console.log('\n📊 Resumo:');
        let devicesWithRXPower = 0;
        
        devices.forEach(device => {
            const rxPower = getRXPowerValue(device);
            if (rxPower !== null) {
                devicesWithRXPower++;
            }
        });
        
        console.log(`✅ Dispositivos com dados de RXPower: ${devicesWithRXPower}/${devices.length}`);
        
        if (devicesWithRXPower === 0) {
            console.log('⚠️ Nenhum dispositivo possui dados de RXPower - este pode ser o motivo pelo qual o RXPower não está sendo exibido');
            console.log('💡 Verifique se o GenieACS está configurado corretamente e se os dispositivos estão reportando dados de potência');
        } else {
            console.log('🎉 A extração de RXPower está funcionando!');
        }
        
    } catch (error) {
        console.error('❌ Erro ao testar a extração de RXPower:', error);
    }
}

// Executar teste
testRXPowerExtraction();
