// بيانات حاسبة التكلفة - يمكن تعديلها بسهولة
import type {
  CommercialFinishLevel,
  CommercialSubtype,
  CurrentCondition,
  LocationKey,
  ProjectSubtype,
  ResidentialFinishLevel,
  ResidentialSubtype,
  ScopeItem,
  ScopeOfWork,
} from "@/types/costCalculator";

// أسعار المتر الأساسية (جنيه مصري) - تجاري
export const COMMERCIAL_BASE_PRICE: Record<CommercialFinishLevel, number> = {
  economy: 6500,
  standard: 9500,
  luxury: 13000,
  brand_pro: 16000,
  chain_repeatable: 14000,
};

// أسعار المتر الأساسية (جنيه مصري) - سكني
export const RESIDENTIAL_BASE_PRICE: Record<ResidentialFinishLevel, number> = {
  economy: 4500,
  medium: 7000,
  high: 10000,
  luxury: 14000,
  ultra_luxury: 16000,
};

// مضاعفات نوع المشروع
export const SUBTYPE_MULTIPLIER: Record<ProjectSubtype, number> = {
  // تجاري
  shop: 1.2,
  restaurant: 1.35,
  cafe: 1.35,
  pharmacy: 1.25,
  clinic: 1.25,
  office: 1.1,
  chain_branch: 1.2,
  facade: 1.15,
  full_setup: 1.3,
  renovation_branch: 1.1,
  // سكني
  apartment: 1.0,
  villa: 1.3,
  duplex: 1.2,
  penthouse: 1.25,
  renovation_unit: 0.9,
  new_finish: 1.0,
};

export const CONDITION_MULTIPLIER: Record<CurrentCondition, number> = {
  bricks: 1.25,
  half_finish: 1.0,
  finished: 0.75,
  needs_renew: 0.55,
  new_project: 1.1,
};

export const LOCATION_MULTIPLIER: Record<LocationKey, number> = {
  cairo_giza: 1.0,
  new_cities: 1.08,
  coast: 1.2,
  governorates: 0.95,
};

export const SCOPE_MULTIPLIER: Record<ScopeOfWork, number> = {
  design_only: 0.15,
  execution_only: 1.0,
  design_execution: 1.1,
  inspection_estimate: 0.05,
  maintenance_renovation: 0.6,
};

export function floorsMultiplier(floors: number): number {
  if (floors <= 1) return 1.0;
  if (floors === 2) return 1.1;
  return 1.18;
}

// نسب التقسيم الافتراضية للتفصيل
export const COST_SPLIT = {
  materials: 0.45,
  labor: 0.35,
  finishing: 0.2,
};

// بنود نطاق العمل - تجاري
export const COMMERCIAL_SCOPE_ITEMS: Omit<ScopeItem, "enabled">[] = [
  { id: "civil", label: "أعمال مدنية", weight: 0.08 },
  { id: "electrical", label: "كهرباء", weight: 0.06 },
  { id: "plumbing", label: "سباكة", weight: 0.05 },
  { id: "hvac", label: "تكييف", weight: 0.07 },
  { id: "lighting", label: "إضاءة", weight: 0.04 },
  { id: "flooring", label: "أرضيات", weight: 0.06 },
  { id: "paint", label: "دهانات", weight: 0.04 },
  { id: "facade", label: "واجهة", weight: 0.07 },
  { id: "signage", label: "لافتة", weight: 0.03 },
  { id: "display", label: "وحدات عرض", weight: 0.05 },
  { id: "counter", label: "كاونتر", weight: 0.04 },
  { id: "operation", label: "تجهيزات تشغيل", weight: 0.06 },
  { id: "cctv", label: "كاميرات وشبكات", weight: 0.03 },
  { id: "decor", label: "أعمال ديكور", weight: 0.05 },
  { id: "metal_wood", label: "أعمال معدنية / خشبية", weight: 0.05 },
  { id: "branding", label: "Branding داخل المكان", weight: 0.04 },
];

// بنود نطاق العمل - سكني
export const RESIDENTIAL_SCOPE_ITEMS: Omit<ScopeItem, "enabled">[] = [
  { id: "electrical", label: "كهرباء", weight: 0.06 },
  { id: "plumbing", label: "سباكة", weight: 0.05 },
  { id: "plaster", label: "محارة", weight: 0.05 },
  { id: "gypsum", label: "جبس بورد", weight: 0.04 },
  { id: "flooring", label: "أرضيات", weight: 0.07 },
  { id: "paint", label: "دهانات", weight: 0.04 },
  { id: "doors", label: "أبواب", weight: 0.04 },
  { id: "carpentry", label: "نجارة", weight: 0.05 },
  { id: "kitchen", label: "مطبخ", weight: 0.06 },
  { id: "bathrooms", label: "حمامات", weight: 0.06 },
  { id: "lighting", label: "إضاءة", weight: 0.03 },
  { id: "hvac", label: "تكييف", weight: 0.05 },
  { id: "marble", label: "رخام / بورسلان", weight: 0.05 },
  { id: "interior", label: "تصميم داخلي", weight: 0.04 },
  { id: "furniture", label: "فرش اختياري", weight: 0.06 },
  { id: "supervision", label: "إدارة تنفيذ", weight: 0.03 },
];

// تسميات للعرض
export const COMMERCIAL_SUBTYPE_LABELS: Record<CommercialSubtype, string> = {
  shop: "محل",
  restaurant: "مطعم",
  cafe: "كافيه",
  pharmacy: "صيدلية",
  clinic: "عيادة",
  office: "مكتب",
  chain_branch: "فرع سلسلة تجارية",
  facade: "واجهة تجارية",
  full_setup: "تجهيز تجاري كامل",
  renovation_branch: "تجديد فرع قائم",
};

export const RESIDENTIAL_SUBTYPE_LABELS: Record<ResidentialSubtype, string> = {
  apartment: "شقة",
  villa: "فيلا",
  duplex: "دوبلكس",
  penthouse: "بنتهاوس",
  renovation_unit: "تجديد وحدة قائمة",
  new_finish: "تشطيب وحدة جديدة",
};

export const CONDITION_LABELS: Record<CurrentCondition, string> = {
  bricks: "على الطوب",
  half_finish: "نصف تشطيب",
  finished: "تشطيب قائم",
  needs_renew: "يحتاج تجديد",
  new_project: "مشروع جديد",
};

export const SCOPE_LABELS: Record<ScopeOfWork, string> = {
  design_only: "تصميم فقط",
  execution_only: "تنفيذ فقط",
  design_execution: "تصميم وتنفيذ",
  inspection_estimate: "معاينة وتقدير",
  maintenance_renovation: "صيانة / تجديد",
};

export const LOCATION_LABELS: Record<LocationKey, string> = {
  cairo_giza: "القاهرة / الجيزة",
  new_cities: "المدن الجديدة",
  coast: "الساحل / العين السخنة",
  governorates: "المحافظات",
};

export const COMMERCIAL_FINISH_LABELS: Record<CommercialFinishLevel, string> = {
  economy: "اقتصادي",
  standard: "قياسي",
  luxury: "فاخر",
  brand_pro: "براند احترافي",
  chain_repeatable: "سلسلة فروع قابل للتكرار",
};

export const RESIDENTIAL_FINISH_LABELS: Record<ResidentialFinishLevel, string> = {
  economy: "اقتصادي",
  medium: "متوسط",
  high: "راقٍ",
  luxury: "فاخر",
  ultra_luxury: "فاخر جدًا",
};
