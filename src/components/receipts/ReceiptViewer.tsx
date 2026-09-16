import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
  RotateCw,
  Search,
  Save,
  X,
  XCircle,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  FormEvent,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { supabase } from "@/integrations/supabase/client";
import {
  exportReviewFiles,
  ReviewReportPayload,
} from "./review-export";
import "./receipt-viewer.css";

type ReviewResult = "correct" | "incorrect";

interface ReceiptItem {
  line_no?: number;
  description?: string;
  unit?: string;
  quantity?: number | string;
  unit_price?: number | string;
  total?: number | string;
  status?: string;
}

interface ReceiptRecord {
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
  image_url: string;
  items: ReceiptItem[];
}

interface ReviewEntry {
  receipt_number: number;
  receipt_code: string;
  status: "in_progress" | "completed";
  result: ReviewResult | null;
  error_comment: string | null;
  completed_at: string | null;
  updated_at: string;
}

interface SessionSummary {
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
}

interface ReviewStatePayload {
  session: SessionSummary;
  reviews: ReviewEntry[];
}

const TOTAL_RECEIPTS = 120;
const TOKEN_KEY = "auf-review-session-token-v1";
const REVIEWER_KEY = "auf-reviewer-name-v1";
const EXPORTED_KEY_PREFIX = "auf-review-auto-exported-v1:";
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;
const SWIPE_THRESHOLD = 70;

const moneyFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function formatNumber(value: number | string | null | undefined): string {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? moneyFormatter.format(number) : "—";
}

function getStoredReviewerName(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(REVIEWER_KEY) || "";
}

function reviewMap(entries: ReviewEntry[]): Record<number, ReviewEntry> {
  return entries.reduce<Record<number, ReviewEntry>>((acc, entry) => {
    acc[entry.receipt_number] = entry;
    return acc;
  }, {});
}

export default function ReceiptViewer() {
  const viewerRef = useRef<HTMLElement>(null);
  const dragStartXRef = useRef<number | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const autoExportingRef = useRef(false);

  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [jumpValue, setJumpValue] = useState("1");
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState("");
  const [started, setStarted] = useState(false);
  const [starting, setStarting] = useState(false);
  const [sessionToken, setSessionToken] = useState("");
  const [session, setSession] = useState<SessionSummary | null>(null);
  const [reviews, setReviews] = useState<Record<number, ReviewEntry>>({});
  const [reviewerName, setReviewerName] = useState(getStoredReviewerName);
  const [selectedResult, setSelectedResult] = useState<ReviewResult | null>(null);
  const [errorComment, setErrorComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [completedFlash, setCompletedFlash] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);

  const currentReceipt = receipts[currentIndex] || null;
  const currentReview = currentReceipt
    ? reviews[currentReceipt.receipt_number]
    : undefined;

  const progress = session
    ? Math.round((session.completed_count / TOTAL_RECEIPTS) * 1000) / 10
    : 0;

  const visibleReceiptNumbers = useMemo(() => {
    if (!showOnlyErrors) return receipts.map((receipt) => receipt.receipt_number);
    return receipts
      .filter((receipt) => reviews[receipt.receipt_number]?.result === "incorrect")
      .map((receipt) => receipt.receipt_number);
  }, [receipts, reviews, showOnlyErrors]);

  const resetImageState = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setDragOffset(0);
    setLoaded(false);
    setFailed(false);
  }, []);

  const goToReceiptNumber = useCallback(
    (receiptNumber: number) => {
      const index = receipts.findIndex(
        (receipt) => receipt.receipt_number === receiptNumber,
      );
      if (index >= 0) setCurrentIndex(index);
    },
    [receipts],
  );

  const goPrevious = useCallback(() => {
    setCurrentIndex((current) => Math.max(0, current - 1));
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex((current) =>
      Math.min(receipts.length - 1, current + 1),
    );
  }, [receipts.length]);

  const zoomIn = useCallback(() => {
    setZoom((current) => Math.min(MAX_ZOOM, current + ZOOM_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((current) => Math.max(MIN_ZOOM, current - ZOOM_STEP));
  }, []);

  const resetZoom = useCallback(() => setZoom(1), []);

  const toggleFullscreen = useCallback(async () => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    try {
      if (!document.fullscreenElement) await viewer.requestFullscreen();
      else await document.exitFullscreen();
    } catch (error) {
      console.error("Fullscreen operation failed:", error);
    }
  }, []);

  const fetchReceipts = useCallback(async (): Promise<ReceiptRecord[]> => {
    const { data, error } = await (supabase as any)
      .from("auf_maintenance_receipts")
      .select(
        "id,receipt_number,receipt_code,receipt_date,branch,items_count,total_quantity,subtotal,vat_14,total_with_vat,withholding_1,net_total,image_url,items",
      )
      .order("receipt_number", { ascending: true });

    if (error) throw error;
    const rows = (data || []) as ReceiptRecord[];
    if (rows.length !== TOTAL_RECEIPTS) {
      throw new Error(`عدد الأذون في قاعدة البيانات ${rows.length} وليس ${TOTAL_RECEIPTS}`);
    }
    return rows;
  }, []);

  const loadReviewState = useCallback(
    async (token: string): Promise<ReviewStatePayload> => {
      const { data, error } = await (supabase as any).rpc(
        "auf_review_get_state",
        { p_session_token: token },
      );
      if (error) throw error;
      if (!data?.session) throw new Error("تعذر قراءة جلسة المراجعة");
      const payload = data as ReviewStatePayload;
      setSession(payload.session);
      setReviews(reviewMap(payload.reviews || []));
      return payload;
    },
    [],
  );

  const bootstrapSession = useCallback(
    async (token: string, name: string) => {
      const { error } = await (supabase as any).rpc("auf_review_bootstrap", {
        p_session_token: token,
        p_reviewer_name: name.trim() || null,
      });
      if (error) throw error;
      const state = await loadReviewState(token);
      setSessionToken(token);
      setStarted(true);
      goToReceiptNumber(state.session.current_receipt_number);
      return state;
    },
    [goToReceiptNumber, loadReviewState],
  );

  const fetchAndExport = useCallback(
    async (token = sessionToken) => {
      if (!token || exporting) return;
      setExporting(true);
      try {
        const { data, error } = await (supabase as any).rpc(
          "auf_review_report",
          { p_session_token: token },
        );
        if (error) throw error;
        await exportReviewFiles(data as ReviewReportPayload);
        setExportDone(true);
      } catch (error) {
        console.error(error);
        setFatalError("تمت المراجعة لكن تعذر إنشاء ملفات Excel وPDF. يمكن إعادة التصدير من زر التصدير.");
      } finally {
        setExporting(false);
      }
    },
    [exporting, sessionToken],
  );

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const rows = await fetchReceipts();
        if (!active) return;
        setReceipts(rows);

        const token = window.localStorage.getItem(TOKEN_KEY);
        if (token) {
          try {
            const name = window.localStorage.getItem(REVIEWER_KEY) || "";
            const { error } = await (supabase as any).rpc(
              "auf_review_bootstrap",
              {
                p_session_token: token,
                p_reviewer_name: name.trim() || null,
              },
            );
            if (error) throw error;
            const state = await loadReviewState(token);
            if (!active) return;
            setSessionToken(token);
            setStarted(true);
            const index = rows.findIndex(
              (receipt) =>
                receipt.receipt_number === state.session.current_receipt_number,
            );
            if (index >= 0) setCurrentIndex(index);
            if (state.session.status === "completed") setShowCompletion(true);
          } catch (error) {
            console.error(error);
            window.localStorage.removeItem(TOKEN_KEY);
          }
        }
      } catch (error) {
        console.error(error);
        if (active) setFatalError("تعذر تحميل بيانات أذون الصيانة من قاعدة البيانات.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [fetchReceipts, loadReviewState]);

  useEffect(() => {
    if (!currentReceipt) return;
    resetImageState();
    setJumpValue(String(currentReceipt.receipt_number));
    const review = reviews[currentReceipt.receipt_number];
    setSelectedResult(review?.result || null);
    setErrorComment(review?.error_comment || "");
    setDraftSavedAt(null);
  }, [currentReceipt, resetImageState, reviews]);

  useEffect(() => {
    if (!started || !sessionToken || !currentReceipt) return;
    void (supabase as any)
      .rpc("auf_review_touch", {
        p_session_token: sessionToken,
        p_receipt_number: currentReceipt.receipt_number,
      })
      .then(({ error }: { error?: unknown }) => {
        if (error) console.error(error);
      });
  }, [currentReceipt, sessionToken, started]);

  useEffect(() => {
    if (!started || !sessionToken || !currentReceipt) return;
    const review = reviews[currentReceipt.receipt_number];
    if (review?.status === "completed") return;
    if (!selectedResult && !errorComment.trim()) return;

    const timer = window.setTimeout(() => {
      void (supabase as any)
        .rpc("auf_review_draft", {
          p_session_token: sessionToken,
          p_receipt_number: currentReceipt.receipt_number,
          p_result: selectedResult,
          p_error_comment: errorComment.trim() || null,
        })
        .then(({ error }: { error?: unknown }) => {
          if (error) {
            console.error(error);
            return;
          }
          setDraftSavedAt(new Date().toLocaleTimeString("ar-EG", {
            hour: "2-digit",
            minute: "2-digit",
          }));
        });
    }, 650);

    return () => window.clearTimeout(timer);
  }, [
    currentReceipt,
    errorComment,
    reviews,
    selectedResult,
    sessionToken,
    started,
  ]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === viewerRef.current);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) return;

      if (event.key === "ArrowLeft" || event.key === "PageDown") {
        event.preventDefault();
        goNext();
      } else if (event.key === "ArrowRight" || event.key === "PageUp") {
        event.preventDefault();
        goPrevious();
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoomIn();
      } else if (event.key === "-") {
        event.preventDefault();
        zoomOut();
      } else if (event.key === "0") {
        event.preventDefault();
        resetZoom();
      } else if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        void toggleFullscreen();
      } else if (event.key === "1") {
        event.preventDefault();
        setSelectedResult("correct");
        setErrorComment("");
      } else if (event.key === "2") {
        event.preventDefault();
        setSelectedResult("incorrect");
      }
    };
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [goNext, goPrevious, resetZoom, toggleFullscreen, zoomIn, zoomOut]);

  const startReview = async () => {
    setStarting(true);
    setFatalError("");
    try {
      const token = crypto.randomUUID();
      window.localStorage.setItem(TOKEN_KEY, token);
      window.localStorage.setItem(REVIEWER_KEY, reviewerName.trim());
      await bootstrapSession(token, reviewerName);
    } catch (error) {
      console.error(error);
      setFatalError("تعذر بدء جلسة المراجعة.");
      window.localStorage.removeItem(TOKEN_KEY);
    } finally {
      setStarting(false);
    }
  };

  const submitJump = (event?: FormEvent) => {
    event?.preventDefault();
    const requested = Number(jumpValue);
    if (!Number.isInteger(requested) || requested < 1 || requested > TOTAL_RECEIPTS) {
      setJumpValue(String(currentReceipt?.receipt_number || 1));
      return;
    }
    goToReceiptNumber(requested);
  };

  const saveReview = async () => {
    if (!currentReceipt || !sessionToken || !selectedResult || saving) return;
    if (selectedResult === "incorrect" && !errorComment.trim()) {
      setFatalError("عند اختيار «خطأ» يجب كتابة تعليق يوضح الخطأ.");
      return;
    }

    setSaving(true);
    setFatalError("");
    try {
      const { data, error } = await (supabase as any).rpc("auf_review_save", {
        p_session_token: sessionToken,
        p_receipt_number: currentReceipt.receipt_number,
        p_result: selectedResult,
        p_error_comment:
          selectedResult === "incorrect" ? errorComment.trim() : null,
      });
      if (error) throw error;

      const result = data as {
        next_receipt_number: number;
        is_complete: boolean;
      };
      const state = await loadReviewState(sessionToken);
      setCompletedFlash(currentReceipt.receipt_number);
      window.setTimeout(() => setCompletedFlash(null), 900);

      if (result.is_complete || state.session.status === "completed") {
        setShowCompletion(true);
        const exportKey = `${EXPORTED_KEY_PREFIX}${sessionToken}`;
        if (!window.localStorage.getItem(exportKey) && !autoExportingRef.current) {
          autoExportingRef.current = true;
          await fetchAndExport(sessionToken);
          window.localStorage.setItem(exportKey, "1");
          autoExportingRef.current = false;
        }
        return;
      }

      window.setTimeout(() => {
        goToReceiptNumber(result.next_receipt_number);
      }, 450);
    } catch (error) {
      console.error(error);
      setFatalError("تعذر حفظ نتيجة مراجعة الإذن.");
    } finally {
      setSaving(false);
    }
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (zoom > 1.05) return;
    dragStartXRef.current = event.clientX;
    activePointerIdRef.current = event.pointerId;
    setIsDragging(true);
    setDragOffset(0);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      !isDragging ||
      dragStartXRef.current === null ||
      activePointerIdRef.current !== event.pointerId
    ) return;
    const movement = event.clientX - dragStartXRef.current;
    setDragOffset(Math.max(-220, Math.min(220, movement)));
  };

  const finishPointerGesture = (
    event: ReactPointerEvent<HTMLDivElement>,
    cancelled = false,
  ) => {
    if (activePointerIdRef.current !== event.pointerId) return;
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Pointer already released.
    }
    const finalOffset = dragOffset;
    dragStartXRef.current = null;
    activePointerIdRef.current = null;
    setIsDragging(false);
    setDragOffset(0);
    if (cancelled) return;
    if (finalOffset <= -SWIPE_THRESHOLD) goNext();
    else if (finalOffset >= SWIPE_THRESHOLD) goPrevious();
  };

  if (loading) {
    return (
      <section className="review-loading" dir="rtl">
        <span className="receipt-free-spinner" />
        <strong>جارٍ تجهيز بيئة المراجعة...</strong>
      </section>
    );
  }

  if (!receipts.length) {
    return (
      <section className="review-loading review-loading--error" dir="rtl">
        <AlertCircle size={28} />
        <strong>{fatalError || "لا توجد بيانات أذون متاحة."}</strong>
      </section>
    );
  }

  if (!started) {
    return (
      <section className="review-start" dir="rtl">
        <div className="review-start__card">
          <div className="review-start__icon"><Play size={32} /></div>
          <h1>مراجعة أذون استلام الصيانة — أبو عوف</h1>
          <p>
            {TOTAL_RECEIPTS} إذن جاهزة للمراجعة. يتم حفظ التقدم تلقائيًا، وعند العودة
            ستكمل من آخر إذن توقفت عنده.
          </p>
          <label>
            اسم المراجع <span>اختياري</span>
            <input
              value={reviewerName}
              onChange={(event) => setReviewerName(event.target.value)}
              placeholder="اسم المراجع"
              autoComplete="name"
            />
          </label>
          {fatalError && <div className="review-inline-error">{fatalError}</div>}
          <button type="button" className="review-primary" onClick={startReview} disabled={starting}>
            <Play size={19} />
            {starting ? "جارٍ البدء..." : "بدء المراجعة"}
          </button>
        </div>
      </section>
    );
  }

  if (!currentReceipt || !session) return null;

  const completed = currentReview?.status === "completed";
  const currentStatusClass = completed
    ? currentReview?.result === "correct"
      ? "is-correct"
      : "is-incorrect"
    : "is-pending";

  return (
    <section ref={viewerRef} className="receipt-review-workspace" dir="rtl">
      <header className="review-topbar">
        <div className="review-heading">
          <h1>مراجعة أذون أبو عوف</h1>
          <span className={`review-current-state ${currentStatusClass}`}>
            {completed
              ? currentReview?.result === "correct"
                ? <><CheckCircle2 size={17} /> تمت المراجعة — صحيح</>
                : <><XCircle size={17} /> تمت المراجعة — خطأ</>
              : "قيد المراجعة"}
          </span>
        </div>

        <div className="review-progress-block">
          <div className="review-progress-meta">
            <strong>{session.completed_count} / {TOTAL_RECEIPTS}</strong>
            <span>{progress}%</span>
          </div>
          <div className="review-progress-track" aria-label={`نسبة الإنجاز ${progress}%`}>
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className="review-progress-stats">
            <span className="stat-correct"><Check size={14} /> صحيح {session.correct_count}</span>
            <span className="stat-incorrect"><X size={14} /> خطأ {session.incorrect_count}</span>
            <span>متبقي {TOTAL_RECEIPTS - session.completed_count}</span>
          </div>
        </div>

        <div className="review-top-actions">
          <form className="receipt-free-jump" onSubmit={submitJump}>
            <Search size={17} />
            <input
              type="number"
              min={1}
              max={TOTAL_RECEIPTS}
              value={jumpValue}
              onChange={(event) => setJumpValue(event.target.value)}
              aria-label="رقم الإذن"
            />
            <button type="submit">انتقال</button>
          </form>
          {session.status === "completed" && (
            <button className="review-export-button" type="button" onClick={() => void fetchAndExport()} disabled={exporting}>
              <Download size={17} />
              {exporting ? "جارٍ التصدير..." : "تصدير Excel + PDF"}
            </button>
          )}
        </div>
      </header>

      <div className="review-receipt-strip" aria-label="حالة الأذون">
        {visibleReceiptNumbers.map((number) => {
          const entry = reviews[number];
          const isCurrent = number === currentReceipt.receipt_number;
          const status = entry?.status === "completed"
            ? entry.result === "correct" ? "correct" : "incorrect"
            : entry?.status === "in_progress" ? "in-progress" : "pending";
          return (
            <button
              key={number}
              type="button"
              className={`review-receipt-chip review-receipt-chip--${status}${isCurrent ? " is-current" : ""}`}
              onClick={() => goToReceiptNumber(number)}
              title={`إذن ${String(number).padStart(3, "0")}`}
            >
              {entry?.status === "completed" && entry.result === "correct" && <Check size={13} />}
              {entry?.status === "completed" && entry.result === "incorrect" && <X size={13} />}
              {String(number).padStart(3, "0")}
            </button>
          );
        })}
        {showOnlyErrors && visibleReceiptNumbers.length === 0 && (
          <span className="review-strip-empty">لا توجد أذون مسجلة كخطأ.</span>
        )}
      </div>

      <main className="review-main-grid">
        <section className="review-image-panel">
          <div className="review-image-toolbar">
            <div>
              <strong>{currentReceipt.receipt_code}</strong>
              <span>{currentReceipt.branch} — {currentReceipt.receipt_date}</span>
            </div>
            <div className="receipt-free-tools">
              <button type="button" onClick={zoomOut} disabled={zoom <= MIN_ZOOM} title="تصغير"><ZoomOut size={19} /></button>
              <button type="button" className="receipt-free-zoom-value" onClick={resetZoom}>{Math.round(zoom * 100)}%</button>
              <button type="button" onClick={zoomIn} disabled={zoom >= MAX_ZOOM} title="تكبير"><ZoomIn size={19} /></button>
              <button type="button" onClick={() => setRotation((value) => (value + 90) % 360)} title="تدوير"><RotateCw size={19} /></button>
              <button type="button" onClick={() => { resetZoom(); setRotation(0); }} title="إعادة الضبط"><RotateCcw size={18} /></button>
              <a href={currentReceipt.image_url} target="_blank" rel="noopener noreferrer" title="فتح الأصل"><ExternalLink size={18} /></a>
              <button type="button" onClick={() => void toggleFullscreen()} title="ملء الشاشة">
                {isFullscreen ? <Minimize2 size={19} /> : <Maximize2 size={19} />}
              </button>
            </div>
          </div>

          <div
            className={`receipt-free-canvas${isDragging ? " receipt-free-canvas--dragging" : ""}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishPointerGesture}
            onPointerCancel={(event) => finishPointerGesture(event, true)}
            onDoubleClick={() => setZoom((value) => value > 1 ? 1 : 2)}
          >
            {!loaded && !failed && (
              <div className="receipt-free-loading"><span className="receipt-free-spinner" /><span>جارٍ تحميل الإذن...</span></div>
            )}
            {failed ? (
              <div className="receipt-free-error">
                <strong>تعذر تحميل صورة الإذن</strong>
                <a href={currentReceipt.image_url} target="_blank" rel="noopener noreferrer">فتح الصورة الأصلية</a>
              </div>
            ) : (
              <img
                key={currentReceipt.image_url}
                src={currentReceipt.image_url}
                alt={`إذن ${currentReceipt.receipt_code}`}
                className={`receipt-free-image${loaded ? " receipt-free-image--loaded" : ""}`}
                style={{
                  transform: `translateX(${zoom <= 1.05 ? dragOffset : 0}px) scale(${zoom}) rotate(${rotation}deg)`,
                }}
                draggable={false}
                decoding="async"
                onLoad={() => setLoaded(true)}
                onError={() => setFailed(true)}
              />
            )}
          </div>

          <div className="review-image-nav">
            <button type="button" onClick={goPrevious} disabled={currentIndex === 0}><ChevronRight size={19} /> السابق</button>
            <strong>إذن {String(currentReceipt.receipt_number).padStart(3, "0")} من {TOTAL_RECEIPTS}</strong>
            <button type="button" onClick={goNext} disabled={currentIndex === receipts.length - 1}>التالي <ChevronLeft size={19} /></button>
          </div>
        </section>

        <aside className="review-confirm-panel">
          <section className="review-data-card">
            <div className="review-card-title">
              <div>
                <span>بيانات الإذن</span>
                <strong>{currentReceipt.receipt_code}</strong>
              </div>
              <button
                type="button"
                className={`review-errors-filter${showOnlyErrors ? " is-active" : ""}`}
                onClick={() => setShowOnlyErrors((value) => !value)}
              >
                <AlertCircle size={15} /> الأخطاء فقط
              </button>
            </div>

            <div className="review-facts">
              <div><span>الفرع</span><strong>{currentReceipt.branch}</strong></div>
              <div><span>التاريخ</span><strong>{currentReceipt.receipt_date}</strong></div>
              <div><span>عدد البنود</span><strong>{currentReceipt.items_count}</strong></div>
              <div><span>إجمالي الكمية</span><strong>{formatNumber(currentReceipt.total_quantity)}</strong></div>
            </div>

            <div className="review-items">
              <h3>بنود الصيانة</h3>
              {currentReceipt.items.map((item, index) => (
                <div className="review-item" key={`${item.line_no || index}-${index}`}>
                  <div className="review-item__number">{index + 1}</div>
                  <div className="review-item__body">
                    <strong>{item.description || "—"}</strong>
                    <span>
                      {item.unit || "—"} × {formatNumber(item.quantity)} × {formatNumber(item.unit_price)}
                    </span>
                  </div>
                  <strong className="review-item__total">{formatNumber(item.total)}</strong>
                </div>
              ))}
            </div>

            <div className="review-financials">
              <div><span>قبل الضريبة</span><strong>{formatNumber(currentReceipt.subtotal)}</strong></div>
              <div><span>VAT 14%</span><strong>{formatNumber(currentReceipt.vat_14)}</strong></div>
              <div><span>خصم 1%</span><strong>{formatNumber(currentReceipt.withholding_1)}</strong></div>
              <div className="review-net"><span>صافي الإذن</span><strong>{formatNumber(currentReceipt.net_total)}</strong></div>
            </div>
          </section>

          <section className={`review-confirm-card ${currentStatusClass}`}>
            <div className="review-card-title">
              <div>
                <span>فاتورة تأكيد المراجعة</span>
                <strong>مطابقة البيانات مع الإذن الأصلي</strong>
              </div>
              {completed && (
                <span className={`review-completed-badge ${currentReview?.result === "correct" ? "is-correct" : "is-incorrect"}`}>
                  {currentReview?.result === "correct" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  مكتمل
                </span>
              )}
            </div>

            <div className="review-decision-buttons">
              <button
                type="button"
                className={`review-decision review-decision--correct${selectedResult === "correct" ? " is-selected" : ""}`}
                onClick={() => { setSelectedResult("correct"); setErrorComment(""); }}
              >
                <CheckCircle2 size={24} />
                <span><strong>صحيح</strong><small>البيانات مطابقة للإذن</small></span>
              </button>
              <button
                type="button"
                className={`review-decision review-decision--incorrect${selectedResult === "incorrect" ? " is-selected" : ""}`}
                onClick={() => setSelectedResult("incorrect")}
              >
                <XCircle size={24} />
                <span><strong>خطأ</strong><small>يوجد اختلاف يحتاج توضيحًا</small></span>
              </button>
            </div>

            {selectedResult === "incorrect" && (
              <label className="review-comment-field">
                <span>التعليق على الخطأ <b>*</b></span>
                <textarea
                  value={errorComment}
                  onChange={(event) => setErrorComment(event.target.value)}
                  placeholder="اكتب الاختلاف الموجود في الإذن بوضوح..."
                  rows={4}
                  autoFocus
                />
              </label>
            )}

            <div className="review-save-row">
              <span className="review-autosave">
                {draftSavedAt ? <><Save size={14} /> حفظ تلقائي {draftSavedAt}</> : "يتم حفظ مسودة العمل تلقائيًا"}
              </span>
              <button
                type="button"
                className="review-complete-button"
                disabled={!selectedResult || saving || (selectedResult === "incorrect" && !errorComment.trim())}
                onClick={() => void saveReview()}
              >
                {saving ? <span className="receipt-free-spinner receipt-free-spinner--small" /> : <Check size={19} />}
                {completed ? "تحديث وإتمام الإذن" : "إتمام الإذن وحفظه"}
              </button>
            </div>

            <div className="review-shortcuts">
              <span>1 = صحيح</span><span>2 = خطأ</span><span>← → = تنقل</span><span>F = ملء الشاشة</span>
            </div>
          </section>
        </aside>
      </main>

      {fatalError && (
        <div className="review-toast review-toast--error"><AlertCircle size={18} />{fatalError}</div>
      )}

      {completedFlash !== null && (
        <div className="review-complete-flash">
          <CheckCircle2 size={40} />
          <strong>تم اعتماد مراجعة الإذن {String(completedFlash).padStart(3, "0")}</strong>
        </div>
      )}

      {showCompletion && session.status === "completed" && (
        <div className="review-modal-backdrop">
          <div className="review-completion-modal">
            <div className="review-completion-icon"><CheckCircle2 size={42} /></div>
            <h2>اكتملت مراجعة جميع الأذون</h2>
            <p>تمت مراجعة {TOTAL_RECEIPTS} من {TOTAL_RECEIPTS} إذنًا.</p>
            <div className="review-completion-stats">
              <div><span>صحيح</span><strong>{session.correct_count}</strong></div>
              <div><span>خطأ</span><strong>{session.incorrect_count}</strong></div>
              <div><span>الإنجاز</span><strong>100%</strong></div>
            </div>
            <div className="review-export-status">
              <FileSpreadsheet size={18} /><span>Excel</span>
              <FileText size={18} /><span>PDF</span>
              {exporting && <em>جارٍ إنشاء الملفات...</em>}
              {exportDone && <em className="is-done">تم إنشاء الملفات</em>}
            </div>
            <div className="review-modal-actions">
              <button type="button" className="review-primary" onClick={() => void fetchAndExport()} disabled={exporting}>
                <Download size={18} /> تصدير Excel + PDF
              </button>
              <button type="button" className="review-secondary" onClick={() => { setShowCompletion(false); setShowOnlyErrors(true); }}>
                <XCircle size={18} /> عرض الأذون التي بها أخطاء
              </button>
              <button type="button" className="review-text-button" onClick={() => setShowCompletion(false)}>العودة للمراجعة</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
