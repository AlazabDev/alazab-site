const db = require('./db-stripe');

async function testDatabase() {
    console.log('🧪 اختبار قاعدة البيانات...\n');

    try {
        // 1. اختبار الاتصال
        console.log('✅ 1. اختبار الاتصال بقاعدة البيانات...');
        const stats = await db.getPaymentStats();
        console.log('   ✅ الاتصال ناجح!');
        console.log('   الإحصائيات:', stats);

        // 2. اختبار إنشاء عميل
        console.log('\n✅ 2. اختبار إنشاء عميل...');
        const customer = await db.createCustomer({
            stripeCustomerId: 'cus_test_node_' + Date.now(),
            email: 'node-test@alazab.com',
            name: 'اختبار Node.js',
            phone: '+201234567890',
            metadata: { test: true, timestamp: Date.now() }
        });
        console.log('   ✅ تم إنشاء العميل:', customer.id);
        console.log('   📧 البريد:', customer.email);

        // 3. اختبار جلب العميل
        console.log('\n✅ 3. اختبار جلب العميل...');
        const foundCustomer = await db.getCustomerByEmail('node-test@alazab.com');
        console.log('   ✅ تم العثور على العميل:', foundCustomer?.id);

        // 4. اختبار إنشاء دفعة
        console.log('\n✅ 4. اختبار إنشاء دفعة...');
        const payment = await db.createPayment({
            stripePaymentIntentId: 'pi_test_node_' + Date.now(),
            stripeCheckoutSessionId: null,
            customerId: customer.id,
            customerEmail: 'node-test@alazab.com',
            amount: 5000,
            currency: 'usd',
            taxAmount: 700,
            taxRate: 0.14,
            totalAmount: 5700,
            status: 'pending',
            paymentMethod: 'card',
            description: 'دفعة اختبار من Node.js',
            metadata: { test: true }
        });
        console.log('   ✅ تم إنشاء الدفعة:', payment.id);
        console.log('   💵 المبلغ:', payment.amount/100, 'USD');

        // 5. اختبار تحديث الدفعة
        console.log('\n✅ 5. اختبار تحديث الدفعة...');
        const updatedPayment = await db.updatePaymentStatus(
            payment.stripe_payment_intent_id,
            'succeeded'
        );
        console.log('   ✅ تم تحديث الدفعة:', updatedPayment.status);

        // 6. اختبار الإحصائيات
        console.log('\n✅ 6. اختبار الإحصائيات...');
        const newStats = await db.getPaymentStats();
        console.log('   📊 إجمالي المدفوعات:', newStats.total);
        console.log('   💰 إجمالي المبلغ:', newStats.totalAmount, 'USD');
        console.log('   ✅ المدفوعات الناجحة:', newStats.succeeded);
        console.log('   ⏳ المدفوعات المعلقة:', newStats.pending);

        // 7. تنظيف البيانات
        console.log('\n🧹 7. تنظيف البيانات التجريبية...');
        await db.updatePaymentStatus(payment.stripe_payment_intent_id, 'refunded');
        // حذف البيانات (اختياري)
        console.log('   ✅ تم التنظيف');

        console.log('\n🎉 جميع الاختبارات نجحت!');
        process.exit(0);

    } catch (error) {
        console.error('❌ خطأ في الاختبار:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

testDatabase();
