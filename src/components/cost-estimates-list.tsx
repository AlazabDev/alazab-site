import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, Trash2, Download, FileText, Plus } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/contexts/language-context"
import { CostDatabaseService } from "@/lib/cost-database-service"
import { CostReportsService } from "@/lib/cost-reports-service"
import { Skeleton } from "@/components/ui/skeleton"

interface EstimateItem {
  id: string
  title: string
  title_ar: string
  project_type: string
  area: number
  finishing_type: string
  total_cost: number
  created_at: string
}

export function CostEstimatesList() {
  const { language } = useLanguage()
  const isAr = language === "ar"
  const [estimates, setEstimates] = useState<EstimateItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEstimates()
  }, [])

  const loadEstimates = async () => {
    setLoading(true)
    const result = await CostDatabaseService.getAllEstimates()
    if (result.success) {
      setEstimates(result.estimates)
    }
    setLoading(false)
  }

  const handleDelete = async (estimateId: string) => {
    if (!confirm(isAr ? "هل أنت متأكد من حذف العرض؟" : "Are you sure you want to delete this estimate?")) {
      return
    }

    const result = await CostDatabaseService.deleteEstimate(estimateId)
    if (result.success) {
      setEstimates(estimates.filter((e) => e.id !== estimateId))
      alert(isAr ? "تم حذف العرض بنجاح" : "Estimate deleted successfully")
    } else {
      alert(isAr ? "حدث خطأ في الحذف" : "Error deleting estimate")
    }
  }

  const getProjectTypeLabel = (type: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      residential: { ar: "سكني", en: "Residential" },
      commercial: { ar: "تجاري", en: "Commercial" },
      industrial: { ar: "صناعي", en: "Industrial" },
      renovation: { ar: "تجديد", en: "Renovation" },
      retail: { ar: "تجارة التجزئة", en: "Retail" },
    }
    return labels[type]?.[isAr ? "ar" : "en"] || type
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">{isAr ? "عروض التكاليف" : "Cost Estimates"}</h2>
          <p className="text-gray-600 mt-2">
            {isAr ? `لديك ${estimates.length} عرض` : `You have ${estimates.length} estimates`}
          </p>
        </div>
        <Link to="/cost-calculator">
          <Button className="gap-2" size="lg">
            <Plus className="w-5 h-5" />
            {isAr ? "عرض جديد" : "New Estimate"}
          </Button>
        </Link>
      </div>

      {/* Estimates Grid */}
      {estimates.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <p className="text-gray-500 text-lg">{isAr ? "لا توجد عروض حتى الآن" : "No estimates yet"}</p>
              <Link to="/cost-calculator">
                <Button>{isAr ? "إنشاء عرض جديد" : "Create New Estimate"}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
          <AnimatePresence>
            {estimates.map((estimate, index) => (
              <motion.div
                key={estimate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      {/* Left Info */}
                      <div className="flex-1" dir={isAr ? "rtl" : "ltr"}>
                        <h3 className="text-xl font-bold mb-2">{isAr ? estimate.title_ar : estimate.title}</h3>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>
                            {isAr ? "نوع المشروع:" : "Project Type:"} <span className="font-semibold text-gray-900">{getProjectTypeLabel(estimate.project_type)}</span>
                          </p>
                          <p>
                            {isAr ? "المساحة:" : "Area:"} <span className="font-semibold text-gray-900">{estimate.area} m²</span>
                          </p>
                          <p>
                            {isAr ? "التاريخ:" : "Created:"} <span className="font-semibold text-gray-900">{new Date(estimate.created_at).toLocaleDateString(isAr ? "ar-EG" : "en-US")}</span>
                          </p>
                        </div>
                      </div>

                      {/* Cost */}
                      <div className="text-right md:text-center min-w-[150px] mb-4 md:mb-0">
                        <p className="text-sm text-gray-600 mb-1">{isAr ? "الإجمالي" : "Total Cost"}</p>
                        <p className="text-2xl font-bold text-primary">
                          {estimate.total_cost.toLocaleString(isAr ? "ar-EG" : "en-US")} ₪
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 w-full md:w-auto">
                        <Button variant="outline" size="sm" className="flex-1 md:flex-none gap-2">
                          <Eye className="w-4 h-4" />
                          {isAr ? "عرض" : "View"}
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 md:flex-none gap-2">
                          <Download className="w-4 h-4" />
                          {isAr ? "تحميل" : "Download"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 md:flex-none gap-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(estimate.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                          {isAr ? "حذف" : "Delete"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
