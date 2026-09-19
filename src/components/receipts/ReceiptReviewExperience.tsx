import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  Maximize2,
  MessageSquareText,
  RotateCw,
  Search,
  ShieldCheck,
  UserRound,
  X,
  XCircle,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import {
  exportReviewWorkbookV2,
  openPrintableReviewReportV2,
  ReviewReportPayloadV2,
} from "./review-export-v2";
import "./review-experience.css";

type ReviewResult = "correct" | "incorrect";

type ReceiptItem = {
  line_no?: number;
  description?: string;
  unit?: string;
  quantity?: number | string;
  unit_price?: number | string;
  total?: number | string;
};

type ReceiptRecord = {
  id: number;
  receipt_number: number;
  receipt_code: string;
  receipt_date: string;
  branch: string;
  items_count: number;
  total_quantity: number | string;
  subtotal: number | string;
  vat_14: number | string;
  total_with_vat: number | string;
  withholding_1: number | string;
  net_total: number | string;
  items: ReceiptItem[];
};

type ReviewEntry = {
  receipt_number: number;
  receipt_code: string;
  status: "in_progress" | "completed";
  result: ReviewResult | null;
  error_comment: string | null;
  completed_at: string | null;
  updated_at: string;
};

type SessionSummary = {
  id: string;
  reviewer_name: string | null;
  status: "in_progress" | "completed";
  current_receipt_number: number;
  completed_count: number;
  correct_count: number;
  incorrect_count: number;
  started_at: string;
  last_activity_at: string;
  completed_at: string | null;
};

type ReviewStatePayload = { session: SessionSummary; reviews: ReviewEntry[] };
type ItemNote = { line_no: number; comment: string; updated_at?: string };

const TOTAL = 120;
const TOKEN_KEY = "auf-review-session-token-v1";
const DEVICE_KEY = "auf-share-device-v1";
const REVIEWER_KEY = "auf-reviewer-name-v1";
const IMAGE_ENDPOINT = "https://bxuhcbfdoaflsgbxiqei.supabase.co/functions/v1/auf-receipt-image";

const money = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

function fmt(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? money.format(number) : "—";
}

function mapReviews(entries: ReviewEntry[]) {
  return entries.reduce<Record<number, ReviewEntry>>((acc, entry) => {
    acc[entry.receipt_number] = entry;
    return acc;
  }, {});
}

export default function ReceiptReviewExperience() {
  const viewerRef = useRef<HTMLElement>(null);
  const noteTimers = useRef<Record<number, number>>({});

  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState("");
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [sessionToken, setSessionToken] = useState("");
  const [session, setSession] = useState<SessionSummary | null>(null);
  const [reviews, setReviews] = useState<Record<number, ReviewEntry>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [jumpValue, setJumpValue] = useState("1");
  const [reviewerName, setReviewerName] = useState(() => window.localStorage.getItem(REVIEWER_KEY) || "");
  const [reviewerDraft, setReviewerDraft] = useState(() => window.localStorage.getItem(REVIEWER_KEY) || "");
  const [identityOpen, setIdentityOpen] = useState(false);
  const [identitySaving, setIdentitySaving] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ReviewResult | null>(null);
  const [generalComment, setGeneralComment] = useState("");
  const [itemNotes, setItemNotes] = useState<Record<number, string>>({});
  const [noteSaving, setNoteSaving] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [secureImageUrl, setSecureImageUrl] = useState("");
  const [imageError, setImageError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);
  const [successFlash, setSuccessFlash] = useState<number | null>(null);

  const current = receipts[currentIndex] || null;
  const currentReview = current ? reviews[current.receipt_number] : undefined;
  const hasItemNotes = useMemo(
    () => Object.values(itemNotes).some((value) => value.trim().length > 0),
    [itemNotes],
  );
  const progress = session ? Math.round((session.completed_count / TOTAL) * 100) : 0;
  const remaining = session ? TOTAL - session.completed_count : TOTAL;

  const rpc = useCallback(async (name: string, args: Record<string, unknown>) => {
    const { data, error } = await (supabase as any).rpc(name, args);
    if (error) throw error;
    return data;
  }, []);

  const loadState = useCallback(async (token: string) => {
    const payload = (await rpc("auf_review_get_state", { p_session_token: token })) as ReviewStatePayload;
    if (!payload?.session) throw new Error("review_state_missing");
    setSession(payload.session);
    setReviews(mapReviews(payload.reviews || []));
    return payload;
  }, [rpc]);

  const loadItemNotes = useCallback(async (token: string, receiptNumber: number) => {
    const rows = (await rpc("auf_review_get_item_notes", {
      p_session_token: token,
      p_receipt_number: receiptNumber,
    })) as ItemNote[];
    const next: Record<number, string> = {};
    (rows || []).forEach((row) => {
      if (row?.line_no && row.comment) next[row.line_no] = row.comment;
    });
    setItemNotes(next);
  }, [rpc]);

  const goToNumber = useCallback((number: number) => {
    const index = receipts.findIndex((receipt) => receipt.receipt_number === number);
    if (index >= 0) setCurrentIndex(index);
  }, [receipts]);

  const goNext = useCallback(() => setCurrentIndex((index) => Math.min(receipts.length - 1, index + 1)), [receipts.length]);
  const goPrevious = useCallback(() => setCurrentIndex((index) => Math.max(0, index - 1)), []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const token = window.localStorage.getItem(TOKEN_KEY) || "";
        const deviceId = window.localStorage.getItem(DEVICE_KEY) || "";
        if (!token || !deviceId) throw new Error("share_session_missing");

        const rows = (await rpc("auf_share_get_receipts", {
          p_session_token: token,
          p_device_id: deviceId,
        })) as ReceiptRecord[];
        if (!active) return;
        if (rows.length !== TOTAL) throw new Error(`receipts_${rows.length}`);
        setReceipts(rows);

        await rpc("auf_review_bootstrap", {
          p_session_token: token,
          p_reviewer_name: reviewerName.trim() || null,
        });
        const state = await loadState(token);
        if (!active) return;
        setSessionToken(token);
        const resolvedReviewer = state.session.reviewer_name?.trim() || reviewerName.trim();
        if (resolvedReviewer) {
          setReviewerName(resolvedReviewer);
          setReviewerDraft(resolvedReviewer);
          window.localStorage.setItem(REVIEWER_KEY, resolvedReviewer);
        } else {
          setIdentityOpen(true);
        }
        const index = rows.findIndex((row) => row.receipt_number === state.session.current_receipt_number);
        if (index >= 0) setCurrentIndex(index);
      } catch (error) {
        console.error(error);
        if (active) setFatalError("تعذر تجهيز جلسة المراجعة الآمنة.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [loadState, reviewerName, rpc]);

  useEffect(() => {
    if (!current || !sessionToken) return;
    setJumpValue(String(current.receipt_number));
    setZoom(1);
    setRotation(0);
    setSelectedResult(currentReview?.result || null);
    setGeneralComment(currentReview?.error_comment || "");
    setItemNotes({});
    void loadItemNotes(sessionToken, current.receipt_number);
    void rpc("auf_review_touch", {
      p_session_token: sessionToken,
      p_receipt_number: current.receipt_number,
    }).catch(console.error);
  }, [current?.receipt_number, currentReview?.result, currentReview?.error_comment, loadItemNotes, rpc, sessionToken]);

  useEffect(() => {
    if (!current || !sessionToken) return;
    const deviceId = window.localStorage.getItem(DEVICE_KEY) || "";
    const controller = new AbortController();
    let objectUrl = "";
    setImageError(false);
    setSecureImageUrl("");
    void (async () => {
      try {
        const response = await fetch(`${IMAGE_ENDPOINT}?receipt=${current.receipt_number}`, {
          headers: { "x-share-session": sessionToken, "x-share-device": deviceId },
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`image_${response.status}`);
        const blob = await response.blob();
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setSecureImageUrl(objectUrl);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error);
          setImageError(true);
        }
      }
    })();
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [current?.receipt_number, sessionToken]);

  useEffect(() => {
    const onFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => document.removeEventListener("fullscreenchange", onFullscreen);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.matches("input,textarea")) return;
      if (event.key === "ArrowLeft") { event.preventDefault(); goNext(); }
      else if (event.key === "ArrowRight") { event.preventDefault(); goPrevious(); }
      else if (event.key === "1" && !hasItemNotes) { event.preventDefault(); setSelectedResult("correct"); setGeneralComment(""); }
      else if (event.key === "2") { event.preventDefault(); setSelectedResult("incorrect"); }
      else if (event.key === "+" || event.key === "=") setZoom((value) => Math.min(3, value + 0.2));
      else if (event.key === "-") setZoom((value) => Math.max(0.6, value - 0.2));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrevious, hasItemNotes]);

  const setNote = (lineNo: number, value: string) => {
    setItemNotes((currentNotes) => ({ ...currentNotes, [lineNo]: value }));
    if (value.trim()) setSelectedResult("incorrect");
    window.clearTimeout(noteTimers.current[lineNo]);
    noteTimers.current[lineNo] = window.setTimeout(() => {
      if (!current || !sessionToken) return;
      setNoteSaving((state) => ({ ...state, [lineNo]: true }));
      void rpc("auf_review_set_item_note", {
        p_session_token: sessionToken,
        p_receipt_number: current.receipt_number,
        p_line_no: lineNo,
        p_comment: value.trim() || null,
      }).catch((error) => {
        console.error(error);
        setFatalError(`تعذر حفظ ملاحظة البند ${lineNo}.`);
      }).finally(() => setNoteSaving((state) => ({ ...state, [lineNo]: false })));
    }, 600);
  };

  const saveReviewerIdentity = async () => {
    const name = reviewerDraft.trim();
    if (!sessionToken || !name || identitySaving) return;
    setIdentitySaving(true);
    setFatalError("");
    try {
      await rpc("auf_review_bootstrap", {
        p_session_token: sessionToken,
        p_reviewer_name: name,
      });
      window.localStorage.setItem(REVIEWER_KEY, name);
      setReviewerName(name);
      await loadState(sessionToken);
      setIdentityOpen(false);
    } catch (error) {
      console.error(error);
      setFatalError("تعذر حفظ اسم المراجع. حاول مرة أخرى.");
    } finally {
      setIdentitySaving(false);
    }
  };

  const saveAndNext = async () => {
    if (!current || !sessionToken || !selectedResult || saving) return;
    if (selectedResult === "correct" && hasItemNotes) {
      setFatalError("يوجد تعليق على بند؛ لذلك لا يمكن اعتماد الإذن كصحيح قبل إزالة الملاحظة.");
      return;
    }
    const itemLines = Object.entries(itemNotes).filter(([, value]) => value.trim()).map(([line]) => line);
    const effectiveComment = selectedResult === "incorrect"
      ? (generalComment.trim() || (itemLines.length ? `ملاحظات على البنود: ${itemLines.join("، ")}` : ""))
      : "";
    if (selectedResult === "incorrect" && !effectiveComment) {
      setFatalError("اكتب ملاحظة عامة أو ملاحظة على بند واحد على الأقل.");
      return;
    }

    setSaving(true);
    setFatalError("");
    try {
      const result = await rpc("auf_review_save", {
        p_session_token: sessionToken,
        p_receipt_number: current.receipt_number,
        p_result: selectedResult,
        p_error_comment: selectedResult === "incorrect" ? effectiveComment : null,
      }) as { next_receipt_number: number; is_complete: boolean };
      const state = await loadState(sessionToken);
      setSuccessFlash(current.receipt_number);
      window.setTimeout(() => setSuccessFlash(null), 700);
      if (!result.is_complete && state.session.status !== "completed") {
        window.setTimeout(() => goToNumber(result.next_receipt_number), 220);
      }
    } catch (error) {
      console.error(error);
      setFatalError("تعذر حفظ نتيجة الإذن. لم يتم الانتقال للإذن التالي.");
    } finally {
      setSaving(false);
    }
  };

  const submitJump = (event: FormEvent) => {
    event.preventDefault();
    const number = Number(jumpValue);
    if (Number.isInteger(number) && number >= 1 && number <= TOTAL) goToNumber(number);
  };

  const toggleFullscreen = async () => {
    if (!viewerRef.current) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await viewerRef.current.requestFullscreen();
  };

  const fetchReport = async () => {
    if (!sessionToken) throw new Error("session_missing");
    return await rpc("auf_review_report", { p_session_token: sessionToken }) as ReviewReportPayloadV2;
  };

  const exportExcel = async () => {
    setExporting("excel");
    try { await exportReviewWorkbookV2(await fetchReport()); }
    catch (error) { console.error(error); setFatalError("تعذر إنشاء ملف Excel الاحترافي."); }
    finally { setExporting(null); }
  };

  const exportPdf = async () => {
    setExporting("pdf");
    try { openPrintableReviewReportV2(await fetchReport()); }
    catch (error) { console.error(error); setFatalError("تعذر تجهيز تقرير PDF."); }
    finally { setExporting(null); }
  };

  const visibleNumbers = useMemo(() => {
    if (!showOnlyErrors) return receipts.map((row) => row.receipt_number);
    return receipts.filter((row) => reviews[row.receipt_number]?.result === "incorrect").map((row) => row.receipt_number);
  }, [receipts, reviews, showOnlyErrors]);

  if (loading) return <div className="rx-center">جارٍ تجهيز تجربة المراجعة…</div>;
  if (fatalError && !receipts.length) return <div className="rx-center rx-error">{fatalError}</div>;
  if (!current || !session) return null;

  const completed = currentReview?.status === "completed";
  const approved = completed && currentReview?.result === "correct";
  const incorrect = completed && currentReview?.result === "incorrect";
  const visualResult = selectedResult ?? currentReview?.result ?? null;
  const statusStamp = visualResult === "correct"
    ? { src: "/approved.png", alt: "approved", state: "approved" }
    : visualResult === "incorrect"
      ? { src: "/not-approved.png", alt: "not-approved", state: "not-approved" }
      : { src: "/under-review.png", alt: "under-review", state: "under-review" };

  return (
    <section className="rx-workspace" ref={viewerRef} dir="rtl">
      <header className="rx-topbar">
        <div className="rx-title">
          <div className="rx-brandline"><span>UberFix</span><i>•</i><span>Alazab</span><button type="button" className="rx-reviewer-chip" onClick={()=>setIdentityOpen(true)}><UserRound size={13}/>{session.reviewer_name || reviewerName || "تحديد المراجع"}</button></div>
          <h1>مراجعة أذون استلام الصيانة</h1>
          <div className="rx-titlemeta">
            <span className={visualResult === "correct" ? "ok" : visualResult === "incorrect" ? "bad" : "pending"}>
              {visualResult === "correct" ? "معتمد" : visualResult === "incorrect" ? "غير معتمد" : "قيد المراجعة"}
            </span>
            <small>{current.branch} — {current.receipt_code}</small>
          </div>
        </div>
        <div className="rx-progress">
          <div className="rx-progress-head"><b>{session.completed_count} من {TOTAL}</b><span>{progress}% مكتمل</span></div>
          <i><em style={{ width: `${progress}%` }} /></i>
          <small><span className="ok">✓ {session.correct_count} معتمد</span><span className="bad">× {session.incorrect_count} غير معتمد</span><span>{remaining} متبقي</span></small>
        </div>
        <div className="rx-actions">
          <form onSubmit={submitJump}><Search size={16}/><input value={jumpValue} onChange={(e)=>setJumpValue(e.target.value)} inputMode="numeric"/><button>انتقال</button></form>
          <button className="excel" onClick={exportExcel} disabled={exporting !== null}><FileSpreadsheet size={17}/>{exporting === "excel" ? "جارٍ الإنشاء" : "Excel"}</button>
          <button className="pdf" onClick={exportPdf} disabled={exporting !== null}><FileText size={17}/>{exporting === "pdf" ? "جارٍ التجهيز" : "PDF"}</button>
        </div>
      </header>

      <nav className="rx-strip">
        {visibleNumbers.map((number) => {
          const entry = reviews[number];
          const cls = entry?.result === "correct" ? "ok" : entry?.result === "incorrect" ? "bad" : entry?.status === "in_progress" ? "doing" : "";
          return <button key={number} className={`${cls} ${number === current.receipt_number ? "active" : ""}`} onClick={()=>goToNumber(number)}>{entry?.result === "correct" ? <Check size={12}/> : entry?.result === "incorrect" ? <X size={12}/> : null}{String(number).padStart(3,"0")}</button>;
        })}
      </nav>

      <main className="rx-main">
        <section className="rx-document">
          <div className="rx-docbar">
            <div><b>{current.receipt_code}</b><span>{current.branch} — {current.receipt_date}</span></div>
            <div className="rx-tools">
              <button onClick={()=>setZoom((z)=>Math.max(0.6,z-0.2))}><ZoomOut size={18}/></button>
              <button className="zoom" onClick={()=>setZoom(1)}>{Math.round(zoom*100)}%</button>
              <button onClick={()=>setZoom((z)=>Math.min(3,z+0.2))}><ZoomIn size={18}/></button>
              <button onClick={()=>setRotation((r)=>(r+90)%360)}><RotateCw size={18}/></button>
              <button onClick={toggleFullscreen}><Maximize2 size={18}/></button>
            </div>
          </div>
          <div className="rx-canvas">
            {imageError ? <div className="rx-image-error"><AlertCircle/><span>تعذر تحميل صورة الإذن</span></div> : secureImageUrl ? <div className="rx-image-stage"><div className="rx-document-sheet" style={{ transform:`scale(${zoom}) rotate(${rotation}deg)` }}><img className="rx-image" src={secureImageUrl} alt={current.receipt_code}/><img key={statusStamp.state} className={`rx-status-stamp ${statusStamp.state}`} src={statusStamp.src} alt={statusStamp.alt}/></div></div> : <div className="rx-loader">جارٍ تحميل الإذن…</div>}
          </div>
          <div className="rx-nav"><button onClick={goPrevious} disabled={currentIndex===0}><ChevronRight size={18}/>السابق</button><b>إذن {String(current.receipt_number).padStart(3,"0")} من {TOTAL}</b><button onClick={goNext} disabled={currentIndex===receipts.length-1}>التالي<ChevronLeft size={18}/></button></div>
        </section>

        <aside className="rx-review">
          <section className="rx-data">
            <div className="rx-card-head"><div><span>بيانات الإذن</span><b>{current.receipt_code}</b></div><button className={showOnlyErrors ? "active" : ""} onClick={()=>setShowOnlyErrors((v)=>!v)}><AlertCircle size={14}/>الأخطاء فقط</button></div>
            <div className="rx-facts"><div><span>الفرع</span><b>{current.branch}</b></div><div><span>التاريخ</span><b>{current.receipt_date}</b></div><div><span>البنود</span><b>{current.items_count}</b></div><div><span>الكمية</span><b>{fmt(current.total_quantity)}</b></div></div>
            <div className="rx-items"><h3>بنود الصيانة <small>اكتب الملاحظة على نفس البند</small></h3>{current.items.map((item,index)=>{const line=item.line_no||index+1;const note=itemNotes[line]||"";return <article key={line} className={note.trim()?"has-note":""}><div className="rx-item-row"><i>{line}</i><div><b>{item.description||"—"}</b><span>{item.unit||"—"} × {fmt(item.quantity)} × {fmt(item.unit_price)}</span></div><strong>{fmt(item.total)}</strong></div><label><MessageSquareText size={14}/><textarea rows={1} value={note} onChange={(e)=>setNote(line,e.target.value)} placeholder="ملاحظة على هذا البند — اتركه فارغًا إذا كان مطابقًا"/><small>{noteSaving[line]?"جارٍ الحفظ…":note.trim()?"محفوظ":""}</small></label></article>})}</div>
            <div className="rx-money"><div><span>قبل الضريبة</span><b>{fmt(current.subtotal)}</b></div><div><span>VAT 14%</span><b>{fmt(current.vat_14)}</b></div><div><span>خصم 1%</span><b>{fmt(current.withholding_1)}</b></div><div className="net"><span>صافي الإذن</span><b>{fmt(current.net_total)}</b></div></div>
          </section>

          <section className={`rx-decision ${approved?"ok":incorrect?"bad":""}`}>
            <div className="rx-card-head"><div><span>قرار المراجعة</span><b>هل الإذن مطابق للبيانات المسجلة؟</b></div>{completed&&<strong className={approved?"ok":"bad"}>{approved?<><CheckCircle2 size={15}/>معتمد</>:<><XCircle size={15}/>غير معتمد</>}</strong>}</div>
            <div className="rx-choice"><button className={selectedResult==="correct"?"selected ok":"ok"} disabled={hasItemNotes} onClick={()=>{setSelectedResult("correct");setGeneralComment("")}}><CheckCircle2/><b>مطابق</b><span>اعتماد الإذن كما هو</span></button><button className={selectedResult==="incorrect"?"selected bad":"bad"} onClick={()=>setSelectedResult("incorrect")}><XCircle/><b>غير مطابق</b><span>توجد ملاحظة أو اختلاف</span></button></div>
            {hasItemNotes && <div className="rx-hint"><MessageSquareText size={15}/>وجود ملاحظة على بند يجعل الإذن تلقائيًا «خطأ» حتى إزالة الملاحظات.</div>}
            {selectedResult==="incorrect"&&<label className="rx-general"><span>ملاحظة عامة <small>اختيارية إذا كتبت ملاحظات على البنود</small></span><textarea rows={3} value={generalComment} onChange={(e)=>setGeneralComment(e.target.value)} placeholder="ملخص عام للمشكلة إن لزم…"/></label>}
            <button className="rx-save" onClick={saveAndNext} disabled={!selectedResult||saving}>{saving?"جارٍ الحفظ…":completed?"حفظ التحديث":selectedResult==="correct"?"اعتماد والانتقال للتالي":"حفظ الملاحظات والانتقال للتالي"}</button>
            <div className="rx-shortcuts"><span>1 مطابق</span><span>2 غير مطابق</span><span>← → تنقل</span><span>+ − تكبير</span><span>ملاحظات البنود تحفظ تلقائيًا</span></div>
          </section>
        </aside>
      </main>

      {identityOpen && <div className="rx-modal-backdrop">
        <div className="rx-welcome-card" role="dialog" aria-modal="true" aria-labelledby="rx-reviewer-title">
          <div className="rx-welcome-icon"><ShieldCheck size={28}/></div>
          <div className="rx-welcome-copy">
            <span>UberFix • Alazab</span>
            <h2 id="rx-reviewer-title">{session.completed_count ? "متابعة جلسة المراجعة" : "بدء مراجعة أذون الصيانة"}</h2>
            <p>سيتم توثيق قرارات المطابقة والملاحظات باسم المراجع داخل التقرير النهائي.</p>
          </div>
          <label className="rx-reviewer-field">
            <span>اسم المراجع</span>
            <input autoFocus value={reviewerDraft} onChange={(e)=>setReviewerDraft(e.target.value)} placeholder="اكتب الاسم الكامل" onKeyDown={(e)=>{if(e.key==="Enter") void saveReviewerIdentity();}}/>
          </label>
          <div className="rx-welcome-stats"><div><b>{TOTAL}</b><span>إذن</span></div><div><b>{session.completed_count}</b><span>تمت مراجعته</span></div><div><b>{remaining}</b><span>متبقي</span></div></div>
          <button className="rx-start-review" onClick={()=>void saveReviewerIdentity()} disabled={!reviewerDraft.trim()||identitySaving}>{identitySaving?"جارٍ الحفظ…":session.completed_count?"متابعة المراجعة":"بدء المراجعة"}</button>
          {session.reviewer_name && <button className="rx-modal-cancel" onClick={()=>setIdentityOpen(false)}>إلغاء</button>}
        </div>
      </div>}

      {session.status === "completed" && <div className="rx-finish-bar">
        <div><CheckCircle2 size={18}/><span>اكتملت المراجعة</span><b>{session.correct_count} معتمد</b><b>{session.incorrect_count} غير معتمد</b></div>
        <div><button onClick={exportExcel} disabled={exporting!==null}><FileSpreadsheet size={15}/>Excel</button><button onClick={exportPdf} disabled={exporting!==null}><FileText size={15}/>PDF</button></div>
      </div>}

      {fatalError && <div className="rx-toast"><AlertCircle size={17}/>{fatalError}<button onClick={()=>setFatalError("")}>×</button></div>}
      {successFlash !== null && <div className="rx-success"><CheckCircle2 size={24}/>تم حفظ قرار إذن {String(successFlash).padStart(3,"0")}</div>}
    </section>
  );
}
