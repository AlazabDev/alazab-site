import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const WA_API = "https://graph.facebook.com/v21.0";

interface NotificationRequest {
  quotation_id: string;
  action: "new" | "status_change" | "approval_request" | "approved" | "rejected";
  old_status?: string;
  new_status?: string;
  rejection_reason?: string;
  approval_notes?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const waToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const waPhoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    
    if (!waToken || !waPhoneId) {
      throw new Error("WhatsApp credentials not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body: NotificationRequest = await req.json();
    const { quotation_id, action, rejection_reason, approval_notes } = body;

    // Fetch quotation
    const { data: quotation, error: qErr } = await supabase
      .from("quotations")
      .select("*")
      .eq("id", quotation_id)
      .single();

    if (qErr || !quotation) throw new Error("Quotation not found");

    // Fetch notification settings
    const { data: settings } = await supabase
      .from("notification_settings")
      .select("setting_key, setting_value")
      .eq("is_active", true);

    const getSetting = (key: string) => settings?.find(s => s.setting_key === key)?.setting_value;
    const adminPhone = getSetting("admin_phone");
    const salesPhone = getSetting("sales_phone");

    const fmt = (n: number) => new Intl.NumberFormat("ar-EG").format(Math.round(n));

    // Build messages based on action
    const notifications: Array<{ phone: string; message: string; recipientType: string }> = [];

    const statusLabels: Record<string, string> = {
      draft: "مسودة",
      sent: "مُرسل",
      pending_approval: "بانتظار الموافقة",
      approved: "تمت الموافقة",
      rejected: "مرفوض",
      reviewing: "قيد المراجعة",
      accepted: "مقبول",
    };

    if (action === "new") {
      // Notify admin & sales about new quotation
      const msg = `🆕 *عرض سعر جديد*\n\n` +
        `📋 رقم العرض: ${quotation.quotation_number}\n` +
        `👤 العميل: ${quotation.client_name}\n` +
        `📞 الهاتف: ${quotation.client_phone || "غير محدد"}\n` +
        `💰 الإجمالي: ${fmt(quotation.total)} ج.م\n` +
        `🏗️ النظام: ${quotation.pricing_system === "area_based" ? "حسب المساحة" : quotation.pricing_system === "itemized" ? "تفصيلي" : "تنفيذ فقط"}\n` +
        `📐 المساحة: ${quotation.property_area || "—"} م²\n\n` +
        `🔗 https://alazab.com/quotation-management`;

      if (adminPhone && getSetting("notify_admin_new_quotation") === "true") {
        notifications.push({ phone: adminPhone, message: msg, recipientType: "admin" });
      }
      if (salesPhone && getSetting("notify_sales_new_quotation") === "true") {
        notifications.push({ phone: salesPhone, message: msg, recipientType: "sales" });
      }
    }

    if (action === "status_change") {
      const newStatusLabel = statusLabels[body.new_status || ""] || body.new_status;
      const adminMsg = `🔄 *تحديث حالة عرض سعر*\n\n` +
        `📋 ${quotation.quotation_number}\n` +
        `👤 ${quotation.client_name}\n` +
        `📊 الحالة الجديدة: ${newStatusLabel}\n` +
        `💰 الإجمالي: ${fmt(quotation.total)} ج.م`;

      if (adminPhone && getSetting("notify_admin_status_change") === "true") {
        notifications.push({ phone: adminPhone, message: adminMsg, recipientType: "admin" });
      }
      if (salesPhone) {
        notifications.push({ phone: salesPhone, message: adminMsg, recipientType: "sales" });
      }

      // Notify client if quotation is sent/approved
      if (quotation.client_phone && (body.new_status === "sent" || body.new_status === "approved" || body.new_status === "accepted")) {
        const clientMsg = body.new_status === "sent"
          ? `مرحباً ${quotation.client_name} 👋\n\n` +
            `تم إعداد عرض سعر خاص لك من *شركة العزب للمقاولات*\n\n` +
            `📋 رقم العرض: ${quotation.quotation_number}\n` +
            `💰 الإجمالي: ${fmt(quotation.total)} ج.م\n\n` +
            `سيتم التواصل معك قريباً لمناقشة التفاصيل.\n` +
            `📞 للاستفسار: +201004006620\n` +
            `🌐 alazab.com`
          : `مرحباً ${quotation.client_name} 👋\n\n` +
            `✅ تمت الموافقة على عرض السعر رقم ${quotation.quotation_number}\n` +
            `💰 الإجمالي: ${fmt(quotation.total)} ج.م\n\n` +
            `يسعدنا بدء العمل معك! سيتواصل معك فريقنا لتنسيق الخطوات القادمة.\n` +
            `📞 +201004006620`;

        notifications.push({ phone: quotation.client_phone, message: clientMsg, recipientType: "client" });
      }
    }

    if (action === "approved") {
      const msg = `✅ *تمت الموافقة على عرض السعر*\n\n` +
        `📋 ${quotation.quotation_number}\n` +
        `👤 ${quotation.client_name}\n` +
        `💰 ${fmt(quotation.total)} ج.م\n` +
        (approval_notes ? `📝 ملاحظات: ${approval_notes}\n` : "") +
        `\n🔗 https://alazab.com/quotation-management`;

      if (adminPhone) notifications.push({ phone: adminPhone, message: msg, recipientType: "admin" });
      if (salesPhone) notifications.push({ phone: salesPhone, message: msg, recipientType: "sales" });

      if (quotation.client_phone && getSetting("notify_client_quotation_ready") === "true") {
        const clientMsg = `مرحباً ${quotation.client_name} 👋\n\n` +
          `✅ تمت الموافقة على عرض السعر الخاص بك\n` +
          `📋 رقم العرض: ${quotation.quotation_number}\n` +
          `💰 الإجمالي: ${fmt(quotation.total)} ج.م\n\n` +
          `سيتواصل معك فريقنا قريباً لبدء التنفيذ.\n` +
          `📞 للاستفسار: +201004006620`;
        notifications.push({ phone: quotation.client_phone, message: clientMsg, recipientType: "client" });
      }
    }

    if (action === "rejected") {
      const msg = `❌ *تم رفض عرض السعر*\n\n` +
        `📋 ${quotation.quotation_number}\n` +
        `👤 ${quotation.client_name}\n` +
        `💰 ${fmt(quotation.total)} ج.م\n` +
        (rejection_reason ? `📝 السبب: ${rejection_reason}\n` : "") +
        `\n🔗 https://alazab.com/quotation-management`;

      if (adminPhone) notifications.push({ phone: adminPhone, message: msg, recipientType: "admin" });
      if (salesPhone) notifications.push({ phone: salesPhone, message: msg, recipientType: "sales" });
    }

    // Send WhatsApp messages
    const results = [];
    for (const notif of notifications) {
      try {
        // Clean phone number
        let phone = notif.phone.replace(/[^\d+]/g, "");
        if (!phone.startsWith("+")) phone = "+" + phone;
        // Remove + for API
        const phoneForApi = phone.replace("+", "");

        const waResp = await fetch(`${WA_API}/${waPhoneId}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${waToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: phoneForApi,
            type: "text",
            text: { body: notif.message },
          }),
        });

        const waData = await waResp.json();
        const waMessageId = waData.messages?.[0]?.id || null;

        // Log notification
        await supabase.from("quotation_notifications").insert({
          quotation_id,
          notification_type: action,
          recipient_type: notif.recipientType,
          recipient_phone: notif.phone,
          wa_message_id: waMessageId,
          status: waResp.ok ? "sent" : "failed",
        });

        results.push({ phone: notif.phone, success: waResp.ok, messageId: waMessageId });
      } catch (err) {
        console.error("Failed to send notification:", err);
        await supabase.from("quotation_notifications").insert({
          quotation_id,
          notification_type: action,
          recipient_type: notif.recipientType,
          recipient_phone: notif.phone,
          status: "failed",
        });
        results.push({ phone: notif.phone, success: false, error: String(err) });
      }
    }

    return new Response(JSON.stringify({ success: true, notifications: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("quotation-notifications error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
