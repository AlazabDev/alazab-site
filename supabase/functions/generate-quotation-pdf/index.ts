import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function formatNumber(n: number): string {
  return new Intl.NumberFormat('ar-EG').format(n);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateHTML(quotation: any, lineItems: any[], finishingLevel: any): string {
  const today = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  const validUntil = quotation.valid_until 
    ? new Date(quotation.valid_until).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const systemLabels: Record<string, string> = {
    area_based: 'تسعير حسب المساحة',
    itemized: 'عرض سعر تفصيلي بالبنود',
    labor_only: 'تنفيذ فقط (خامات على العميل)',
  };

  let itemsHTML = '';
  
  if (quotation.pricing_system === 'area_based' && finishingLevel) {
    itemsHTML = `
      <table class="items-table">
        <thead>
          <tr>
            <th style="width:5%">م</th>
            <th>البند</th>
            <th style="width:12%">المساحة</th>
            <th style="width:12%">سعر المتر</th>
            <th style="width:15%">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>${finishingLevel.name} - ${finishingLevel.description || ''}</td>
            <td>${formatNumber(quotation.property_area)} م²</td>
            <td>${formatNumber(finishingLevel.price_per_sqm)} ج.م</td>
            <td>${formatNumber(quotation.subtotal)} ج.م</td>
          </tr>
        </tbody>
      </table>`;
  } else if (quotation.pricing_system === 'labor_only') {
    itemsHTML = `
      <table class="items-table">
        <thead>
          <tr>
            <th style="width:5%">م</th>
            <th>البند</th>
            <th style="width:15%">القيمة</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>قيمة الخامات (يوفرها العميل)</td>
            <td>${formatNumber(quotation.material_cost)} ج.م</td>
          </tr>
          <tr>
            <td>2</td>
            <td>نسبة التنفيذ (${quotation.labor_percentage}%)</td>
            <td>${formatNumber(quotation.subtotal)} ج.م</td>
          </tr>
        </tbody>
      </table>`;
  } else {
    // Itemized
    const rows = lineItems.map((item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${item.description}</td>
        <td>${item.unit}</td>
        <td>${formatNumber(item.quantity)}</td>
        <td>${formatNumber(item.unit_price)}</td>
        <td>${formatNumber(item.total)}</td>
      </tr>`).join('');
    
    itemsHTML = `
      <table class="items-table">
        <thead>
          <tr>
            <th style="width:5%">م</th>
            <th>البند</th>
            <th style="width:8%">الوحدة</th>
            <th style="width:8%">الكمية</th>
            <th style="width:12%">سعر الوحدة</th>
            <th style="width:15%">الإجمالي</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
  
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Cairo', sans-serif; color: #1a1a1a; font-size: 11px; line-height: 1.6; }
  
  .page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 15mm; position: relative; }
  
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #C8A951; padding-bottom: 15px; margin-bottom: 20px; }
  .company-info { text-align: right; }
  .company-name { font-size: 22px; font-weight: 900; color: #1B3A4B; }
  .company-name-en { font-size: 12px; color: #666; font-weight: 600; }
  .company-details { font-size: 9px; color: #666; margin-top: 5px; }
  
  .quote-badge { background: linear-gradient(135deg, #1B3A4B, #2d5a6e); color: white; padding: 12px 20px; border-radius: 8px; text-align: center; }
  .quote-badge h2 { font-size: 16px; font-weight: 700; }
  .quote-number { font-size: 13px; color: #C8A951; font-weight: 700; margin-top: 3px; }
  .quote-date { font-size: 9px; opacity: 0.8; margin-top: 2px; }
  
  .client-section { background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 20px; border-right: 4px solid #C8A951; }
  .client-section h3 { font-size: 13px; font-weight: 700; color: #1B3A4B; margin-bottom: 8px; }
  .client-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .client-field { font-size: 10px; }
  .client-label { font-weight: 600; color: #666; }
  
  .system-badge { display: inline-block; background: #C8A951; color: white; padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 600; margin-bottom: 15px; }
  
  .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  .items-table th { background: #1B3A4B; color: white; padding: 8px 6px; font-size: 10px; font-weight: 600; text-align: center; }
  .items-table td { padding: 7px 6px; border-bottom: 1px solid #eee; text-align: center; font-size: 10px; }
  .items-table tbody tr:nth-child(even) { background: #f8f9fa; }
  
  .totals { margin-right: auto; width: 250px; }
  .total-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px; border-bottom: 1px solid #eee; }
  .total-row.grand { background: #1B3A4B; color: white; padding: 10px 12px; border-radius: 6px; font-size: 14px; font-weight: 700; margin-top: 8px; }
  
  .terms { margin-top: 25px; padding: 15px; background: #f8f9fa; border-radius: 8px; }
  .terms h3 { font-size: 12px; font-weight: 700; color: #1B3A4B; margin-bottom: 8px; }
  .terms ul { padding-right: 15px; font-size: 9px; color: #555; }
  .terms li { margin-bottom: 3px; }
  
  .footer { position: absolute; bottom: 10mm; left: 15mm; right: 15mm; text-align: center; border-top: 2px solid #C8A951; padding-top: 10px; }
  .footer p { font-size: 8px; color: #888; }
  .footer .contacts { font-size: 9px; color: #1B3A4B; font-weight: 600; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="company-info">
      <div class="company-name">شركة العزب للمقاولات العامة</div>
      <div class="company-name-en">Al-Azab General Contracting Co.</div>
      <div class="company-details">
        رقم السجل التجاري: 218670 | الرقم الضريبي: 1053001002186<br>
        8 شارع 500، المعادي الجديدة، القاهرة - مصر
      </div>
    </div>
    <div class="quote-badge">
      <h2>عرض سعر</h2>
      <div class="quote-number">${quotation.quotation_number}</div>
      <div class="quote-date">${today}</div>
    </div>
  </div>

  <div class="client-section">
    <h3>بيانات العميل</h3>
    <div class="client-grid">
      <div class="client-field"><span class="client-label">الاسم:</span> ${quotation.client_name}</div>
      <div class="client-field"><span class="client-label">الهاتف:</span> ${quotation.client_phone || '-'}</div>
      <div class="client-field"><span class="client-label">البريد:</span> ${quotation.client_email || '-'}</div>
      <div class="client-field"><span class="client-label">نوع المشروع:</span> ${quotation.project_type === 'residential' ? 'سكني' : 'تجاري'}</div>
      ${quotation.property_type ? `<div class="client-field"><span class="client-label">نوع العقار:</span> ${quotation.property_type}</div>` : ''}
      ${quotation.property_area ? `<div class="client-field"><span class="client-label">المساحة:</span> ${formatNumber(quotation.property_area)} م²</div>` : ''}
    </div>
  </div>

  <div class="system-badge">${systemLabels[quotation.pricing_system] || quotation.pricing_system}</div>

  ${itemsHTML}

  <div class="totals">
    <div class="total-row">
      <span>الإجمالي الفرعي</span>
      <span>${formatNumber(quotation.subtotal)} ج.م</span>
    </div>
    ${quotation.discount_amount > 0 ? `
    <div class="total-row">
      <span>الخصم (${quotation.discount_percentage}%)</span>
      <span style="color: #e74c3c">-${formatNumber(quotation.discount_amount)} ج.م</span>
    </div>` : ''}
    ${quotation.tax_amount > 0 ? `
    <div class="total-row">
      <span>ضريبة القيمة المضافة (${quotation.tax_percentage}%)</span>
      <span>${formatNumber(quotation.tax_amount)} ج.م</span>
    </div>` : ''}
    <div class="total-row grand">
      <span>الإجمالي النهائي</span>
      <span>${formatNumber(quotation.total)} ج.م</span>
    </div>
  </div>

  ${validUntil ? `<p style="text-align:center; margin-top:10px; font-size:10px; color:#e74c3c; font-weight:600;">صالح حتى: ${validUntil}</p>` : ''}

  <div class="terms">
    <h3>الشروط والأحكام</h3>
    <ul>
      <li>العرض صالح لمدة 30 يوماً من تاريخ الإصدار ما لم يُذكر خلاف ذلك</li>
      <li>يتم دفع 50% مقدم عند التعاقد والباقي على دفعات حسب مراحل التنفيذ</li>
      <li>الأسعار لا تشمل أي تعديلات إضافية خارج نطاق العمل المتفق عليه</li>
      <li>مدة الضمان سنة كاملة من تاريخ التسليم على جميع الأعمال المنفذة</li>
      <li>الأسعار قابلة للتغيير في حالة تغير أسعار الخامات بنسبة تتجاوز 10%</li>
    </ul>
  </div>

  ${quotation.notes ? `<div style="margin-top:15px; padding:10px; background:#fff3cd; border-radius:6px; font-size:10px;"><strong>ملاحظات:</strong> ${quotation.notes}</div>` : ''}

  <div class="footer">
    <div class="contacts">
      القاهرة: +201004006620 | جدة: +966547330897 | الدقهلية: +201014536600
    </div>
    <p>support@al-azab.co | www.alazab.com</p>
    <p>شركة العزب للمقاولات العامة © ${new Date().getFullYear()} - جميع الحقوق محفوظة</p>
  </div>
</div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { quotationId, action } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch quotation
    const { data: quotation, error: qErr } = await supabase
      .from("quotations")
      .select("*")
      .eq("id", quotationId)
      .single();

    if (qErr || !quotation) throw new Error("عرض السعر غير موجود");

    // Fetch line items if itemized
    let lineItems: Record<string, unknown>[] = [];
    if (quotation.pricing_system === 'itemized') {
      const { data } = await supabase
        .from("quotation_line_items")
        .select("*")
        .eq("quotation_id", quotationId)
        .order("sort_order");
      lineItems = data || [];
    }

    // Fetch finishing level if area-based
    let finishingLevel = null;
    if (quotation.pricing_system === 'area_based' && quotation.finishing_level_id) {
      const { data } = await supabase
        .from("finishing_levels")
        .select("*")
        .eq("id", quotation.finishing_level_id)
        .single();
      finishingLevel = data;
    }

    const html = generateHTML(quotation, lineItems, finishingLevel);

    return new Response(JSON.stringify({ html, quotation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("PDF generation error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
