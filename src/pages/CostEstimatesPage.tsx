import { CostEstimatesList } from "@/components/cost-estimates-list"

export default function EstimatesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white py-12">
        <div className="container max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Cost Estimates</h1>
          <h1 className="text-4xl font-bold mb-2 text-white/80">عروض التكاليف</h1>
          <p className="text-lg text-white/90">
            Manage all your project cost estimates
          </p>
          <p className="text-lg text-white/90">
            إدارة جميع عروض تكاليف مشاريعك
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-7xl mx-auto px-4 py-12">
        <CostEstimatesList />
      </div>
    </div>
  )
}
