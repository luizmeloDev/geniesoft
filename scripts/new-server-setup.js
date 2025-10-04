#!/usr/bin/env node

/**
 * New Server Setup - Configuração inicial para um novo servidor
 * Cria os dados padrão necessários para um novo servidor sem dados antigos.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function newServerSetup() {
    const dbPath = path.join(__dirname, '../data/billing.db');
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);
    
    try {
        console.log('🚀 NEW SERVER SETUP - Configuração Inicial do Novo Servidor...\n');
        
        // Passo 1: Otimizações do banco de dados
        console.log('⚙️  Passo 1: Aplicando otimizações ao banco de dados...');
        await new Promise((resolve, reject) => {
            db.run('PRAGMA journal_mode=WAL', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        await new Promise((resolve, reject) => {
            db.run('PRAGMA busy_timeout=30000', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        await new Promise((resolve, reject) => {
            db.run('PRAGMA foreign_keys=ON', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        console.log('   ✅ Modo WAL ativado');
        console.log('   ✅ Timeout configurado');
        console.log('   ✅ Chaves estrangeiras ativadas');
        
        // Passo 2: Criar pacotes padrão
        console.log('\n📦 Passo 2: Criando pacotes padrão...');
        const packages = [
            {
                name: 'Plano Básico',
                speed: '10 Mbps',
                price: 100.00,
                description: 'Plano de internet básico de 10 Mbps ilimitado',
                is_active: 1,
                pppoe_profile: 'default'
            },
            {
                name: 'Plano Padrão',
                speed: '20 Mbps',
                price: 150.00,
                description: 'Plano de internet padrão de 20 Mbps ilimitado',
                is_active: 1,
                pppoe_profile: 'standard'
            },
            {
                name: 'Plano Premium',
                speed: '50 Mbps',
                price: 250.00,
                description: 'Plano de internet premium de 50 Mbps ilimitado',
                is_active: 1,
                pppoe_profile: 'premium'
            }
        ];
        
        const packageIds = [];
        for (const pkg of packages) {
            const packageId = await new Promise((resolve, reject) => {
                db.run(`
                    INSERT INTO packages (name, speed, price, tax_rate, description, is_active, pppoe_profile) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [
                    pkg.name, pkg.speed, pkg.price, 0, pkg.description, pkg.is_active, pkg.pppoe_profile
                ], function(err) {
                    if (err) {
                        console.error(`❌ Falha ao criar o pacote ${pkg.name}:`, err.message);
                        reject(err);
                    } else {
                        console.log(`   ✅ Pacote ${pkg.name} criado (ID: ${this.lastID})`);
                        resolve(this.lastID);
                    }
                });
            });
            packageIds.push(packageId);
        }
        
        // Passo 3: Criar coletor padrão
        console.log('\n👤 Passo 3: Criando coletor padrão...');
        const collectorId = await new Promise((resolve, reject) => {
            db.run(`
                INSERT INTO collectors (name, phone, email, commission_rate, status, created_at) 
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `, [
                'Coletor Padrão',
                '11912345678',
                'coletor@empresa.com',
                10.0, // 10% de comissão
                'active'
            ], function(err) {
                if (err) {
                    console.error('❌ Falha ao criar o coletor padrão:', err.message);
                    reject(err);
                } else {
                    console.log('   ✅ Coletor padrão criado (ID: ' + this.lastID + ')');
                    resolve(this.lastID);
                }
            });
        });
        
        // Passo 4: Criar técnico padrão
        console.log('\n🔧 Passo 4: Criando técnico padrão...');
        const technicianId = await new Promise((resolve, reject) => {
            db.run(`
                INSERT INTO technicians (name, phone, role, is_active, join_date, created_at) 
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `, [
                'Administrador',
                '11987654321',
                'technician',
                1
            ], function(err) {
                if (err) {
                    console.error('❌ Falha ao criar o técnico padrão:', err.message);
                    reject(err);
                } else {
                    console.log('   ✅ Técnico padrão criado (ID: ' + this.lastID + ')');
                    resolve(this.lastID);
                }
            });
        });
        
        // Passo 5: Criar clientes de exemplo
        console.log('\n👥 Passo 5: Criando clientes de exemplo...');
        const customers = [
            {
                username: 'cliente1',
                name: 'Primeiro Cliente',
                phone: '11999998888',
                email: 'cliente1@example.com',
                address: 'Endereço do Primeiro Cliente'
            },
            {
                username: 'cliente2',
                name: 'Segundo Cliente',
                phone: '11988889999',
                email: 'cliente2@example.com',
                address: 'Endereço do Segundo Cliente'
            }
        ];
        
        const customerIds = [];
        for (const customer of customers) {
            const customerId = await new Promise((resolve, reject) => {
                db.run(`
                    INSERT INTO customers (username, name, phone, email, address, status, join_date) 
                    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                `, [
                    customer.username, customer.name, customer.phone, customer.email, customer.address, 'active'
                ], function(err) {
                    if (err) {
                        console.error(`❌ Falha ao criar o cliente ${customer.username}:`, err.message);
                        reject(err);
                    } else {
                        console.log(`   ✅ Cliente ${customer.username} criado (ID: ${this.lastID})`);
                        resolve(this.lastID);
                    }
                });
            });
            customerIds.push(customerId);
        }
        
        // Passo 6: Criar faturas de exemplo
        console.log('\n📄 Passo 6: Criando faturas de exemplo...');
        const invoices = [
            {
                customer_id: customerIds[0],
                package_id: packageIds[0],
                amount: 100.00,
                status: 'unpaid',
                due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                invoice_number: 'FAT-001',
                invoice_type: 'monthly'
            },
            {
                customer_id: customerIds[1],
                package_id: packageIds[1],
                amount: 150.00,
                status: 'unpaid',
                due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                invoice_number: 'FAT-002',
                invoice_type: 'monthly'
            }
        ];
        
        const invoiceIds = [];
        for (const invoice of invoices) {
            const invoiceId = await new Promise((resolve, reject) => {
                db.run(`
                    INSERT INTO invoices (customer_id, package_id, amount, status, due_date, created_at, invoice_number, invoice_type) 
                    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
                `, [
                    invoice.customer_id, invoice.package_id, invoice.amount, invoice.status, 
                    invoice.due_date, invoice.invoice_number, invoice.invoice_type
                ], function(err) {
                    if (err) {
                        console.error(`❌ Falha ao criar a fatura ${invoice.invoice_number}:`, err.message);
                        reject(err);
                    } else {
                        console.log(`   ✅ Fatura ${invoice.invoice_number} criada (ID: ${this.lastID})`);
                        resolve(this.lastID);
                    }
                });
            });
            invoiceIds.push(invoiceId);
        }
        
        // Passo 7: Criar configurações do aplicativo
        console.log('\n⚙️  Passo 7: Criando configurações do aplicativo...');
        const settings = [
            { key: 'company_name', value: 'Sua Empresa de Internet' },
            { key: 'company_phone', value: '11900000000' },
            { key: 'company_email', value: 'contato@suaempresa.com' },
            { key: 'company_address', value: 'Rua Exemplo, 123, Sua Cidade' },
            { key: 'default_commission_rate', value: '10' },
            { key: 'tax_rate', value: '0' },
            { key: 'currency', value: 'BRL' },
            { key: 'timezone', value: 'America/Sao_Paulo' }
        ];
        
        for (const setting of settings) {
            await new Promise((resolve, reject) => {
                db.run(`
                    INSERT INTO app_settings (key, value, created_at) 
                    VALUES (?, ?, CURRENT_TIMESTAMP)
                `, [
                    setting.key, setting.value
                ], function(err) {
                    if (err) {
                        console.error(`❌ Falha ao criar a configuração ${setting.key}:`, err.message);
                        reject(err);
                    } else {
                        console.log(`   ✅ Configuração ${setting.key} criada`);
                        resolve();
                    }
                });
            });
        }
        
        console.log('\n🎉 CONFIGURAÇÃO DO NOVO SERVIDOR CONCLUÍDA!');
        console.log('='.repeat(60));
        console.log('✅ Pacotes padrão criados');
        console.log('✅ Coletor padrão criado');
        console.log('✅ Técnico padrão criado');
        console.log('✅ Clientes de exemplo criados');
        console.log('✅ Faturas de exemplo criadas');
        console.log('✅ Configurações do aplicativo definidas');
        console.log('✅ Otimizações do banco de dados aplicadas');
        console.log('✅ Sistema pronto para produção');
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('❌ Erro durante a configuração do novo servidor:', error);
        throw error;
    } finally {
        db.close();
    }
}

// Executa se chamado diretamente
if (require.main === module) {
    newServerSetup()
        .then(() => {
            console.log('✅ Configuração do novo servidor concluída com sucesso');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Falha na configuração do novo servidor:', error);
            process.exit(1);
        });
}

module.exports = newServerSetup;
