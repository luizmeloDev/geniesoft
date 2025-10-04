#!/usr/bin/env node

/**
 * New Server Setup - Configuração inicial para um novo servidor.
 * Cria ou verifica os dados padrão necessários, tornando o script seguro para ser executado múltiplas vezes.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Abre a conexão com o banco de dados de forma assíncrona
const openDb = (dbPath) => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(db);
            }
        });
    });
};

// Executa uma consulta SQL (run) de forma assíncrona
const dbRun = (db, sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ lastID: this.lastID, changes: this.changes });
            }
        });
    });
};

// Obtém um único registro (get) de forma assíncrona
const dbGet = (db, sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

async function newServerSetup() {
    let db;
    try {
        const dbPath = path.join(__dirname, '../data/billing.db');
        db = await openDb(dbPath);
        
        console.log('🚀 NEW SERVER SETUP - Configuração Inicial do Novo Servidor...\n');

        // Passo 1: Otimizações do banco de dados
        console.log('⚙️  Passo 1: Aplicando otimizações ao banco de dados...');
        await dbRun(db, 'PRAGMA journal_mode=WAL');
        await dbRun(db, 'PRAGMA busy_timeout=30000');
        await dbRun(db, 'PRAGMA foreign_keys=ON');
        console.log('   ✅ Otimizações do banco de dados aplicadas.\n');

        // Função Genérica para "Get or Create"
        const getOrCreate = async (selectSql, selectParams, insertSql, insertParams, logPrefix) => {
            let record = await dbGet(db, selectSql, selectParams);
            if (record) {
                console.log(`   ☑️  ${logPrefix} já existe (ID: ${record.id}).`);
                return record.id;
            } else {
                const { lastID } = await dbRun(db, insertSql, insertParams);
                console.log(`   ✅ ${logPrefix} criado (ID: ${lastID}).`);
                return lastID;
            }
        };

        // Passo 2: Criar pacotes padrão
        console.log('📦 Passo 2: Criando ou verificando pacotes padrão...');
        const packages = [
            { name: 'Plano Básico', speed: '10 Mbps', price: 100.00, desc: 'Plano básico de 10 Mbps', pppoe: 'default' },
            { name: 'Plano Padrão', speed: '20 Mbps', price: 150.00, desc: 'Plano padrão de 20 Mbps', pppoe: 'standard' },
            { name: 'Plano Premium', speed: '50 Mbps', price: 250.00, desc: 'Plano premium de 50 Mbps', pppoe: 'premium' },
        ];
        const packageIds = [];
        for (const pkg of packages) {
            const id = await getOrCreate(
                'SELECT id FROM packages WHERE name = ?', [pkg.name],
                'INSERT INTO packages (name, speed, price, tax_rate, description, is_active, pppoe_profile) VALUES (?, ?, ?, ?, ?, 1, ?)',
                [pkg.name, pkg.speed, pkg.price, 0, pkg.desc, pkg.ppoe],
                `Pacote ${pkg.name}`
            );
            packageIds.push(id);
        }
        console.log('');

        // Passo 3: Criar coletor padrão
        console.log('👤 Passo 3: Criando ou verificando coletor padrão...');
        const collectorId = await getOrCreate(
            'SELECT id FROM collectors WHERE phone = ?', ['11912345678'],
            'INSERT INTO collectors (name, phone, email, commission_rate, status, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
            ['Coletor Padrão', '11912345678', 'coletor@empresa.com', 10.0, 'active'],
            'Coletor Padrão'
        );
        console.log('');

        // Passo 4: Criar técnico padrão
        console.log('🔧 Passo 4: Criando ou verificando técnico padrão...');
        const technicianId = await getOrCreate(
            'SELECT id FROM technicians WHERE phone = ?', ['11987654321'],
            'INSERT INTO technicians (name, phone, role, is_active, join_date, created_at) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
            ['Administrador', '11987654321', 'technician'],
            'Técnico Padrão'
        );
        console.log('');

        // Passo 5: Criar clientes de exemplo
        console.log('👥 Passo 5: Criando ou verificando clientes de exemplo...');
        const customers = [
            { user: 'cliente1', name: 'Primeiro Cliente', phone: '11999998888', email: 'c1@example.com', addr: 'Endereço 1' },
            { user: 'cliente2', name: 'Segundo Cliente', phone: '11988889999', email: 'c2@example.com', addr: 'Endereço 2' },
        ];
        const customerIds = [];
        for (const cust of customers) {
            const id = await getOrCreate(
                'SELECT id FROM customers WHERE username = ?', [cust.user],
                'INSERT INTO customers (username, name, phone, email, address, status, join_date) VALUES (?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)',
                [cust.user, cust.name, cust.phone, cust.email, cust.addr],
                `Cliente ${cust.user}`
            );
            customerIds.push(id);
        }
        console.log('');
        
        // Passo 6: Criar faturas de exemplo
        console.log('📄 Passo 6: Criando ou verificando faturas de exemplo...');
        const invoices = [
            { custId: customerIds[0], pkgId: packageIds[0], amount: 100.00, num: 'FAT-001' },
            { custId: customerIds[1], pkgId: packageIds[1], amount: 150.00, num: 'FAT-002' },
        ];

        for (const inv of invoices) {
            await getOrCreate(
                'SELECT id FROM invoices WHERE invoice_number = ?', [inv.num],
                'INSERT INTO invoices (customer_id, package_id, amount, status, due_date, created_at, invoice_number, invoice_type) VALUES (?, ?, ?, 'unpaid', ?, CURRENT_TIMESTAMP, ?, 'monthly')',
                [inv.custId, inv.pkgId, inv.amount, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], inv.num],
                `Fatura ${inv.num}`
            );
        }
        console.log('');


        // Passo 7: Criar configurações do aplicativo
        console.log('⚙️  Passo 7: Criando ou verificando configurações do aplicativo...');
        const settings = [
            { key: 'company_name', value: 'Sua Empresa de Internet' },
            { key: 'company_phone', value: '11900000000' },
            { key: 'company_email', value: 'contato@suaempresa.com' },
        ];
        for (const setting of settings) {
            await getOrCreate(
                'SELECT key as id FROM app_settings WHERE key = ?', [setting.key],
                'INSERT INTO app_settings (key, value, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
                [setting.key, setting.value],
                `Configuração ${setting.key}`
            );
        }
        console.log('');
        
        console.log('🎉 CONFIGURAÇÃO DO NOVO SERVIDOR VERIFICADA/CONCLUÍDA!');
        console.log('='.repeat(60));
        console.log('✅ O sistema está pronto para uso.');
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('\n❌ Erro durante a configuração do novo servidor:', error);
        throw error;
    } finally {
        if (db) {
            db.close();
        }
    }
}

if (require.main === module) {
    newServerSetup()
        .then(() => {
            console.log('\n✅ Script de configuração concluído com sucesso.');
            process.exit(0);
        })
        .catch(() => {
            console.error('\n❌ Falha na execução do script de configuração.');
            process.exit(1);
        });
}

module.exports = newServerSetup;
