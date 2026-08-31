"use client";

import { useSyncExternalStore } from "react";

/** 구독할 외부 소스가 없다. 값이 절대 변하지 않으므로 빈 해제 함수만 돌려준다. */
const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * 브라우저에서 실행 중인지 여부. 서버 렌더와 하이드레이션 첫 패스에서는 `false`,
 * 하이드레이션이 끝나면 `true` 다.
 *
 * 포털(`createPortal(…, document.body)`)처럼 **DOM 이 있어야만 가능한 렌더**를
 * 게이팅할 때 쓴다.
 *
 * `useEffect(() => setMounted(true), [])` 로도 같은 효과를 낼 수 있지만,
 * 그건 이펙트 안에서 동기 setState 를 호출해 렌더를 한 번 더 유발한다
 * (React Compiler 의 `set-state-in-effect` 규칙에 걸린다).
 * `useSyncExternalStore` 는 서버 스냅샷과 클라이언트 스냅샷을 React 에 직접
 * 알려주므로 추가 렌더 없이 같은 결과를 얻고, 하이드레이션 불일치도 없다.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
