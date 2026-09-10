"use server";

import { redirect } from "next/navigation";
import { AFTER_ONBOARDING } from "@/entities/account";
import { getAccessToken } from "@/entities/account/server";
import { eventApi } from "@/entities/event";
import { geoApi, type GeoPoint } from "@/entities/geo";
import { normalizeAreas } from "@/entities/user";
import { userApi } from "@/entities/user/server";
import {
  SCAN_LIMIT,
  exploreHref,
  itemsOrNull,
} from "@/features/event-filter";
import { countNearby, type LocationResolution } from "@/features/location-permission";
import { DEFAULT_PROVINCE } from "@/shared/config";
import { toActionFailure, type ActionFailure } from "@/shared/ui";
import { requireFunnelSession } from "../_guard";

/**
 * 좌표 → `granted` 화면의 요약 (4.2).
 *
 * **서버 액션인 이유는 좌표다.** 클라이언트에서 직접 조회하면 좌표가 쿼리스트링에
 * 실려 브라우저 히스토리·프록시 로그에 남는다 — 4.1 이 `저장되지 않습니다` 를
 * 고정 문구로 못 박은 이상 그 경로를 만들지 않는다 (`decisions.md` 4.54).
 * 좌표는 이 함수 안에서 지역 이름으로 바뀌고 **그대로 버려진다.**
 *
 * ⚠️ **세션 가드를 부르지 않는다.** 4.49 의 기준은 `세션에 딸린 일을 하는가` 이고,
 * 이 함수가 하는 일(좌표→지명, 지역별 건수)은 게스트가 `/explore` 에서 그대로 볼 수
 * 있는 값이라 세션에 딸려 있지 않다. 세션이 필요한 것은 **저장하는 쪽**이다
 * (`savePreferredAreasAction`).
 */
export async function resolveLocationAction(
  point: GeoPoint,
): Promise<LocationResolution> {
  try {
    const place = await geoApi.reverseGeocode(point);
    const query = { province: DEFAULT_PROVINCE, area: place.area ?? undefined };

    const page = await eventApi.getList({
      ...query,
      // 모집 중만 센다 — 마감 건을 세어 놓고 목록에서 걸러내면 숫자가 어긋난다 (4.23)
      status: "OPEN",
      cursor: null,
      limit: SCAN_LIMIT,
    });

    return {
      ok: true,
      summary: {
        label: place.label,
        area: place.area,
        counts: countNearby(page.totalCount, itemsOrNull(page)),
        // `features` 는 라우팅을 모른다. 주소는 여기서 만들어 넣는다
        href: exploreHref({ view: "list", query }),
      },
    };
  } catch (error) {
    return { ok: false, failure: toActionFailure(error) };
  }
}

/**
 * 활동 지역 저장 (4.3).
 *
 * **저장하는 값은 3.4 의 선호 지역과 같은 필드다** — 지역 마스터도 한도도 같다
 * (`decisions.md` 4.53). 그래서 `normalizeAreas` 를 프로필과 공유한다.
 *
 * ⚠️ **가드를 스스로 부른다.** 레이아웃 재실행이 `<Link>` 이동에서 보장되지 않고,
 * 여기는 **세션에 딸린 쓰기**다 (4.49).
 */
export async function savePreferredAreasAction(
  _previous: ActionFailure | null,
  formData: FormData,
): Promise<ActionFailure | null> {
  await requireFunnelSession();

  const raw = formData.get("areas");
  const areas = normalizeAreas(
    (typeof raw === "string" ? raw : "").split(","),
  );

  // 비활성 버튼이 이미 막는다(2.5). 폼을 우회한 제출을 위한 방어선이다
  if (areas.length === 0) return null;

  try {
    const accessToken = await getAccessToken();
    await userApi.savePreferredAreas(areas, { accessToken });
  } catch (error) {
    return toActionFailure(error);
  }

  redirect(AFTER_ONBOARDING);
}

