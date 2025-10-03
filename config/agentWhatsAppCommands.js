const logger = require('./logger');
const AgentManager = require('./agentManager');
const AgentWhatsAppManager = require('./agentWhatsApp');
const languageHelper = require('./languageHelper');

class AgentWhatsAppCommands {
    constructor() {
        this.agentManager = new AgentManager();
        this.whatsappManager = new AgentWhatsAppManager();
    }

    async getMessage(key, phone, params = {}) {
        return await languageHelper.getLocalizedMessage(key, phone, params);
    }

    async handleMessage(from, message) {
        try {
            const phone = from.replace('@s.whatsapp.net', '');
            const agent = await this.agentManager.getAgentByPhone(phone);
            if (!agent) {
                return this.sendMessage(from, await this.getMessage('whatsapp.error_not_found', phone));
            }

            const command = this.parseCommand(message);
            switch (command.type) {
                case 'help':
                    return this.handleHelp(from, phone);
                case 'saldo':
                    return this.handleCheckBalance(from, agent, phone);
                case 'jual':
                    return this.handleSellVoucher(from, agent, command.params, phone);
                case 'bayar':
                    return this.handleProcessPayment(from, agent, command.params, phone);
                case 'request':
                    return this.handleRequestBalance(from, agent, command.params, phone);
                case 'riwayat':
                    return this.handleTransactionHistory(from, agent, phone);
                default:
                    return this.sendMessage(from, await this.getMessage('whatsapp.error_invalid_command', phone));
            }
        } catch (error) {
            logger.error('Error handling WhatsApp message:', error);
            return this.sendMessage(from, await this.getMessage('notifications.error', from.replace('@s.whatsapp.net', '')));
        }
    }

    parseCommand(message) {
        const text = message.toLowerCase().trim();
        if (text.includes('help') || text.includes('bantuan')) return { type: 'help' };
        if (text.includes('saldo') || text.includes('balance')) return { type: 'saldo' };
        if (text.includes('jual') || text.includes('sell')) return { type: 'jual', params: this.parseSellParams(text) };
        if (text.includes('bayar') || text.includes('payment')) return { type: 'bayar', params: this.parsePaymentParams(text) };
        if (text.includes('request') || text.includes('minta')) return { type: 'request', params: this.parseRequestParams(text) };
        if (text.includes('riwayat') || text.includes('history')) return { type: 'riwayat' };
        return { type: 'unknown' };
    }

    parseSellParams(text) {
        const parts = text.split(' ');
        const jualIndex = parts.findIndex(p => p.includes('jual'));
        if (jualIndex === -1) return null;

        const remainingParts = parts.slice(jualIndex + 1);
        if (remainingParts.length === 0) return null;

        const phonePattern = /^[0-9]+$/;
        const lastPart = remainingParts[remainingParts.length - 1];
        const hasPhoneNumber = phonePattern.test(lastPart);
        
        let packageParts, customerPhone;
        if (hasPhoneNumber) {
            customerPhone = lastPart;
            packageParts = remainingParts.slice(0, -1);
        } else {
            customerPhone = null;
            packageParts = remainingParts;
        }

        if (packageParts.length === 0) return null;

        const availablePackages = ['3k', '5k', '10k', '15k', '25k', '50k', 'member 7 hari', 'member 30 hari', 'member 90 hari'];
        let bestMatch = '';
        let bestMatchLength = 0;

        for (const pkg of availablePackages) {
            const pkgParts = pkg.split(' ');
            if (packageParts.length >= pkgParts.length) {
                const exactMatch = pkgParts.every((pkgPart, index) => packageParts[index] && packageParts[index].toLowerCase() === pkgPart.toLowerCase());
                if (exactMatch && pkgParts.length > bestMatchLength) {
                    bestMatch = pkg;
                    bestMatchLength = pkgParts.length;
                }
            }
        }

        if (!bestMatch) {
            for (const pkg of availablePackages) {
                const pkgParts = pkg.split(' ');
                if (packageParts.length >= pkgParts.length) {
                    const substringMatch = pkgParts.every((pkgPart, index) => packageParts[index] && packageParts[index].toLowerCase().includes(pkgPart.toLowerCase()));
                    if (substringMatch && pkgParts.length > bestMatchLength) {
                        bestMatch = pkg;
                        bestMatchLength = pkgParts.length;
                    }
                }
            }
        }

        return {
            package: bestMatch || packageParts[0],
            customerName: '',
            customerPhone: customerPhone,
            sendWhatsApp: hasPhoneNumber
        };
    }

    parsePaymentParams(text) {
        const parts = text.split(' ');
        const bayarIndex = parts.findIndex(p => p.includes('bayar'));
        if (bayarIndex === -1 || parts.length < bayarIndex + 4) return null;
        return {
            customerName: parts[bayarIndex + 1],
            customerPhone: parts[bayarIndex + 2],
            amount: parseFloat(parts[bayarIndex + 3]),
            sendWhatsApp: parts[bayarIndex + 4] === 'ya' || parts[bayarIndex + 4] === 'yes'
        };
    }

    parseRequestParams(text) {
        const parts = text.split(' ');
        const requestIndex = parts.findIndex(p => p.includes('request') || p.includes('minta'));
        if (requestIndex === -1 || parts.length < requestIndex + 2) return null;
        return {
            amount: parseFloat(parts[requestIndex + 1]),
            notes: parts.slice(requestIndex + 2).join(' ')
        };
    }

    async handleHelp(from, phone) {
        const helpText = await this.getMessage('agent.help', phone);
        return this.sendMessage(from, helpText);
    }

    async handleCheckBalance(from, agent, phone) {
        try {
            const balance = await this.agentManager.getAgentBalance(agent.id);
            const message = await this.getMessage('agent.balance', phone, { 
                agentName: agent.name, 
                balance: balance.toLocaleString('id-ID') 
            });
            return this.sendMessage(from, message);
        } catch (error) {
            return this.sendMessage(from, await this.getMessage('agent.balance_error', phone));
        }
    }

    async handleSellVoucher(from, agent, params, phone) {
        if (!params) {
            return this.sendMessage(from, await this.getMessage('agent.sell.invalid_format', phone));
        }

        try {
            const packages = await this.agentManager.getAvailablePackages();
            const selectedPackage = packages.find(p => p.name.toLowerCase().includes(params.package.toLowerCase()));
            
            if (!selectedPackage) {
                return this.sendMessage(from, await this.getMessage('agent.sell.package_not_found', phone, { packages: packages.map(p => p.name).join(', ') }));
            }

            const voucherCode = this.agentManager.generateVoucherCode(selectedPackage);
            const result = await this.agentManager.sellVoucher(agent.id, voucherCode, selectedPackage.id, params.customerName || 'Customer', params.customerPhone || '');

            if (result.success) {
                let message = await this.getMessage('agent.sell.success', phone, {
                    voucherCode: result.voucherCode,
                    packageName: result.packageName,
                    customerPrice: result.customerPrice.toLocaleString('id-ID'),
                    commissionAmount: result.commissionAmount.toLocaleString('id-ID'),
                    newBalance: result.newBalance.toLocaleString('id-ID')
                });

                if (params.sendWhatsApp && params.customerPhone) {
                    await this.whatsappManager.sendVoucherToCustomer(params.customerPhone, params.customerName || 'Customer', result.voucherCode, result.packageName, result.customerPrice, { name: agent.name, phone: agent.phone });
                    message += await this.getMessage('agent.sell.notification_sent', phone, { customerPhone: params.customerPhone });
                } else {
                    message += await this.getMessage('agent.sell.notification_not_sent', phone);
                }
                return this.sendMessage(from, message);
            } else {
                return this.sendMessage(from, await this.getMessage('agent.sell.failure', phone, { message: result.message }));
            }
        } catch (error) {
            return this.sendMessage(from, await this.getMessage('agent.sell.error_message', phone));
        }
    }

    async handleProcessPayment(from, agent, params, phone) {
        if (!params) {
            return this.sendMessage(from, await this.getMessage('agent.payment.invalid_format', phone));
        }

        try {
            const result = await this.agentManager.processPayment(agent.id, params.customerName, params.customerPhone, params.amount);
            if (result.success) {
                let message = await this.getMessage('agent.payment.success', phone, {
                    customerName: params.customerName,
                    amount: params.amount.toLocaleString('id-ID'),
                    newBalance: result.newBalance.toLocaleString('id-ID')
                });

                if (params.sendWhatsApp) {
                    await this.whatsappManager.sendPaymentConfirmation(params.customerPhone, params.customerName, params.amount);
                    message += await this.getMessage('agent.payment.confirmation_sent', phone);
                }
                return this.sendMessage(from, message);
            } else {
                return this.sendMessage(from, await this.getMessage('agent.payment.failure', phone, { message: result.message }));
            }
        } catch (error) {
            return this.sendMessage(from, await this.getMessage('agent.payment.error_message', phone));
        }
    }

    async handleRequestBalance(from, agent, params, phone) {
        if (!params) {
            return this.sendMessage(from, await this.getMessage('agent.request.invalid_format', phone));
        }

        try {
            const result = await this.agentManager.requestBalance(agent.id, params.amount, params.notes);
            if (result.success) {
                const message = await this.getMessage('agent.request.success', phone, {
                    amount: params.amount.toLocaleString('id-ID'),
                    notes: params.notes
                });
                await this.whatsappManager.sendBalanceRequestToAdmin(agent.name, params.amount, params.notes);
                return this.sendMessage(from, message);
            } else {
                return this.sendMessage(from, await this.getMessage('agent.request.failure', phone, { message: result.message }));
            }
        } catch (error) {
            return this.sendMessage(from, await this.getMessage('agent.request.error_message', phone));
        }
    }

    async handleTransactionHistory(from, agent, phone) {
        try {
            const transactions = await this.agentManager.getAgentTransactions(agent.id, 10);
            let message = await this.getMessage('agent.history.header', phone, { agentName: agent.name });

            if (transactions.length === 0) {
                message += await this.getMessage('agent.history.no_transactions', phone);
            } else {
                transactions.forEach((tx, index) => {
                    message += this.getMessage('agent.history.transaction_item', phone, {
                        index: index + 1,
                        type: tx.transaction_type.toUpperCase(),
                        amount: tx.amount.toLocaleString('id-ID'),
                        date: new Date(tx.created_at).toLocaleDateString('id-ID')
                    });
                });
            }
            return this.sendMessage(from, message);
        } catch (error) {
            return this.sendMessage(from, await this.getMessage('agent.history.error_message', phone));
        }
    }

    async sendMessage(to, message) {
        try {
            if (this.whatsappManager.sock) {
                await this.whatsappManager.sock.sendMessage(to, { text: message });
                return true;
            } else {
                logger.error('WhatsApp socket not set on whatsappManager');
                return false;
            }
        } catch (error) {
            logger.error('Error sending WhatsApp message:', error);
            return false;
        }
    }
}

module.exports = AgentWhatsAppCommands;
