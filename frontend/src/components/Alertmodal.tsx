import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type ModalType = "success" | "error";
type ModalMode = "side" | "center";

interface AlertOptions {
  message?: string;
  mode?: ModalMode;
  duration?: number;
  onClose?: () => void;
}

interface AlertItem extends AlertOptions {
  id: string;
  type: ModalType;
  title: string;
}

// ─── Global trigger ───────────────────────────────────────────────────────────
type ShowAlertFn = (item: Omit<AlertItem, "id">) => void;
let _showAlert: ShowAlertFn | null = null;

export function showAlert(type: ModalType, title: string, options?: AlertOptions): Promise<void> {
  return new Promise((resolve) => {
    _showAlert?.({
      type, title, mode: "side", duration: 3000, ...options,
      onClose: () => { options?.onClose?.(); resolve(); },
    });
  });
}

export const alertSuccess = (title: string, options?: AlertOptions): Promise<void> =>
  showAlert("success", title, options);

export const alertError = (title: string, options?: AlertOptions): Promise<void> =>
  showAlert("error", title, options);

// ─── Single side card ─────────────────────────────────────────────────────────
function SideCard({ item, onRemove }: { item: AlertItem; onRemove: (id: string) => void }) {
  const [show, setShow] = useState(false);
  const isSuccess = item.type === "success";

  const handleClose = useCallback(() => {
    setShow(false);
    setTimeout(() => {
      item.onClose?.();
      onRemove(item.id);
    }, 350);
  }, [item, onRemove]);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 10);
    return () => clearTimeout(t);
  }, []);

  // Auto-close timer
  useEffect(() => {
    const duration = item.duration ?? 3000;
    const timer = setTimeout(() => handleClose(), duration);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`
      w-80 transition-all duration-[350ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]
      ${show ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"}
    `}>
      <div className="am-font bg-white dark:bg-gray-700 rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.10)] border border-gray-100 dark:border-gray-600">
        <div className="flex items-start gap-4 p-4">

          {/* Icon */}
          <div className="relative flex-shrink-0 flex items-center justify-center rounded-2xl overflow-hidden"
            style={{ width: 52, height: 52 }}>
            <div className={`absolute inset-0 ${isSuccess ? "bg-gradient-to-br from-green-100 to-green-50" : "bg-gradient-to-br from-red-100 to-red-50"}`} />
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 6px, ${isSuccess ? "#bbf7d0" : "#fecaca"} 6px, ${isSuccess ? "#bbf7d0" : "#fecaca"} 7px), repeating-linear-gradient(90deg, transparent, transparent 6px, ${isSuccess ? "#bbf7d0" : "#fecaca"} 6px, ${isSuccess ? "#bbf7d0" : "#fecaca"} 7px)`
            }} />
            <div className={`relative flex items-center justify-center rounded-full ${isSuccess ? "bg-green-500" : "bg-red-500"}`}
              style={{ width: 30, height: 30 }}>
              {isSuccess ? (
                <svg style={{ width: 15, height: 15 }} viewBox="0 0 24 24" fill="none"
                  stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg style={{ width: 15, height: 15 }} viewBox="0 0 24 24" fill="none"
                  stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
            </div>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
              {item.title}
            </p>
            {item.message && (
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-1">
                {item.message}
              </p>
            )}
          </div>

          {/* Close */}
          <button onClick={handleClose}
            className="flex-shrink-0 text-gray-300 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300 transition-colors mt-0.5">
            <svg style={{ width: 13, height: 13 }} viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AlertModalProvider({ children }: { children: React.ReactNode }) {
  const [sideItems, setSideItems] = useState<AlertItem[]>([]);
  const [centerItem, setCenterItem] = useState<AlertItem | null>(null);
  const [centerShow, setCenterShow] = useState(false);
  const centerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    _showAlert = (item) => {
      const id = `${Date.now()}-${Math.random()}`;
      const mode = item.mode ?? "side";
      if (mode === "side") {
        setSideItems((prev) => {
          if (prev.length >= 4) return prev;
          return [...prev, { ...item, id, mode }];
        });
      } else {
        setCenterItem({ ...item, id, mode });
      }
    };
    return () => { _showAlert = null; };
  }, []);

  // center animate in
  useEffect(() => {
    if (centerItem) {
      const t = setTimeout(() => setCenterShow(true), 10);
      return () => clearTimeout(t);
    } else {
      setCenterShow(false);
    }
  }, [centerItem]);

  // center auto-close
  useEffect(() => {
    if (!centerItem) return;
    if (centerTimerRef.current) clearTimeout(centerTimerRef.current);
    centerTimerRef.current = setTimeout(() => closeCenterItem(), centerItem.duration ?? 3000);
    return () => { if (centerTimerRef.current) clearTimeout(centerTimerRef.current); };
  }, [centerItem]);

  const closeCenterItem = useCallback(() => {
    setCenterShow(false);
    setTimeout(() => {
      centerItem?.onClose?.();
      setCenterItem(null);
    }, 300);
  }, [centerItem]);

  const removeItem = useCallback((id: string) => {
    setSideItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const isSuccess = centerItem?.type === "success";

  return (
    <>
      {children}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        .am-font * { font-family: 'Inter', sans-serif !important; }
        @keyframes am-ripple {
          0%   { inset: -4px;  opacity: 0.5; }
          100% { inset: -14px; opacity: 0; }
        }
        .am-ring::after {
          content: '';
          position: absolute;
          border-radius: 9999px;
          border: 1.5px solid;
          inset: -4px;
          opacity: 0;
          animation: am-ripple 1.6s ease-out 0.3s infinite;
        }
        .am-ring-success::after { border-color: #16a34a; }
        .am-ring-error::after   { border-color: #dc2626; }
      `}</style>

      {/* ── SIDE stack ── */}
      {sideItems.length > 0 && (
        <div className="fixed top-20 right-5 z-50 flex flex-col gap-2">
          {sideItems.slice(-4).map((item) => (
            <SideCard key={item.id} item={item} onRemove={removeItem} />
          ))}
        </div>
      )}

      {/* ── CENTER modal ── */}
      {centerItem && (
        <div
          onClick={(e) => e.target === e.currentTarget && closeCenterItem()}
          className={`
            fixed inset-0 z-50 flex items-center justify-center
            bg-black/60 backdrop-blur-sm
            transition-opacity duration-300
            ${centerShow ? "opacity-100" : "opacity-0"}
          `}
        >
          <div className={`am-font
            bg-white dark:bg-gray-700 rounded-xl w-80 overflow-hidden
            shadow-[0_8px_40px_rgba(0,0,0,0.2)]
            border border-gray-200 dark:border-gray-600
            transition-all duration-300
            ${centerShow ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"}
          `}>
            <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-6">
              <div className={`flex items-center justify-center rounded-full
                ${isSuccess ? "bg-green-100" : "bg-red-100"}`}
                style={{ width: 56, height: 56 }}>
                {isSuccess ? (
                  <svg style={{ width: 26, height: 26 }} className="stroke-green-600" viewBox="0 0 24 24" fill="none"
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg style={{ width: 26, height: 26 }} className="stroke-red-600" viewBox="0 0 24 24" fill="none"
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                )}
              </div>
              <p className="text-base font-semibold text-gray-900 dark:text-white text-center leading-snug">
                {centerItem.title}
              </p>
              {centerItem.message && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center leading-relaxed -mt-1">
                  {centerItem.message}
                </p>
              )}
            </div>

            {/* Progress bar (center only) */}
            <CenterProgress duration={centerItem.duration ?? 3000} isSuccess={isSuccess ?? true} />
          </div>
        </div>
      )}
    </>
  );
}

// ─── Center progress bar (isolated re-render) ─────────────────────────────────
function CenterProgress({ duration, isSuccess }: { duration: number; isSuccess: boolean }) {
  const [progress, setProgress] = useState(100);
  useEffect(() => {
    const fps = 60;
    const step = 100 / ((duration / 1000) * fps);
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = p - step;
        return next <= 0 ? 0 : next;
      });
    }, 1000 / fps);
    return () => clearInterval(interval);
  }, [duration]);

  return (
    <div className="h-0.5 bg-gray-100 dark:bg-gray-600">
      <div
        className={`h-full transition-none ${isSuccess ? "bg-green-500" : "bg-red-500"}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}