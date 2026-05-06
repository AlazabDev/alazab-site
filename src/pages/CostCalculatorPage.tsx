import { CostCalculatorAdvanced } from "@/components/cost-calculator-advanced"

export default function CostCalculatorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white py-12">
        <div className="container max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Advanced Cost Calculator</h1>
          <h1 className="text-4xl font-bold mb-2 text-white/80">حاسبة التكاليف المتقدمة</h1>
          <p className="text-lg text-white/90">
            Calculate project costs with detailed breakdowns and professional reports
          </p>
          <p className="text-lg text-white/90">
            احسب تكاليف المشروع مع تفاصيل شاملة وتقارير احترافية
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-7xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <CostCalculatorAdvanced />
        </div>
      </div>

      {/* Features */}
      <div className="container max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8 text-center">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-lg shadow border-t-4 border-primary">
            <h3 className="text-xl font-bold mb-2">Advanced Calculations</h3>
            <p className="text-gray-600">Calculate costs with multiple elements, materials, labor, and finishing options</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow border-t-4 border-primary">
            <h3 className="text-xl font-bold mb-2">Professional Reports</h3>
            <p className="text-gray-600">Generate detailed PDF reports with breakdown charts and analysis</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow border-t-4 border-primary">
            <h3 className="text-xl font-bold mb-2">Data Persistence</h3>
            <p className="text-gray-600">Save estimates in database and access them anytime</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow border-t-4 border-primary">
            <h3 className="text-xl font-bold mb-2">Comparisons</h3>
            <p className="text-gray-600">Compare multiple estimates and analyze differences</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow border-t-4 border-primary">
            <h3 className="text-xl font-bold mb-2">Bilingual Support</h3>
            <p className="text-gray-600">Full Arabic and English support for all features</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow border-t-4 border-primary">
            <h3 className="text-xl font-bold mb-2">Export Options</h3>
            <p className="text-gray-600">Export data as HTML, PDF, or CSV for easy sharing</p>
          </div>
        </div>
      </div>
    </div>
  )
}
