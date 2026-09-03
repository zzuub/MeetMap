import type { ReactNode } from "react";

/** `/design-system` 전용 뼈대. 제품 화면이 아니므로 `shared/ui` 로 올리지 않는다. */

export function Section({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-[15px] font-bold text-primary">{title}</h2>
        <p className="text-[12px] text-text-sub">{note}</p>
      </div>
      {children}
    </section>
  );
}

/** 이름 + 근거를 머리에 단 조각 상자 */
export function Piece({ name, spec, children }: { name: string; spec: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4">
      <CodeHeading name={name} spec={spec} />
      {children}
    </div>
  );
}

/** 상자 없이 이름 + 근거만 다는 변형 블록 */
export function VariantBlock({ name, spec, children }: { name: string; spec: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <CodeHeading name={name} spec={spec} />
      {children}
    </div>
  );
}

/** 조각 밑에 붙는 근거 문단. JSX 가 태그 옆 공백을 지우므로 코드 조각에 여백을 준다 */
export function Note({ children }: { children: ReactNode }) {
  return (
    <p
      className={[
        "text-[11.5px] leading-5 text-text-sub",
        "[&_code]:mx-0.5 [&_code]:rounded-[4px] [&_code]:bg-accent-soft [&_code]:px-1",
      ].join(" ")}
    >
      {children}
    </p>
  );
}

export function Swatch({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`h-12 w-full rounded-[10px] border border-border ${className}`} />
      <span className="text-[10px] text-text-sub">{label}</span>
    </div>
  );
}

function CodeHeading({ name, spec }: { name: string; spec: string }) {
  return (
    <p className="text-[12px] text-text-sub">
      <code className="rounded-chip bg-accent-soft px-2 py-0.5 font-bold text-text">{name}</code>{" "}
      {spec}
    </p>
  );
}
