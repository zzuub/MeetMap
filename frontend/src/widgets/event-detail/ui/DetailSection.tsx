import type { ReactNode } from "react";

/**
 * 상세의 블록 하나 (7.1). 히어로의 소개팅명이 `h1` 이라 여기는 `h2` 이고,
 * 크기를 블록마다 정하지 않는다 — `h3` 처럼 보이는 `h2` 가 생긴다.
 */
export function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-[15px] font-bold text-text">{title}</h2>
      {children}
    </section>
  );
}
