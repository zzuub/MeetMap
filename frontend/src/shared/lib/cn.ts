type ClassValue = string | number | null | undefined | false | ClassValue[];

/**
 * 조건부 className 결합.
 *
 * 주의: 이 구현은 문자열을 이어붙이기만 한다. Tailwind 클래스 충돌
 * (`px-4` + `px-2`)은 해결하지 않으므로, 컴포넌트에서 `className` 을 덮어쓸 때는
 * 기본값과 겹치지 않는 유틸리티를 넘겨야 한다.
 * 충돌 해결이 필요해지면 `tailwind-merge` 도입을 검토한다.
 */
export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];

  for (const input of inputs) {
    if (!input) continue;
    if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested) out.push(nested);
    } else {
      out.push(String(input));
    }
  }

  return out.join(" ");
}
