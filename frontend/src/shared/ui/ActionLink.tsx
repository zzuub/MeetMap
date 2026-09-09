import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../lib/cn";

type LinkProps = ComponentProps<typeof Link>;

interface ActionLinkProps extends Pick<LinkProps, "href" | "replace" | "scroll" | "prefetch"> {
  children: ReactNode;
  className?: string;
}

/**
 * 빈 상태·에러 화면의 액션 (11.2 `다음 행동을 제시한다`).
 *
 * 모양은 `PrimaryButton` 의 `secondary` 와 같지만 **하는 일이 이동이라 앵커다** —
 * `<button onClick={router.push}>` 로 만들면 새 탭·주소 복사·미들클릭이 죽는다.
 * 그래서 버튼 컴포넌트에 `as` 를 붙이는 대신 자리를 하나 더 둔다.
 *
 * 터치 타깃 44px 은 여기서 보장한다 (15장).
 */
export function ActionLink({ children, className, ...props }: ActionLinkProps) {
  return (
    <Link
      {...props}
      className={cn(
        "inline-flex min-h-[44px] w-full items-center justify-center rounded-chip",
        "border border-primary bg-surface px-4 text-[14px] font-semibold text-primary",
        className,
      )}
    >
      {children}
    </Link>
  );
}
