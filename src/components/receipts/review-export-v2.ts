export interface ReviewItem {
  line_no?: number;
  description?: string;
  unit?: string;
  quantity?: number | string;
  unit_price?: number | string;
  total?: number | string;
}

export interface ReviewItemNote {
  line_no: number;
  comment: string;
  updated_at?: string;
}

export interface ReviewReportRowV2 {
  receipt_number: number;
  receipt_code: string;
  receipt_date: string;
  branch: string;
  items_count: number;
  items?: ReviewItem[];
  subtotal: number | string;
  vat_14: number | string;
  withholding_1: number | string;
  net_total: number | string;
  review_status: string;
  review_result: "correct" | "incorrect" | null;
  error_comment: string | null;
  item_notes?: ReviewItemNote[];
  reviewed_at: string | null;
}

export interface ReviewReportPayloadV2 {
  session: {
    reviewer_name: string | null;
    status: string;
    completed_count: number;
    correct_count: number;
    incorrect_count: number;
    started_at: string;
    completed_at: string | null;
  };
  rows: ReviewReportRowV2[];
}

const money = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const dateTime = new Intl.DateTimeFormat("ar-EG", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function n(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function issueRows(report: ReviewReportPayloadV2) {
  return report.rows.flatMap((row) => {
    const items = row.items || [];
    return (row.item_notes || []).map((note) => {
      const item = items.find((candidate, index) => (candidate.line_no || index + 1) === note.line_no);
      return {
        receipt_number: row.receipt_number,
        receipt_code: row.receipt_code,
        branch: row.branch,
        date: row.receipt_date,
        line_no: note.line_no,
        description: item?.description || "",
        quantity: item?.quantity ?? "",
        unit: item?.unit || "",
        unit_price: item?.unit_price ?? "",
        total: item?.total ?? "",
        comment: note.comment,
      };
    });
  });
}

export async function exportReviewWorkbookV2(report: ReviewReportPayloadV2) {
  const XLSX = await import(/* @vite-ignore */ "https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs");
  const issues = issueRows(report);
  const summary = [
    ["تقرير مراجعة أذون استلام الصيانة — أبو عوف", ""],
    ["المراجع", report.session.reviewer_name || "—"],
    ["إجمالي الأذون", report.rows.length],
    ["تمت المراجعة", report.session.completed_count],
    ["صحيح", report.session.correct_count],
    ["به أخطاء", report.session.incorrect_count],
    ["ملاحظات على البنود", issues.length],
    ["نسبة المطابقة", report.rows.length ? report.session.correct_count / report.rows.length : 0],
    ["بدء المراجعة", report.session.started_at || ""],
    ["انتهاء المراجعة", report.session.completed_at || ""],
  ];

  const receipts = [
    ["رقم الإذن", "الكود", "التاريخ", "الفرع", "عدد البنود", "قبل الضريبة", "VAT 14%", "خصم 1%", "الصافي", "النتيجة", "تعليق عام", "عدد ملاحظات البنود", "وقت المراجعة"],
    ...report.rows.map((row) => [
      row.receipt_number,
      row.receipt_code,
      row.receipt_date,
      row.branch,
      row.items_count,
      n(row.subtotal),
      n(row.vat_14),
      n(row.withholding_1),
      n(row.net_total),
      row.review_result === "correct" ? "معتمد" : row.review_result === "incorrect" ? "به أخطاء" : "غير مكتمل",
      row.error_comment || "",
      row.item_notes?.length || 0,
      row.reviewed_at || "",
    ]),
  ];

  const issueSheetRows = [
    ["رقم الإذن", "الكود", "التاريخ", "الفرع", "رقم البند", "وصف البند", "الوحدة", "الكمية", "سعر الوحدة", "الإجمالي", "ملاحظة المراجع"],
    ...issues.map((row) => [
      row.receipt_number,
      row.receipt_code,
      row.date,
      row.branch,
      row.line_no,
      row.description,
      row.unit,
      row.quantity,
      row.unit_price,
      row.total,
      row.comment,
    ]),
  ];

  const wb = XLSX.utils.book_new();
  const wsSummary = XLSX.utils.aoa_to_sheet(summary);
  const wsReceipts = XLSX.utils.aoa_to_sheet(receipts);
  const wsIssues = XLSX.utils.aoa_to_sheet(issueSheetRows);

  wsSummary["!cols"] = [{ wch: 34 }, { wch: 30 }];
  wsReceipts["!cols"] = [10, 15, 14, 28, 11, 14, 13, 12, 14, 14, 36, 16, 24].map((wch) => ({ wch }));
  wsIssues["!cols"] = [10, 15, 14, 25, 10, 48, 12, 11, 13, 13, 55].map((wch) => ({ wch }));
  wsSummary["!views"] = [{ rightToLeft: true }];
  wsReceipts["!views"] = [{ rightToLeft: true }];
  wsIssues["!views"] = [{ rightToLeft: true }];
  wsReceipts["!autofilter"] = { ref: `A1:M${receipts.length}` };
  if (issueSheetRows.length > 1) wsIssues["!autofilter"] = { ref: `A1:K${issueSheetRows.length}` };

  XLSX.utils.book_append_sheet(wb, wsSummary, "ملخص المراجعة");
  XLSX.utils.book_append_sheet(wb, wsReceipts, "نتائج الأذون");
  XLSX.utils.book_append_sheet(wb, wsIssues, "ملاحظات البنود");

  const output = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  downloadBlob(
    new Blob([output], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `auf-maintenance-review-${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}

export function openPrintableReviewReportV2(report: ReviewReportPayloadV2) {
  const issues = issueRows(report);
  const incorrect = report.rows.filter((row) => row.review_result === "incorrect");
  const completedAt = report.session.completed_at ? dateTime.format(new Date(report.session.completed_at)) : "—";
  const reviewer = esc(report.session.reviewer_name || "—");
  const totalNet = report.rows.reduce((sum, row) => sum + n(row.net_total), 0);

  const issueHtml = incorrect.length
    ? incorrect.map((row) => {
        const rowIssues = issues.filter((issue) => issue.receipt_number === row.receipt_number);
        return `<section class="exception">
          <div class="exception-head">
            <div><b>${esc(row.receipt_code)}</b><span>${esc(row.branch)} — ${esc(row.receipt_date)}</span></div>
            <strong>به أخطاء</strong>
          </div>
          ${row.error_comment ? `<p class="general-note">${esc(row.error_comment)}</p>` : ""}
          ${rowIssues.length ? `<table><thead><tr><th>البند</th><th>الوصف</th><th>ملاحظة المراجع</th></tr></thead><tbody>${rowIssues.map((item) => `<tr><td>${item.line_no}</td><td>${esc(item.description)}</td><td>${esc(item.comment)}</td></tr>`).join("")}</tbody></table>` : ""}
        </section>`;
      }).join("")
    : `<div class="all-clear"><div class="seal">✓</div><h2>تم اعتماد جميع الأذون بدون ملاحظات</h2><p>لا توجد استثناءات أو بنود مخالفة مسجلة أثناء المراجعة.</p></div>`;

  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>تقرير مراجعة أذون أبو عوف</title><style>
    @page{size:A4;margin:12mm}*{box-sizing:border-box}body{font-family:Tahoma,Arial,sans-serif;color:#111827;margin:0;background:white;font-size:12px}header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #030957;padding-bottom:14px;margin-bottom:18px}.brand h1{margin:0;color:#030957;font-size:24px}.brand p{margin:5px 0 0;color:#64748b}.meta{text-align:left;color:#475569}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:14px 0 18px}.card{border:1px solid #dbe3ee;border-radius:10px;padding:12px;background:#f8fafc}.card span{display:block;color:#64748b;font-size:10px}.card b{display:block;font-size:20px;margin-top:4px;color:#030957}.card.ok b{color:#15803d}.card.bad b{color:#b91c1c}.summary{border:1px solid #dbe3ee;border-radius:10px;padding:12px;margin-bottom:18px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.summary div span{color:#64748b;display:block}.summary div b{font-size:14px}.section-title{font-size:16px;color:#030957;margin:20px 0 10px}.exception{border:1px solid #fecaca;border-radius:10px;margin:0 0 12px;overflow:hidden;break-inside:avoid}.exception-head{display:flex;justify-content:space-between;padding:10px 12px;background:#fff1f2}.exception-head div{display:grid;gap:3px}.exception-head span{color:#64748b;font-size:10px}.exception-head strong{color:#b91c1c}.general-note{padding:0 12px;color:#7f1d1d}table{width:100%;border-collapse:collapse}th,td{border-top:1px solid #e5e7eb;padding:8px;text-align:right;vertical-align:top}th{background:#f8fafc;color:#334155}.all-clear{text-align:center;padding:50px 20px;border:2px solid #bbf7d0;border-radius:16px;background:#f0fdf4}.seal{width:72px;height:72px;border-radius:50%;display:grid;place-items:center;margin:0 auto 12px;background:#dcfce7;color:#15803d;font-size:40px;font-weight:900}.all-clear h2{color:#15803d;margin:0 0 8px}.all-clear p{color:#475569;margin:0}footer{margin-top:20px;border-top:1px solid #e5e7eb;padding-top:10px;color:#64748b;text-align:center}.no-print{position:fixed;left:20px;bottom:20px;background:#030957;color:#fff;border:0;border-radius:10px;padding:12px 18px;font-weight:bold;cursor:pointer}@media print{.no-print{display:none}.exception{break-inside:avoid}}
  </style></head><body>
    <header><div class="brand"><h1>تقرير مراجعة أذون استلام الصيانة — أبو عوف</h1><p>Alazab / UberFix — تقرير اعتماد نهائي</p></div><div class="meta"><div>المراجع: <b>${reviewer}</b></div><div>تاريخ الإقفال: <b>${esc(completedAt)}</b></div></div></header>
    <div class="cards"><div class="card"><span>إجمالي الأذون</span><b>${report.rows.length}</b></div><div class="card ok"><span>معتمد</span><b>${report.session.correct_count}</b></div><div class="card bad"><span>به أخطاء</span><b>${report.session.incorrect_count}</b></div><div class="card"><span>ملاحظات البنود</span><b>${issues.length}</b></div></div>
    <div class="summary"><div><span>نسبة المطابقة</span><b>${report.rows.length ? ((report.session.correct_count / report.rows.length) * 100).toFixed(1) : "0.0"}%</b></div><div><span>إجمالي صافي الأذون</span><b>${money.format(totalNet)} ج.م</b></div><div><span>حالة المراجعة</span><b>${report.session.status === "completed" ? "مكتملة" : "قيد المراجعة"}</b></div></div>
    <h2 class="section-title">الاستثناءات والملاحظات</h2>${issueHtml}
    <footer>هذا التقرير ناتج من جلسة مراجعة إلكترونية موثقة ضمن نظام Alazab Review.</footer>
    <button class="no-print" onclick="window.print()">طباعة / حفظ PDF</button>
    <script>setTimeout(()=>window.print(),500)</script>
  </body></html>`;

  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) throw new Error("تعذر فتح نافذة التقرير. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.");
  win.document.open();
  win.document.write(html);
  win.document.close();
}
