"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { TOAST_DURATION_MS } from "../config/constants";

interface ToastContextValue {
  /** 하단 토스트를 띄운다. 1.8초 뒤 자동 소멸한다. */
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * 토스트 (2.5).
 *
 * 규격: 화면 하단(고정 CTA 위 ~150px), 1.8초 자동 소멸, `fadeIn 0.16s`.
 * 사용처: 찜 저장/해제, 비교 담기, 담기 한도 초과, 선택 한도 초과(16장 개선안).
 *
 * ⚠️ 폼 검증 실패에는 쓰지 않는다. 그 경우는 **비활성 버튼의 라벨이 사유를 말한다**
 * (2.5). 이 규칙을 깨면 제품 전체의 피드백 일관성이 무너진다.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((next: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(next);
    timerRef.current = setTimeout(() => setMessage(null), TOAST_DURATION_MS);
  }, []);

  // Provider 가 언마운트될 때 남은 타이머를 지운다. 지우지 않으면 타이머가
  // 살아남아 사라진 컴포넌트에 setState 한다. 루트에 있어 실서비스에서는 드물지만
  // Fast Refresh 와 테스트에서는 매번 걸린다.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // showToast 가 안정적이므로 이 값은 절대 변하지 않는다.
  // 덕분에 토스트가 뜨고 사라져도 useToast() 를 쓰는 컴포넌트는 리렌더되지 않는다.
  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* 토스트가 없을 때도 live region 은 DOM에 남겨둔다.
          나중에 삽입되면 스크린리더가 읽지 못하는 경우가 있다. */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 bottom-[150px] z-[60] flex justify-center px-6"
      >
        {message ? (
          <p className="animate-fade-in rounded-chip bg-primary/95 px-4 py-2.5 text-[13px] font-semibold text-surface shadow-lg">
            {message}
          </p>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast 는 ToastProvider 안에서만 사용할 수 있습니다.");
  }
  return context;
}
