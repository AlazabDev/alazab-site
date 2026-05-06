// منطق حساب التكلفة التقديرية
import {
  COMMERCIAL_BASE_PRICE,
  CONDITION_MULTIPLIER,
  COST_SPLIT,
  LOCATION_MULTIPLIER,
  RESIDENTIAL_BASE_PRICE,
  SCOPE_MULTIPLIER,
  SUBTYPE_MULTIPLIER,
  floorsMultiplier,
} from "@/data/costCalculatorData";
import type {
  CommercialFinishLevel,
  CostBreakdown,
  ResidentialFinishLevel,
  Step1Data,
  Step2Data,
} from "@/types/costCalculator";

export interface CalcInput {
  step1: Step1Data;
  step2: Step2Data;
  discountPct?: number; // خصومات اختيارية
}

export function calculateCost({ step1, step2, discountPct = 0 }: CalcInput): CostBreakdown | null {
  const { category, subtype, area, floors, location, condition, scope } = step1;
  const { finishLevel, items, managementPct, contingencyPct } = step2;

  if (!category || !subtype || !location || !condition || !scope || !finishLevel || area <= 0) {
    return null;
  }

  const basePrice =
    category === "commercial"
      ? COMMERCIAL_BASE_PRICE[finishLevel as CommercialFinishLevel] ?? 9500
      : RESIDENTIAL_BASE_PRICE[finishLevel as ResidentialFinishLevel] ?? 7000;

  const subtypeMult = SUBTYPE_MULTIPLIER[subtype] ?? 1;
  const conditionMult = CONDITION_MULTIPLIER[condition] ?? 1;
  const locationMult = LOCATION_MULTIPLIER[location] ?? 1;
  const floorsMult = floorsMultiplier(floors);
  const scopeMult = SCOPE_MULTIPLIER[scope] ?? 1;

  // وزن البنود المُفعّلة (مجموع الأوزان كنسبة إضافية)
  const itemsWeight = items.filter((i) => i.enabled).reduce((s, i) => s + i.weight, 0);
  const itemsMult = 1 + itemsWeight;

  const baseCost =
    area * basePrice * subtypeMult * conditionMult * locationMult * floorsMult * scopeMult * itemsMult;

  const materials = baseCost * COST_SPLIT.materials;
  const labor = baseCost * COST_SPLIT.labor;
  const finishing = baseCost * COST_SPLIT.finishing;
  const subtotal = materials + labor + finishing;

  const management = subtotal * (managementPct / 100);
  const contingency = subtotal * (contingencyPct / 100);
  const beforeDiscount = subtotal + management + contingency;
  const total = beforeDiscount * (1 - discountPct / 100);

  // مدى السعر ±12%
  const rangeMin = Math.round(total * 0.88);
  const rangeMax = Math.round(total * 1.12);

  // درجة الدقة
  const enabledCount = items.filter((i) => i.enabled).length;
  let accuracy: CostBreakdown["accuracy"] = "low";
  if (enabledCount >= 8) accuracy = "high";
  else if (enabledCount >= 4) accuracy = "medium";

  const accuracyLabel =
    accuracy === "high" ? "عالية" : accuracy === "medium" ? "متوسطة" : "منخفضة";

  return {
    materials: Math.round(materials),
    labor: Math.round(labor),
    finishing: Math.round(finishing),
    management: Math.round(management),
    contingency: Math.round(contingency),
    subtotal: Math.round(subtotal),
    total: Math.round(total),
    perMeter: Math.round(total / Math.max(area, 1)),
    rangeMin,
    rangeMax,
    accuracy,
    accuracyLabel,
  };
}

export function formatEGP(value: number): string {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(value);
}
