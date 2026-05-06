import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
import {
  Building2,
  Calculator,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Home,
  Info,
  MapPin,
  MessageCircle,
  Phone,
  RotateCcw,
  Send,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { calculateCost, formatEGP } from "@/lib/costCalculator";
import {
  COMMERCIAL_FINISH_LABELS,
  COMMERCIAL_SCOPE_ITEMS,
  COMMERCIAL_SUBTYPE_LABELS,
  CONDITION_LABELS,
  LOCATION_LABELS,
  RESIDENTIAL_FINISH_LABELS,
  RESIDENTIAL_SCOPE_ITEMS,
  RESIDENTIAL_SUBTYPE_LABELS,
  SCOPE_LABELS,
} from "@/data/costCalculatorData";
import {
  CALCULATOR_FAQ,
  CONDITION_NOTES,
  FIELD_TOOLTIPS,
  FINISH_NOTES,
  LOCATION_NOTES,
  SCOPE_RECOMMENDATIONS,
  SUBTYPE_NOTES,
  generateSmartInsights,
} from "@/data/costCalculatorKnowledge";
import type {
  CommercialFinishLevel,
  ResidentialFinishLevel,
  ScopeItem,
  Step1Data,
  Step2Data,
  Step3ContactData,
} from "@/types/costCalculator";
import { supabase } from "@/integrations/supabase/client";

const initialStep1: Step1Data = {
  category: null,
  subtype: null,
  area: 100,
  floors: 1,
  location: null,
  condition: null,
  scope: null,
};

const initialStep2: Step2Data = {
  finishLevel: null,
  items: [],
  managementPct: 8,
  contingencyPct: 10,
};

const initialContact: Step3ContactData = {
  name: "",
  phone: "",
  clientType: "individual",
  projectName: "",
  city: "",
  notes: "",
};

const STEPS = [
  { n: 1, label: "بيانات المشروع" },
  { n: 2, label: "نطاق الأعمال" },
  { n: 3, label: "النتيجة الذكية" },
  { n: 4, label: "طلب عرض السعر" },
];

// زر معلومات صغير مع Tooltip بدلًا من Popover (يفتح في الاتجاه الصحيح بفضل DirectionProvider)
function InfoHint({ text }: { text: string }) {
  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
          aria-label="معلومات"
        >
          <Info className="w-3 h-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-right leading-relaxed">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

export default function CostCalculator() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [s1, setS1] = useState<Step1Data>(initialStep1);
  const [s2, setS2] = useState<Step2Data>(initialStep2);
  const [contact, setContact] = useState<Step3ContactData>(initialContact);
  const [submitting, setSubmitting] = useState(false);

  // ربط ثنائي مع البوت: استقبال parameters من URL
  useEffect(() => {
    const cat = searchParams.get("category");
    const sub = searchParams.get("subtype");
    const area = searchParams.get("area");
    const loc = searchParams.get("location");
    if (cat === "commercial" || cat === "residential") {
      setS1((p) => ({
        ...p,
        category: cat,
        subtype: (sub as Step1Data["subtype"]) || p.subtype,
        area: area ? Number(area) : p.area,
        location: (loc as Step1Data["location"]) || p.location,
      }));
    }
  }, [searchParams]);

  const subtypeOptions = s1.category === "commercial"
    ? Object.entries(COMMERCIAL_SUBTYPE_LABELS)
    : s1.category === "residential"
      ? Object.entries(RESIDENTIAL_SUBTYPE_LABELS)
      : [];

  const finishOptions = s1.category === "commercial"
    ? Object.entries(COMMERCIAL_FINISH_LABELS)
    : Object.entries(RESIDENTIAL_FINISH_LABELS);

  const scopeItemsTemplate = s1.category === "commercial"
    ? COMMERCIAL_SCOPE_ITEMS
    : RESIDENTIAL_SCOPE_ITEMS;

  // مزامنة البنود مع الفئة المختارة
  useEffect(() => {
    if (!s1.category) return;
    setS2((prev) => ({
      ...prev,
      items: scopeItemsTemplate.map<ScopeItem>((it) => ({ ...it, enabled: false })),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s1.category]);

  const breakdown = useMemo(() => calculateCost({ step1: s1, step2: s2 }), [s1, s2]);

  const insights = useMemo(() => {
    if (!breakdown) return [];
    return generateSmartInsights({
      category: s1.category,
      subtype: s1.subtype,
      area: s1.area,
      finishLevel: s2.finishLevel,
      enabledItemsCount: s2.items.filter((i) => i.enabled).length,
      totalItemsCount: s2.items.length,
      total: breakdown.total,
      perMeter: breakdown.perMeter,
    });
  }, [s1, s2, breakdown]);

  const canNext1 =
    !!s1.category && !!s1.subtype && s1.area > 0 && !!s1.location && !!s1.condition && !!s1.scope;
  const canNext2 = !!s2.finishLevel;

  const reset = () => {
    setS1(initialStep1);
    setS2(initialStep2);
    setContact(initialContact);
    setStep(1);
  };

  const submitQuote = async () => {
    if (!contact.name || !contact.phone) {
      toast({ title: "بيانات ناقصة", description: "من فضلك أدخل الاسم ورقم الهاتف", variant: "destructive" });
      return;
    }
    if (!breakdown) return;
    setSubmitting(true);
    try {
      const payload = {
        client_name: contact.name,
        client_phone: contact.phone,
        client_type: contact.clientType,
        project_name: contact.projectName,
        city: contact.city,
        notes: contact.notes,
        category: s1.category,
        subtype: s1.subtype,
        area: s1.area,
        floors: s1.floors,
        location: s1.location,
        condition: s1.condition,
        scope: s1.scope,
        finish_level: s2.finishLevel,
        enabled_items: s2.items.filter((i) => i.enabled).map((i) => i.id),
        management_pct: s2.managementPct,
        contingency_pct: s2.contingencyPct,
        estimated_total: breakdown.total,
        per_meter: breakdown.perMeter,
        range_min: breakdown.rangeMin,
        range_max: breakdown.rangeMax,
        accuracy: breakdown.accuracy,
      };
      await supabase.from("cost_estimate_requests").insert(payload);
      toast({
        title: "تم إرسال طلبك بنجاح",
        description: "سيتواصل معك فريق العزب قريبًا لتحديد المعاينة وتقديم عرض دقيق.",
      });
    } catch {
      toast({
        title: "تم استلام طلبك",
        description: "للتواصل المباشر استخدم زر واتساب أدناه.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ربط مع البوت: تمرير ملخص الحاسبة لـ AzaBot
  const sendToBot = () => {
    if (!breakdown) return;
    const summary = `أريد متابعة طلبي عبر حاسبة التكلفة:\n- النوع: ${s1.category === "commercial" ? "تجاري" : "سكني"}\n- المساحة: ${s1.area} م²\n- التقدير: ${formatEGP(breakdown.total)}\n- الموقع: ${s1.location ? LOCATION_LABELS[s1.location] : "-"}`;
    sessionStorage.setItem("azabot_prefill", summary);
    sessionStorage.setItem("azabot_open", "1");
    window.dispatchEvent(new CustomEvent("azabot:open", { detail: { prefill: summary } }));
    toast({ title: "تم تحويل بياناتك للبوت", description: "سيفتح المساعد الذكي بالبيانات جاهزة." });
  };

  const wa = breakdown
    ? `https://wa.me/201004006620?text=${encodeURIComponent(
        `طلب عرض سعر دقيق من حاسبة التكلفة\nالاسم: ${contact.name}\nالهاتف: ${contact.phone}\nالمشروع: ${contact.projectName || "-"}\nالنوع: ${s1.category === "commercial" ? "تجاري" : "سكني"}\nالمساحة: ${s1.area} م²\nالتقدير الأولي: ${formatEGP(breakdown.total)}`,
      )}`
    : "https://wa.me/201004006620";

  return (
    <TooltipProvider>
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Helmet>
        <title>حاسبة التكلفة الذكية | العزب للمقاولات</title>
        <meta
          name="description"
          content="نظام تقدير ذكي لتكلفة المشاريع السكنية والتجارية في 4 خطوات مع توصيات احترافية ومعاينة مجانية."
        />
        <link rel="canonical" href="https://azab.services/cost-calculator" />
      </Helmet>

      <Header />

      <main className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-bold mb-4">
            <Calculator className="w-4 h-4" />
            حاسبة التكلفة الذكية
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-construction-primary mb-3">
            احسب تكلفة مشروعك في 4 خطوات
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            نظام تقدير ذكي مبني على قواعد المعرفة الفعلية لشركة العزب — يغطي السكني والتجاري ويعطيك توصيات مهنية مخصصة.
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-1 md:gap-3 mb-10 flex-wrap">
          {STEPS.map((st, i) => {
            const active = step === st.n;
            const done = step > st.n;
            return (
              <React.Fragment key={st.n}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-colors ${
                      done
                        ? "bg-amber-400 border-amber-400 text-construction-primary"
                        : active
                          ? "bg-construction-primary border-construction-primary text-white"
                          : "bg-background border-muted-foreground/30 text-muted-foreground"
                    }`}
                  >
                    {done ? <CheckCircle2 className="w-5 h-5" /> : st.n}
                  </div>
                  <span className={`text-xs md:text-sm mt-2 ${active ? "font-bold text-construction-primary" : "text-muted-foreground"}`}>
                    {st.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 w-6 md:w-16 ${step > st.n ? "bg-amber-400" : "bg-muted"}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-[1fr,320px] gap-6">
          <div>
        {/* STEP 1 */}
        {step === 1 && (
          <div className="bg-card border rounded-2xl shadow-sm p-6 md:p-8 space-y-6">
            <h2 className="text-xl font-bold text-construction-primary">بيانات المشروع الأساسية</h2>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label>نوع المشروع</Label>
                <InfoHint text={FIELD_TOOLTIPS.category} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { v: "residential", icon: Home, label: "سكني" },
                  { v: "commercial", icon: Building2, label: "تجاري" },
                ].map(({ v, icon: Icon, label }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setS1((p) => ({ ...p, category: v as Step1Data["category"], subtype: null }))}
                    className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                      s1.category === v
                        ? "border-amber-400 bg-amber-50"
                        : "border-border hover:border-amber-300"
                    }`}
                  >
                    <Icon className="w-6 h-6 text-construction-primary" />
                    <span className="font-bold">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {s1.category && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label>نوع الوحدة</Label>
                    <InfoHint text={FIELD_TOOLTIPS.subtype} />
                  </div>
                  <Select
                    value={s1.subtype || ""}
                    onValueChange={(v) => setS1((p) => ({ ...p, subtype: v as Step1Data["subtype"] }))}
                  >
                    <SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                    <SelectContent>
                      {subtypeOptions.map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {s1.subtype && SUBTYPE_NOTES[s1.subtype] && (
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{SUBTYPE_NOTES[s1.subtype]}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label>المساحة (م²)</Label>
                    <InfoHint text={FIELD_TOOLTIPS.area} />
                  </div>
                  <Input
                    type="number"
                    min={1}
                    value={s1.area}
                    onChange={(e) => setS1((p) => ({ ...p, area: Number(e.target.value) || 0 }))}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label>عدد الأدوار</Label>
                    <InfoHint text={FIELD_TOOLTIPS.floors} />
                  </div>
                  <Select
                    value={String(s1.floors)}
                    onValueChange={(v) => setS1((p) => ({ ...p, floors: Number(v) }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label>الموقع</Label>
                    <InfoHint text={FIELD_TOOLTIPS.location} />
                  </div>
                  <Select
                    value={s1.location || ""}
                    onValueChange={(v) => setS1((p) => ({ ...p, location: v as Step1Data["location"] }))}
                  >
                    <SelectTrigger><SelectValue placeholder="اختر الموقع" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(LOCATION_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {s1.location && (
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{LOCATION_NOTES[s1.location]}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label>الحالة الحالية</Label>
                    <InfoHint text={FIELD_TOOLTIPS.condition} />
                  </div>
                  <Select
                    value={s1.condition || ""}
                    onValueChange={(v) => setS1((p) => ({ ...p, condition: v as Step1Data["condition"] }))}
                  >
                    <SelectTrigger><SelectValue placeholder="اختر الحالة" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CONDITION_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {s1.condition && (
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{CONDITION_NOTES[s1.condition]}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label>المطلوب</Label>
                    <InfoHint text={FIELD_TOOLTIPS.scope} />
                  </div>
                  <Select
                    value={s1.scope || ""}
                    onValueChange={(v) => setS1((p) => ({ ...p, scope: v as Step1Data["scope"] }))}
                  >
                    <SelectTrigger><SelectValue placeholder="اختر النطاق" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(SCOPE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {s1.scope && (
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{SCOPE_RECOMMENDATIONS[s1.scope]}</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={reset}><RotateCcw className="w-4 h-4 ml-2" />إعادة</Button>
              <Button disabled={!canNext1} onClick={() => setStep(2)} className="bg-construction-primary">
                التالي <ChevronLeft className="w-4 h-4 mr-2" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="bg-card border rounded-2xl shadow-sm p-6 md:p-8 space-y-6">
            <h2 className="text-xl font-bold text-construction-primary">مستوى التشطيب ونطاق الأعمال</h2>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label>مستوى التشطيب</Label>
                <InfoHint text={FIELD_TOOLTIPS.finishLevel} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {finishOptions.map(([k, v]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setS2((p) => ({ ...p, finishLevel: k as CommercialFinishLevel | ResidentialFinishLevel }))}
                    className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${
                      s2.finishLevel === k
                        ? "border-amber-400 bg-amber-50 text-construction-primary"
                        : "border-border hover:border-amber-300"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              {s2.finishLevel && FINISH_NOTES[s2.finishLevel] && (
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed bg-amber-50/50 border border-amber-200 rounded-lg p-3">
                  💡 {FINISH_NOTES[s2.finishLevel]}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Label>بنود الأعمال (فعّل ما يناسب مشروعك)</Label>
                <InfoHint text={FIELD_TOOLTIPS.scopeItems} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {s2.items.map((it) => (
                  <label
                    key={it.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      it.enabled ? "border-amber-400 bg-amber-50/50" : "border-border"
                    }`}
                  >
                    <span className="text-sm font-medium">{it.label}</span>
                    <Switch
                      checked={it.enabled}
                      onCheckedChange={(checked) =>
                        setS2((p) => ({
                          ...p,
                          items: p.items.map((x) => (x.id === it.id ? { ...x, enabled: checked } : x)),
                        }))
                      }
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Label>نسبة الإدارة والإشراف</Label>
                    <InfoHint text={FIELD_TOOLTIPS.managementPct} />
                  </div>
                  <Badge variant="secondary">{s2.managementPct}%</Badge>
                </div>
                <Slider
                  min={5} max={10} step={1}
                  value={[s2.managementPct]}
                  onValueChange={([v]) => setS2((p) => ({ ...p, managementPct: v }))}
                />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Label>هامش احتياطي</Label>
                    <InfoHint text={FIELD_TOOLTIPS.contingencyPct} />
                  </div>
                  <Badge variant="secondary">{s2.contingencyPct}%</Badge>
                </div>
                <Slider
                  min={7} max={15} step={1}
                  value={[s2.contingencyPct]}
                  onValueChange={([v]) => setS2((p) => ({ ...p, contingencyPct: v }))}
                />
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronRight className="w-4 h-4 ml-2" />السابق
              </Button>
              <Button disabled={!canNext2} onClick={() => setStep(3)} className="bg-construction-primary">
                عرض النتيجة <ChevronLeft className="w-4 h-4 mr-2" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 - النتيجة + الملخص الذكي */}
        {step === 3 && breakdown && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-2 border-amber-300 rounded-2xl p-6">
              <div className="text-sm text-amber-800 font-bold mb-2">إجمالي التكلفة التقديرية</div>
              <div className="text-3xl md:text-4xl font-extrabold text-construction-primary">
                {formatEGP(breakdown.total)}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                التكلفة لكل متر مربع: <span className="font-bold text-construction-primary">{formatEGP(breakdown.perMeter)}</span>
              </div>
            </div>

            <div className="bg-card border rounded-2xl p-6">
              <h3 className="font-bold mb-4">تفصيل التكلفة</h3>
              <div className="space-y-2 text-sm">
                <Row label="المواد" value={formatEGP(breakdown.materials)} />
                <Row label="العمالة" value={formatEGP(breakdown.labor)} />
                <Row label="التشطيبات" value={formatEGP(breakdown.finishing)} />
                <Row label={`الإدارة والإشراف (${s2.managementPct}%)`} value={formatEGP(breakdown.management)} />
                <Row label={`هامش احتياطي (${s2.contingencyPct}%)`} value={formatEGP(breakdown.contingency)} />
                <div className="border-t pt-2 mt-2 font-bold">
                  <Row label="الإجمالي" value={formatEGP(breakdown.total)} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border rounded-2xl p-5">
                <div className="text-xs text-muted-foreground mb-1">مدى السعر التقديري</div>
                <div className="font-bold text-construction-primary text-sm">
                  {formatEGP(breakdown.rangeMin)}<br/>إلى {formatEGP(breakdown.rangeMax)}
                </div>
              </div>
              <div className="bg-card border rounded-2xl p-5">
                <div className="text-xs text-muted-foreground mb-1">درجة دقة التقدير</div>
                <Badge className={
                  breakdown.accuracy === "high" ? "bg-green-500" :
                  breakdown.accuracy === "medium" ? "bg-amber-500" : "bg-red-500"
                }>
                  {breakdown.accuracyLabel}
                </Badge>
              </div>
            </div>

            {/* الملخص الذكي */}
            {insights.length > 0 && (
              <div className="bg-card border-2 border-construction-primary/20 rounded-2xl p-6">
                <h3 className="font-bold text-construction-primary mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  ملخص ذكي وتوصيات
                </h3>
                <ul className="space-y-2 text-sm">
                  {insights.map((tip, i) => (
                    <li key={i} className="leading-relaxed text-muted-foreground">{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                <ChevronRight className="w-4 h-4 ml-2" />تعديل البيانات
              </Button>
              <Button onClick={sendToBot} variant="outline" className="flex-1 border-construction-primary text-construction-primary">
                <MessageCircle className="w-4 h-4 ml-2" />
                متابعة عبر AzaBot
              </Button>
              <Button onClick={() => setStep(4)} className="flex-1 bg-construction-primary">
                طلب عرض دقيق <ChevronLeft className="w-4 h-4 mr-2" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4 - نموذج التواصل */}
        {step === 4 && breakdown && (
          <div className="bg-card border rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-lg text-construction-primary">احصل على عرض سعر دقيق</h3>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
              <span className="font-bold">تقديرك: {formatEGP(breakdown.total)}</span> · {s1.area} م² · {s1.category === "commercial" ? "تجاري" : "سكني"}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block">الاسم *</Label>
                <Input value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
              </div>
              <div>
                <Label className="mb-1 block">رقم الهاتف *</Label>
                <Input
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  placeholder="01xxxxxxxxx"
                />
              </div>
              <div>
                <Label className="mb-1 block">نوع العميل</Label>
                <Select
                  value={contact.clientType}
                  onValueChange={(v) => setContact({ ...contact, clientType: v as Step3ContactData["clientType"] })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">فرد</SelectItem>
                    <SelectItem value="company">شركة</SelectItem>
                    <SelectItem value="chain">سلسلة تجارية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1 block">المدينة</Label>
                <Input value={contact.city} onChange={(e) => setContact({ ...contact, city: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label className="mb-1 block">اسم المشروع</Label>
                <Input value={contact.projectName} onChange={(e) => setContact({ ...contact, projectName: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label className="mb-1 block">ملاحظات</Label>
                <Textarea
                  value={contact.notes}
                  onChange={(e) => setContact({ ...contact, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button onClick={submitQuote} disabled={submitting} className="flex-1 bg-construction-primary">
                <Send className="w-4 h-4 ml-2" />
                {submitting ? "جاري الإرسال..." : "إرسال الطلب"}
              </Button>
              <a href={wa} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button type="button" variant="outline" className="w-full border-green-500 text-green-700 hover:bg-green-50">
                  <Phone className="w-4 h-4 ml-2" /> واتساب
                </Button>
              </a>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" size="sm" onClick={() => setStep(3)}>
                <ChevronRight className="w-4 h-4 ml-1" />رجوع للنتيجة
              </Button>
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw className="w-4 h-4 ml-1" />تقدير جديد
              </Button>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 flex gap-2">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span>نقدم خصومات وضمانات على الأعمال + هدايا حسب نطاق المشروع. اطلب التفاصيل من فريق المبيعات.</span>
            </div>
          </div>
        )}
          </div>

          {/* Sidebar - FAQ */}
          <aside className="space-y-4">
            <div className="bg-card border rounded-2xl p-5 sticky top-4">
              <h3 className="font-bold text-construction-primary mb-3 flex items-center gap-2">
                <Info className="w-5 h-5" />
                أسئلة شائعة
              </h3>
              <Accordion type="single" collapsible className="w-full">
                {CALCULATOR_FAQ.map((f, i) => (
                  <AccordionItem key={i} value={`item-${i}`}>
                    <AccordionTrigger className="text-sm text-right hover:no-underline">{f.q}</AccordionTrigger>
                    <AccordionContent className="text-xs text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <div className="border-t mt-4 pt-4">
                <p className="text-xs text-muted-foreground mb-3">محتاج مساعدة فورية؟</p>
                <Button onClick={sendToBot} variant="outline" size="sm" className="w-full">
                  <MessageCircle className="w-4 h-4 ml-2" />
                  اسأل AzaBot
                </Button>
                <Link to="/maintenance-services" className="block text-center text-xs text-construction-primary hover:underline mt-3">
                  استكشف خدماتنا التفصيلية ←
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
    </TooltipProvider>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
