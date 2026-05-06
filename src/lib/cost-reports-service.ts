import type { ProjectEstimate, CostBreakdown } from "./cost-calculator-service"
import { CostCalculatorService } from "./cost-calculator-service"

export interface ReportData {
  estimateTitle: string
  projectType: string
  area: number
  finishingType: string
  location: string
  breakdown: CostBreakdown
  percentages: {
    materials: number
    labor: number
    finishing: number
    additionalCosts: number
  }
  costPerMeter: number
  generatedDate: string
}

export class CostReportsService {
  /**
   * إنشاء بيانات التقرير
   */
  static generateReportData(estimate: ProjectEstimate): ReportData {
    const percentages = CostCalculatorService.calculatePercentages(estimate.breakdown)

    return {
      estimateTitle: estimate.title,
      projectType: estimate.projectType,
      area: estimate.area,
      finishingType: estimate.finishingType,
      location: estimate.location,
      breakdown: estimate.breakdown,
      percentages,
      costPerMeter: estimate.breakdown.costPerMeter || 0,
      generatedDate: new Date().toLocaleDateString("en-US"),
    }
  }

  /**
   * إنشاء تقرير نصي بسيط
   */
  static generateTextReport(estimate: ProjectEstimate): string {
    const report = CostCalculatorService.generateSummaryReport(estimate)
    return report
  }

  /**
   * إنشاء تقرير HTML
   */
  static generateHTMLReport(estimate: ProjectEstimate): string {
    const reportData = this.generateReportData(estimate)
    const { breakdown, percentages } = reportData

    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تقرير التكاليف</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Cairo', sans-serif;
      background: #f5f5f5;
      padding: 20px;
      color: #333;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #1e40af;
      padding-bottom: 20px;
    }
    .header h1 {
      font-size: 28px;
      color: #1e40af;
      margin-bottom: 10px;
    }
    .header p {
      font-size: 14px;
      color: #666;
    }
    .project-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
      padding: 20px;
      background: #f9fafb;
      border-radius: 6px;
    }
    .info-item {
      display: flex;
      flex-direction: column;
    }
    .info-item label {
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 5px;
      font-size: 12px;
    }
    .info-item span {
      font-size: 16px;
      color: #333;
    }
    .breakdown {
      margin-bottom: 30px;
    }
    .breakdown h2 {
      font-size: 20px;
      color: #1e40af;
      margin-bottom: 15px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 10px;
    }
    .breakdown-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .breakdown-table th {
      background: #1e40af;
      color: white;
      padding: 12px;
      text-align: right;
      font-weight: 600;
    }
    .breakdown-table td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .breakdown-table tr:last-child td {
      border-bottom: none;
    }
    .breakdown-table .row-total {
      background: #f0f7ff;
      font-weight: bold;
      color: #1e40af;
    }
    .amount {
      text-align: left;
      font-weight: 600;
      color: #1e40af;
    }
    .percentage {
      text-align: left;
      color: #666;
      font-size: 12px;
    }
    .summary {
      background: #f0f7ff;
      padding: 20px;
      border-radius: 6px;
      border-left: 4px solid #1e40af;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      padding: 8px 0;
    }
    .summary-row.total {
      border-top: 2px solid #1e40af;
      padding-top: 10px;
      font-weight: bold;
      font-size: 18px;
      color: #1e40af;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      color: #999;
      font-size: 12px;
      border-top: 1px solid #e5e7eb;
      padding-top: 20px;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .container {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>تقرير تكاليف المشروع</h1>
      <p>Project Cost Estimation Report</p>
      <p>التاريخ: ${reportData.generatedDate}</p>
    </div>

    <div class="project-info">
      <div class="info-item">
        <label>اسم المشروع</label>
        <span>${reportData.estimateTitle}</span>
      </div>
      <div class="info-item">
        <label>نوع المشروع</label>
        <span>${this.getProjectTypeLabel(reportData.projectType)}</span>
      </div>
      <div class="info-item">
        <label>المساحة</label>
        <span>${reportData.area} متر مربع</span>
      </div>
      <div class="info-item">
        <label>نوع التشطيب</label>
        <span>${this.getFinishingTypeLabel(reportData.finishingType)}</span>
      </div>
      <div class="info-item">
        <label>الموقع</label>
        <span>${reportData.location}</span>
      </div>
      <div class="info-item">
        <label>السعر لكل متر مربع</label>
        <span>₪ ${reportData.costPerMeter.toLocaleString('ar-EG')}</span>
      </div>
    </div>

    <div class="breakdown">
      <h2>تفصيل التكاليف</h2>
      <table class="breakdown-table">
        <thead>
          <tr>
            <th>البند</th>
            <th class="amount">المبلغ (جنيه)</th>
            <th class="percentage">النسبة</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>المواد الخام</td>
            <td class="amount">₪ ${breakdown.materials.toLocaleString('ar-EG')}</td>
            <td class="percentage">${percentages.materials.toFixed(1)}%</td>
          </tr>
          <tr>
            <td>العمالة</td>
            <td class="amount">₪ ${breakdown.labor.toLocaleString('ar-EG')}</td>
            <td class="percentage">${percentages.labor.toFixed(1)}%</td>
          </tr>
          <tr>
            <td>التشطيبات</td>
            <td class="amount">₪ ${breakdown.finishing.toLocaleString('ar-EG')}</td>
            <td class="percentage">${percentages.finishing.toFixed(1)}%</td>
          </tr>
          <tr>
            <td>تكاليف إضافية</td>
            <td class="amount">₪ ${breakdown.additionalCosts.toLocaleString('ar-EG')}</td>
            <td class="percentage">${percentages.additionalCosts.toFixed(1)}%</td>
          </tr>
          <tr class="row-total">
            <td>المجموع الفرعي</td>
            <td class="amount">₪ ${breakdown.subtotal.toLocaleString('ar-EG')}</td>
            <td class="percentage">100%</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="summary">
      <div class="summary-row">
        <span>المجموع الفرعي</span>
        <span>₪ ${breakdown.subtotal.toLocaleString('ar-EG')}</span>
      </div>
      <div class="summary-row">
        <span>الضريبة (${(breakdown.taxRate * 100).toFixed(0)}%)</span>
        <span>₪ ${breakdown.tax.toLocaleString('ar-EG')}</span>
      </div>
      <div class="summary-row total">
        <span>الإجمالي</span>
        <span>₪ ${breakdown.total.toLocaleString('ar-EG')}</span>
      </div>
    </div>

    <div class="footer">
      <p>هذا التقرير من: Alazab للتصاميم والتشطيبات</p>
      <p>يرجى التواصل معنا للمزيد من التفاصيل</p>
    </div>
  </div>
</body>
</html>
    `
    return html
  }

  /**
   * إنشاء بيانات CSV
   */
  static generateCSVData(estimate: ProjectEstimate): string {
    let csv = "اسم البند,الفئة,الوحدة,الكمية,السعر للوحدة,الإجمالي\n"

    estimate.items.forEach((item) => {
      const total = item.quantity * item.unitPrice
      csv += `"${item.nameAr}","${item.category}","${item.unitAr}",${item.quantity},${item.unitPrice},${total}\n`
    })

    csv += "\n,,,المجموع,," + estimate.breakdown.subtotal + "\n"
    csv += ",,,الضريبة,," + estimate.breakdown.tax + "\n"
    csv += ",,,الإجمالي,," + estimate.breakdown.total + "\n"

    return csv
  }

  /**
   * تحميل الملف
   */
  static downloadFile(content: string, filename: string, type: "text/plain" | "text/html" | "text/csv") {
    const element = document.createElement("a")
    element.setAttribute("href", `data:${type};charset=utf-8,${encodeURIComponent(content)}`)
    element.setAttribute("download", filename)
    element.style.display = "none"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  /**
   * طباعة التقرير
   */
  static printReport(htmlContent: string) {
    const printWindow = window.open("", "", "height=400,width=800")
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
  }

  /**
   * الحصول على تسمية نوع المشروع
   */
  private static getProjectTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      residential: "سكني",
      commercial: "تجاري",
      industrial: "صناعي",
      renovation: "تجديد",
      retail: "تجارة التجزئة",
    }
    return labels[type] || type
  }

  /**
   * الحصول على تسمية نوع التشطيب
   */
  private static getFinishingTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      basic: "بسيط",
      standard: "عادي",
      luxury: "فاخر",
      premium: "متميز",
    }
    return labels[type] || type
  }

  /**
   * مقارنة عرضين
   */
  static compareEstimates(estimate1: ProjectEstimate, estimate2: ProjectEstimate) {
    return {
      estimate1: {
        title: estimate1.title,
        total: estimate1.breakdown.total,
        costPerMeter: estimate1.breakdown.costPerMeter,
        materials: estimate1.breakdown.materials,
        labor: estimate1.breakdown.labor,
        finishing: estimate1.breakdown.finishing,
      },
      estimate2: {
        title: estimate2.title,
        total: estimate2.breakdown.total,
        costPerMeter: estimate2.breakdown.costPerMeter,
        materials: estimate2.breakdown.materials,
        labor: estimate2.breakdown.labor,
        finishing: estimate2.breakdown.finishing,
      },
      difference: {
        total: estimate2.breakdown.total - estimate1.breakdown.total,
        costPerMeter: (estimate2.breakdown.costPerMeter || 0) - (estimate1.breakdown.costPerMeter || 0),
        materials: estimate2.breakdown.materials - estimate1.breakdown.materials,
        labor: estimate2.breakdown.labor - estimate1.breakdown.labor,
        finishing: estimate2.breakdown.finishing - estimate1.breakdown.finishing,
      },
    }
  }
}
