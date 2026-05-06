/* eslint-disable */
/**
 * Auto-generated from: alazab-routing-rules(5).json
 * Generated at: 2026-05-05T19:46:36.649620+00:00
 *
 * Usage:
 * import { alazabRoutingRules } from '@/data/alazabRoutingRulesData';
 */

export type AlazabRoutingRules = {
  version: string;
  language: string;
  generated_at: string;
  default_fallback_question: string;
  classification_priority: string[];
  confidence_policy: Record<string, unknown>;
  rules: Array<Record<string, unknown>>;
};

export const alazabRoutingRules: AlazabRoutingRules = {
  "version": "2.1.0-content-upgrade",
  "language": "ar-EG",
  "generated_at": "2026-05-04T04:39:45Z",
  "default_fallback_question": "هل احتياجك متعلق بصيانة، تشطيب سكني، تجهيز فرع تجاري، توريد خامات، أم مشروع عام؟",
  "classification_priority": [
    "maintenance",
    "commercial_space",
    "luxury_finishing",
    "supply_request",
    "general_project"
  ],
  "confidence_policy": {
    "high": "تظهر إشارات واضحة لمسار واحد مع بيانات داعمة.",
    "medium": "تظهر إشارات لمسار واحد لكن البيانات ناقصة.",
    "low": "الطلب عام أو مختلط ويحتاج سؤال تصنيف واحد."
  },
  "rules": [
    {
      "route": "general_project",
      "brand_id": "alazab_group",
      "brand_ar": "مجموعة العزب",
      "brand_en": "Alazab Group",
      "target_url": "https://alazab.com",
      "priority": 1,
      "positive_signals": [
        "العزب",
        "مجموعة العزب",
        "alazab",
        "مشروع معماري",
        "تصميم وتنفيذ",
        "إدارة مشروع",
        "مقاولات",
        "تشطيب",
        "صيانة",
        "توريد",
        "شركة العزب",
        "حل معماري"
      ],
      "negative_signals": [],
      "minimum_required_fields": [
        "ما نوع الاحتياج: صيانة، تجهيز فرع، تشطيب سكني، توريد، أم مشروع عام؟",
        "هل الطلب سكني أم تجاري؟",
        "ما المدينة أو المنطقة؟",
        "هل توجد مساحة تقريبية أو صور أو ملف أو مخطط؟",
        "هل المطلوب استشارة، عرض سعر، معاينة، تنفيذ، أم متابعة طلب؟"
      ],
      "lead_fields": [
        "service_type",
        "customer_type",
        "city_area",
        "project_or_branch_name",
        "area_or_scope",
        "attachments_available",
        "requested_action",
        "contact_name",
        "contact_phone"
      ],
      "handoff_policy": "إذا لم يتضح المسار من أول رسالتين، اسأل سؤال تصنيف واحد فقط، ثم حوّل إلى المسار الأقرب بدل إطالة الحوار.",
      "response_goal": "تحديد المسار الصحيح، جمع الحد الأدنى من البيانات، ثم تحويل الطلب للفريق المختص دون وعود غير مثبتة.",
      "allowed_commitments": [
        "جمع بيانات مبدئية",
        "توجيه للعلامة المناسبة",
        "طلب صور أو ملفات داعمة"
      ],
      "blocked_commitments": [
        "سعر نهائي بدون نطاق",
        "موعد زيارة ملزم بدون فريق التشغيل",
        "ضمان قانوني غير موثق"
      ],
      "sample_first_reply": "أهلاً بحضرتك، مجموعة العزب تقدر توجّه طلبك للمسار الأنسب. هل احتياجك متعلق بصيانة، تجهيز فرع تجاري، تشطيب سكني، توريد خامات، أم مشروع عام؟"
    },
    {
      "route": "commercial_space",
      "brand_id": "brand_identity",
      "brand_ar": "هوية العلامة التجارية",
      "brand_en": "Brand Identity",
      "target_url": "https://brand-identity.alazab.com",
      "priority": 2,
      "positive_signals": [
        "براند",
        "هوية",
        "هوية بصرية",
        "فرع",
        "محل",
        "مطعم",
        "كافيه",
        "صيدلية",
        "عيادة",
        "واجهة",
        "سلسلة فروع",
        "تجهيز تجاري",
        "تجربة عميل",
        "branding",
        "brand identity",
        "commercial fit-out"
      ],
      "negative_signals": [],
      "minimum_required_fields": [
        "ما نوع النشاط التجاري؟",
        "هل يوجد شعار وهوية بصرية حالية؟",
        "كم عدد الفروع الحالية أو المستهدفة؟",
        "ما مساحة الفرع وموقعه؟",
        "هل المطلوب تصميم فقط أم تصميم وتنفيذ وتجهيز كامل؟",
        "هل توجد صور، مخطط، أو معاينة مطلوبة؟"
      ],
      "lead_fields": [
        "business_type",
        "brand_assets_available",
        "branch_count",
        "location",
        "area_m2",
        "scope_design_or_turnkey",
        "target_opening_date",
        "attachments_available",
        "decision_maker_contact"
      ],
      "handoff_policy": "حوّل إلى Brand Identity عندما يكون محور الطلب فرعًا تجاريًا أو واجهة أو تجربة عميل أو تكرار نموذج فرعي.",
      "response_goal": "تحديد المسار الصحيح، جمع الحد الأدنى من البيانات، ثم تحويل الطلب للفريق المختص دون وعود غير مثبتة.",
      "allowed_commitments": [
        "جمع بيانات مبدئية",
        "توجيه للعلامة المناسبة",
        "طلب صور أو ملفات داعمة"
      ],
      "blocked_commitments": [
        "سعر نهائي بدون نطاق",
        "موعد زيارة ملزم بدون فريق التشغيل",
        "ضمان قانوني غير موثق"
      ],
      "sample_first_reply": "أهلاً بحضرتك، مسار Brand Identity مناسب لتجهيز الفروع التجارية وتحويل البراند إلى تجربة مكانية. ما نوع النشاط التجاري ومساحة الفرع تقريبًا؟"
    },
    {
      "route": "luxury_finishing",
      "brand_id": "luxury_finishing",
      "brand_ar": "التشطيب الراقي",
      "brand_en": "Luxury Finishing",
      "target_url": "https://luxury-finishing.alazab.com",
      "priority": 3,
      "positive_signals": [
        "تشطيب",
        "تشطيب راقي",
        "سوبر لوكس",
        "فاخر",
        "شقة",
        "فيلا",
        "ديكور",
        "تصميم داخلي",
        "إضاءة",
        "رخام",
        "بورسلان",
        "باركيه",
        "دهانات",
        "نجارة",
        "تجديد"
      ],
      "negative_signals": [],
      "minimum_required_fields": [
        "ما نوع الوحدة: شقة أم فيلا؟",
        "ما المساحة التقريبية؟",
        "هل الوحدة على الطوب أم نصف تشطيب أم تحتاج تجديد؟",
        "ما مستوى التشطيب المطلوب؟",
        "هل توجد صور أو مخطط؟",
        "ما المنطقة والموعد المتوقع للبدء؟"
      ],
      "lead_fields": [
        "unit_type",
        "area_m2",
        "current_condition",
        "desired_finish_level",
        "location",
        "start_timeline",
        "drawings_available",
        "photos_available",
        "contact_phone"
      ],
      "handoff_policy": "حوّل إلى Luxury Finishing عندما يكون الطلب سكنيًا أو متعلقًا بالتشطيب الداخلي أو الخامات أو التصميم الداخلي للوحدات الخاصة.",
      "response_goal": "تحديد المسار الصحيح، جمع الحد الأدنى من البيانات، ثم تحويل الطلب للفريق المختص دون وعود غير مثبتة.",
      "allowed_commitments": [
        "جمع بيانات مبدئية",
        "توجيه للعلامة المناسبة",
        "طلب صور أو ملفات داعمة"
      ],
      "blocked_commitments": [
        "سعر نهائي بدون نطاق",
        "موعد زيارة ملزم بدون فريق التشغيل",
        "ضمان قانوني غير موثق"
      ],
      "sample_first_reply": "أهلاً بحضرتك، مسار Luxury Finishing مناسب للتشطيبات السكنية الراقية. هل الوحدة شقة أم فيلا، وما المساحة وحالة التشطيب الحالية؟"
    },
    {
      "route": "maintenance",
      "brand_id": "uberfix",
      "brand_ar": "أوبرفيكس",
      "brand_en": "UberFix",
      "target_url": "https://uberfix.shop/service-request",
      "priority": 4,
      "positive_signals": [
        "صيانة",
        "بلاغ",
        "عطل",
        "فني",
        "أوبرفيكس",
        "uberfix",
        "طلب صيانة",
        "رقم الطلب",
        "متابعة",
        "فرع",
        "تقرير",
        "صور العطل",
        "سباكة",
        "كهرباء",
        "تكييف",
        "نجارة",
        "دهانات",
        "facilities management"
      ],
      "negative_signals": [],
      "minimum_required_fields": [
        "ما نوع العطل؟",
        "هل الطلب سكني أم تجاري؟",
        "ما الموقع أو الفرع؟",
        "هل توجد صور للعطل؟",
        "هل لديك رقم طلب سابق؟",
        "ما درجة الاستعجال؟",
        "ما رقم التواصل؟"
      ],
      "lead_fields": [
        "issue_type",
        "customer_type",
        "site_or_branch",
        "address",
        "urgency",
        "photos_available",
        "existing_request_number",
        "contact_name",
        "contact_phone",
        "preferred_visit_time"
      ],
      "handoff_policy": "حوّل إلى UberFix فورًا عند ظهور كلمة صيانة أو عطل أو بلاغ أو رقم طلب أو فني، ولا تطل الشرح قبل تسجيل البيانات الأساسية.",
      "response_goal": "تحديد المسار الصحيح، جمع الحد الأدنى من البيانات، ثم تحويل الطلب للفريق المختص دون وعود غير مثبتة.",
      "allowed_commitments": [
        "جمع بيانات مبدئية",
        "توجيه للعلامة المناسبة",
        "طلب صور أو ملفات داعمة"
      ],
      "blocked_commitments": [
        "سعر نهائي بدون نطاق",
        "موعد زيارة ملزم بدون فريق التشغيل",
        "ضمان قانوني غير موثق"
      ],
      "sample_first_reply": "أهلاً بحضرتك، لتسجيل طلب الصيانة نحتاج نوع العطل، الموقع أو اسم الفرع، درجة الاستعجال، وصور للعطل إن وجدت."
    },
    {
      "route": "supply_request",
      "brand_id": "laban_alasfour",
      "brand_ar": "لبن العصفور",
      "brand_en": "Laban Alasfour",
      "target_url": "https://laban-alasfour.alazab.com",
      "priority": 5,
      "positive_signals": [
        "توريد",
        "خامة",
        "خامات",
        "لبن العصفور",
        "قطعة",
        "مش لاقي",
        "بديل",
        "إكسسوارات",
        "مورد",
        "منتج",
        "مقاس",
        "كود",
        "CAD",
        "GLB",
        "AR",
        "VR"
      ],
      "negative_signals": [],
      "minimum_required_fields": [
        "ما نوع الخامة أو المنتج المطلوب؟",
        "هل توجد صورة أو كود أو مقاس؟",
        "ما الكمية المطلوبة؟",
        "هل المطلوب بديل أم نفس المنتج؟",
        "هل التوريد لمشروع، صيانة، أم تشطيب؟",
        "ما موعد الاحتياج؟"
      ],
      "lead_fields": [
        "product_type",
        "photo_or_code_available",
        "dimensions",
        "quantity",
        "same_or_alternative",
        "related_project_type",
        "needed_by",
        "delivery_location",
        "contact_phone"
      ],
      "handoff_policy": "حوّل إلى Laban Alasfour عند وجود طلب خامة أو قطعة أو منتج أو بديل أو توريد مرتبط بمشروع أو صيانة أو تشطيب.",
      "response_goal": "تحديد المسار الصحيح، جمع الحد الأدنى من البيانات، ثم تحويل الطلب للفريق المختص دون وعود غير مثبتة.",
      "allowed_commitments": [
        "جمع بيانات مبدئية",
        "توجيه للعلامة المناسبة",
        "طلب صور أو ملفات داعمة"
      ],
      "blocked_commitments": [
        "سعر نهائي بدون نطاق",
        "موعد زيارة ملزم بدون فريق التشغيل",
        "ضمان قانوني غير موثق"
      ],
      "sample_first_reply": "أهلاً بحضرتك، لمساعدتك في التوريد نحتاج صورة أو كود أو مقاس المنتج، والكمية المطلوبة، وهل المطلوب نفس المنتج أم بديل مناسب."
    }
  ]
};

export default alazabRoutingRules;
