"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
interface ToastMessage {
  text: string;
  /** 같은 문구를 연달아 띄워도 타이머가 처음부터 다시 돌게 하는 값 */
  key: number;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<ToastMessage | null>(null);

  const showToast = useCallback((next: string) => {
    setMessage((previous) => ({ text: next, key: (previous?.key ?? 0) + 1 }));
  }, []);

  /**
   * **소멸 타이머는 문구가 화면에 올라간 뒤부터 센다.**
   *
   * ⚠️ 전에는 `showToast` 안에서 `setTimeout` 을 바로 걸었다. 그러면 **호출 시점**
   * 부터 1.8초를 세는데, `startTransition` 안에서 부른 토스트는 transition 이 끝날
   * 때까지 커밋되지 않는다 — 느린 액션(찜 저장 등)에서는 커밋되기 전에 타이머가
   * 먼저 만료돼 **토스트가 아예 안 뜬다.** 6초를 지켜봐도 안 나오는 것을 계측으로
   * 확인했다 (P2-7 · `decisions.md` 4.61).
   *
   * 이펙트로 옮기면 타이머가 **커밋 뒤**에 시작하므로 어느 경로로 불려도 1.8초를
   * 온전히 보여준다. 정리 함수가 언마운트·문구 교체를 함께 처리한다.
   */
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => setMessage(null), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [message]);

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
          <p
            key={message.key}
            className="animate-fade-in rounded-chip bg-primary/95 px-4 py-2.5 text-[13px] font-semibold text-surface shadow-lg"
          >
            {message.text}
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
