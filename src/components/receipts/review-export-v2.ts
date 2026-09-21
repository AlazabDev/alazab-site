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
    new Blob([workbook as BlobPart], { type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `auf-maintenance-review-${new Date().toISOString().slice(0,10)}.xlsx`,
  );
}


function dataUrlBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] || "";
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

function wrapRtlText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  if (!words.length) return y;
  let line = words[0];
  let cursorY = y;
  for (let i = 1; i < words.length; i += 1) {
    const candidate = `${line} ${words[i]}`;
    if (ctx.measureText(candidate).width > maxWidth) {
      ctx.fillText(line, x, cursorY);
      cursorY += lineHeight;
      line = words[i];
    } else {
      line = candidate;
    }
  }
  ctx.fillText(line, x, cursorY);
  return cursorY + lineHeight;
}

function createPdf(canvases: HTMLCanvasElement[]): Uint8Array {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const objectCount = 2 + canvases.length * 3;
  const objects: Array<Uint8Array | null> = new Array(objectCount + 1).fill(null);
  const pageRefs: string[] = [];

  objects[1] = encoder.encode("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  canvases.forEach((canvas, index) => {
    const pageObj = 3 + index * 3;
    const imageObj = pageObj + 1;
    const contentObj = pageObj + 2;
    pageRefs.push(`${pageObj} 0 R`);
    const jpeg = dataUrlBytes(canvas.toDataURL("image/jpeg", 0.92));
    objects[pageObj] = encoder.encode(
      `${pageObj} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 ${imageObj} 0 R >> >> /Contents ${contentObj} 0 R >>\nendobj\n`,
    );
    objects[imageObj] = concatBytes([
      encoder.encode(`${imageObj} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`),
      jpeg,
      encoder.encode("\nendstream\nendobj\n"),
    ]);
    const content = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im0 Do\nQ\n`;
    objects[contentObj] = encoder.encode(`${contentObj} 0 obj\n<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`);
  });

  objects[2] = encoder.encode(`2 0 obj\n<< /Type /Pages /Count ${canvases.length} /Kids [${pageRefs.join(" ")}] >>\nendobj\n`);
  const header = encoder.encode("%PDF-1.4\n%ALAZAB\n");
  const bodyParts: Uint8Array[] = [header];
  const offsets = new Array<number>(objectCount + 1).fill(0);
  let offset = header.length;
  for (let i = 1; i <= objectCount; i += 1) {
    const object = objects[i];
    if (!object) throw new Error(`PDF object ${i} missing`);
    offsets[i] = offset;
    bodyParts.push(object);
    offset += object.length;
  }

  const xrefOffset = offset;
  let xref = `xref\n0 ${objectCount + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objectCount; i += 1) xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  xref += `trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  bodyParts.push(encoder.encode(xref));
  return concatBytes(bodyParts);
}

function buildClientReportCanvases(report: ReviewReportPayloadV2): HTMLCanvasElement[] {
  const width = 1240;
  const height = 1754;
  const margin = 78;
  const pages: HTMLCanvasElement[] = [];
  const issues = issueRows(report);
  const incorrect = report.rows.filter((row) => row.review_result === "incorrect");
  const totalNet = report.rows.reduce((sum, row) => sum + n(row.net_total), 0);
  const completedAt = report.session.completed_at ? dateTime.format(new Date(report.session.completed_at)) : "—";
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let y = 0;

  const roundedRect = (x:number, yy:number, w:number, h:number, r:number, fill:string, stroke?:string) => {
    ctx.beginPath();
    ctx.roundRect(x, yy, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  };

  const startPage = (continuation = false) => {
    canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("تعذر إنشاء صفحة PDF");
    ctx = context;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0,0,width,height);
    ctx.direction = "rtl";
    ctx.textAlign = "right";

    ctx.fillStyle = "#ffb900";
    ctx.font = "bold 22px Arial, Tahoma, sans-serif";
    ctx.fillText("UberFix • Alazab", width - margin, 64);

    ctx.fillStyle = "#030957";
    ctx.font = "bold 38px Arial, Tahoma, sans-serif";
    ctx.fillText(continuation ? "استكمال تقرير مراجعة أذون الصيانة" : "تقرير مراجعة أذون استلام الصيانة — أبو عوف", width - margin, 112);

    ctx.fillStyle = "#667085";
    ctx.font = "20px Arial, Tahoma, sans-serif";
    ctx.fillText(`المراجع: ${report.session.reviewer_name || "—"}    •    تاريخ التقرير: ${completedAt}`, width - margin, 150);

    ctx.strokeStyle = "#dfe6ee";
    ctx.beginPath();
    ctx.moveTo(margin, 178);
    ctx.lineTo(width-margin, 178);
    ctx.stroke();
    y = 220;
    pages.push(canvas);
  };

  startPage();

  const cardW = (width - margin * 2 - 30) / 4;
  const cards = [
    ["إجمالي الأذون", String(report.rows.length), "#030957"],
    ["معتمد", String(report.session.correct_count), "#117a3f"],
    ["غير معتمد", String(report.session.incorrect_count), "#b42318"],
    ["ملاحظات البنود", String(issues.length), "#030957"],
  ];
  cards.forEach((card,index)=>{
    const x = margin + index * (cardW + 10);
    roundedRect(x,y,cardW,112,16,"#f8fafc","#e2e8f0");
    ctx.fillStyle="#667085";
    ctx.font="18px Arial, Tahoma, sans-serif";
    ctx.textAlign="center";
    ctx.fillText(card[0],x+cardW/2,y+36);
    ctx.fillStyle=card[2];
    ctx.font="bold 34px Arial, Tahoma, sans-serif";
    ctx.fillText(card[1],x+cardW/2,y+80);
  });
  ctx.textAlign="right";
  y += 142;

  roundedRect(margin,y,width-margin*2,105,16,"#f8fafc","#e2e8f0");
  ctx.fillStyle="#667085";
  ctx.font="18px Arial, Tahoma, sans-serif";
  ctx.fillText("نسبة المطابقة",width-margin-24,y+34);
  ctx.fillText("إجمالي صافي الأذون",width-margin-385,y+34);
  ctx.fillText("حالة المراجعة",width-margin-790,y+34);
  ctx.fillStyle="#111827";
  ctx.font="bold 26px Arial, Tahoma, sans-serif";
  ctx.fillText(`${report.rows.length ? ((report.session.correct_count/report.rows.length)*100).toFixed(1) : "0.0"}%`,width-margin-24,y+75);
  ctx.fillText(`${money.format(totalNet)} ج.م`,width-margin-385,y+75);
  ctx.fillText(report.session.status==="completed"?"مكتملة":"قيد المراجعة",width-margin-790,y+75);
  y += 145;

  ctx.fillStyle="#030957";
  ctx.font="bold 28px Arial, Tahoma, sans-serif";
  ctx.fillText("الاستثناءات والملاحظات",width-margin,y);
  y += 32;

  if (!incorrect.length) {
    roundedRect(margin,y,width-margin*2,280,20,"#f0fdf4","#bbf7d0");
    ctx.textAlign="center";
    ctx.fillStyle="#117a3f";
    ctx.font="bold 66px Arial, Tahoma, sans-serif";
    ctx.fillText("✓",width/2,y+90);
    ctx.font="bold 30px Arial, Tahoma, sans-serif";
    ctx.fillText("تم اعتماد جميع الأذون بدون ملاحظات",width/2,y+150);
    ctx.fillStyle="#667085";
    ctx.font="20px Arial, Tahoma, sans-serif";
    ctx.fillText("لا توجد استثناءات أو بنود مخالفة مسجلة أثناء المراجعة.",width/2,y+195);
    ctx.textAlign="right";
  } else {
    for (const row of incorrect) {
      const rowIssues = issues.filter((item)=>item.receipt_number===row.receipt_number);
      const required = 150 + Math.max(1,rowIssues.length)*72 + (row.error_comment ? 60 : 0);
      if (y + required > height - 110) startPage(true);

      roundedRect(margin,y,width-margin*2,52,12,"#fff2f0","#fecaca");
      ctx.fillStyle="#b42318";
      ctx.font="bold 22px Arial, Tahoma, sans-serif";
      ctx.fillText("غير معتمد",width-margin-18,y+33);
      ctx.fillStyle="#111827";
      ctx.font="bold 22px Arial, Tahoma, sans-serif";
      ctx.fillText(`${row.receipt_code} — ${row.branch} — ${row.receipt_date}`,width-margin-180,y+33);
      y += 70;

      if (row.error_comment) {
        ctx.fillStyle="#7f1d1d";
        ctx.font="20px Arial, Tahoma, sans-serif";
        y = wrapRtlText(ctx,`ملاحظة عامة: ${row.error_comment}`,width-margin,y,width-margin*2-30,32)+12;
      }

      if (!rowIssues.length) {
        ctx.fillStyle="#667085";
        ctx.font="18px Arial, Tahoma, sans-serif";
        ctx.fillText("لم تسجل ملاحظات على بنود محددة.",width-margin,y);
        y += 42;
      } else {
        for (const item of rowIssues) {
          roundedRect(margin,y-22,width-margin*2,62,10,"#f8fafc","#e5e7eb");
          ctx.fillStyle="#111827";
          ctx.font="bold 18px Arial, Tahoma, sans-serif";
          ctx.fillText(`بند ${item.line_no}: ${item.description || "—"}`,width-margin-16,y+4);
          ctx.fillStyle="#b42318";
          ctx.font="18px Arial, Tahoma, sans-serif";
          wrapRtlText(ctx,item.comment,width-margin-16,y+31,width-margin*2-32,26);
          y += 76;
        }
      }
      y += 20;
    }
  }

  pages.forEach((page,index)=>{
    const footer=page.getContext("2d");
    if(!footer) return;
    footer.direction="rtl";
    footer.textAlign="center";
    footer.fillStyle="#98a2b3";
    footer.font="16px Arial, Tahoma, sans-serif";
    footer.fillText(`Alazab Review • صفحة ${index+1} من ${pages.length}`,width/2,height-48);
  });

  return pages;
}

export function openPrintableReviewReportV2(report: ReviewReportPayloadV2) {
  const pdf = createPdf(buildClientReportCanvases(report));
  downloadBlob(
    new Blob([pdf as BlobPart], { type:"application/pdf" }),
    `auf-maintenance-review-${new Date().toISOString().slice(0,10)}.pdf`,
  );
}
