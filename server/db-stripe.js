// ============================================
// db-stripe.js - Database Layer for Stripe
// ============================================

const { createClient } = require('@supabase/supabase-js');
const logger = require('./logger');

// استخدام Supabase (أو PostgreSQL مباشرة)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

class StripeDatabase {
    
    // ============================================
    // العملاء (Customers)
    // ============================================
    async createCustomer(data) {
        try {
            const { data: customer, error } = await supabase
                .from('customers')
                .insert([{
                    stripe_customer_id: data.stripeCustomerId,
                    email: data.email,
                    name: data.name,
                    phone: data.phone,
                    tax_id: data.taxId,
                    metadata: data.metadata || {},
                }])
                .select()
                .single();

            if (error) throw error;
            logger.info(`✅ Customer created: ${customer.id}`);
            return customer;
        } catch (error) {
            logger.error('❌ Error creating customer:', error);
            throw error;
        }
    }

    async getCustomerByStripeId(stripeCustomerId) {
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('stripe_customer_id', stripeCustomerId)
                .single();

            if (error) return null;
            return data;
        } catch (error) {
            logger.error('Error fetching customer:', error);
            return null;
        }
    }

    async getCustomerByEmail(email) {
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('email', email)
                .single();

            if (error) return null;
            return data;
        } catch (error) {
            logger.error('Error fetching customer by email:', error);
            return null;
        }
    }

    async getCustomerById(id) {
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('id', id)
                .single();

            if (error) return null;
            return data;
        } catch (error) {
            logger.error('Error fetching customer by id:', error);
            return null;
        }
    }

    // ============================================
    // المدفوعات (Payments)
    // ============================================
    async createPayment(data) {
        try {
            const { data: payment, error } = await supabase
                .from('payments')
                .insert([{
                    stripe_payment_intent_id: data.stripePaymentIntentId,
                    stripe_checkout_session_id: data.stripeCheckoutSessionId,
                    customer_id: data.customerId || null,
                    customer_email: data.customerEmail,
                    amount: data.amount,
                    currency: data.currency || 'usd',
                    tax_amount: data.taxAmount || 0,
                    tax_rate: data.taxRate || 0,
                    total_amount: data.totalAmount,
                    status: data.status || 'pending',
                    payment_method: data.paymentMethod,
                    description: data.description,
                    metadata: data.metadata || {},
                }])
                .select()
                .single();

            if (error) throw error;
            logger.info(`✅ Payment created: ${payment.id}`);
            return payment;
        } catch (error) {
            logger.error('❌ Error creating payment:', error);
            throw error;
        }
    }

    async updatePaymentStatus(stripePaymentIntentId, status, data = {}) {
        try {
            const updateData = {
                status: status,
                updated_at: new Date().toISOString(),
                ...(status === 'succeeded' && { paid_at: new Date().toISOString() }),
                ...(status === 'failed' && { failed_at: new Date().toISOString() }),
                ...(status === 'canceled' && { failed_at: new Date().toISOString() }),
                ...data,
            };

            const { data: payment, error } = await supabase
                .from('payments')
                .update(updateData)
                .eq('stripe_payment_intent_id', stripePaymentIntentId)
                .select()
                .single();

            if (error) throw error;
            logger.info(`✅ Payment updated: ${payment.id} -> ${status}`);
            return payment;
        } catch (error) {
            logger.error('❌ Error updating payment:', error);
            throw error;
        }
    }

    async getPaymentByStripeIntent(stripePaymentIntentId) {
        try {
            const { data, error } = await supabase
                .from('payments')
                .select('*')
                .eq('stripe_payment_intent_id', stripePaymentIntentId)
                .single();

            if (error) return null;
            return data;
        } catch (error) {
            logger.error('Error fetching payment:', error);
            return null;
        }
    }

    async getPaymentsByCustomer(customerId) {
        try {
            const { data, error } = await supabase
                .from('payments')
                .select('*')
                .eq('customer_id', customerId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Error fetching payments:', error);
            return [];
        }
    }

    // ============================================
    // الفواتير (Invoices)
    // ============================================
    async createInvoice(data) {
        try {
            // إنشاء رقم فاتورة تلقائي
            const invoiceNumber = data.invoiceNumber || `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            const { data: invoice, error } = await supabase
                .from('invoices')
                .insert([{
                    stripe_invoice_id: data.stripeInvoiceId,
                    stripe_customer_id: data.stripeCustomerId,
                    customer_id: data.customerId || null,
                    customer_email: data.customerEmail,
                    invoice_number: invoiceNumber,
                    amount: data.amount,
                    currency: data.currency || 'usd',
                    tax_amount: data.taxAmount || 0,
                    tax_rate: data.taxRate || 0,
                    total_amount: data.totalAmount,
                    status: data.status || 'draft',
                    description: data.description,
                    invoice_url: data.invoiceUrl,
                    invoice_pdf_url: data.invoicePdfUrl,
                    due_date: data.dueDate,
                }])
                .select()
                .single();

            if (error) throw error;
            logger.info(`✅ Invoice created: ${invoice.invoice_number}`);
            return invoice;
        } catch (error) {
            logger.error('❌ Error creating invoice:', error);
            throw error;
        }
    }

    async updateInvoiceStatus(stripeInvoiceId, status) {
        try {
            const updateData = {
                status: status,
                updated_at: new Date().toISOString(),
                ...(status === 'paid' && { paid_at: new Date().toISOString() }),
            };

            const { data: invoice, error } = await supabase
                .from('invoices')
                .update(updateData)
                .eq('stripe_invoice_id', stripeInvoiceId)
                .select()
                .single();

            if (error) throw error;
            logger.info(`✅ Invoice updated: ${invoice.invoice_number} -> ${status}`);
            return invoice;
        } catch (error) {
            logger.error('❌ Error updating invoice:', error);
            throw error;
        }
    }

    // ============================================
    // سجل Webhook (Webhook Events)
    // ============================================
    async logWebhookEvent(data) {
        try {
            const { data: event, error } = await supabase
                .from('webhook_events')
                .insert([{
                    stripe_event_id: data.eventId,
                    event_type: data.eventType,
                    event_data: data.eventData,
                    status: 'received',
                }])
                .select()
                .single();

            if (error) throw error;
            logger.info(`✅ Webhook logged: ${event.event_type}`);
            return event;
        } catch (error) {
            logger.error('❌ Error logging webhook:', error);
            throw error;
        }
    }

    async updateWebhookStatus(eventId, status, errorMessage = null) {
        try {
            const { data, error } = await supabase
                .from('webhook_events')
                .update({
                    status: status,
                    processed_at: new Date().toISOString(),
                    error_message: errorMessage,
                })
                .eq('stripe_event_id', eventId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Error updating webhook:', error);
            throw error;
        }
    }

    // ============================================
    // سجل الأخطاء (Error Logs)
    // ============================================
    async logError(data) {
        try {
            const { data: errorLog, error } = await supabase
                .from('payment_errors')
                .insert([{
                    error_type: data.errorType,
                    error_message: data.errorMessage,
                    stack_trace: data.stackTrace,
                    payment_id: data.paymentId || null,
                    stripe_payment_intent_id: data.stripePaymentIntentId,
                    metadata: data.metadata || {},
                }])
                .select()
                .single();

            if (error) throw error;
            logger.warn(`⚠️ Error logged: ${errorLog.error_type}`);
            return errorLog;
        } catch (error) {
            logger.error('Error logging error:', error);
            throw error;
        }
    }

    // ============================================
    // الإحصائيات (Stats)
    // ============================================
    async getPaymentStats() {
        try {
            const { data, error } = await supabase
                .from('payments')
                .select('status, amount, total_amount, created_at')
                .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

            if (error) throw error;

            const stats = {
                total: data.length,
                totalAmount: data.reduce((sum, p) => sum + p.total_amount, 0) / 100,
                succeeded: data.filter(p => p.status === 'succeeded').length,
                pending: data.filter(p => p.status === 'pending').length,
                failed: data.filter(p => p.status === 'failed').length,
                refunded: data.filter(p => p.status === 'refunded').length,
                canceled: data.filter(p => p.status === 'canceled').length,
                byDay: data.reduce((acc, p) => {
                    const day = p.created_at.split('T')[0];
                    acc[day] = (acc[day] || 0) + 1;
                    return acc;
                }, {}),
            };

            return stats;
        } catch (error) {
            logger.error('Error getting stats:', error);
            return null;
        }
    }

    // ============================================
    // الاشتراكات (Subscriptions)
    // ============================================
    async createSubscription(data) {
        try {
            const { data: subscription, error } = await supabase
                .from('subscriptions')
                .insert([{
                    stripe_subscription_id: data.stripeSubscriptionId,
                    stripe_customer_id: data.stripeCustomerId,
                    customer_id: data.customerId || null,
                    stripe_price_id: data.stripePriceId,
                    stripe_product_id: data.stripeProductId,
                    plan_name: data.planName,
                    status: data.status || 'active',
                    currency: data.currency || 'usd',
                    amount: data.amount,
                    interval_type: data.intervalType,
                    interval_count: data.intervalCount || 1,
                    trial_start_at: data.trialStartAt,
                    trial_end_at: data.trialEndAt,
                    current_period_start: data.currentPeriodStart,
                    current_period_end: data.currentPeriodEnd,
                    metadata: data.metadata || {},
                }])
                .select()
                .single();

            if (error) throw error;
            logger.info(`✅ Subscription created: ${subscription.id}`);
            return subscription;
        } catch (error) {
            logger.error('❌ Error creating subscription:', error);
            throw error;
        }
    }

    async updateSubscriptionStatus(stripeSubscriptionId, status) {
        try {
            const { data: subscription, error } = await supabase
                .from('subscriptions')
                .update({
                    status: status,
                    updated_at: new Date().toISOString(),
                    ...(status === 'canceled' && { canceled_at: new Date().toISOString() }),
                })
                .eq('stripe_subscription_id', stripeSubscriptionId)
                .select()
                .single();

            if (error) throw error;
            logger.info(`✅ Subscription updated: ${subscription.id} -> ${status}`);
            return subscription;
        } catch (error) {
            logger.error('❌ Error updating subscription:', error);
            throw error;
        }
    }
}

module.exports = new StripeDatabase();
