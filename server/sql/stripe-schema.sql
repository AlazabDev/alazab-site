-- ============================================
-- STRIPE PAYMENTS DATABASE SCHEMA
-- ============================================
-- لتشغيل: psql -U postgres -d alazab -f sql/stripe-schema.sql
-- ============================================

-- ============================================
-- 1. العملاء (Customers)
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_customer_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(50),
    tax_id VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE customers IS 'عملاء النظام المتكاملين مع Stripe';
COMMENT ON COLUMN customers.stripe_customer_id IS 'رقم العميل من Stripe';
COMMENT ON COLUMN customers.tax_id IS 'الرقم الضريبي للعميل';

-- ============================================
-- 2. المدفوعات (Payments)
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
    stripe_checkout_session_id VARCHAR(255),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_email VARCHAR(255),
    amount INTEGER NOT NULL, -- بالملي (سنتات)
    currency VARCHAR(3) DEFAULT 'usd',
    tax_amount INTEGER DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    total_amount INTEGER NOT NULL, -- شامل الضريبة
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    paid_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE payments IS 'سجل جميع المدفوعات';
COMMENT ON COLUMN payments.amount IS 'المبلغ بدون ضريبة (بالملي)';
COMMENT ON COLUMN payments.total_amount IS 'المبلغ شامل الضريبة (بالملي)';

-- ============================================
-- 3. الفواتير (Invoices)
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_invoice_id VARCHAR(255) UNIQUE NOT NULL,
    stripe_customer_id VARCHAR(255),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_email VARCHAR(255),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'usd',
    tax_amount INTEGER DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    total_amount INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    description TEXT,
    invoice_url TEXT,
    invoice_pdf_url TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE invoices IS 'الفواتير المرسلة للعملاء';
COMMENT ON COLUMN invoices.invoice_number IS 'رقم الفاتورة التلقائي (مثل INV-001)';

-- ============================================
-- 4. أصناف الفواتير (Invoice Items)
-- ============================================
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    stripe_invoice_item_id VARCHAR(255),
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_amount INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'usd',
    tax_amount INTEGER DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    total_amount INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE invoice_items IS 'أصناف الفاتورة (الخدمات/المنتجات)';

-- ============================================
-- 5. الاشتراكات (Subscriptions)
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
    stripe_customer_id VARCHAR(255),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    stripe_price_id VARCHAR(255) NOT NULL,
    stripe_product_id VARCHAR(255) NOT NULL,
    plan_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    currency VARCHAR(3) DEFAULT 'usd',
    amount INTEGER NOT NULL,
    interval_type VARCHAR(50) NOT NULL, -- 'month', 'year', 'week'
    interval_count INTEGER DEFAULT 1,
    trial_start_at TIMESTAMP WITH TIME ZONE,
    trial_end_at TIMESTAMP WITH TIME ZONE,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at TIMESTAMP WITH TIME ZONE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE subscriptions IS 'اشتراكات العملاء المتكررة';

-- ============================================
-- 6. سجل Webhook (Webhook Events Log)
-- ============================================
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'received',
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE webhook_events IS 'سجل جميع إشعارات Webhook من Stripe';

-- ============================================
-- 7. سجل الأخطاء (Error Logs)
-- ============================================
CREATE TABLE IF NOT EXISTS payment_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_type VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    stripe_payment_intent_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE payment_errors IS 'سجل أخطاء المدفوعات لسهولة التتبع';

-- ============================================
-- 8. الضرائب (Tax Rates)
-- ============================================
CREATE TABLE IF NOT EXISTS tax_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_tax_rate_id VARCHAR(255),
    code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    description TEXT,
    jurisdiction VARCHAR(100),
    is_default BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE tax_rates IS 'نسب الضريبة المختلفة (VAT, Sales Tax, etc.)';

-- ============================================
-- 9. السجلات (Transaction Logs)
-- ============================================
CREATE TABLE IF NOT EXISTS transaction_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_id VARCHAR(255),
    reference_type VARCHAR(50), -- 'payment', 'invoice', 'subscription'
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'paid', 'refunded'
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    changes JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE transaction_logs IS 'سجل تغيرات حالة المعاملات';

-- ============================================
-- الفهارس (Indexes) لتسريع الاستعلامات
-- ============================================

-- Payments
CREATE INDEX idx_payments_stripe_intent ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_customer_email ON payments(customer_email);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- Invoices
CREATE INDEX idx_invoices_stripe_invoice ON invoices(stripe_invoice_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);

-- Subscriptions
CREATE INDEX idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_customer_id ON subscriptions(customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_current_period_end ON subscriptions(current_period_end);

-- Webhook Events
CREATE INDEX idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_status ON webhook_events(status);
CREATE INDEX idx_webhook_events_created_at ON webhook_events(created_at);

-- Customers
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_stripe_customer_id ON customers(stripe_customer_id);

-- Invoice Items
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
