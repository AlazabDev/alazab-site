import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Calculator,
  Plus,
  Trash2,
  Save,
  Download,
  Eye,
  BarChart3,
  FileText,
  Copy,
  DollarSign,
  Grid3X3,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLanguage } from "@/contexts/language-context"
import { CostCalculatorService, type ProjectEstimate, type CostItem } from "@/lib/cost-calculator-service"
import { CostReportsService } from "@/lib/cost-reports-service"
import { CostDatabaseService } from "@/lib/cost-database-service"
import { Separator } from "@/components/ui/separator"

export function CostCalculatorAdvanced() {
  const { language, t } = useLanguage()
  const isAr = language === "ar"

  // حالات البيانات
  const [estimateTitle, setEstimateTitle] = useState("")
  const [projectType, setProjectType] = useState<"residential" | "commercial" | "industrial" | "renovation" | "retail">(
    "residential",
  )
  const [area, setArea] = useState<number>(100)
  const [location, setLocation] = useState("cairo")
  const [finishingType, setFinishingType] = useState<"basic" | "standard" | "luxury" | "premium">("standard")
  const [items, setItems] = useState<CostItem[]>([])
  const [breakdown, setBreakdown] = useState(CostCalculatorService.calculateAdvanced(100, "residential", "standard"))
  const [newItem, setNewItem] = useState<Partial<CostItem>>({
    nameAr: "",
    name: "",
    category: "materials",
    unitAr: "متر",
    unit: "m",
    quantity: 1,
    unitPrice: 0,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [activeTab, setActiveTab] = useState("calculator")

  // تحديث الحسابات عند تغيير البيانات الأساسية
  useEffect(() => {
    const newBreakdown = CostCalculatorService.calculateAdvanced(area, projectType, finishingType)
    setBreakdown(newBreakdown)
  }, [area, projectType, finishingType])

  // إضافة عنصر جديد
  const handleAddItem = () => {
    const validation = CostCalculatorService.validateItem(newItem)
    if (!validation.valid) {
      alert(validation.errors.join("\n"))
      return
    }

    const item: CostItem = {
      id: Date.now().toString(),
      name: newItem.name || "",
      nameAr: newItem.nameAr || "",
      category: newItem.category || "materials",
      unit: newItem.unit || "m",
      unitAr: newItem.unitAr || "متر",
      quantity: newItem.quantity || 1,
      unitPrice: newItem.unitPrice || 0,
    }

    setItems([...items, item])
    setNewItem({
      nameAr: "",
      name: "",
      category: "materials",
      unitAr: "متر",
      unit: "m",
      quantity: 1,
      unitPrice: 0,
    })
  }

  // تحديث العنصر
  const handleUpdateItem = (id: string, updates: Partial<CostItem>) => {
    setItems(items.map((item) => (item.id === id ? { ...item, ...updates } : item)))
  }

  // حذف العنصر
  const handleDeleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  // حفظ العرض
  const handleSaveEstimate = async () => {
    if (!estimateTitle.trim()) {
      alert(isAr ? "يرجى إدخال اسم المشروع" : "Please enter a project title")
      return
    }

    setIsSaving(true)
    try {
      const estimate: ProjectEstimate = {
        id: Date.now().toString(),
        title: estimateTitle,
        titleAr: estimateTitle,
        projectType,
        area,
        location,
        finishingType,
        items,
        breakdown,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = await CostDatabaseService.createEstimate(estimate)

      if (result.success) {
        alert(isAr ? "تم حفظ العرض بنجاح" : "Estimate saved successfully")
        // إعادة تعيين النموذج
        resetForm()
      } else {
        alert(result.error || (isAr ? "حدث خطأ" : "Error occurred"))
      }
    } catch (error) {
      console.error("Error saving estimate:", error)
    } finally {
      setIsSaving(false)
    }
  }

  // تنزيل التقرير
  const handleDownloadReport = () => {
    const estimate: ProjectEstimate = {
      id: Date.now().toString(),
      title: estimateTitle,
      titleAr: estimateTitle,
      projectType,
      area,
      location,
      finishingType,
      items,
      breakdown,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const htmlContent = CostReportsService.generateHTMLReport(estimate)
    CostReportsService.downloadFile(
      htmlContent,
      `${estimateTitle || "estimate"}_${Date.now()}.html`,
      "text/html",
    )
  }

  // طباعة التقرير
  const handlePrintReport = () => {
    const estimate: ProjectEstimate = {
      id: Date.now().toString(),
      title: estimateTitle,
      titleAr: estimateTitle,
      projectType,
      area,
      location,
      finishingType,
      items,
      breakdown,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const htmlContent = CostReportsService.generateHTMLReport(estimate)
    CostReportsService.printReport(htmlContent)
  }

  // إعادة تعيين النموذج
  const resetForm = () => {
    setEstimateTitle("")
    setProjectType("residential")
    setArea(100)
    setLocation("cairo")
    setFinishingType("standard")
    setItems([])
    setNewItem({
      nameAr: "",
      name: "",
      category: "materials",
      unitAr: "متر",
      unit: "m",
      quantity: 1,
      unitPrice: 0,
    })
  }

  // حساب إجمالي العناصر
  const itemsTotal = items.length > 0 ? CostCalculatorService.calculateTotalFromItems(items) : breakdown

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

  const getFinishingLabel = (type: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      basic: { ar: "بسيط", en: "Basic" },
      standard: { ar: "عادي", en: "Standard" },
      luxury: { ar: "فاخر", en: "Luxury" },
      premium: { ar: "متميز", en: "Premium" },
    }
    return labels[type]?.[isAr ? "ar" : "en"] || type
  }

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            {isAr ? "الحاسبة" : "Calculator"}
          </TabsTrigger>
          <TabsTrigger value="items" className="flex items-center gap-2">
            <Grid3X3 className="w-4 h-4" />
            {isAr ? "العناصر" : "Items"}
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            {isAr ? "المعاينة" : "Preview"}
          </TabsTrigger>
        </TabsList>

        {/* تبويب الحاسبة */}
        <TabsContent value="calculator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{isAr ? "معلومات المشروع" : "Project Information"}</CardTitle>
              <CardDescription>{isAr ? "أدخل تفاصيل المشروع الأساسية" : "Enter basic project details"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* اسم المشروع */}
              <div className="space-y-2">
                <Label>{isAr ? "اسم المشروع" : "Project Title"}</Label>
                <Input
                  value={estimateTitle}
                  onChange={(e) => setEstimateTitle(e.target.value)}
                  placeholder={isAr ? "أدخل اسم المشروع" : "Enter project title"}
                  dir={isAr ? "rtl" : "ltr"}
                />
              </div>

              {/* الشبكة */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* نوع المشروع */}
                <div className="space-y-2">
                  <Label>{isAr ? "نوع المشروع" : "Project Type"}</Label>
                  <Select value={projectType} onValueChange={(value: any) => setProjectType(value)}>
                    <SelectTrigger dir={isAr ? "rtl" : "ltr"}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">{getProjectTypeLabel("residential")}</SelectItem>
                      <SelectItem value="commercial">{getProjectTypeLabel("commercial")}</SelectItem>
                      <SelectItem value="industrial">{getProjectTypeLabel("industrial")}</SelectItem>
                      <SelectItem value="renovation">{getProjectTypeLabel("renovation")}</SelectItem>
                      <SelectItem value="retail">{getProjectTypeLabel("retail")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* نوع التشطيب */}
                <div className="space-y-2">
                  <Label>{isAr ? "نوع التشطيب" : "Finishing Type"}</Label>
                  <Select value={finishingType} onValueChange={(value: any) => setFinishingType(value)}>
                    <SelectTrigger dir={isAr ? "rtl" : "ltr"}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">{getFinishingLabel("basic")}</SelectItem>
                      <SelectItem value="standard">{getFinishingLabel("standard")}</SelectItem>
                      <SelectItem value="luxury">{getFinishingLabel("luxury")}</SelectItem>
                      <SelectItem value="premium">{getFinishingLabel("premium")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* المساحة */}
                <div className="space-y-2">
                  <Label>{isAr ? "المساحة (متر مربع)" : "Area (m²)"}</Label>
                  <Input
                    type="number"
                    value={area}
                    onChange={(e) => setArea(Number(e.target.value))}
                    min="1"
                    step="1"
                  />
                </div>

                {/* الموقع */}
                <div className="space-y-2">
                  <Label>{isAr ? "الموقع" : "Location"}</Label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger dir={isAr ? "rtl" : "ltr"}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cairo">{isAr ? "القاهرة" : "Cairo"}</SelectItem>
                      <SelectItem value="giza">{isAr ? "الجيزة" : "Giza"}</SelectItem>
                      <SelectItem value="alexandria">{isAr ? "الإسكندرية" : "Alexandria"}</SelectItem>
                      <SelectItem value="other">{isAr ? "أخرى" : "Other"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* النتيجة */}
          <Card className="border-primary/50 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">{isAr ? "النتيجة المحسوبة" : "Calculated Result"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-white rounded-lg border"
                >
                  <p className="text-sm text-gray-600 mb-1">{isAr ? "المواد" : "Materials"}</p>
                  <p className="text-xl font-bold text-primary">
                    {itemsTotal.materials.toLocaleString(isAr ? "ar-EG" : "en-US")} ₪
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-4 bg-white rounded-lg border"
                >
                  <p className="text-sm text-gray-600 mb-1">{isAr ? "العمالة" : "Labor"}</p>
                  <p className="text-xl font-bold text-primary">
                    {itemsTotal.labor.toLocaleString(isAr ? "ar-EG" : "en-US")} ₪
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-4 bg-white rounded-lg border"
                >
                  <p className="text-sm text-gray-600 mb-1">{isAr ? "التشطيبات" : "Finishing"}</p>
                  <p className="text-xl font-bold text-primary">
                    {itemsTotal.finishing.toLocaleString(isAr ? "ar-EG" : "en-US")} ₪
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="p-4 bg-white rounded-lg border"
                >
                  <p className="text-sm text-gray-600 mb-1">{isAr ? "السعر/متر" : "Cost/m²"}</p>
                  <p className="text-xl font-bold text-primary">
                    {(itemsTotal.costPerMeter || 0).toLocaleString(isAr ? "ar-EG" : "en-US")} ₪
                  </p>
                </motion.div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-lg border">
                  <p className="text-sm text-gray-600 mb-1">{isAr ? "المجموع الفرعي" : "Subtotal"}</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {itemsTotal.subtotal.toLocaleString(isAr ? "ar-EG" : "en-US")} ₪
                  </p>
                </div>

                <div className="p-4 bg-white rounded-lg border">
                  <p className="text-sm text-gray-600 mb-1">{isAr ? "الضريبة (14%)" : "Tax (14%)"}</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {itemsTotal.tax.toLocaleString(isAr ? "ar-EG" : "en-US")} ₪
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-r from-primary to-primary/80 text-white rounded-lg border border-primary">
                  <p className="text-sm mb-1 opacity-90">{isAr ? "الإجمالي الكلي" : "Total"}</p>
                  <p className="text-2xl font-bold">{itemsTotal.total.toLocaleString(isAr ? "ar-EG" : "en-US")} ₪</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* الأزرار */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSaveEstimate} disabled={isSaving} className="gap-2">
              <Save className="w-4 h-4" />
              {isSaving ? (isAr ? "جاري الحفظ..." : "Saving...") : isAr ? "حفظ العرض" : "Save Estimate"}
            </Button>
            <Button onClick={handleDownloadReport} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              {isAr ? "تنزيل HTML" : "Download HTML"}
            </Button>
            <Button onClick={handlePrintReport} variant="outline" className="gap-2">
              <FileText className="w-4 h-4" />
              {isAr ? "طباعة" : "Print"}
            </Button>
          </div>
        </TabsContent>

        {/* تبويب العناصر */}
        <TabsContent value="items" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{isAr ? "إضافة عناصر التكاليف" : "Add Cost Items"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{isAr ? "الاسم (عربي)" : "Name (Arabic)"}</Label>
                  <Input
                    value={newItem.nameAr || ""}
                    onChange={(e) => setNewItem({ ...newItem, nameAr: e.target.value })}
                    placeholder={isAr ? "اسم البند" : "Item name"}
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "الاسم (إنجليزي)" : "Name (English)"}</Label>
                  <Input
                    value={newItem.name || ""}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="Item name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "الفئة" : "Category"}</Label>
                  <Select value={newItem.category || "materials"} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="materials">{isAr ? "مواد" : "Materials"}</SelectItem>
                      <SelectItem value="labor">{isAr ? "عمالة" : "Labor"}</SelectItem>
                      <SelectItem value="finishing">{isAr ? "تشطيبات" : "Finishing"}</SelectItem>
                      <SelectItem value="additional">{isAr ? "إضافي" : "Additional"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>{isAr ? "الوحدة (عربي)" : "Unit (Arabic)"}</Label>
                  <Input
                    value={newItem.unitAr || ""}
                    onChange={(e) => setNewItem({ ...newItem, unitAr: e.target.value })}
                    placeholder="متر"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "الوحدة (إنجليزي)" : "Unit (English)"}</Label>
                  <Input
                    value={newItem.unit || ""}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    placeholder="m"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "الكمية" : "Quantity"}</Label>
                  <Input
                    type="number"
                    value={newItem.quantity || 1}
                    onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    min="1"
                    step="0.1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "السعر/الوحدة" : "Price/Unit"}</Label>
                  <Input
                    type="number"
                    value={newItem.unitPrice || 0}
                    onChange={(e) => setNewItem({ ...newItem, unitPrice: Number(e.target.value) })}
                    min="0"
                    step="1"
                  />
                </div>
              </div>

              <Button onClick={handleAddItem} className="w-full gap-2">
                <Plus className="w-4 h-4" />
                {isAr ? "إضافة عنصر" : "Add Item"}
              </Button>
            </CardContent>
          </Card>

          {/* قائمة العناصر */}
          <Card>
            <CardHeader>
              <CardTitle>{isAr ? "العناصر المضافة" : "Added Items"}</CardTitle>
              <CardDescription>{isAr ? `إجمالي: ${items.length} عناصر` : `Total: ${items.length} items`}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <AnimatePresence>
                  {items.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      {isAr ? "لا توجد عناصر مضافة بعد" : "No items added yet"}
                    </p>
                  ) : (
                    items.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="p-3 bg-gray-50 rounded-lg border flex justify-between items-center"
                      >
                        <div className="flex-1" dir={isAr ? "rtl" : "ltr"}>
                          <p className="font-semibold">{isAr ? item.nameAr : item.name}</p>
                          <p className="text-sm text-gray-600">
                            {item.quantity} {isAr ? item.unitAr : item.unit} × {item.unitPrice.toLocaleString()} ₪ = {(item.quantity * item.unitPrice).toLocaleString()} ₪
                          </p>
                        </div>
                        <Button
                          onClick={() => handleDeleteItem(item.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب المعاينة */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{isAr ? "معاينة التقرير" : "Report Preview"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">{isAr ? "اسم المشروع" : "Project Title"}</p>
                  <p className="text-lg font-semibold">{estimateTitle || (isAr ? "بدون عنوان" : "Untitled")}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">{isAr ? "نوع المشروع" : "Project Type"}</p>
                  <p className="text-lg font-semibold">{getProjectTypeLabel(projectType)}</p>
                </div>
              </div>

              <Button onClick={handleDownloadReport} className="w-full gap-2" size="lg">
                <Download className="w-4 h-4" />
                {isAr ? "تحميل التقرير كـ PDF" : "Download as PDF"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
