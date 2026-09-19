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


const encoder = new TextEncoder();

function xmlEscape(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function le16(value: number): Uint8Array {
  const out = new Uint8Array(2);
  new DataView(out.buffer).setUint16(0, value & 0xffff, true);
  return out;
}

function le32(value: number): Uint8Array {
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, value >>> 0, true);
  return out;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let value = n;
    for (let k = 0; k < 8; k += 1) value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    table[n] = value >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function zipStore(entries: Array<{ name: string; data: Uint8Array }>): Uint8Array {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let localOffset = 0;
  const now = new Date();
  const dosTime = ((now.getHours() & 0x1f) << 11) | ((now.getMinutes() & 0x3f) << 5) | (Math.floor(now.getSeconds() / 2) & 0x1f);
  const dosDate = (((Math.max(1980, now.getFullYear()) - 1980) & 0x7f) << 9) | (((now.getMonth() + 1) & 0x0f) << 5) | (now.getDate() & 0x1f);

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const data = entry.data;
    const crc = crc32(data);
    const flags = 0x0800;
    const local = concatBytes([
      le32(0x04034b50), le16(20), le16(flags), le16(0), le16(dosTime), le16(dosDate),
      le32(crc), le32(data.length), le32(data.length), le16(name.length), le16(0), name, data,
    ]);
    localParts.push(local);
    centralParts.push(concatBytes([
      le32(0x02014b50), le16(20), le16(20), le16(flags), le16(0), le16(dosTime), le16(dosDate),
      le32(crc), le32(data.length), le32(data.length), le16(name.length), le16(0), le16(0), le16(0), le16(0),
      le32(0), le32(localOffset), name,
    ]));
    localOffset += local.length;
  }

  const central = concatBytes(centralParts);
  return concatBytes([
    ...localParts,
    central,
    le32(0x06054b50), le16(0), le16(0), le16(entries.length), le16(entries.length),
    le32(central.length), le32(localOffset), le16(0),
  ]);
}

function cellRef(column: number, row: number): string {
  let col = "";
  let value = column;
  while (value > 0) {
    const mod = (value - 1) % 26;
    col = String.fromCharCode(65 + mod) + col;
    value = Math.floor((value - 1) / 26);
  }
  return `${col}${row}`;
}

function sheetXml(rows: Array<Array<string | number | null>>, widths: number[], freezeTop = true): string {
  const body = rows.map((row, rowIndex) => {
    const cells = row.map((value, colIndex) => {
      const ref = cellRef(colIndex + 1, rowIndex + 1);
      const style = rowIndex === 0 ? ' s="1"' : "";
      if (typeof value === "number" && Number.isFinite(value)) return `<c r="${ref}"${style}><v>${value}</v></c>`;
      return `<c r="${ref}" t="inlineStr"${style}><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
    }).join("");
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join("");
  const cols = widths.map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`).join("");
  const pane = freezeTop ? '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>' : "";
  const autoFilter = rows.length && rows[0]?.length ? `<autoFilter ref="A1:${cellRef(rows[0].length, rows.length)}"/>` : "";
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView workbookViewId="0" rightToLeft="1">${pane}</sheetView></sheetViews>
  <cols>${cols}</cols>
  <sheetData>${body}</sheetData>
  ${autoFilter}
</worksheet>`;
}

function createWorkbook(sheets: Array<{ name: string; rows: Array<Array<string | number | null>>; widths: number[]; freezeTop?: boolean }>): Uint8Array {
  const contentTypes = sheets.map((_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("");
  const workbookSheets = sheets.map((sheet, index) => `<sheet name="${xmlEscape(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join("");
  const workbookRels = sheets.map((_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join("");
  const styleRelId = sheets.length + 1;

  const entries: Array<{ name: string; data: Uint8Array }> = [
    { name:"[Content_Types].xml", data:encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${contentTypes}<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`) },
    { name:"_rels/.rels", data:encoder.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>') },
    { name:"xl/workbook.xml", data:encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets>${workbookSheets}</sheets></workbook>`) },
    { name:"xl/_rels/workbook.xml.rels", data:encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${workbookRels}<Relationship Id="rId${styleRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`) },
    { name:"xl/styles.xml", data:encoder.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Arial"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Arial"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF030957"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf></cellXfs></styleSheet>') },
  ];

  sheets.forEach((sheet, index) => entries.push({
    name:`xl/worksheets/sheet${index + 1}.xml`,
    data:encoder.encode(sheetXml(sheet.rows, sheet.widths, sheet.freezeTop !== false)),
  }));
  return zipStore(entries);
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
  const issues = issueRows(report);
  const summaryRows: Array<Array<string | number | null>> = [
    ["البيان", "القيمة"],
    ["تقرير المراجعة", "أذون استلام الصيانة — أبو عوف"],
    ["المراجع", report.session.reviewer_name || "—"],
    ["إجمالي الأذون", report.rows.length],
    ["تمت المراجعة", report.session.completed_count],
    ["معتمد", report.session.correct_count],
    ["غير معتمد", report.session.incorrect_count],
    ["ملاحظات البنود", issues.length],
    ["نسبة المطابقة", report.rows.length ? `${((report.session.correct_count / report.rows.length) * 100).toFixed(1)}%` : "0.0%"],
    ["إجمالي صافي الأذون", report.rows.reduce((sum, row) => sum + n(row.net_total), 0)],
    ["بدء المراجعة", report.session.started_at || ""],
    ["انتهاء المراجعة", report.session.completed_at || ""],
  ];

  const receiptRows: Array<Array<string | number | null>> = [
    ["رقم الإذن","الكود","التاريخ","الفرع","عدد البنود","قبل الضريبة","VAT 14%","خصم 1%","الصافي","القرار","تعليق عام","ملاحظات البنود","وقت المراجعة"],
    ...report.rows.map((row) => [
      row.receipt_number,row.receipt_code,row.receipt_date,row.branch,row.items_count,n(row.subtotal),n(row.vat_14),n(row.withholding_1),n(row.net_total),
      row.review_result === "correct" ? "معتمد" : row.review_result === "incorrect" ? "غير معتمد" : "قيد المراجعة",
      row.error_comment || "",row.item_notes?.length || 0,row.reviewed_at || "",
    ]),
  ];

  const issueSheetRows: Array<Array<string | number | null>> = [
    ["رقم الإذن","الكود","التاريخ","الفرع","رقم البند","وصف البند","الوحدة","الكمية","سعر الوحدة","الإجمالي","ملاحظة المراجع"],
    ...issues.map((row) => [row.receipt_number,row.receipt_code,row.date,row.branch,row.line_no,row.description,row.unit,n(row.quantity),n(row.unit_price),n(row.total),row.comment]),
  ];

  const workbook = createWorkbook([
    { name:"ملخص المراجعة", rows:summaryRows, widths:[30,38], freezeTop:false },
    { name:"نتائج الأذون", rows:receiptRows, widths:[10,16,14,28,11,14,13,12,14,14,38,15,24] },
    { name:"ملاحظات البنود", rows:issueSheetRows, widths:[10,16,14,26,10,46,12,10,13,13,52] },
  ]);

  downloadBlob(
    new Blob([workbook], { type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `auf-maintenance-review-${new Date().toISOString().slice(0,10)}.xlsx`,
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
            <strong>غير معتمد</strong>
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
    <div class="cards"><div class="card"><span>إجمالي الأذون</span><b>${report.rows.length}</b></div><div class="card ok"><span>معتمد</span><b>${report.session.correct_count}</b></div><div class="card bad"><span>غير معتمد</span><b>${report.session.incorrect_count}</b></div><div class="card"><span>ملاحظات البنود</span><b>${issues.length}</b></div></div>
    <div class="summary"><div><span>نسبة المطابقة</span><b>${report.rows.length ? ((report.session.correct_count / report.rows.length) * 100).toFixed(1) : "0.0"}%</b></div><div><span>إجمالي صافي الأذون</span><b>${money.format(totalNet)} ج.م</b></div><div><span>حالة المراجعة</span><b>${report.session.status === "completed" ? "مكتملة" : "قيد المراجعة"}</b></div></div>
    <h2 class="section-title">الاستثناءات والملاحظات</h2>${issueHtml}
    <footer>هذا التقرير ناتج من جلسة مراجعة إلكترونية موثقة ضمن نظام Alazab Review.</footer>
    <button class="no-print" onclick="window.print()">طباعة / حفظ PDF</button>
    <script>setTimeout(()=>window.print(),500)</script>
  </body></html>`;

  const win = window.open("", "_blank");
  if (!win) throw new Error("تعذر فتح نافذة التقرير. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.");
  win.opener = null;
  win.document.open();
  win.document.write(html);
  win.document.close();
}
