// نظام حساب التكاليف المتقدم
export interface CostItem {
  id: string
  name: string
  nameAr: string
  category: string
  unit: string
  unitAr: string
  quantity: number
  unitPrice: number
  totalPrice?: number
}

export interface CostBreakdown {
  materials: number
  labor: number
  finishing: number
  additionalCosts: number
  subtotal: number
  taxRate: number
  tax: number
  total: number
  costPerMeter?: number
}

export interface ProjectEstimate {
  id: string
  title: string
  titleAr: string
  projectType: "residential" | "commercial" | "industrial" | "renovation" | "retail"
  area: number
  location: string
  finishingType: "basic" | "standard" | "luxury" | "premium"
  items: CostItem[]
  breakdown: CostBreakdown
  notes?: string
  notesAr?: string
  createdAt: Date
  updatedAt: Date
}

// أسعار المواد الأساسية
export const MATERIAL_PRICES: Record<string, Record<string, number>> = {
  flooring: {
    tiles: 150,
    wood: 200,
    marble: 350,
    ceramic: 120,
    granite: 400,
  },
  walls: {
    paint: 30,
    wallpaper: 80,
    tiles: 120,
    stone: 250,
  },
  doors: {
    wood: 500,
    aluminum: 800,
    glass: 1200,
    pvc: 300,
  },
  windows: {
    aluminum: 1000,
    upvc: 1500,
    wood: 2000,
    glass: 500,
  },
  electrical: {
    wiring: 15,
    sockets: 50,
    switches: 40,
    lightFixtures: 200,
    breaker: 300,
  },
  plumbing: {
    pipes: 20,
    fittings: 30,
    sanitaryWare: 500,
    water_heater: 2000,
  },
  finishing: {
    paint: 30,
    varnish: 50,
    hardware: 100,
    accessories: 80,
  },
}

// أسعار العمالة (جنيه مصري)
export const LABOR_RATES: Record<string, Record<string, number> | number> = {
  skilled: {
    electrician: 150,
    plumber: 150,
    carpenter: 120,
    mason: 100,
    painter: 80,
  },
  semi_skilled: {
    helper: 60,
    assistant: 50,
  },
  supervisor: 200,
}

// مضاعفات حسب نوع المشروع
export const PROJECT_TYPE_MULTIPLIERS: Record<string, number> = {
  residential: 1.0,
  commercial: 1.2,
  industrial: 0.8,
  renovation: 0.9,
  retail: 1.1,
}

// مضاعفات حسب المعايير
export const FINISHING_MULTIPLIERS: Record<string, number> = {
  basic: 0.8,
  standard: 1.0,
  luxury: 1.5,
  premium: 2.0,
}

// مضاعفات المواقع
export const LOCATION_MULTIPLIERS: Record<string, number> = {
  cairo: 1.2,
  giza: 1.1,
  alexandria: 1.0,
  other: 0.9,
}

// فئات التكاليف
export const COST_CATEGORIES = {
  materials: { label: "Materials", labelAr: "المواد" },
  labor: { label: "Labor", labelAr: "العمالة" },
  finishing: { label: "Finishing", labelAr: "التشطيبات" },
  equipment: { label: "Equipment", labelAr: "المعدات" },
  permits: { label: "Permits", labelAr: "التراخيص" },
  contingency: { label: "Contingency", labelAr: "احتياطي" },
}

export class CostCalculatorService {
  /**
   * حساب السعر الإجمالي للعنصر
   */
  static calculateItemPrice(item: CostItem): number {
    return item.quantity * item.unitPrice
  }

  /**
   * حساب إجمالي التكاليف من العناصر
   */
  static calculateTotalFromItems(items: CostItem[]): CostBreakdown {
    let materials = 0
    let labor = 0
    let finishing = 0
    let additionalCosts = 0

    items.forEach((item) => {
      const itemTotal = this.calculateItemPrice(item)
      switch (item.category) {
        case "materials":
          materials += itemTotal
          break
        case "labor":
          labor += itemTotal
          break
        case "finishing":
          finishing += itemTotal
          break
        case "additional":
          additionalCosts += itemTotal
          break
      }
    })

    const subtotal = materials + labor + finishing + additionalCosts
    const taxRate = 0.14 // ضريبة القيمة المضافة 14%
    const tax = Math.round(subtotal * taxRate)
    const total = subtotal + tax

    return {
      materials,
      labor,
      finishing,
      additionalCosts,
      subtotal,
      taxRate,
      tax,
      total,
    }
  }

  /**
   * حساب التكلفة المتقدمة مع المعاملات
   */
  static calculateAdvanced(
    area: number,
    projectType: string,
    finishingType: string,
    basePrice: number = 5000,
  ): CostBreakdown {
    const projectMultiplier = PROJECT_TYPE_MULTIPLIERS[projectType] || 1.0
    const finishingMultiplier = FINISHING_MULTIPLIERS[finishingType] || 1.0

    const costPerMeter = basePrice * projectMultiplier * finishingMultiplier
    const subtotal = Math.round(area * costPerMeter)

    const taxRate = 0.14
    const tax = Math.round(subtotal * taxRate)
    const total = subtotal + tax

    // تقسيم التكاليف
    const materialsPercent = 0.4
    const laborPercent = 0.35
    const finishingPercent = 0.25

    return {
      materials: Math.round(subtotal * materialsPercent),
      labor: Math.round(subtotal * laborPercent),
      finishing: Math.round(subtotal * finishingPercent),
      additionalCosts: 0,
      subtotal,
      taxRate,
      tax,
      total,
      costPerMeter,
    }
  }

  /**
   * تحديث عنصر من العناصر
   */
  static updateItem(item: CostItem, updates: Partial<CostItem>): CostItem {
    return { ...item, ...updates }
  }

  /**
   * حذف عنصر
   */
  static removeItem(items: CostItem[], itemId: string): CostItem[] {
    return items.filter((item) => item.id !== itemId)
  }

  /**
   * إضافة عنصر جديد
   */
  static addItem(items: CostItem[], newItem: CostItem): CostItem[] {
    return [...items, newItem]
  }

  /**
   * التحقق من صحة البيانات
   */
  static validateItem(item: Partial<CostItem>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!item.name || item.name.trim() === "") {
      errors.push("Item name is required")
    }
    if (!item.unit || item.unit.trim() === "") {
      errors.push("Unit is required")
    }
    if (!item.quantity || item.quantity <= 0) {
      errors.push("Quantity must be greater than 0")
    }
    if (!item.unitPrice || item.unitPrice <= 0) {
      errors.push("Unit price must be greater than 0")
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * تحويل التكاليف إلى صيغة صديقة للعرض
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EGP",
    }).format(amount)
  }

  /**
   * حساب نسبة كل عنصر من التكلفة الإجمالية
   */
  static calculatePercentages(breakdown: CostBreakdown) {
    const { materials, labor, finishing, additionalCosts, subtotal } = breakdown
    const total = subtotal || 1

    return {
      materials: (materials / total) * 100,
      labor: (labor / total) * 100,
      finishing: (finishing / total) * 100,
      additionalCosts: (additionalCosts / total) * 100,
    }
  }

  /**
   * إنشاء تقرير ملخص
   */
  static generateSummaryReport(estimate: ProjectEstimate): string {
    const { breakdown, projectType, area, finishingType } = estimate
    const percentages = this.calculatePercentages(breakdown)

    return `
Project: ${estimate.title}
Type: ${projectType}
Area: ${area} m²
Finishing: ${finishingType}

Cost Breakdown:
- Materials: EGP ${breakdown.materials.toLocaleString()} (${percentages.materials.toFixed(1)}%)
- Labor: EGP ${breakdown.labor.toLocaleString()} (${percentages.labor.toFixed(1)}%)
- Finishing: EGP ${breakdown.finishing.toLocaleString()} (${percentages.finishing.toFixed(1)}%)
- Additional: EGP ${breakdown.additionalCosts.toLocaleString()} (${percentages.additionalCosts.toFixed(1)}%)

Subtotal: EGP ${breakdown.subtotal.toLocaleString()}
Tax (14%): EGP ${breakdown.tax.toLocaleString()}
Total: EGP ${breakdown.total.toLocaleString()}
Cost per m²: EGP ${breakdown.costPerMeter?.toFixed(2)}
    `
  }
}
