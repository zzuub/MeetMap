import { ActionLink, EmptyState } from "@/shared/ui";

/**
 * 매칭되지 않는 주소 전체 (11.2).
 *
 * 루트 `not-found.tsx` 는 **앱의 어떤 라우트에도 안 걸린 URL** 을 받는다 — 오타,
 * 옛 링크, 아직 안 만든 화면(`/compare`·`/providers/[id]`)이 그것이다.
 * 지금까지는 Next 기본 404(영문)로 떨어지고 있었다.
 *
 * 셸이 없다 — 루트 레이아웃은 프로바이더만 얹으므로 폭·배경을 직접 잡는다. 하단
 * 탭도 없으니 **홈으로 가는 길이 이 화면의 유일한 출구**다 (`decisions.md` 4.40).
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-shell flex-col justify-center bg-bg">
      <h1 className="sr-only">페이지를 찾을 수 없음</h1>

      <EmptyState
        icon="🧭"
        title="페이지를 찾을 수 없어요"
        description="주소가 바뀌었거나 아직 준비 중인 화면일 수 있어요"
        action={
          <ActionLink href="/">홈으로 가기</ActionLink>
        }
      />
    </div>
  );
}
