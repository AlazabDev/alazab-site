// ============================================
// routes/stripe.js - Stripe Integration
// ============================================

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../logger');
const db = require('../db-stripe');

// ============================================
// Middleware للـ Webhook (يحتاج raw body)
// ============================================
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        logger.info(`📩 Webhook received: ${event.type} (${event.id})`);

        // تسجيل في قاعدة البيانات
        await db.logWebhookEvent({
            eventId: event.id,
            eventType: event.type,
            eventData: event.data,
        });

    } catch (err) {
        logger.error(`❌ Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // ============================================
    // معالجة الأحداث المختلفة
    // ============================================
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            logger.info(`✅ Payment succeeded: ${paymentIntent.id}`);
            
            // تحديث قاعدة البيانات
            await db.updatePaymentStatus(paymentIntent.id, 'succeeded', {
                payment_method: paymentIntent.payment_method_types?.[0] || 'card',
            });
            
            // هنا ممكن تحديث حالة الطلب في قاعدة البيانات
            // await updateOrderStatus(paymentIntent.metadata.orderId, 'paid');
            break;

        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            logger.warn(`❌ Payment failed: ${failedPayment.id}`);
            
            await db.updatePaymentStatus(failedPayment.id, 'failed', {
                error_message: failedPayment.last_payment_error?.message || 'Unknown error',
            });
            break;

        case 'checkout.session.completed':
            const checkoutSession = event.data.object;
            logger.info(`✅ Checkout completed: ${checkoutSession.id}`);
            
            // تحديث الدفع المرتبط بالجلسة
            if (checkoutSession.payment_intent) {
                await db.updatePaymentStatus(checkoutSession.payment_intent, 'succeeded', {
                    stripe_checkout_session_id: checkoutSession.id,
                });
            }
            
            // إرسال إيميل تأكيد للعميل
            // تفعيل الخدمة المشتراة
            break;

        case 'invoice.payment_succeeded':
            const invoice = event.data.object;
            logger.info(`✅ Invoice paid: ${invoice.id} (${invoice.number})`);
            
            await db.updateInvoiceStatus(invoice.id, 'paid');
            
            // إرسال إيميل الفاتورة
            break;

        case 'invoice.payment_failed':
            const failedInvoice = event.data.object;
            logger.warn(`❌ Invoice payment failed: ${failedInvoice.id}`);
            
            await db.updateInvoiceStatus(failedInvoice.id, 'payment_failed');
            
            // إرسال تذكير للعميل
            break;

        case 'customer.subscription.created':
            const subCreated = event.data.object;
            logger.info(`✅ Subscription created: ${subCreated.id}`);
            
            await db.createSubscription({
                stripeSubscriptionId: subCreated.id,
                stripeCustomerId: subCreated.customer,
                customerId: null, // سيتم تحديثه لاحقاً
                stripePriceId: subCreated.items.data[0]?.price.id,
                stripeProductId: subCreated.items.data[0]?.price.product,
                planName: subCreated.items.data[0]?.price.nickname || 'Subscription',
                status: subCreated.status,
                currency: subCreated.currency,
                amount: subCreated.items.data[0]?.price.unit_amount || 0,
                intervalType: subCreated.items.data[0]?.price.recurring?.interval || 'month',
                intervalCount: subCreated.items.data[0]?.price.recurring?.interval_count || 1,
                trialStartAt: subCreated.trial_start ? new Date(subCreated.trial_start * 1000) : null,
                trialEndAt: subCreated.trial_end ? new Date(subCreated.trial_end * 1000) : null,
                currentPeriodStart: new Date(subCreated.current_period_start * 1000),
                currentPeriodEnd: new Date(subCreated.current_period_end * 1000),
                metadata: subCreated.metadata,
            });
            break;

        case 'customer.subscription.updated':
            const subUpdated = event.data.object;
            logger.info(`🔄 Subscription updated: ${subUpdated.id}`);
            
            await db.updateSubscriptionStatus(subUpdated.id, subUpdated.status);
            break;

        case 'customer.subscription.deleted':
            const subDeleted = event.data.object;
            logger.info(`🗑️ Subscription canceled: ${subDeleted.id}`);
            
            await db.updateSubscriptionStatus(subDeleted.id, 'canceled');
            break;

        default:
            logger.info(`📌 Unhandled event type: ${event.type}`);
    }

    // تحديث حالة الـ Webhook في قاعدة البيانات
    await db.updateWebhookStatus(event.id, 'processed');

    res.json({ received: true });
});

// ============================================
// 1. اختبار الاتصال بـ Stripe
// ============================================
router.get('/test', async (req, res) => {
    try {
        const balance = await stripe.balance.retrieve();
        
        // اختبار الاتصال بقاعدة البيانات
        const stats = await db.getPaymentStats();

        res.json({
            status: '✅ Stripe connected successfully!',
            database: '✅ Connected to database',
            balance: {
                available: balance.available.map(b => ({
                    amount: b.amount / 100,
                    currency: b.currency
                })),
                pending: balance.pending.map(b => ({
                    amount: b.amount / 100,
                    currency: b.currency
                }))
            },
            stats: stats,
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        logger.error('❌ Stripe test failed:', error);
        res.status(500).json({
            error: '❌ Failed to connect to Stripe',
            details: error.message
        });
    }
});

// ============================================
// 2. إنشاء Payment Intent (للدفع)
// ============================================
router.post('/create-payment-intent', async (req, res) => {
    try {
        const {
            amount,
            currency = process.env.DEFAULT_CURRENCY || 'usd',
            customerEmail,
            customerName,
            description,
            metadata = {}
        } = req.body;

        if (!amount || amount < 0.5) {
            return res.status(400).json({
                error: 'المبلغ المطلوب غير صحيح. أقل مبلغ 0.50 دولار'
            });
        }

        // البحث عن العميل أو إنشاؤه
        let customer = null;
        if (customerEmail) {
            const existingCustomer = await db.getCustomerByEmail(customerEmail);
            if (existingCustomer) {
                customer = existingCustomer;
            } else if (customerName) {
                // إنشاء عميل جديد في Stripe
                const stripeCustomer = await stripe.customers.create({
                    email: customerEmail,
                    name: customerName,
                    metadata: {
                        business: 'alazab.com',
                        source: 'payment_intent'
                    }
                });

                customer = await db.createCustomer({
                    stripeCustomerId: stripeCustomer.id,
                    email: customerEmail,
                    name: customerName,
                    metadata: { source: 'payment_intent' }
                });
            }
        }

        // إنشاء Payment Intent في Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: currency,
            customer: customer?.stripe_customer_id || undefined,
            description: description || 'دفع عبر Alazab',
            metadata: {
                ...metadata,
                business: 'alazab.com',
                customerId: customer?.id || '',
                environment: process.env.NODE_ENV || 'development'
            },
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: 'never'
            },
        });

        // حفظ في قاعدة البيانات
        const savedPayment = await db.createPayment({
            stripePaymentIntentId: paymentIntent.id,
            stripeCheckoutSessionId: null,
            customerId: customer?.id || null,
            customerEmail: customerEmail || null,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            taxAmount: 0,
            taxRate: 0,
            totalAmount: paymentIntent.amount,
            status: paymentIntent.status,
            paymentMethod: 'card',
            description: description || 'دفع عبر Stripe',
            metadata: paymentIntent.metadata,
        });

        logger.info(`✅ Payment Intent created: ${paymentIntent.id} for ${amount} ${currency}`);

        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            paymentId: savedPayment.id,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            customer: customer,
            status: paymentIntent.status,
        });

    } catch (error) {
        logger.error('❌ Error creating payment intent:', error);
        
        await db.logError({
            errorType: 'create_payment_intent',
            errorMessage: error.message,
            stackTrace: error.stack,
            metadata: req.body,
        });

        res.status(500).json({
            error: 'فشل إنشاء طلب الدفع',
            details: error.message
        });
    }
});

// ============================================
// 3. استرداد معلومات الدفع
// ============================================
router.get('/payment-intent/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // البحث في قاعدة البيانات أولاً
        let payment = await db.getPaymentByStripeIntent(id);

        if (!payment) {
            // إذا لم يوجد، اسأل Stripe
            const paymentIntent = await stripe.paymentIntents.retrieve(id);
            payment = {
                id: paymentIntent.id,
                amount: paymentIntent.amount / 100,
                currency: paymentIntent.currency,
                status: paymentIntent.status,
                clientSecret: paymentIntent.client_secret,
                customer: paymentIntent.customer,
                metadata: paymentIntent.metadata,
                created: paymentIntent.created,
            };
        }

        res.json(payment);

    } catch (error) {
        logger.error('❌ Error retrieving payment intent:', error);
        res.status(404).json({ error: 'Payment Intent غير موجود' });
    }
});

// ============================================
// 4. إلغاء الدفع
// ============================================
router.post('/cancel-payment/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const paymentIntent = await stripe.paymentIntents.cancel(id);

        // تحديث قاعدة البيانات
        await db.updatePaymentStatus(id, 'canceled');

        res.json({
            message: 'تم إلغاء الدفع بنجاح',
            paymentIntent: paymentIntent.id,
            status: paymentIntent.status,
        });

    } catch (error) {
        logger.error('❌ Error canceling payment:', error);
        res.status(500).json({ error: 'فشل إلغاء الدفع' });
    }
});

// ============================================
// 5. إنشاء Checkout Session (صفحة دفع جاهزة)
// ============================================
router.post('/create-checkout-session', async (req, res) => {
    try {
        const {
            items = [],
            customerEmail,
            customerName,
            successUrl = 'https://alazab.com/success?session_id={CHECKOUT_SESSION_ID}',
            cancelUrl = 'https://alazab.com/cancel',
            metadata = {},
            allowPromotionCodes = true,
            taxRate = process.env.DEFAULT_TAX_RATE || 0.14,
            currency = process.env.DEFAULT_CURRENCY || 'usd',
            orderId,
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'يجب إضافة منتج واحد على الأقل' });
        }

        // تحويل الأصناف إلى صيغة Stripe Checkout
        const lineItems = items.map(item => ({
            price_data: {
                currency: currency,
                product_data: {
                    name: item.name,
                    description: item.description || '',
                    images: item.images || [],
                },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity || 1,
        }));

        // البحث عن العميل أو إنشاؤه
        let customer = null;
        if (customerEmail) {
            const existingCustomer = await db.getCustomerByEmail(customerEmail);
            if (existingCustomer) {
                customer = existingCustomer;
            } else if (customerName) {
                const stripeCustomer = await stripe.customers.create({
                    email: customerEmail,
                    name: customerName,
                    metadata: {
                        business: 'alazab.com',
                        source: 'checkout'
                    }
                });

                customer = await db.createCustomer({
                    stripeCustomerId: stripeCustomer.id,
                    email: customerEmail,
                    name: customerName,
                    metadata: { source: 'checkout' }
                });
            }
        }

        // إنشاء Tax Rate إذا كانت موجودة
        let taxRateId = null;
        if (taxRate > 0) {
            const taxRates = await stripe.taxRates.list({
                active: true,
                percentage: taxRate * 100,
            });

            if (taxRates.data.length > 0) {
                taxRateId = taxRates.data[0].id;
            } else {
                const newTaxRate = await stripe.taxRates.create({
                    display_name: 'VAT',
                    description: 'ضريبة القيمة المضافة',
                    percentage: taxRate * 100,
                    jurisdiction: 'EG',
                    inclusive: false,
                });
                taxRateId = newTaxRate.id;
            }
        }

        // إنشاء جلسة Checkout
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: successUrl,
            cancel_url: cancelUrl,
            customer: customer?.stripe_customer_id || undefined,
            customer_email: customerEmail || undefined,
            metadata: {
                ...metadata,
                business: 'alazab.com',
                orderId: orderId || '',
                customerId: customer?.id || '',
                environment: process.env.NODE_ENV || 'development',
            },
            allow_promotion_codes: allowPromotionCodes,
            tax_id_collection: {
                enabled: true,
            },
            ...(taxRateId && { tax_rates: [taxRateId] }),
            payment_method_options: {
                card: {
                    setup_future_usage: 'off_session',
                },
            },
            billing_address_collection: 'required',
            phone_number_collection: {
                enabled: true,
            },
        });

        // حفظ في قاعدة البيانات
        const totalAmount = lineItems.reduce((sum, item) => 
            sum + (item.price_data.unit_amount * item.quantity), 0
        );
        const taxAmount = Math.round(totalAmount * taxRate);
        
        await db.createPayment({
            stripePaymentIntentId: null, // سيتحدد لاحقاً
            stripeCheckoutSessionId: session.id,
            customerId: customer?.id || null,
            customerEmail: customerEmail || null,
            amount: totalAmount,
            currency: currency,
            taxAmount: taxAmount,
            taxRate: taxRate,
            totalAmount: totalAmount + taxAmount,
            status: 'pending',
            paymentMethod: 'checkout',
            description: `Checkout Session: ${session.id}`,
            metadata: session.metadata,
        });

        logger.info(`✅ Checkout session created: ${session.id}`);

        res.json({
            sessionId: session.id,
            sessionUrl: session.url,
            successUrl: session.success_url,
            cancelUrl: session.cancel_url,
        });

    } catch (error) {
        logger.error('❌ Error creating checkout session:', error);
        
        await db.logError({
            errorType: 'create_checkout_session',
            errorMessage: error.message,
            stackTrace: error.stack,
            metadata: req.body,
        });

        res.status(500).json({
            error: 'فشل إنشاء جلسة الدفع',
            details: error.message,
        });
    }
});

// ============================================
// 6. استرداد Checkout Session
// ============================================
router.get('/checkout-session/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const session = await stripe.checkout.sessions.retrieve(id, {
            expand: ['line_items.data.price.product', 'customer'],
        });

        res.json({
            id: session.id,
            customer: session.customer,
            customerDetails: session.customer_details,
            status: session.status,
            paymentStatus: session.payment_status,
            amountTotal: session.amount_total / 100,
            currency: session.currency,
            lineItems: session.line_items?.data || [],
            successUrl: session.success_url,
            cancelUrl: session.cancel_url,
            metadata: session.metadata,
        });

    } catch (error) {
        logger.error('❌ Error retrieving checkout session:', error);
        res.status(404).json({ error: 'Session غير موجودة' });
    }
});

// ============================================
// 7. إنشاء فاتورة
// ============================================
router.post('/create-invoice', async (req, res) => {
    try {
        const {
            customerEmail,
            customerName,
            description,
            taxRate = process.env.DEFAULT_TAX_RATE || 0.14,
            currency = process.env.DEFAULT_CURRENCY || 'usd',
            items = [],
            dueDays = 30,
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'يجب إضافة عنصر واحد على الأقل' });
        }

        // البحث عن العميل أو إنشاؤه
        let customer = await db.getCustomerByEmail(customerEmail);
        let stripeCustomer;

        if (customer) {
            stripeCustomer = await stripe.customers.retrieve(customer.stripe_customer_id);
        } else {
            // إنشاء عميل جديد في Stripe
            stripeCustomer = await stripe.customers.create({
                email: customerEmail,
                name: customerName,
                metadata: {
                    business: 'alazab.com',
                    source: 'invoice'
                }
            });

            customer = await db.createCustomer({
                stripeCustomerId: stripeCustomer.id,
                email: customerEmail,
                name: customerName || 'Guest',
                metadata: { source: 'invoice' }
            });
        }

        // إنشاء الفاتورة في Stripe
        const invoice = await stripe.invoices.create({
            customer: stripeCustomer.id,
            auto_advance: true,
            collection_method: 'send_invoice',
            days_until_due: dueDays,
            metadata: {
                business: 'alazab.com',
                description: description || 'خدمات من Alazab',
                customerId: customer.id,
            }
        });

        // إضافة الأصناف للفاتورة
        let totalAmount = 0;
        for (const item of items) {
            const unitAmount = Math.round(item.price * 100);
            totalAmount += unitAmount * (item.quantity || 1);

            await stripe.invoiceItems.create({
                customer: stripeCustomer.id,
                unit_amount: unitAmount,
                currency: currency,
                description: item.name,
                quantity: item.quantity || 1,
                invoice: invoice.id,
                metadata: {
                    ...item.metadata,
                }
            });
        }

        // حساب الضريبة
        const taxAmount = Math.round(totalAmount * taxRate);
        const totalWithTax = totalAmount + taxAmount;

        // إنهاء الفاتورة
        await stripe.invoices.finalizeInvoice(invoice.id);

        // جلب الفاتورة النهائية
        const finalInvoice = await stripe.invoices.retrieve(invoice.id, {
            expand: ['lines.data']
        });

        // حفظ في قاعدة البيانات
        const savedInvoice = await db.createInvoice({
            stripeInvoiceId: finalInvoice.id,
            stripeCustomerId: stripeCustomer.id,
            customerId: customer.id,
            customerEmail: customerEmail,
            invoiceNumber: finalInvoice.number,
            amount: totalAmount,
            currency: currency,
            taxAmount: taxAmount,
            taxRate: taxRate,
            totalAmount: totalWithTax,
            status: finalInvoice.status,
            description: description || 'خدمات من Alazab',
            invoiceUrl: finalInvoice.hosted_invoice_url,
            invoicePdfUrl: finalInvoice.invoice_pdf,
            dueDate: finalInvoice.due_date ? new Date(finalInvoice.due_date * 1000) : null,
        });

        logger.info(`✅ Invoice created: ${finalInvoice.id} (${finalInvoice.number})`);

        res.json({
            invoiceId: finalInvoice.id,
            invoiceNumber: finalInvoice.number,
            invoiceUrl: finalInvoice.hosted_invoice_url,
            invoicePdf: finalInvoice.invoice_pdf,
            customerId: customer.id,
            customerEmail: customerEmail,
            amount: totalAmount / 100,
            taxAmount: taxAmount / 100,
            totalAmount: totalWithTax / 100,
            currency: currency,
            status: finalInvoice.status,
            dueDate: finalInvoice.due_date,
            items: finalInvoice.lines.data,
        });

    } catch (error) {
        logger.error('❌ Error creating invoice:', error);
        
        await db.logError({
            errorType: 'create_invoice',
            errorMessage: error.message,
            stackTrace: error.stack,
            metadata: req.body,
        });

        res.status(500).json({
            error: 'فشل إنشاء الفاتورة',
            details: error.message
        });
    }
});

// ============================================
// 8. استرداد فاتورة
// ============================================
router.get('/invoice/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await stripe.invoices.retrieve(id, {
            expand: ['customer', 'lines.data']
        });

        res.json({
            id: invoice.id,
            number: invoice.number,
            customer: invoice.customer,
            amount: invoice.amount_due / 100,
            currency: invoice.currency,
            status: invoice.status,
            pdfUrl: invoice.invoice_pdf,
            hostedUrl: invoice.hosted_invoice_url,
            created: invoice.created,
            dueDate: invoice.due_date,
            lines: invoice.lines.data,
        });

    } catch (error) {
        logger.error('❌ Error retrieving invoice:', error);
        res.status(404).json({ error: 'الفاتورة غير موجودة' });
    }
});

// ============================================
// 9. حساب الضرائب
// ============================================
router.post('/calculate-tax', async (req, res) => {
    try {
        const { amount, taxRate = process.env.DEFAULT_TAX_RATE || 0.14 } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'المبلغ مطلوب' });
        }

        const subtotal = amount;
        const tax = Math.round((subtotal * taxRate) * 100) / 100;
        const total = subtotal + tax;

        res.json({
            subtotal: subtotal,
            taxRate: taxRate,
            taxAmount: tax,
            total: total,
            currency: process.env.DEFAULT_CURRENCY || 'usd',
            taxPercentage: (taxRate * 100).toFixed(2) + '%',
        });

    } catch (error) {
        logger.error('❌ Error calculating tax:', error);
        res.status(500).json({ error: 'فشل حساب الضريبة' });
    }
});

// ============================================
// 10. إحصائيات المدفوعات
// ============================================
router.get('/stats', async (req, res) => {
    try {
        const stats = await db.getPaymentStats();

        // إحصائيات إضافية من Stripe
        const balance = await stripe.balance.retrieve();
        const charges = await stripe.charges.list({ limit: 100 });

        res.json({
            database: stats,
            stripe: {
                balance: {
                    available: balance.available.map(b => ({
                        amount: b.amount / 100,
                        currency: b.currency
                    })),
                    pending: balance.pending.map(b => ({
                        amount: b.amount / 100,
                        currency: b.currency
                    }))
                },
                recentCharges: charges.data.map(c => ({
                    id: c.id,
                    amount: c.amount / 100,
                    currency: c.currency,
                    status: c.status,
                    created: new Date(c.created * 1000),
                })),
            },
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        logger.error('❌ Error getting stats:', error);
        res.status(500).json({ error: 'فشل جلب الإحصائيات' });
    }
});

// ============================================
// 11. إنشاء اشتراك (Subscription)
// ============================================
router.post('/create-subscription-session', async (req, res) => {
    try {
        const {
            priceId,
            customerEmail,
            customerName,
            successUrl = 'https://alazab.com/success',
            cancelUrl = 'https://alazab.com/cancel',
            metadata = {},
            trialDays = 0,
        } = req.body;

        if (!priceId) {
            return res.status(400).json({ error: 'priceId مطلوب' });
        }

        // البحث عن العميل أو إنشاؤه
        let customer = null;
        if (customerEmail) {
            const existingCustomer = await db.getCustomerByEmail(customerEmail);
            if (existingCustomer) {
                customer = existingCustomer;
            } else if (customerName) {
                const stripeCustomer = await stripe.customers.create({
                    email: customerEmail,
                    name: customerName,
                    metadata: {
                        business: 'alazab.com',
                        source: 'subscription'
                    }
                });

                customer = await db.createCustomer({
                    stripeCustomerId: stripeCustomer.id,
                    email: customerEmail,
                    name: customerName,
                    metadata: { source: 'subscription' }
                });
            }
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            success_url: successUrl,
            cancel_url: cancelUrl,
            customer: customer?.stripe_customer_id || undefined,
            customer_email: customerEmail || undefined,
            metadata: {
                ...metadata,
                business: 'alazab.com',
                type: 'subscription',
                customerId: customer?.id || '',
            },
            subscription_data: {
                trial_period_days: trialDays,
                metadata: {
                    ...metadata,
                    business: 'alazab.com',
                    customerId: customer?.id || '',
                },
            },
            allow_promotion_codes: true,
            billing_address_collection: 'required',
            phone_number_collection: {
                enabled: true,
            },
        });

        logger.info(`✅ Subscription session created: ${session.id}`);

        res.json({
            sessionId: session.id,
            sessionUrl: session.url,
        });

    } catch (error) {
        logger.error('❌ Error creating subscription session:', error);
        res.status(500).json({
            error: 'فشل إنشاء جلسة الاشتراك',
            details: error.message,
        });
    }
});

// ============================================
// 12. إلغاء اشتراك
// ============================================
router.post('/cancel-subscription/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const subscription = await stripe.subscriptions.cancel(id);

        await db.updateSubscriptionStatus(id, 'canceled');

        res.json({
            message: 'تم إلغاء الاشتراك بنجاح',
            subscriptionId: subscription.id,
            status: subscription.status,
            cancelAt: subscription.cancel_at,
        });

    } catch (error) {
        logger.error('❌ Error canceling subscription:', error);
        res.status(500).json({ error: 'فشل إلغاء الاشتراك' });
    }
});

// ============================================
// 13. استرداد الاشتراكات
// ============================================
router.get('/subscriptions/:customerId', async (req, res) => {
    try {
        const { customerId } = req.params;
        
        const customer = await db.getCustomerById(customerId);
        if (!customer) {
            return res.status(404).json({ error: 'العميل غير موجود' });
        }

        const subscriptions = await stripe.subscriptions.list({
            customer: customer.stripe_customer_id,
            status: 'all',
        });

        res.json({
            customer: customer,
            subscriptions: subscriptions.data.map(sub => ({
                id: sub.id,
                status: sub.status,
                plan: sub.items.data[0]?.price.nickname || 'Unknown',
                amount: sub.items.data[0]?.price.unit_amount / 100,
                currency: sub.currency,
                currentPeriodStart: new Date(sub.current_period_start * 1000),
                currentPeriodEnd: new Date(sub.current_period_end * 1000),
                trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
                cancelAt: sub.cancel_at ? new Date(sub.cancel_at * 1000) : null,
            })),
        });

    } catch (error) {
        logger.error('❌ Error fetching subscriptions:', error);
        res.status(500).json({ error: 'فشل جلب الاشتراكات' });
    }
});

module.exports = router;
