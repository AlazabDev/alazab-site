/* eslint-disable */
/**
 * Auto-generated from: alazab-faq(5).json
 * Generated at: 2026-05-05T19:46:36.647638+00:00
 *
 * Usage:
 * import { alazabFaq } from '@/data/alazabFaqData';
 */

export type AlazabFaqItem = {
  answer: string;
  brand_id: string;
  id: string;
  intent: string;
  question: string;
  required_followup: string[];
  source: string;
  tags: string[];
};

export const alazabFaq: AlazabFaqItem[] = [
  {
    "id": "faq_001",
    "brand_id": "alazab_group",
    "intent": "alazab_group.general",
    "question": "ما هي مجموعة العزب؟",
    "answer": "مجموعة العزب هي منظومة معمارية وتشغيلية تجمع تجهيز المساحات التجارية، التشطيبات الراقية، الصيانة وإدارة المرافق، والتوريدات المعمارية في مسار واحد يبدأ من فهم احتياج العميل وينتهي بالتنفيذ أو التشغيل والمتابعة.",
    "required_followup": [
      "ما نوع احتياجك تحديدًا؟"
    ],
    "tags": [
      "تعريف",
      "مؤسسة"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_002",
    "brand_id": "alazab_group",
    "intent": "alazab_group.general",
    "question": "ما العلامات التابعة لمجموعة العزب؟",
    "answer": "العلامات الأساسية هي: Alazab Group للتوجيه العام، Brand Identity للمساحات التجارية، Luxury Finishing للتشطيبات السكنية الراقية، UberFix للصيانة وإدارة المرافق، وLaban Alasfour للتوريدات والخامات والمنتجات المعمارية.",
    "required_followup": [],
    "tags": [
      "علامات",
      "توجيه"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_003",
    "brand_id": "alazab_group",
    "intent": "alazab_group.general",
    "question": "كيف أعرف المسار المناسب لطلبي؟",
    "answer": "لو الطلب صيانة أو عطل فهو UberFix. لو فرع أو محل أو واجهة فهو Brand Identity. لو شقة أو فيلا أو تشطيب داخلي فهو Luxury Finishing. لو خامة أو قطعة أو توريد فهو Laban Alasfour. ولو الطلب غير واضح تبدأ من Alazab Group للتوجيه.",
    "required_followup": [
      "هل طلبك صيانة أم تشطيب أم فرع تجاري أم توريد؟"
    ],
    "tags": [
      "توجيه",
      "تصنيف"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_004",
    "brand_id": "alazab_group",
    "intent": "alazab_group.general",
    "question": "هل يمكن إعطاء سعر من أول رسالة؟",
    "answer": "لا يتم إعطاء سعر نهائي من أول رسالة لأن السعر يعتمد على النطاق والمساحة والموقع والحالة والصور أو المعاينة. يمكن فقط جمع البيانات مبدئيًا ثم تحويل الطلب للفريق المختص.",
    "required_followup": [],
    "tags": [
      "تسعير",
      "سياسة"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_005",
    "brand_id": "alazab_group",
    "intent": "alazab_group.general",
    "question": "ما البيانات العامة المطلوبة لفتح طلب جديد؟",
    "answer": "البيانات العامة هي: نوع الخدمة، هل الطلب سكني أم تجاري، الموقع، مساحة أو وصف مختصر، صور أو ملفات إن وجدت، ووسيلة التواصل. بعدها يتم تحويل الطلب للمسار الصحيح.",
    "required_followup": [],
    "tags": [
      "بيانات",
      "lead"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_006",
    "brand_id": "alazab_group",
    "intent": "alazab_group.general",
    "question": "هل مجموعة العزب شركة مقاولات فقط؟",
    "answer": "لا. مجموعة العزب أوسع من فكرة المقاولات التقليدية؛ هي منظومة تجمع التصميم والتنفيذ والتشغيل والصيانة والتوريد، مع مسارات متخصصة حسب نوع احتياج العميل.",
    "required_followup": [],
    "tags": [
      "تعريف",
      "استراتيجية"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_007",
    "brand_id": "alazab_group",
    "intent": "alazab_group.general",
    "question": "ما الفرق بين الموقع الرئيسي والمواقع الفرعية؟",
    "answer": "الموقع الرئيسي alazab.com هو بوابة المجموعة والتوجيه العام. المواقع الفرعية مخصصة لمسارات محددة: Brand Identity للتجاري، Luxury Finishing للسكني، UberFix للصيانة، وLaban Alasfour للتوريدات.",
    "required_followup": [],
    "tags": [
      "مواقع",
      "توجيه"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_008",
    "brand_id": "alazab_group",
    "intent": "alazab_group.general",
    "question": "ما السياسة عند عدم وضوح طلب العميل؟",
    "answer": "يتم سؤال سؤال تصنيف واحد: هل احتياجك متعلق بصيانة، تشطيب، تجهيز فرع تجاري، توريد خامات، أم مشروع عام؟ ثم يتم التحويل للمسار الأقرب.",
    "required_followup": [],
    "tags": [
      "تشغيل",
      "محادثة"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_009",
    "brand_id": "brand_identity",
    "intent": "brand_identity.general",
    "question": "ما هي خدمة Brand Identity؟",
    "answer": "Brand Identity هي خدمة تصميم وتجهيز المساحات التجارية وتحويل الهوية البصرية إلى تجربة مكانية داخل الفرع، تشمل الواجهة والحركة والإضاءة والخامات ووحدات العرض والتجهيز التنفيذي.",
    "required_followup": [
      "ما نوع النشاط التجاري؟"
    ],
    "tags": [
      "تعريف",
      "تجاري"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_010",
    "brand_id": "brand_identity",
    "intent": "brand_identity.general",
    "question": "هل Brand Identity تعني تصميم شعار فقط؟",
    "answer": "لا. تصميم الشعار جزء من الهوية البصرية، أما Brand Identity داخل مجموعة العزب فهي تحويل البراند إلى مساحة تجارية فعلية قابلة للتنفيذ والتشغيل والتكرار في الفروع.",
    "required_followup": [],
    "tags": [
      "توضيح",
      "هوية"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_011",
    "brand_id": "brand_identity",
    "intent": "brand_identity.general",
    "question": "ما البيانات المطلوبة لتجهيز فرع تجاري؟",
    "answer": "نحتاج نوع النشاط، مساحة وموقع الفرع، هل توجد هوية بصرية حالية، عدد الفروع الحالية أو المستهدفة، نطاق الخدمة: تصميم فقط أم تصميم وتنفيذ، وصور أو مخطط إن وجد.",
    "required_followup": [
      "ما مساحة الفرع وموقعه؟"
    ],
    "tags": [
      "بيانات",
      "فرع"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_012",
    "brand_id": "brand_identity",
    "intent": "brand_identity.general",
    "question": "هل يمكن تجهيز سلسلة فروع بنفس الهوية؟",
    "answer": "نعم، المسار مناسب جدًا للسلاسل التجارية لأن الهدف هو بناء نموذج فرع قابل للتكرار مع ضبط الهوية والخامات والتجربة التشغيلية.",
    "required_followup": [],
    "tags": [
      "سلاسل",
      "تكرار"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_013",
    "brand_id": "brand_identity",
    "intent": "brand_identity.general",
    "question": "ما الفرق بين تصميم الفرع وتجهيزه؟",
    "answer": "التصميم يحدد الشكل والتوزيع والخامات والتجربة. التجهيز أو التنفيذ يحول التصميم إلى واقع شامل الأعمال المدنية والكهرباء والإضاءة والواجهات والوحدات حسب النطاق المتفق عليه.",
    "required_followup": [],
    "tags": [
      "نطاق",
      "تنفيذ"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_014",
    "brand_id": "brand_identity",
    "intent": "brand_identity.general",
    "question": "هل يتم العمل على مطاعم وكافيهات وصيدليات؟",
    "answer": "نعم، مسار Brand Identity مناسب للمطاعم والكافيهات والصيدليات والعيادات والمحلات وأي نشاط تجاري يحتاج تجربة مكانية واضحة.",
    "required_followup": [],
    "tags": [
      "أنشطة",
      "تجاري"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_015",
    "brand_id": "brand_identity",
    "intent": "brand_identity.general",
    "question": "هل يلزم وجود هوية بصرية قبل التصميم؟",
    "answer": "يفضل وجود شعار وألوان وخطوط، لكن عند عدم توفرها يمكن تسجيل ذلك كجزء من نطاق العمل ليتم تحديد احتياج الهوية قبل تحويلها إلى فرع فعلي.",
    "required_followup": [],
    "tags": [
      "هوية",
      "بيانات"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_016",
    "brand_id": "brand_identity",
    "intent": "brand_identity.general",
    "question": "متى يتحول الطلب إلى Brand Identity؟",
    "answer": "عند وجود كلمات مثل فرع، محل، واجهة، مطعم، كافيه، صيدلية، عيادة، هوية، تجهيز تجاري، أو سلسلة فروع.",
    "required_followup": [],
    "tags": [
      "توجيه"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_017",
    "brand_id": "luxury_finishing",
    "intent": "luxury_finishing.general",
    "question": "ما هي خدمة Luxury Finishing؟",
    "answer": "Luxury Finishing هي مسار التشطيبات السكنية الراقية للشقق والفيلات، يركز على جودة الخامات ودقة التفاصيل والراحة البصرية والتنفيذ الهادئ غير المبالغ فيه.",
    "required_followup": [
      "هل الوحدة شقة أم فيلا؟"
    ],
    "tags": [
      "تعريف",
      "سكني"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_018",
    "brand_id": "luxury_finishing",
    "intent": "luxury_finishing.general",
    "question": "ما البيانات المطلوبة قبل عرض تشطيب؟",
    "answer": "نحتاج نوع الوحدة، المساحة، حالة التشطيب الحالية، الموقع، مستوى التشطيب المطلوب، صور أو مخطط، والموعد المتوقع للبدء.",
    "required_followup": [],
    "tags": [
      "بيانات",
      "تشطيب"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_019",
    "brand_id": "luxury_finishing",
    "intent": "luxury_finishing.general",
    "question": "هل يمكن تشطيب وحدة على الطوب؟",
    "answer": "نعم، يمكن دراسة الوحدة على الطوب ضمن نطاق كامل يبدأ من الأعمال الأساسية حتى التشطيب النهائي، لكن يلزم معرفة المساحة والحالة والمخططات أو الصور.",
    "required_followup": [],
    "tags": [
      "تشطيب",
      "على الطوب"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_020",
    "brand_id": "luxury_finishing",
    "intent": "luxury_finishing.general",
    "question": "هل يمكن تجديد شقة قائمة؟",
    "answer": "نعم، يمكن التعامل مع التجديد، لكن يجب توضيح هل المطلوب تغيير كامل أم تحسينات جزئية، وهل الوحدة مشغولة أم فارغة، وما البنود المطلوبة.",
    "required_followup": [],
    "tags": [
      "تجديد",
      "سكني"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_021",
    "brand_id": "luxury_finishing",
    "intent": "luxury_finishing.general",
    "question": "هل التشطيب الراقي يعني تكلفة مرتفعة دائمًا؟",
    "answer": "ليس بالضرورة. التشطيب الراقي يعني اختيار متزن للخامات والتفاصيل والتنفيذ، والتكلفة تحدد حسب النطاق والمستوى والمساحة وليس الاسم فقط.",
    "required_followup": [],
    "tags": [
      "تسعير",
      "توضيح"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_022",
    "brand_id": "luxury_finishing",
    "intent": "luxury_finishing.general",
    "question": "هل تقدمون تصميم داخلي فقط؟",
    "answer": "يمكن دراسة التصميم الداخلي كمسار مستقل أو مرتبط بالتنفيذ، لكن يجب تحديد هل المطلوب تصميم فقط أم تصميم وتنفيذ وتسليم.",
    "required_followup": [],
    "tags": [
      "تصميم داخلي",
      "نطاق"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_023",
    "brand_id": "luxury_finishing",
    "intent": "luxury_finishing.general",
    "question": "ما الفرق بين Luxury Finishing وBrand Identity؟",
    "answer": "Luxury Finishing مخصص للوحدات السكنية مثل الشقق والفيلات. Brand Identity مخصص للفروع والمساحات التجارية وتجربة العميل داخل النشاط التجاري.",
    "required_followup": [],
    "tags": [
      "توجيه",
      "فرق"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_024",
    "brand_id": "luxury_finishing",
    "intent": "luxury_finishing.general",
    "question": "متى يتحول الطلب إلى Luxury Finishing؟",
    "answer": "عند وجود طلب شقة، فيلا، تشطيب داخلي، تجديد وحدة، خامات سكنية، إضاءة، دهانات، أرضيات أو تصميم داخلي سكني.",
    "required_followup": [],
    "tags": [
      "توجيه"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_025",
    "brand_id": "uberfix",
    "intent": "uberfix.general",
    "question": "ما هو UberFix؟",
    "answer": "UberFix هو مسار الصيانة وإدارة المرافق داخل مجموعة العزب، يركز على تسجيل البلاغات ومتابعة الحالة وتوجيه الفنيين وتوثيق العطل والإصلاح.",
    "required_followup": [
      "ما نوع العطل؟"
    ],
    "tags": [
      "تعريف",
      "صيانة"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_026",
    "brand_id": "uberfix",
    "intent": "uberfix.general",
    "question": "كيف أسجل طلب صيانة؟",
    "answer": "لتسجيل طلب صيانة نحتاج نوع العطل، الموقع أو اسم الفرع، درجة الاستعجال، رقم التواصل، وصور للعطل إن وجدت. يمكن استخدام نموذج طلب الصيانة الرسمي عند الحاجة.",
    "required_followup": [
      "ما الموقع أو الفرع؟"
    ],
    "tags": [
      "تسجيل",
      "بلاغ"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_027",
    "brand_id": "uberfix",
    "intent": "uberfix.general",
    "question": "ما البيانات المطلوبة لبلاغ صيانة؟",
    "answer": "الحد الأدنى: نوع العطل، هل الطلب سكني أم تجاري، الموقع أو الفرع، صور إن وجدت، رقم طلب سابق إن وجد، درجة الاستعجال، ووسيلة التواصل.",
    "required_followup": [],
    "tags": [
      "بيانات",
      "صيانة"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_028",
    "brand_id": "uberfix",
    "intent": "uberfix.general",
    "question": "هل UberFix للسكني أم التجاري؟",
    "answer": "يخدم السكني والتجاري، لكن قوته الأساسية في إدارة صيانة الفروع والسلاسل التجارية حيث تكون المتابعة والتقارير والتوثيق مهمة جدًا.",
    "required_followup": [],
    "tags": [
      "سكني",
      "تجاري"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_029",
    "brand_id": "uberfix",
    "intent": "uberfix.general",
    "question": "هل يمكن متابعة طلب صيانة سابق؟",
    "answer": "نعم، يجب إرسال رقم الطلب إن وجد أو بيانات العميل والموقع ونوع العطل حتى يتم تحديد البلاغ ومتابعته.",
    "required_followup": [
      "هل لديك رقم طلب سابق؟"
    ],
    "tags": [
      "متابعة",
      "رقم طلب"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_030",
    "brand_id": "uberfix",
    "intent": "uberfix.general",
    "question": "ما المقصود بـ Facilities Management؟",
    "answer": "Facilities Management تعني إدارة المرافق والتشغيل والصيانة بطريقة منظمة تشمل استقبال البلاغ، التصنيف، التوجيه، التنفيذ، التوثيق، والإغلاق بتقرير.",
    "required_followup": [],
    "tags": [
      "تصنيف",
      "تشغيل"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_031",
    "brand_id": "uberfix",
    "intent": "uberfix.general",
    "question": "هل يمكن إرسال صور العطل؟",
    "answer": "نعم، الصور تساعد في فهم العطل وتصنيفه وتجهيز الفني أو الخامات المطلوبة قبل الزيارة.",
    "required_followup": [],
    "tags": [
      "صور",
      "بلاغ"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_032",
    "brand_id": "uberfix",
    "intent": "uberfix.general",
    "question": "متى يتحول الطلب إلى UberFix؟",
    "answer": "عند ظهور كلمات مثل صيانة، عطل، بلاغ، فني، رقم طلب، متابعة، فرع، تكييف، كهرباء، سباكة، أو صور العطل.",
    "required_followup": [],
    "tags": [
      "توجيه"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_033",
    "brand_id": "laban_alasfour",
    "intent": "laban_alasfour.general",
    "question": "ما هو Laban Alasfour؟",
    "answer": "Laban Alasfour هو مسار التوريدات والخامات والمنتجات المعمارية، خاصة المنتجات النادرة أو القطع التي يصعب الوصول إليها أو تحتاج بديلًا مناسبًا.",
    "required_followup": [
      "ما نوع المنتج أو الخامة المطلوبة؟"
    ],
    "tags": [
      "تعريف",
      "توريد"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_034",
    "brand_id": "laban_alasfour",
    "intent": "laban_alasfour.general",
    "question": "ما البيانات المطلوبة لطلب توريد؟",
    "answer": "نحتاج نوع المنتج أو الخامة، صورة أو كود أو مقاس، الكمية، هل المطلوب نفس المنتج أم بديل، هل الطلب لمشروع أو صيانة، وموعد الاحتياج.",
    "required_followup": [],
    "tags": [
      "بيانات",
      "توريد"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_035",
    "brand_id": "laban_alasfour",
    "intent": "laban_alasfour.general",
    "question": "هل يمكن البحث عن بديل لخامة أو قطعة؟",
    "answer": "نعم، بشرط وجود صورة أو مواصفات أو مقاس أو كود، مع توضيح هل المطلوب بديل مطابق أو بديل مناسب من حيث الوظيفة والتكلفة.",
    "required_followup": [],
    "tags": [
      "بدائل",
      "خامات"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_036",
    "brand_id": "laban_alasfour",
    "intent": "laban_alasfour.general",
    "question": "هل Laban Alasfour يخدم الصيانة؟",
    "answer": "نعم، يمكن أن يخدم طلبات الصيانة عند الحاجة إلى قطعة أو خامة أو بديل لإتمام الإصلاح، لكنه ليس مسار تسجيل البلاغ نفسه؛ البلاغ يذهب إلى UberFix.",
    "required_followup": [],
    "tags": [
      "صيانة",
      "توريد"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_037",
    "brand_id": "laban_alasfour",
    "intent": "laban_alasfour.general",
    "question": "هل يوجد دعم لملفات CAD أو GLB؟",
    "answer": "الرؤية المستقبلية تعتمد على تنظيم المنتجات بملفات JSON وGLB وCAD وصور متعددة لدعم AR/VR والتصميم الذكي، لكن تأكيد الملفات المتاحة يكون حسب المنتج الفعلي.",
    "required_followup": [],
    "tags": [
      "CAD",
      "GLB",
      "AR",
      "VR"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_038",
    "brand_id": "laban_alasfour",
    "intent": "laban_alasfour.general",
    "question": "هل يمكن تأكيد توفر المنتج من أول رسالة؟",
    "answer": "لا يتم تأكيد التوفر أو السعر النهائي قبل معرفة المواصفات والكمية والتحقق من المورد أو المخزون.",
    "required_followup": [],
    "tags": [
      "توافر",
      "تسعير"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_039",
    "brand_id": "laban_alasfour",
    "intent": "laban_alasfour.general",
    "question": "ما الفرق بين Laban Alasfour وLuxury Finishing؟",
    "answer": "Luxury Finishing ينفذ مسار تشطيب سكني، أما Laban Alasfour فيركز على توريد الخامات أو المنتجات أو البدائل التي قد تخدم التشطيب أو الصيانة أو المشاريع.",
    "required_followup": [],
    "tags": [
      "توجيه",
      "فرق"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_040",
    "brand_id": "laban_alasfour",
    "intent": "laban_alasfour.general",
    "question": "متى يتحول الطلب إلى Laban Alasfour؟",
    "answer": "عند وجود كلمات مثل خامة، توريد، قطعة، بديل، كود، مقاس، منتج، مورد، CAD، GLB، AR أو VR.",
    "required_followup": [],
    "tags": [
      "توجيه"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_041",
    "brand_id": "alazab_group",
    "intent": "alazab_group.general",
    "question": "هل البوت يقرر بدل الفريق؟",
    "answer": "لا. البوت يجمع البيانات ويوجه الطلب ويقدم إجابات من قاعدة المعرفة فقط. القرارات النهائية مثل السعر أو الموعد أو الالتزام القانوني تحتاج اعتماد الفريق المختص.",
    "required_followup": [],
    "tags": [
      "حوكمة",
      "بوت"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_042",
    "brand_id": "alazab_group",
    "intent": "alazab_group.general",
    "question": "ماذا يحدث عند نقص البيانات؟",
    "answer": "يطلب المساعد المعلومة الناقصة مباشرة بدل التخمين. الهدف تقليل الكلام العام وتحويل الطلب لبيانات قابلة للتنفيذ.",
    "required_followup": [],
    "tags": [
      "بيانات",
      "تشغيل"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_043",
    "brand_id": "uberfix",
    "intent": "uberfix.general",
    "question": "هل يمكن تصنيف الأعطال حسب الأولوية؟",
    "answer": "نعم، يتم سؤال العميل عن درجة الاستعجال وتحديد هل العطل طارئ أم عادي، لكن الأولوية التشغيلية النهائية تعتمد على تقييم الفريق.",
    "required_followup": [],
    "tags": [
      "أولوية",
      "صيانة"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_044",
    "brand_id": "brand_identity",
    "intent": "brand_identity.general",
    "question": "هل يمكن البدء من صور فقط؟",
    "answer": "يمكن استخدام الصور كبداية لفهم الحالة الحالية، لكن التصميم أو العرض يحتاج مساحة وموقع ونطاق خدمة واضح.",
    "required_followup": [],
    "tags": [
      "صور",
      "فرع"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_045",
    "brand_id": "luxury_finishing",
    "intent": "luxury_finishing.general",
    "question": "هل الصور تكفي لتقدير التشطيب؟",
    "answer": "الصور تساعد، لكنها لا تكفي وحدها لسعر نهائي. يجب معرفة المساحة وحالة الوحدة والنطاق والموقع وربما المعاينة.",
    "required_followup": [],
    "tags": [
      "صور",
      "تسعير"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_046",
    "brand_id": "laban_alasfour",
    "intent": "laban_alasfour.general",
    "question": "هل الكمية تؤثر على السعر؟",
    "answer": "نعم، الكمية والمواصفات وموعد الاحتياج ومكان التسليم كلها تؤثر على التكلفة والتوافر.",
    "required_followup": [],
    "tags": [
      "كمية",
      "تسعير"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_047",
    "brand_id": "alazab_group",
    "intent": "alazab_group.general",
    "question": "ما أسلوب الرد المعتمد؟",
    "answer": "الأسلوب المعتمد واضح ومباشر وراقي، بدون مبالغة، وبدون اختراع معلومات غير موجودة في قاعدة المعرفة.",
    "required_followup": [],
    "tags": [
      "أسلوب",
      "محادثة"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_048",
    "brand_id": "alazab_group",
    "intent": "alazab_group.general",
    "question": "هل يمكن استخدام المعرفة في MCP؟",
    "answer": "نعم، هذه الحزمة مصممة لتكون قناة معرفة قابلة للاستخدام عبر MCP، وتوفر أدوات بحث وتوجيه وقراءة مستندات وفهرس صوت وFAQ.",
    "required_followup": [],
    "tags": [
      "MCP",
      "تقني"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_049",
    "brand_id": "alazab_group",
    "intent": "alazab_group.general",
    "question": "هل يمكن استخدام المعرفة في Rasa؟",
    "answer": "نعم، توجد ملفات domain وFAQ وrouting تساعد Rasa، لكن أي نشر إنتاجي يحتاج تشغيل rasa data validate داخل مشروع Rasa الحقيقي.",
    "required_followup": [],
    "tags": [
      "Rasa",
      "تقني"
    ],
    "source": "content_upgrade_v2.1"
  },
  {
    "id": "faq_050",
    "brand_id": "alazab_group",
    "intent": "alazab_group.general",
    "question": "هل يمكن استخدام المعرفة في RAG؟",
    "answer": "نعم، ملفات ingestion وkb.corpus.json توفر مستندات وchunks قابلة للفهرسة والبحث، مع ضرورة إعادة التوليد عند تحديث المحتوى.",
    "required_followup": [],
    "tags": [
      "RAG",
      "تقني"
    ],
    "source": "content_upgrade_v2.1"
  }
];

export default alazabFaq;
