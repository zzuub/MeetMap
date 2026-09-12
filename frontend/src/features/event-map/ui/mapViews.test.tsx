import { isValidElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { EventSummary, LocationPrecision } from "@/entities/event";
import { formatErrorTimestamp } from "@/shared/lib";
import { mapLoadFailure, type MapLoadFailureKind } from "../api/kakaoLoader";
import { PRECISION_LEGEND, ZOOM_LABEL } from "../model/copy";
import { toMapMarker } from "../model/markers";
import { MAX_LEVEL, MIN_LEVEL } from "../model/viewport";
import { MapLegend } from "./MapLegend";
import { MapMarker, PIN_SHAPE } from "./MapMarker";
import { MapFailure, MapLoadingOverlay } from "./MapOverlays";
import { ZoomControl } from "./ZoomControl";

/**
 * 지도 위의 조각들 (6.6 · 11.2 · 11.3 · 15장).
 *
 * 훅이 없거나 서버에서 그려지는 조각이라 `react-dom/server` 로 그리고, 버튼은 함수로 불러
 * 돌려받은 `onClick` 을 직접 누른다 — jsdom 을 들이지 않는다 (4.10 · 4.39 · 4.61).
 */
const PRECISIONS: LocationPrecision[] = ["EXACT", "STATION", "DISTRICT"];

/** 목 데이터가 아니라 직접 짓는다 */
function event(overrides: Partial<EventSummary> = {}): EventSummary {
  return {
    id: "evt-x",
    title: "성수 루프탑 와인 소개팅",
    shortTitle: "성수 루프탑",
    provider: { id: "prv-x", name: "테스트주최사" },
    thumbnailUrl: null,
    date: "2026-09-12T19:30:00+09:00",
    dateLabel: "9/12(토)",
    timeLabel: "19:30",
    timeSlot: "DINNER",
    birthYearFrom: 1990,
    birthYearTo: 1999,
    maleCapacity: 7,
    femaleCapacity: 7,
    scale: "STANDARD",
    malePrice: 45000,
    femalePrice: 35000,
    status: "신청 가능",
    jobGroups: [],
    mood: [],
    area: "성수·건대",
    province: "SEOUL",
    district: "SEONGDONG",
    locationPrecision: "EXACT",
    stationName: "강남역",
    lat: 37.5445,
    lng: 127.0557,
    distanceKm: null,
    popularity: 100,
    createdAt: "2026-08-21T10:00:00+09:00",
    isLiked: false,
    ...overrides,
  };
}

function marker(overrides: Partial<EventSummary> = {}) {
  return renderToStaticMarkup(<MapMarker marker={toMapMarker(event(overrides))} />);
}

/** 태그를 걷어낸 글자 — 눈에 보이는 것 */
function visibleText(html: string) {
  return html.replace(/<[^>]*>/g, "");
}

describe("마커 (6.6)", () => {
  it("보이는 글자는 시각뿐이다 — 제목은 스크린리더 이름에만 있다", () => {
    const html = marker();

    expect(visibleText(html)).toBe("19:30");
    expect(html).toContain('aria-label="9/12(토) 19:30 성수 루프탑 와인 소개팅');
  });

  it("상세로 가는 링크다 — 누르면 아무 일도 없는 마커를 그리지 않는다 (4.29)", () => {
    expect(marker({ id: "evt-q" })).toContain('href="/events/evt-q"');
  });

  it("정밀도 셋이 서로 다른 모양이다", () => {
    expect(new Set(Object.values(PIN_SHAPE)).size).toBe(PRECISIONS.length);

    for (const precision of PRECISIONS) {
      expect(marker({ locationPrecision: precision })).toContain(PIN_SHAPE[precision]);
    }
  });

  it("범례가 같은 모양 셋을 이름과 함께 그린다 — 두 벌이면 범례와 핀이 어긋난다", () => {
    const html = renderToStaticMarkup(<MapLegend />);

    for (const precision of PRECISIONS) {
      expect(html).toContain(PIN_SHAPE[precision]);
      expect(html).toContain(PRECISION_LEGEND[precision]);
    }
  });
});

interface ButtonProps {
  label?: string;
  onClick?: () => void;
  children?: ReactNode;
}

/** 훅 없는 트리에서 이름 있는 버튼을 모은다 */
function buttonsIn(node: ReactNode): { label: string; onClick: () => void }[] {
  if (Array.isArray(node)) return node.flatMap(buttonsIn);
  if (!isValidElement<ButtonProps>(node)) return [];

  const { label, onClick, children } = node.props;
  const own = typeof label === "string" && onClick ? [{ label, onClick }] : [];
  return [...own, ...buttonsIn(children)];
}

function zoomAt(level: number | null) {
  const onZoom = vi.fn();
  return {
    html: renderToStaticMarkup(<ZoomControl level={level} onZoom={onZoom} />),
    buttons: buttonsIn(ZoomControl({ level, onZoom })),
    onZoom,
  };
}

describe("줌 버튼 (6.6 `한계에서 비활성` · 2.5 `라벨이 사유` · 15장)", () => {
  it("가장 가까우면 확대 쪽 이름이 사유다 — 포커스를 잃지 않게 `aria-disabled`", () => {
    const { html } = zoomAt(MIN_LEVEL);

    expect(html).toContain(`aria-label="${ZOOM_LABEL.in.limit}"`);
    expect(html).toContain(`aria-label="${ZOOM_LABEL.out.enabled}"`);
    expect(html).toContain('aria-disabled="true"');
    expect(html).not.toContain('disabled=""');
  });

  it("가장 멀면 축소 쪽이 막힌다", () => {
    const { html } = zoomAt(MAX_LEVEL);

    expect(html).toContain(`aria-label="${ZOOM_LABEL.in.enabled}"`);
    expect(html).toContain(`aria-label="${ZOOM_LABEL.out.limit}"`);
  });

  it("지도가 뜨기 전에는 둘 다 막는다", () => {
    const { html } = zoomAt(null);

    expect(html).toContain(`aria-label="${ZOOM_LABEL.in.limit}"`);
    expect(html).toContain(`aria-label="${ZOOM_LABEL.out.limit}"`);
  });

  it("막힌 버튼을 누르면 아무 일도 없고, 열린 버튼은 제 방향을 알린다", () => {
    const { buttons, onZoom } = zoomAt(MIN_LEVEL);

    buttons.find((button) => button.label === ZOOM_LABEL.in.limit)?.onClick();
    expect(onZoom).not.toHaveBeenCalled();

    buttons.find((button) => button.label === ZOOM_LABEL.out.enabled)?.onClick();
    expect(onZoom).toHaveBeenCalledWith("out");
  });

  it("버튼은 둘이다 — 확대와 축소", () => {
    expect(zoomAt(5).buttons.map((button) => button.label)).toEqual([
      ZOOM_LABEL.in.enabled,
      ZOOM_LABEL.out.enabled,
    ]);
  });
});

/** 같은 조건의 리스트 주소. 여기서는 모양만 본다 */
const LIST_HREF = "/explore?district=MAPO";

/** 재시도 버튼이 있어야 하는 실패. `Record` 라 실패 종류가 늘면 여기서 판정을 요구한다 */
const RETRY: Record<MapLoadFailureKind, boolean> = {
  NO_KEY: false,
  SCRIPT: true,
  TIMEOUT: true,
  SDK: false,
};

function failureCard(kind: MapLoadFailureKind) {
  const failure = mapLoadFailure(kind);
  return {
    failure,
    html: renderToStaticMarkup(
      <MapFailure failure={failure} onRetry={() => {}} listHref={LIST_HREF} />,
    ),
  };
}

describe("지도를 못 띄웠을 때 (11.2 · 4.71)", () => {
  it.each(Object.keys(RETRY) as MapLoadFailureKind[])(
    "`%s` — 코드와 발생 시각을 남긴다",
    (kind) => {
      const { failure, html } = failureCard(kind);

      expect(html).toContain(`${failure.code} · ${formatErrorTimestamp(failure.occurredAt)}`);
    },
  );

  it.each(Object.keys(RETRY) as MapLoadFailureKind[])(
    "`%s` — 재시도할 수 있는 실패에만 버튼이 있다",
    (kind) => {
      // 문구에 `다시 시도해주세요` 가 섞일 수 있으니 버튼의 유무로 본다
      expect(failureCard(kind).html.includes("<button")).toBe(RETRY[kind]);
    },
  );

  it.each(Object.keys(RETRY) as MapLoadFailureKind[])(
    "`%s` — 같은 조건의 리스트로 나갈 길이 있다",
    (kind) => {
      expect(failureCard(kind).html).toContain(`href="${LIST_HREF}"`);
    },
  );

  it("키가 없는 머신에 네트워크를 확인하라고 하지 않는다", () => {
    expect(failureCard("NO_KEY").html).not.toContain("네트워크");
  });
});

describe("로딩 오버레이 (11.3)", () => {
  it("무엇을 기다리는지 말한다", () => {
    const html = renderToStaticMarkup(<MapLoadingOverlay />);

    expect(html).toContain('role="status"');
    expect(html).toContain("지도를 불러오는 중이에요");
  });
});
