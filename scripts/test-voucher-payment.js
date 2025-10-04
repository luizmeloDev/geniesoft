#!/usr/bin/env node

/**
 * Script para testar a compra de voucher e garantir que o webhook funcione
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const billingManager = require('../config/billing');

async function testVoucherPayment() {
    const dbPath = path.join(__dirname, '../data/billing.db');
    const db = new sqlite3.Database(dbPath);
    
    try {
        console.log('🧪 TESTANDO FLUXO DE PAGAMENTO DE VOUCHER');
        console.log('='.repeat(50));
        
        // Passo 1: Criar cliente de voucher público, se não existir
        console.log('📋 Passo 1: Criando cliente de voucher público...');
        
        let voucherCustomerId;
        try {
            voucherCustomerId = await billingManager.getCustomerByUsername('voucher_public');
            if (!voucherCustomerId) {
                const customerData = {
                    username: 'voucher_public',
                    name: 'Voucher Público',
                    phone: '0000000000',
                    email: 'voucher@public.com',
                    address: 'Sistema de Voucher Público',
                    package_id: 1,
                    status: 'active'
                };
                
                voucherCustomerId = await billingManager.createCustomer(customerData);
                console.log('✅ Cliente de voucher público criado com ID:', voucherCustomerId.id);
            } else {
                console.log('✅ Cliente de voucher público já existe com ID:', voucherCustomerId.id);
            }
        } catch (error) {
            console.error('❌ Erro ao criar cliente de voucher:', error);
            return;
        }
        
        // Passo 2: Criar fatura de voucher de teste
        console.log('\n📋 Passo 2: Criando fatura de voucher de teste...');
        
        const invoiceData = {
            customer_id: voucherCustomerId.id,
            package_id: 1,
            amount: 3000,
            due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 dia a partir de agora
            notes: 'Voucher de Teste Hotspot 3k - 1 Dia x1',
            invoice_type: 'voucher'
        };
        
        const testInvoice = await billingManager.createInvoice(invoiceData);
        console.log('✅ Fatura de voucher de teste criada:', testInvoice.invoice_number);
        
        // Passo 3: Criar registro de compra de voucher
        console.log('\n📋 Passo 3: Criando registro de compra de voucher...');
        
        const purchaseData = {
            invoice_id: testInvoice.id,
            customer_name: 'Cliente de Teste',
            customer_phone: '081234567890',
            voucher_package: '3k',
            voucher_profile: '3k',
            voucher_quantity: 1,
            amount: 3000,
            status: 'pending'
        };
        
        const purchase = await new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO voucher_purchases 
                (invoice_id, customer_name, customer_phone, voucher_package, voucher_profile, 
                 voucher_quantity, amount, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
            `;
            
            db.run(sql, Object.values(purchaseData), function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, ...purchaseData });
            });
        });
        
        console.log('✅ Registro de compra de voucher criado com ID:', purchase.id);
        
        // Passo 4: Simular sucesso do webhook de pagamento
        console.log('\n📋 Passo 4: Simulando sucesso do webhook de pagamento...');
        
        const webhookData = {
            order_id: testInvoice.invoice_number,
            status: 'PAID',
            amount: 3000,
            payment_type: 'qris'
        };
        
        try {
            const { handleVoucherWebhook } = require('../routes/publicVoucher');
            const result = await handleVoucherWebhook(webhookData, {});
            
            console.log('✅ Resultado do webhook:', result);
            
            if (result.success) {
                console.log('🎉 Webhook processado com sucesso!');
            } else {
                console.log('❌ Falha no webhook:', result.message);
            }
        } catch (webhookError) {
            console.error('❌ Erro no webhook:', webhookError);
        }
        
        // Passo 5: Verificar resultados
        console.log('\n📋 Passo 5: Verificando resultados...');
        
        // Verificar status da fatura
        const updatedInvoice = await billingManager.getInvoiceById(testInvoice.id);
        console.log('📊 Status da Fatura:', updatedInvoice.status);
        
        // Verificar status da compra
        const updatedPurchase = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM voucher_purchases WHERE id = ?', [purchase.id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        console.log('📊 Status da Compra:', updatedPurchase.status);
        console.log('📊 Dados do Voucher:', updatedPurchase.voucher_data ? 'Existe' : 'Não existe');
        
        // Passo 6: Limpar dados de teste
        console.log('\n📋 Passo 6: Limpando dados de teste...');
        
        const cleanupAnswer = await new Promise((resolve) => {
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            
            rl.question('Excluir dados de teste? (s/N): ', (input) => {
                rl.close();
                resolve(input.toLowerCase());
            });
        });
        
        if (cleanupAnswer === 's' || cleanupAnswer === 'sim') {
            // Excluir compra
            await new Promise((resolve, reject) => {
                db.run('DELETE FROM voucher_purchases WHERE id = ?', [purchase.id], (err) => {
                    if (err) reject(err); else resolve();
                });
            });
            
            // Excluir fatura
            await billingManager.deleteInvoice(testInvoice.id);
            
            console.log('✅ Dados de teste excluídos com sucesso');
        } else {
            console.log('ℹ️  Dados de teste mantidos');
        }
        
        console.log('\n🎉 Teste concluído!');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    } finally {
        db.close();
    }
}

if (require.main === module) {
    testVoucherPayment()
        .then(() => {
            console.log('\n✅ Script de teste concluído!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Falha no script de teste:', error);
            process.exit(1);
        });
}

module.exports = { testVoucherPayment };
