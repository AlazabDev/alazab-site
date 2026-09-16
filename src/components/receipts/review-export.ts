export interface ReviewReportRow {
  receipt_number: number;
  receipt_code: string;
  receipt_date: string;
  branch: string;
  items_count: number;
  subtotal: number | string;
  vat_14: number | string;
  withholding_1: number | string;
  net_total: number | string;
  image_url: string;
  review_status: string;
  review_result: "correct" | "incorrect" | null;
  error_comment: string | null;
  reviewed_at: string | null;
}

export interface ReviewReportPayload {
  session: {
    reviewer_name: string | null;
    status: string;
    completed_count: number;
    correct_count: number;
    incorrect_count: number;
    started_at: string;
    completed_at: string | null;
  };
  rows: ReviewReportRow[];
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
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zipStore(entries: Array<{ name: string; data: Uint8Array }>): Uint8Array {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let localOffset = 0;
  const now = new Date();
  const dosTime =
    ((now.getHours() & 0x1f) << 11) |
    ((now.getMinutes() & 0x3f) << 5) |
    ((Math.floor(now.getSeconds() / 2)) & 0x1f);
  const dosDate =
    (((Math.max(1980, now.getFullYear()) - 1980) & 0x7f) << 9) |
    (((now.getMonth() + 1) & 0x0f) << 5) |
    (now.getDate() & 0x1f);

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const data = entry.data;
    const crc = crc32(data);
    const flags = 0x0800;
    const local = concatBytes([
      le32(0x04034b50),
      le16(20),
      le16(flags),
      le16(0),
      le16(dosTime),
      le16(dosDate),
      le32(crc),
      le32(data.length),
      le32(data.length),
      le16(name.length),
      le16(0),
      name,
      data,
    ]);
    localParts.push(local);

    centralParts.push(
      concatBytes([
        le32(0x02014b50),
        le16(20),
        le16(20),
        le16(flags),
        le16(0),
        le16(dosTime),
        le16(dosDate),
        le32(crc),
        le32(data.length),
        le32(data.length),
        le16(name.length),
        le16(0),
        le16(0),
        le16(0),
        le16(0),
        le32(0),
        le32(localOffset),
        name,
      ]),
    );
    localOffset += local.length;
  }

  const central = concatBytes(centralParts);
  const end = concatBytes([
    le32(0x06054b50),
    le16(0),
    le16(0),
    le16(entries.length),
    le16(entries.length),
    le32(central.length),
    le32(localOffset),
    le16(0),
  ]);

  return concatBytes([...localParts, central, end]);
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

function sheetXml(rows: Array<Array<string | number | null>>, widths: number[]): string {
  const body = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, colIndex) => {
          const ref = cellRef(colIndex + 1, rowIndex + 1);
          const style = rowIndex === 0 ? ' s="1"' : "";
          if (typeof value === "number" && Number.isFinite(value)) {
            return `<c r="${ref}"${style}><v>${value}</v></c>`;
          }
          return `<c r="${ref}" t="inlineStr"${style}><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
        })
        .join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");

  const cols = widths
    .map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`)
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView workbookViewId="0" rightToLeft="1"/></sheetViews>
  <cols>${cols}</cols>
  <sheetData>${body}</sheetData>
  <autoFilter ref="A1:${cellRef(rows[0]?.length || 1, rows.length)}"/>
</worksheet>`;
}

function createXlsx(report: ReviewReportPayload): Uint8Array {
  const detailRows: Array<Array<string | number | null>> = [
    [
      "رقم الإذن",
      "الكود",
      "التاريخ",
      "الفرع",
      "عدد البنود",
      "قبل الضريبة",
      "ضريبة 14%",
      "خصم 1%",
      "الصافي",
      "نتيجة المراجعة",
      "تعليق الخطأ",
      "وقت المراجعة",
      "رابط الصورة",
    ],
    ...report.rows.map((row) => [
      row.receipt_number,
      row.receipt_code,
      row.receipt_date,
      row.branch,
      row.items_count,
      Number(row.subtotal),
      Number(row.vat_14),
      Number(row.withholding_1),
      Number(row.net_total),
      row.review_result === "correct" ? "صحيح" : row.review_result === "incorrect" ? "خطأ" : "غير مراجع",
      row.error_comment || "",
      row.reviewed_at || "",
      row.image_url,
    ]),
  ];

  const summaryRows: Array<Array<string | number | null>> = [
    ["البيان", "القيمة"],
    ["المراجع", report.session.reviewer_name || "—"],
    ["إجمالي الأذون", report.rows.length],
    ["تمت المراجعة", report.session.completed_count],
    ["صحيح", report.session.correct_count],
    ["خطأ", report.session.incorrect_count],
    ["نسبة المطابقة", report.rows.length ? `${((report.session.correct_count / report.rows.length) * 100).toFixed(1)}%` : "0%"],
    ["بدء المراجعة", report.session.started_at || ""],
    ["انتهاء المراجعة", report.session.completed_at || ""],
  ];

  const entries = [
    {
      name: "[Content_Types].xml",
      data: encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`),
    },
    {
      name: "_rels/.rels",
      data: encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`),
    },
    {
      name: "xl/workbook.xml",
      data: encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <bookViews><workbookView/></bookViews>
  <sheets>
    <sheet name="تفاصيل المراجعة" sheetId="1" r:id="rId1"/>
    <sheet name="ملخص المراجعة" sheetId="2" r:id="rId2"/>
  </sheets>
</workbook>`),
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      data: encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`),
    },
    {
      name: "xl/styles.xml",
      data: encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2"><font><sz val="11"/><name val="Arial"/></font><font><b/><sz val="11"/><name val="Arial"/></font></fonts>
  <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>
</styleSheet>`),
    },
    {
      name: "xl/worksheets/sheet1.xml",
      data: encoder.encode(sheetXml(detailRows, [12, 15, 16, 28, 12, 16, 14, 14, 16, 18, 42, 24, 54])),
    },
    {
      name: "xl/worksheets/sheet2.xml",
      data: encoder.encode(sheetXml(summaryRows, [28, 34])),
    },
  ];

  return zipStore(entries);
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

function buildReportCanvases(report: ReviewReportPayload): HTMLCanvasElement[] {
  const width = 1240;
  const height = 1754;
  const margin = 80;
  const pages: HTMLCanvasElement[] = [];
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let y = 0;

  const startPage = () => {
    canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("تعذر إنشاء صفحة PDF");
    ctx = context;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.direction = "rtl";
    ctx.textAlign = "right";
    ctx.fillStyle = "#030957";
    ctx.font = "bold 38px Arial, Tahoma, sans-serif";
    ctx.fillText("تقرير مراجعة أذون استلام الصيانة — أبو عوف", width - margin, 80);
    ctx.font = "24px Arial, Tahoma, sans-serif";
    ctx.fillStyle = "#334155";
    ctx.fillText(`المراجع: ${report.session.reviewer_name || "—"}`, width - margin, 125);
    ctx.fillText(
      `الإجمالي: ${report.rows.length}   |   صحيح: ${report.session.correct_count}   |   خطأ: ${report.session.incorrect_count}`,
      width - margin,
      165,
    );
    ctx.strokeStyle = "#dbe2ea";
    ctx.beginPath();
    ctx.moveTo(margin, 195);
    ctx.lineTo(width - margin, 195);
    ctx.stroke();
    y = 240;
    pages.push(canvas);
  };

  startPage();

  for (const row of report.rows) {
    const comment = row.error_comment || "";
    const rowHeight = row.review_result === "incorrect" && comment ? 150 : 100;
    if (y + rowHeight > height - 80) startPage();

    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(margin, y - 42, width - margin * 2, rowHeight - 12);
    ctx.font = "bold 25px Arial, Tahoma, sans-serif";
    ctx.fillStyle = row.review_result === "correct" ? "#15803d" : row.review_result === "incorrect" ? "#b91c1c" : "#64748b";
    const resultLabel = row.review_result === "correct" ? "✓ صحيح" : row.review_result === "incorrect" ? "✕ خطأ" : "غير مراجع";
    ctx.fillText(resultLabel, width - margin - 20, y);

    ctx.fillStyle = "#0f172a";
    ctx.font = "23px Arial, Tahoma, sans-serif";
    ctx.fillText(`${row.receipt_code} — ${row.branch} — ${row.receipt_date}`, width - margin - 210, y);

    if (row.review_result === "incorrect" && comment) {
      ctx.font = "21px Arial, Tahoma, sans-serif";
      ctx.fillStyle = "#7f1d1d";
      wrapRtlText(ctx, `التعليق: ${comment}`, width - margin - 20, y + 48, width - margin * 2 - 40, 32);
    }
    y += rowHeight;
  }

  return pages;
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

    const jpeg = dataUrlBytes(canvas.toDataURL("image/jpeg", 0.9));
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
  for (let i = 1; i <= objectCount; i += 1) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  bodyParts.push(encoder.encode(xref));
  return concatBytes(bodyParts);
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function timestamp(): string {
  const d = new Date();
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export async function exportReviewFiles(report: ReviewReportPayload): Promise<void> {
  const stamp = timestamp();
  const xlsx = createXlsx(report);
  downloadBlob(
    new Blob([xlsx], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `auf-maintenance-review-${stamp}.xlsx`,
  );

  const pdf = createPdf(buildReportCanvases(report));
  await new Promise((resolve) => window.setTimeout(resolve, 150));
  downloadBlob(new Blob([pdf], { type: "application/pdf" }), `auf-maintenance-review-${stamp}.pdf`);
}
