import { describe, expect, it } from "vitest";
import { eventApi, type EventSummary } from "@/entities/event";
import { providerApi } from "@/entities/provider";

/**
 * **entity 두 슬라이스의 목 데이터가 어긋나지 않는지 지킨다.**
 *
 * `entities/event/mock/events.ts` 와 `entities/provider/mock/providers.ts` 가 같은
 * 주최사의 원본 평균·후기 수를 각자 들고 있다. entity 끼리 서로를 import 할 수
 * 없어서(FSD) 구조가 강제한 중복이고, 지금까지는 서로를 가리키는 주석으로만
 * 막아 뒀다 (`decisions.md` 4.21). 어긋나면 **목록 정렬과 주최사 페이지의 평점이
 * 서로 다른 답을 낸다.**
 *
 * ## 이 파일이 `src/app/` 아래 있는 이유
 *
 * 레이어 경계 규칙은 `src/{shared,entities,features,widgets}/**` 에만 걸린다
 * (`eslint.config.mjs` 의 `layerBoundaryRules`). `app` 은 대상에서 빠져 있고,
 * 원래 모든 레이어를 볼 수 있는 최상위라 **두 entity 를 함께 import 할 수 있는
 * 유일한 자리**다. `_` 로 시작하는 폴더는 App Router 가 라우트로 잡지 않는다.
 *
 * 슬라이스 내부(`mock/*`)가 아니라 **공개 API 로만** 접근한다 — `app` 레이어의
 * 배럴 규칙도 그대로 지킨다.
 *
 * `widgets/provider-profile` 이 생기면(P5-4) 그쪽이 두 포트를 조립하는 자리가
 * 되므로 이 테스트도 같이 옮긴다.
 */

/** 목 지연(300ms)이 케이스마다 붙지 않도록 한 번만 조회해 공유한다 */
async function loadEvents(): Promise<EventSummary[]> {
  const { items } = await eventApi.getList({ limit: 50 });
  return items;
}

describe("목 데이터 교차 검증 — 소개팅이 든 주최사 정보 vs 주최사 슬라이스", () => {
  it("주최사별 평점·후기 수가 두 슬라이스에서 같다", async () => {
    const events = await loadEvents();
    const providerIds = [...new Set(events.map((e) => e.provider.id))];
    expect(providerIds.length).toBeGreaterThan(0);

    for (const providerId of providerIds) {
      const eventId = events.find((e) => e.provider.id === providerId)!.id;
      const detail = await eventApi.getDetail(eventId);
      const provider = await providerApi.getSummary(providerId);

      expect(detail.provider.name, `${providerId} 이름`).toBe(provider.name);
      expect(detail.provider.tagline, `${providerId} 한 줄 소개`).toBe(provider.tagline);
      expect(detail.provider.reviewCount, `${providerId} 후기 수`).toBe(provider.reviewCount);
      // 표시 임계(5건)를 넘긴 주최사만 숫자가 뜬다. null 여부까지 같아야 한다
      expect(detail.provider.rating, `${providerId} 평점`).toBe(provider.rating);
    }
  });

  it("탐색의 평점 정렬이 주최사 페이지의 보정값 순서와 일치한다", async () => {
    // 후기 5건 미만인 주최사는 `rating` 이 양쪽 다 null 이라 위 테스트가 원본
    // 평균의 어긋남을 못 잡는다. 보정값은 그 평균에서 나오므로 순서로 확인한다.
    const { items } = await eventApi.getList({ sort: "rating", limit: 50 });

    const scores = await Promise.all(
      items.map(async (event) => (await providerApi.getSummary(event.provider.id)).ratingScore),
    );

    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it("소개팅이 가리키는 주최사가 모두 실재한다", async () => {
    const events = await loadEvents();

    for (const providerId of new Set(events.map((e) => e.provider.id))) {
      await expect(providerApi.getSummary(providerId)).resolves.toMatchObject({
        id: providerId,
      });
    }
  });
});
