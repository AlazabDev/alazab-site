import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Maximize2,
  Minimize2,
  RotateCcw,
  Search,
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

import "./receipt-viewer.css";

interface ReceiptImage {
  number: number;
  paddedNumber: string;
  fileName: string;
  title: string;
  url: string;
}

const TOTAL_RECEIPTS = 120;

const RECEIPTS_BASE_URL =
  "https://lyqkkrftypypnixaptms.supabase.co/storage/v1/object/public/Receipts";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;
const SWIPE_THRESHOLD = 70;

function createReceiptImages(): ReceiptImage[] {
  return Array.from({ length: TOTAL_RECEIPTS }, (_, index) => {
    const number = index + 1;
    const paddedNumber = String(number).padStart(3, "0");
    const fileName = `auf-${paddedNumber}.jpg`;

    return {
      number,
      paddedNumber,
      fileName,
      title: `إذن الاستلام رقم ${paddedNumber}`,
      url: `${RECEIPTS_BASE_URL}/${fileName}`,
    };
  });
}

export default function ReceiptViewer() {
  const viewerRef = useRef<HTMLElement>(null);
  const dragStartXRef = useRef<number | null>(null);
  const activePointerIdRef = useRef<number | null>(null);

  const images = useMemo(() => createReceiptImages(), []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [jumpValue, setJumpValue] = useState("1");
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const currentImage = images[currentIndex];

  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < images.length - 1;

  const resetImageState = useCallback(() => {
    setZoom(1);
    setDragOffset(0);
    setLoaded(false);
    setFailed(false);
  }, []);

  const goPrevious = useCallback(() => {
    setCurrentIndex((current) => {
      if (current <= 0) {
        return current;
      }

      return current - 1;
    });
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex((current) => {
      if (current >= images.length - 1) {
        return current;
      }

      return current + 1;
    });
  }, [images.length]);

  const goToImage = useCallback(
    (index: number) => {
      const safeIndex = Math.max(
        0,
        Math.min(index, images.length - 1),
      );

      setCurrentIndex(safeIndex);
    },
    [images.length],
  );

  const zoomIn = useCallback(() => {
    setZoom((current) =>
      Math.min(MAX_ZOOM, current + ZOOM_STEP),
    );
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((current) =>
      Math.max(MIN_ZOOM, current - ZOOM_STEP),
    );
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  const toggleDoubleClickZoom = useCallback(() => {
    setZoom((current) => (current > 1 ? 1 : 2));
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const viewer = viewerRef.current;

    if (!viewer) {
      return;
    }

    try {
      if (!document.fullscreenElement) {
        await viewer.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen operation failed:", error);
    }
  }, []);

  const submitJump = useCallback(
    (event?: FormEvent) => {
      event?.preventDefault();

      const requestedNumber = Number(jumpValue);

      if (
        !Number.isInteger(requestedNumber) ||
        requestedNumber < 1 ||
        requestedNumber > images.length
      ) {
        setJumpValue(String(currentIndex + 1));
        return;
      }

      goToImage(requestedNumber - 1);
    },
    [
      currentIndex,
      goToImage,
      images.length,
      jumpValue,
    ],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      /*
       * عند تكبير الصورة نترك الحركة للتمرير داخل الصورة،
       * ولا نستخدم السحب للتقليب حتى لا يتعارض الاثنان.
       */
      if (zoom > 1.05) {
        return;
      }

      dragStartXRef.current = event.clientX;
      activePointerIdRef.current = event.pointerId;

      setIsDragging(true);
      setDragOffset(0);

      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [zoom],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (
        !isDragging ||
        dragStartXRef.current === null ||
        activePointerIdRef.current !== event.pointerId
      ) {
        return;
      }

      const movement = event.clientX - dragStartXRef.current;

      setDragOffset(
        Math.max(-220, Math.min(220, movement)),
      );
    },
    [isDragging],
  );

  const finishPointerGesture = useCallback(
    (
      event: ReactPointerEvent<HTMLDivElement>,
      cancelled = false,
    ) => {
      if (
        activePointerIdRef.current !== event.pointerId
      ) {
        return;
      }

      try {
        if (
          event.currentTarget.hasPointerCapture(
            event.pointerId,
          )
        ) {
          event.currentTarget.releasePointerCapture(
            event.pointerId,
          );
        }
      } catch {
        /* لا توجد مشكلة إذا تم تحرير المؤشر بالفعل */
      }

      const finalOffset = dragOffset;

      dragStartXRef.current = null;
      activePointerIdRef.current = null;

      setIsDragging(false);
      setDragOffset(0);

      if (cancelled) {
        return;
      }

      /*
       * السحب لليسار = الصورة التالية
       * السحب لليمين = الصورة السابقة
       */
      if (
        finalOffset <= -SWIPE_THRESHOLD &&
        canGoNext
      ) {
        goNext();
        return;
      }

      if (
        finalOffset >= SWIPE_THRESHOLD &&
        canGoPrevious
      ) {
        goPrevious();
      }
    },
    [
      canGoNext,
      canGoPrevious,
      dragOffset,
      goNext,
      goPrevious,
    ],
  );

  useEffect(() => {
    resetImageState();
    setJumpValue(String(currentIndex + 1));
  }, [currentIndex, resetImageState]);

  useEffect(() => {
    /*
     * تحميل الصورة السابقة والتالية مسبقًا
     * حتى يكون التقليب أسرع.
     */
    const adjacentIndexes = [
      currentIndex - 1,
      currentIndex + 1,
    ];

    adjacentIndexes.forEach((index) => {
      const image = images[index];

      if (!image) {
        return;
      }

      const preloadImage = new Image();
      preloadImage.src = image.url;
    });
  }, [currentIndex, images]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement === viewerRef.current,
      );
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange,
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange,
      );
    };
  }, []);

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }

      switch (event.key) {
        case "ArrowLeft":
        case "PageDown":
          event.preventDefault();
          goNext();
          break;

        case "ArrowRight":
        case "PageUp":
          event.preventDefault();
          goPrevious();
          break;

        case "Home":
          event.preventDefault();
          goToImage(0);
          break;

        case "End":
          event.preventDefault();
          goToImage(images.length - 1);
          break;

        case "+":
        case "=":
          event.preventDefault();
          zoomIn();
          break;

        case "-":
          event.preventDefault();
          zoomOut();
          break;

        case "0":
          event.preventDefault();
          resetZoom();
          break;

        case "f":
        case "F":
          event.preventDefault();
          void toggleFullscreen();
          break;

        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyboard);

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyboard,
      );
    };
  }, [
    goNext,
    goPrevious,
    goToImage,
    images.length,
    resetZoom,
    toggleFullscreen,
    zoomIn,
    zoomOut,
  ]);

  return (
    <section
      ref={viewerRef}
      className="receipt-free-viewer"
      dir="rtl"
    >
      <header className="receipt-free-toolbar">
        <div className="receipt-free-title">
          <div>
            <h1>أذون استلام أبو عوف</h1>

            <p>
              {currentImage.title}
              {" — "}
              {currentIndex + 1} من {images.length}
            </p>
          </div>
        </div>

        <form
          className="receipt-free-jump"
          onSubmit={submitJump}
        >
          <Search size={17} aria-hidden="true" />

          <input
            type="number"
            min={1}
            max={images.length}
            value={jumpValue}
            onChange={(event) =>
              setJumpValue(event.target.value)
            }
            aria-label="رقم الإذن"
            title="رقم الإذن"
          />

          <button type="submit">
            انتقال
          </button>
        </form>

        <div className="receipt-free-tools">
          <button
            type="button"
            className="receipt-free-tool-button"
            onClick={zoomOut}
            disabled={zoom <= MIN_ZOOM}
            title="تصغير"
            aria-label="تصغير الصورة"
          >
            <ZoomOut size={20} />
          </button>

          <button
            type="button"
            className="receipt-free-zoom-value"
            onClick={resetZoom}
            title="إعادة الحجم إلى 100%"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            type="button"
            className="receipt-free-tool-button"
            onClick={zoomIn}
            disabled={zoom >= MAX_ZOOM}
            title="تكبير"
            aria-label="تكبير الصورة"
          >
            <ZoomIn size={20} />
          </button>

          <button
            type="button"
            className="receipt-free-tool-button"
            onClick={resetZoom}
            title="إعادة ضبط الحجم"
            aria-label="إعادة ضبط الحجم"
          >
            <RotateCcw size={19} />
          </button>

          <a
            className="receipt-free-tool-button"
            href={currentImage.url}
            target="_blank"
            rel="noopener noreferrer"
            title="فتح الصورة الأصلية"
            aria-label="فتح الصورة الأصلية"
          >
            <ExternalLink size={19} />
          </a>

          <button
            type="button"
            className="receipt-free-tool-button"
            onClick={() => void toggleFullscreen()}
            title={
              isFullscreen
                ? "إلغاء ملء الشاشة"
                : "ملء الشاشة"
            }
            aria-label={
              isFullscreen
                ? "إلغاء ملء الشاشة"
                : "ملء الشاشة"
            }
          >
            {isFullscreen ? (
              <Minimize2 size={20} />
            ) : (
              <Maximize2 size={20} />
            )}
          </button>
        </div>
      </header>

      <main className="receipt-free-stage">
        <button
          type="button"
          className="receipt-free-arrow receipt-free-arrow--right"
          onClick={goPrevious}
          disabled={!canGoPrevious}
          aria-label="الصورة السابقة"
          title="السابق"
        >
          <ChevronRight size={34} />
        </button>

        <div
          className={
            isDragging
              ? "receipt-free-canvas receipt-free-canvas--dragging"
              : "receipt-free-canvas"
          }
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={(event) =>
            finishPointerGesture(event)
          }
          onPointerCancel={(event) =>
            finishPointerGesture(event, true)
          }
          onDoubleClick={toggleDoubleClickZoom}
        >
          {!loaded && !failed && (
            <div className="receipt-free-loading">
              <span className="receipt-free-spinner" />
              <span>جارٍ تحميل الصورة...</span>
            </div>
          )}

          {failed ? (
            <div className="receipt-free-error">
              <strong>تعذر تحميل الصورة</strong>
              <span>{currentImage.fileName}</span>

              <a
                href={currentImage.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                فتح الرابط الأصلي
              </a>
            </div>
          ) : (
            <div
              className="receipt-free-image-area"
              style={{
                width: `${zoom * 100}%`,
                height: `${zoom * 100}%`,
                transform:
                  zoom <= 1.05
                    ? `translateX(${dragOffset}px)`
                    : undefined,
              }}
            >
              <img
                key={currentImage.url}
                src={currentImage.url}
                alt={currentImage.title}
                decoding="async"
                draggable={false}
                className={
                  loaded
                    ? "receipt-free-image receipt-free-image--loaded"
                    : "receipt-free-image"
                }
                onLoad={() => setLoaded(true)}
                onError={() => setFailed(true)}
              />
            </div>
          )}
        </div>

        <button
          type="button"
          className="receipt-free-arrow receipt-free-arrow--left"
          onClick={goNext}
          disabled={!canGoNext}
          aria-label="الصورة التالية"
          title="التالي"
        >
          <ChevronLeft size={34} />
        </button>

        <div className="receipt-free-counter">
          <span>{currentImage.fileName}</span>

          <strong>
            {currentIndex + 1} / {images.length}
          </strong>
        </div>

        {zoom <= 1.05 && (
          <div className="receipt-free-swipe-hint">
            اسحب يمينًا أو يسارًا للتقليب
          </div>
        )}
      </main>

      <footer className="receipt-free-footer">
        <button
          type="button"
          onClick={goPrevious}
          disabled={!canGoPrevious}
        >
          <ChevronRight size={20} />
          السابق
        </button>

        <div>
          <button
            type="button"
            onClick={() => goToImage(0)}
          >
            البداية
          </button>

          <strong>
            إذن {currentImage.paddedNumber}
          </strong>

          <button
            type="button"
            onClick={() =>
              goToImage(images.length - 1)
            }
          >
            النهاية
          </button>
        </div>

        <button
          type="button"
          onClick={goNext}
          disabled={!canGoNext}
        >
          التالي
          <ChevronLeft size={20} />
        </button>
      </footer>
    </section>
  );
}
