const logger = require('./logger');
const { getSettingsWithCache } = require('./settingsManager');
const languageHelper = require('./languageHelper');

class AgentWhatsAppManager {
    constructor() {
        this.sock = null;
    }

    setSocket(sock) {
        this.sock = sock;
    }

    async getMessage(key, phone, params) {
        if (phone) {
            return await languageHelper.getLocalizedMessage(key, phone, params);
        }
        return languageHelper.getMessageWithLanguage(key, 'pt', params);
    }

    // ===== VOUCHER NOTIFICATIONS =====

    async sendVoucherNotification(agent, customer, voucherData) {
        try {
            if (!this.sock) {
                logger.warn('WhatsApp socket not available for voucher notification');
                const message = await this.getMessage('whatsapp.notAvailable', agent.phone || customer.phone);
                return { success: false, message };
            }

            const settings = getSettingsWithCache();
            const companyHeader = settings.company_header || '📱 ALIJAYA DIGITAL NETWORK 📱\n\n';
            const footerInfo = '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' + (settings.footer_info || 'Powered by Alijaya Digital Network');

            const params = {
                voucherCode: voucherData.voucherCode,
                packageName: voucherData.packageName,
                price: voucherData.price.toLocaleString(),
                commission: voucherData.commission.toLocaleString(),
                customerName: customer.name,
                customerPhone: customer.phone || await this.getMessage('common.notAvailable', agent.phone),
                contactPhone: settings.contact_phone || 'Admin'
            };

            const agentMessageText = await this.getMessage('notifications.voucher.soldToAgent', agent.phone, params);
            const agentMessage = `${companyHeader}${agentMessageText}${footerInfo}`;

            const customerMessageText = await this.getMessage('notifications.voucher.sentToCustomer', customer.phone, params);
            const customerMessage = `${companyHeader}${customerMessageText}${footerInfo}`;

            if (agent.phone) {
                await this.sock.sendMessage(agent.phone + '@s.whatsapp.net', { text: agentMessage });
            }

            if (customer.phone) {
                await this.sock.sendMessage(customer.phone + '@s.whatsapp.net', { text: customerMessage });
            }

            return { success: true, message: await this.getMessage('notifications.success', agent.phone) };
        } catch (error) {
            logger.error('Send voucher notification error:', error);
            const message = await this.getMessage('notifications.failure', null);
            return { success: false, message };
        }
    }

    async sendVoucherToCustomer(customerPhone, customerName, voucherCode, packageName, price, agentInfo = null) {
        try {
            if (!this.sock) {
                logger.warn('WhatsApp socket not available for customer voucher');
                return { success: false, message: await this.getMessage('whatsapp.notAvailable', customerPhone) };
            }

            const settings = getSettingsWithCache();
            const companyHeader = settings.company_header || '📱 ALIJAYA DIGITAL NETWORK 📱\n\n';
            const footerInfo = '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' + (settings.footer_info || 'Powered by Alijaya Digital Network');

            let agentInfoText = '';
            if (agentInfo && agentInfo.name) {
                agentInfoText = await this.getMessage('notifications.voucher.purchasedVia', customerPhone, { agentName: agentInfo.name });
                if (agentInfo.phone) {
                    agentInfoText += await this.getMessage('notifications.voucher.agentContact', customerPhone, { agentPhone: agentInfo.phone });
                }
            }

            const params = {
                voucherCode,
                packageName,
                price: price.toLocaleString('id-ID'),
                agentInfoText,
                contactPhone: settings.contact_phone || 'Admin'
            };

            const customerMessageText = await this.getMessage('notifications.voucher.sentDirectlyToCustomer', customerPhone, params);
            const customerMessage = `${companyHeader}${customerMessageText}${footerInfo}`;

            await this.sock.sendMessage(customerPhone + '@s.whatsapp.net', { text: customerMessage });
            
            logger.info(`Voucher sent to customer: ${customerPhone}`);
            return { success: true, message: await this.getMessage('notifications.voucher.sendToCustomerSuccess', customerPhone) };
        } catch (error) {
            logger.error('Send voucher to customer error:', error);
            return { success: false, message: await this.getMessage('notifications.voucher.sendToCustomerFailure', customerPhone) };
        }
    }

    async sendPaymentNotification(agent, customer, paymentData) {
        try {
            if (!this.sock) {
                logger.warn('WhatsApp socket not available for payment notification');
                return { success: false, message: await this.getMessage('whatsapp.notAvailable', agent.phone) };
            }

            const settings = getSettingsWithCache();
            const companyHeader = settings.company_header || '📱 ALIJAYA DIGITAL NETWORK 📱\n\n';
            const footerInfo = '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' + (settings.footer_info || 'Powered by Alijaya Digital Network');
            
            const params = {
                amount: paymentData.amount.toLocaleString(),
                method: paymentData.method,
                commission: paymentData.commission.toLocaleString(),
                customerName: customer.name,
                customerPhone: customer.phone || await this.getMessage('common.notAvailable', agent.phone),
                date: new Date().toLocaleString('id-ID'),
                agentName: agent.name
            };

            const agentMessageText = await this.getMessage('notifications.payment.processedForAgent', agent.phone, params);
            const agentMessage = `${companyHeader}${agentMessageText}${footerInfo}`;

            const customerMessageText = await this.getMessage('notifications.payment.receivedFromCustomer', customer.phone, params);
            const customerMessage = `${companyHeader}${customerMessageText}${footerInfo}`;

            if (agent.phone) {
                await this.sock.sendMessage(agent.phone + '@s.whatsapp.net', { text: agentMessage });
            }

            if (customer.phone) {
                await this.sock.sendMessage(customer.phone + '@s.whatsapp.net', { text: customerMessage });
            }

            return { success: true, message: await this.getMessage('notifications.success', agent.phone) };
        } catch (error) {
            logger.error('Send payment notification error:', error);
            return { success: false, message: await this.getMessage('notifications.failure', agent.phone) };
        }
    }

    async sendBalanceUpdateNotification(agent, balanceData) {
        try {
            if (!this.sock) {
                logger.warn('WhatsApp socket not available for balance notification');
                return { success: false, message: await this.getMessage('whatsapp.notAvailable', agent.phone) };
            }

            const settings = getSettingsWithCache();
            const companyHeader = settings.company_header || '📱 ALIJAYA DIGITAL NETWORK 📱\n\n';
            const footerInfo = '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' + (settings.footer_info || 'Powered by Alijaya Digital Network');
            
            const params = {
                previousBalance: balanceData.previousBalance.toLocaleString(),
                change: `${balanceData.change > 0 ? '+' : ''}Rp ${balanceData.change.toLocaleString()}`,
                currentBalance: balanceData.currentBalance.toLocaleString(),
                description: balanceData.description
            };
            
            const messageText = await this.getMessage('notifications.balance.updated', agent.phone, params);
            const message = `${companyHeader}${messageText}${footerInfo}`;

            if (agent.phone) {
                await this.sock.sendMessage(agent.phone + '@s.whatsapp.net', { text: message });
            }

            return { success: true, message: await this.getMessage('notifications.success', agent.phone) };
        } catch (error) {
            logger.error('Send balance notification error:', error);
            return { success: false, message: await this.getMessage('notifications.failure', agent.phone) };
        }
    }

    async sendRequestApprovedNotification(agent, requestData) {
        try {
            if (!this.sock) {
                logger.warn('WhatsApp socket not available for request notification');
                return { success: false, message: await this.getMessage('whatsapp.notAvailable', agent.phone) };
            }

            const settings = getSettingsWithCache();
            const companyHeader = settings.company_header || '📱 ALIJAYA DIGITAL NETWORK 📱\n\n';
            const footerInfo = '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' + (settings.footer_info || 'Powered by Alijaya Digital Network');

            const params = {
                amount: requestData.amount.toLocaleString(),
                requestedAt: new Date(requestData.requestedAt).toLocaleString('id-ID'),
                approvedAt: new Date().toLocaleString('id-ID'),
                previousBalance: requestData.previousBalance.toLocaleString(),
                newBalance: requestData.newBalance.toLocaleString(),
                adminNotes: requestData.adminNotes || await this.getMessage('common.notAvailable', agent.phone)
            };

            const messageText = await this.getMessage('notifications.request.approved', agent.phone, params);
            const message = `${companyHeader}${messageText}${footerInfo}`;

            if (agent.phone) {
                await this.sock.sendMessage(agent.phone + '@s.whatsapp.net', { text: message });
            }

            return { success: true, message: await this.getMessage('notifications.success', agent.phone) };
        } catch (error) {
            logger.error('Send request approved notification error:', error);
            return { success: false, message: await this.getMessage('notifications.failure', agent.phone) };
        }
    }

    async sendRequestRejectedNotification(agent, requestData) {
        try {
            if (!this.sock) {
                logger.warn('WhatsApp socket not available for request notification');
                return { success: false, message: await this.getMessage('whatsapp.notAvailable', agent.phone) };
            }

            const settings = getSettingsWithCache();
            const companyHeader = settings.company_header || '📱 ALIJAYA DIGITAL NETWORK 📱\n\n';
            const footerInfo = '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' + (settings.footer_info || 'Powered by Alijaya Digital Network');

            const params = {
                amount: requestData.amount.toLocaleString(),
                requestedAt: new Date(requestData.requestedAt).toLocaleString('id-ID'),
                rejectedAt: new Date().toLocaleString('id-ID'),
                rejectReason: requestData.rejectReason,
                contactPhone: settings.contact_phone || 'Admin'
            };

            const messageText = await this.getMessage('notifications.request.rejected', agent.phone, params);
            const message = `${companyHeader}${messageText}${footerInfo}`;

            if (agent.phone) {
                await this.sock.sendMessage(agent.phone + '@s.whatsapp.net', { text: message });
            }

            return { success: true, message: await this.getMessage('notifications.success', agent.phone) };
        } catch (error) {
            logger.error('Send request rejected notification error:', error);
            return { success: false, message: await this.getMessage('notifications.failure', agent.phone) };
        }
    }

    async sendBulkNotifications(notifications) {
        try {
            if (!this.sock) {
                logger.warn('WhatsApp socket not available for bulk notifications');
                return { success: false, message: await this.getMessage('whatsapp.notAvailable', null) };
            }

            let sent = 0;
            let failed = 0;

            for (const notification of notifications) {
                try {
                    if (notification.phone) {
                        await this.sock.sendMessage(notification.phone + '@s.whatsapp.net', { text: notification.message });
                        sent++;
                        await this.delay(1000);
                    }
                } catch (error) {
                    failed++;
                    logger.error('Bulk notification error:', error);
                }
            }

            return { success: true, sent, failed };
        } catch (error) {
            logger.error('Send bulk notifications error:', error);
            return { success: false, message: await this.getMessage('notifications.bulk.failure', null) };
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    formatPhoneNumber(phone) {
        if (!phone) return null;
        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.startsWith('0')) {
            cleanPhone = '62' + cleanPhone.substring(1);
        } else if (!cleanPhone.startsWith('62')) {
            cleanPhone = '62' + cleanPhone;
        }
        return cleanPhone;
    }
}

module.exports = AgentWhatsAppManager;
