// أنواع حاسبة التكلفة التقديرية - مشروعات العزب
export type ProjectCategory = "residential" | "commercial";

export type CommercialSubtype =
  | "shop"
  | "restaurant"
  | "cafe"
  | "pharmacy"
  | "clinic"
  | "office"
  | "chain_branch"
  | "facade"
  | "full_setup"
  | "renovation_branch";

export type ResidentialSubtype =
  | "apartment"
  | "villa"
  | "duplex"
  | "penthouse"
  | "renovation_unit"
  | "new_finish";

export type ProjectSubtype = CommercialSubtype | ResidentialSubtype;

export type CurrentCondition =
  | "bricks"      // على الطوب
  | "half_finish" // نصف تشطيب
  | "finished"    // تشطيب قائم
  | "needs_renew" // يحتاج تجديد
  | "new_project";// مشروع جديد

export type ScopeOfWork =
  | "design_only"
  | "execution_only"
  | "design_execution"
  | "inspection_estimate"
  | "maintenance_renovation";

export type LocationKey =
  | "cairo_giza"
  | "new_cities"
  | "coast"
  | "governorates";

export type CommercialFinishLevel =
  | "economy"
  | "standard"
  | "luxury"
  | "brand_pro"
  | "chain_repeatable";

export type ResidentialFinishLevel =
  | "economy"
  | "medium"
  | "high"
  | "luxury"
  | "ultra_luxury";

export type FinishLevel = CommercialFinishLevel | ResidentialFinishLevel;

export type ClientType = "individual" | "company" | "chain";

export interface ScopeItem {
  id: string;
  label: string;
  weight: number; // وزن إضافي على التكلفة الأساسية
  enabled: boolean;
}

export interface Step1Data {
  category: ProjectCategory | null;
  subtype: ProjectSubtype | null;
  area: number;
  floors: number;
  location: LocationKey | null;
  condition: CurrentCondition | null;
  scope: ScopeOfWork | null;
}

export interface Step2Data {
  finishLevel: FinishLevel | null;
  items: ScopeItem[];
  managementPct: number;   // 5..10
  contingencyPct: number;  // 7..15
}

export interface Step3ContactData {
  name: string;
  phone: string;
  clientType: ClientType;
  projectName: string;
  city: string;
  notes: string;
}

export interface CostBreakdown {
  materials: number;
  labor: number;
  finishing: number;
  management: number;
  contingency: number;
  subtotal: number;
  total: number;
  perMeter: number;
  rangeMin: number;
  rangeMax: number;
  accuracy: "low" | "medium" | "high";
  accuracyLabel: string;
}
