"use client";

import { useEffect } from "react";

/**
 * 시트·모달이 열려 있는 동안 배경 스크롤을 잠근다 (15장).
 *
 * 중첩(시트 위 모달)을 대비해 참조 카운트로 관리한다. 단순히 `overflow:hidden` 을
 * 넣고 빼면, 안쪽이 닫힐 때 바깥쪽이 아직 열려 있는데도 잠금이 풀린다.
 */
let lockCount = 0;
let savedOverflow = "";
let savedPaddingRight = "";

export function useLockBodyScroll(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;

    if (lockCount === 0) {
      const { body } = document;
      savedOverflow = body.style.overflow;
      savedPaddingRight = body.style.paddingRight;

      // 스크롤바가 사라지며 레이아웃이 밀리는 것을 보정한다.
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`;
      }
      body.style.overflow = "hidden";
    }

    lockCount += 1;

    return () => {
      // 카운트가 음수로 내려가면(HMR 등으로 cleanup 이 어긋나면) 이후 잠금이
      // 영원히 풀리지 않고, 스크롤이 죽은 채 원인을 찾을 수 없게 된다.
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.body.style.overflow = savedOverflow;
        document.body.style.paddingRight = savedPaddingRight;
      }
    };
  }, [locked]);
}
