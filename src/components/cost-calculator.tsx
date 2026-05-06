import { useState } from "react"
import { motion } from "framer-motion"
import { Calculator, Building, MapPin, Layers, Home, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useLanguage } from "@/contexts/language-context"

interface CalculationResult {
  totalCost: number
  costPerMeter: number
  breakdown: {
    materials: number
    labor: number
    finishing: number
    overhead: number
  }
}

export function CostCalculator() {
  const { language, t } = useLanguage()
  const [formData, setFormData] = useState({
    projectType: "",
    area: "",
    finishType: "",
    floors: "1",
    location: "",
  })
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  // Base rates per square meter in EGP
  const baseRates = {
    residential: { basic: 3000, standard: 4500, luxury: 7000, premium: 10000 },
    commercial: { basic: 3500, standard: 5000, luxury: 8000, premium: 12000 },
    industrial: { basic: 2500, standard: 3500, luxury: 5500, premium: 8000 },
    renovation: { basic: 1500, standard: 2500, luxury: 4000, premium: 6000 },
  }

  // Location multipliers
  const locationMultipliers = {
    cairo: 1.2,
    giza: 1.1,
    alexandria: 1.0,
    other: 0.9,
  }

  // Floor multipliers
  const floorMultipliers = {
    1: 1.0,
    2: 1.1,
    3: 1.2,
    4: 1.3,
    "5+": 1.4,
  }

  const calculateCost = () => {
    if (!formData.projectType || !formData.area || !formData.finishType || !formData.location) {
      return
    }

    setIsCalculating(true)

    // Simulate calculation delay
    setTimeout(() => {
      const area = Number.parseFloat(formData.area)
      const baseRate =
        baseRates[formData.projectType as keyof typeof baseRates][
          formData.finishType as keyof typeof baseRates.residential
        ]
      const locationMultiplier = locationMultipliers[formData.location as keyof typeof locationMultipliers]
      const floorMultiplier = floorMultipliers[formData.floors as keyof typeof floorMultipliers]

      const costPerMeter = baseRate * locationMultiplier * floorMultiplier
      const totalCost = costPerMeter * area

      // Calculate breakdown
      const materials = totalCost * 0.45
      const labor = totalCost * 0.35
      const finishing = totalCost * 0.15
      const overhead = totalCost * 0.05

      setResult({
        totalCost,
        costPerMeter,
        breakdown: { materials, labor, finishing, overhead },
      })
      setIsCalculating(false)
    }, 1500)
  }

  const resetCalculator = () => {
    setFormData({
      projectType: "",
      area: "",
      finishType: "",
      floors: "1",
      location: "",
    })
    setResult(null)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "ar" ? "ar-EG" : "en-EG", {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Calculator className="h-4 w-4" />
          {t("calculator.title")}
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t("calculator.title")}</h2>
        <p className="text-gray-600 dark:text-gray-300">{t("calculator.subtitle")}</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calculator Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-yellow-500" />
                {t("calculator.title")}
              </CardTitle>
              <CardDescription>{t("calculator.subtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Project Type */}
              <div className="space-y-2">
                <Label htmlFor="projectType" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  {t("calculator.projectType")}
                </Label>
                <Select
                  value={formData.projectType}
                  onValueChange={(value) => setFormData({ ...formData, projectType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("calculator.projectType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">{t("calculator.projectType.residential")}</SelectItem>
                    <SelectItem value="commercial">{t("calculator.projectType.commercial")}</SelectItem>
                    <SelectItem value="industrial">{t("calculator.projectType.industrial")}</SelectItem>
                    <SelectItem value="renovation">{t("calculator.projectType.renovation")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Area */}
              <div className="space-y-2">
                <Label htmlFor="area">{t("calculator.area")}</Label>
                <Input
                  id="area"
                  type="number"
                  placeholder="100"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                />
              </div>

              {/* Finish Type */}
              <div className="space-y-2">
                <Label htmlFor="finishType" className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  {t("calculator.finishType")}
                </Label>
                <Select
                  value={formData.finishType}
                  onValueChange={(value) => setFormData({ ...formData, finishType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("calculator.finishType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">{t("calculator.finishType.basic")}</SelectItem>
                    <SelectItem value="standard">{t("calculator.finishType.standard")}</SelectItem>
                    <SelectItem value="luxury">{t("calculator.finishType.luxury")}</SelectItem>
                    <SelectItem value="premium">{t("calculator.finishType.premium")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Floors */}
              <div className="space-y-2">
                <Label htmlFor="floors">{t("calculator.floors")}</Label>
                <Select value={formData.floors} onValueChange={(value) => setFormData({ ...formData, floors: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("calculator.floors")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5+">5+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {t("calculator.location")}
                </Label>
                <Select
                  value={formData.location}
                  onValueChange={(value) => setFormData({ ...formData, location: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("calculator.location")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cairo">{t("calculator.location.cairo")}</SelectItem>
                    <SelectItem value="giza">{t("calculator.location.giza")}</SelectItem>
                    <SelectItem value="alexandria">{t("calculator.location.alexandria")}</SelectItem>
                    <SelectItem value="other">{t("calculator.location.other")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={calculateCost}
                  disabled={
                    !formData.projectType ||
                    !formData.area ||
                    !formData.finishType ||
                    !formData.location ||
                    isCalculating
                  }
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
                >
                  {isCalculating ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="mr-2"
                    >
                      <Calculator className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <Calculator className="h-4 w-4 mr-2" />
                  )}
                  {t("calculator.calculate")}
                </Button>
                <Button onClick={resetCalculator} variant="outline" size="icon">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {result ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-yellow-600">{t("calculator.result.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Total Cost */}
                <div className="text-center p-6 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">{t("calculator.result.total")}</p>
                  <p className="text-3xl font-bold text-yellow-600">{formatCurrency(result.totalCost)}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {t("calculator.result.perMeter")}: {formatCurrency(result.costPerMeter)}
                  </p>
                </div>

                <Separator />

                {/* Cost Breakdown */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">تفصيل التكلفة / Cost Breakdown</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">المواد / Materials (45%)</span>
                      <span className="font-medium">{formatCurrency(result.breakdown.materials)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">العمالة / Labor (35%)</span>
                      <span className="font-medium">{formatCurrency(result.breakdown.labor)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">التشطيبات / Finishing (15%)</span>
                      <span className="font-medium">{formatCurrency(result.breakdown.finishing)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">إدارية / Overhead (5%)</span>
                      <span className="font-medium">{formatCurrency(result.breakdown.overhead)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Note */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 mb-3">{t("calculator.result.note")}</p>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    {t("calculator.result.contact")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <Calculator className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {language === "ar" ? "املأ النموذج للحصول على التقدير" : "Fill the form to get estimate"}
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  )
}
