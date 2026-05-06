import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { TrendingDown, TrendingUp, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/contexts/language-context"
import { CostReportsService } from "@/lib/cost-reports-service"
import type { ProjectEstimate } from "@/lib/cost-calculator-service"

interface CostComparisonProps {
  estimate1?: ProjectEstimate
  estimate2?: ProjectEstimate
}

export function CostComparison({ estimate1, estimate2 }: CostComparisonProps) {
  const { language } = useLanguage()
  const isAr = language === "ar"
  const [comparison, setComparison] = useState<any>(null)

  useEffect(() => {
    if (estimate1 && estimate2) {
      const comp = CostReportsService.compareEstimates(estimate1, estimate2)
      setComparison(comp)
    }
  }, [estimate1, estimate2])

  if (!comparison) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-gray-500">
            {isAr ? "يرجى اختيار عرضين للمقارنة" : "Please select two estimates to compare"}
          </p>
        </CardContent>
      </Card>
    )
  }

  const getDifferenceBadge = (difference: number) => {
    if (difference === 0) return "text-gray-500"
    if (difference < 0) return "text-green-500"
    return "text-red-500"
  }

  const getDifferenceIcon = (difference: number) => {
    if (difference === 0) return null
    if (difference < 0) return <TrendingDown className="w-4 h-4" />
    return <TrendingUp className="w-4 h-4" />
  }

  const ComparisonRow = ({ label, est1Value, est2Value, difference }: any) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-4 border-b last:border-b-0 flex justify-between items-center"
    >
      <div className="flex-1">
        <p className="text-sm text-gray-600">{label}</p>
      </div>
      <div className="flex gap-8 items-center">
        <div className="text-right min-w-[150px]">
          <p className="font-semibold">{est1Value.toLocaleString(isAr ? "ar-EG" : "en-US")} ₪</p>
          <p className="text-xs text-gray-500">{comparison.estimate1.title}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-400" />
        <div className="text-right min-w-[150px]">
          <p className="font-semibold">{est2Value.toLocaleString(isAr ? "ar-EG" : "en-US")} ₪</p>
          <p className="text-xs text-gray-500">{comparison.estimate2.title}</p>
        </div>
        <div className={`text-right min-w-[150px] font-bold flex items-center gap-1 ${getDifferenceBadge(difference)}`}>
          {getDifferenceIcon(difference)}
          <span>{(difference > 0 ? "+" : "") + difference.toLocaleString(isAr ? "ar-EG" : "en-US")} ₪</span>
        </div>
      </div>
    </motion.div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isAr ? "مقارنة العروض" : "Estimate Comparison"}</CardTitle>
        <CardDescription>
          {isAr ? "المقارنة التفصيلية بين عرضي التكاليف" : "Detailed comparison between two cost estimates"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">{isAr ? "العرض الأول" : "Estimate 1"}</p>
            <p className="text-lg font-bold text-primary">{comparison.estimate1.title}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-sm text-gray-600 mb-1">{isAr ? "الفرق الإجمالي" : "Total Difference"}</p>
            <p className={`text-2xl font-bold ${getDifferenceBadge(comparison.difference.total)}`}>
              {(comparison.difference.total > 0 ? "+" : "") + comparison.difference.total.toLocaleString(isAr ? "ar-EG" : "en-US")} ₪
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">{isAr ? "العرض الثاني" : "Estimate 2"}</p>
            <p className="text-lg font-bold text-primary">{comparison.estimate2.title}</p>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <ComparisonRow
            label={isAr ? "الإجمالي الكلي" : "Total Cost"}
            est1Value={comparison.estimate1.total}
            est2Value={comparison.estimate2.total}
            difference={comparison.difference.total}
          />
          <ComparisonRow
            label={isAr ? "السعر لكل متر مربع" : "Cost per m²"}
            est1Value={comparison.estimate1.costPerMeter}
            est2Value={comparison.estimate2.costPerMeter}
            difference={comparison.difference.costPerMeter}
          />
          <ComparisonRow
            label={isAr ? "المواد" : "Materials"}
            est1Value={comparison.estimate1.materials}
            est2Value={comparison.estimate2.materials}
            difference={comparison.difference.materials}
          />
          <ComparisonRow
            label={isAr ? "العمالة" : "Labor"}
            est1Value={comparison.estimate1.labor}
            est2Value={comparison.estimate2.labor}
            difference={comparison.difference.labor}
          />
          <ComparisonRow
            label={isAr ? "التشطيبات" : "Finishing"}
            est1Value={comparison.estimate1.finishing}
            est2Value={comparison.estimate2.finishing}
            difference={comparison.difference.finishing}
          />
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm font-semibold text-amber-900 mb-2">
            {isAr ? "ملخص المقارنة" : "Comparison Summary"}
          </p>
          <ul className="space-y-1 text-sm text-amber-800">
            {comparison.difference.total < 0 ? (
              <li>
                {isAr
                  ? `العرض الثاني أقل بـ ${Math.abs(comparison.difference.total).toLocaleString("ar-EG")} جنيه`
                  : `Estimate 2 is cheaper by ${Math.abs(comparison.difference.total).toLocaleString("en-US")} EGP`}
              </li>
            ) : (
              <li>
                {isAr
                  ? `العرض الثاني أعلى بـ ${comparison.difference.total.toLocaleString("ar-EG")} جنيه`
                  : `Estimate 2 is more expensive by ${comparison.difference.total.toLocaleString("en-US")} EGP`}
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
