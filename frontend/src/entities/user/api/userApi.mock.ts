// 서버 전용 모듈이다. 쓰기(`saveTerms`·`saveProfile`·`savePreferredAreas`)는
// 쿠키를 심으므로 Server Action 안에서만 부를 수 있다.
import { cookies } from "next/headers";
import { MAX_PREFERRED_AREAS, MOCK_LATENCY_MS } from "@/shared/config";
import type { ProfileInput, UserApi } from "../model/ports";
import type { TermsAgreement, UserProfile } from "../model/types";

/**
 * 목 모드의 내 계정 저장소 (P2-2 · P2-4 · P2-6).
 *
 * 백엔드가 없으므로 **브라우저 쿠키 한 장이 저장소다.** 모듈 스코프 변수로 두면
 * 모든 브라우저가 같은 프로필을 보게 되고, `localStorage` 는 서버 컴포넌트가
 * 못 읽는다 — 홈·탐색이 `viewer` 를 서버에서 읽어야 하므로 쿠키뿐이다.
 *
 * 약관과 프로필을 한 쿠키에 담는 이유는 개수다. 이미 세션 쿠키가 둘(역할 스위치,
 * 목 세션) 있어서 여기서 또 둘로 나누면 넷이 된다.
 *
 * ⚠️ **선호 지역은 `areas` 한 칸에 산다** (P2-6). 프로필이 없는 사용자도 지역을
 * 고를 수 있어야 해서(4.3) `profile` 안에 넣을 수 없다 — `decisions.md` 4.53.
 * `profile.preferredAreas` 는 **P2-6 이전에 심긴 쿠키를 위한 폴백**으로만 읽는다.
 */
const MOCK_USER_COOKIE = "meetmap_mock_user";

const COOKIE_OPTIONS = {
  path: "/",
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 30,
} as const;

interface MockUserRecord {
  terms?: TermsAgreement;
  profile?: UserProfile;
  /** 선호 지역의 **현재 값**. 없으면 `profile.preferredAreas` 로 떨어진다 */
  areas?: string[];
}

export const mockUserApi: UserApi = {
  async getMyProfile() {
    await delay();
    return effectiveProfile(await read());
  },

  async saveTerms(agreement: TermsAgreement) {
    await delay();
    await write({ ...(await read()), terms: agreement });
  },

  async saveProfile(input: ProfileInput) {
    await delay();

    const record = await read();
    const areas = input.preferredAreas.slice(0, MAX_PREFERRED_AREAS);
    const next: MockUserRecord = {
      ...record,
      profile: toProfile(input, record.profile?.id),
      areas,
    };

    await write(next);

    // 방금 쓴 기록에서 다시 만든다 — 돌려주는 값과 다음 조회가 갈라지지 않게
    return effectiveProfile(next) as UserProfile;
  },

  async savePreferredAreas(areas: string[]) {
    await delay();

    const record = await read();
    await write({ ...record, areas: areas.slice(0, MAX_PREFERRED_AREAS) });
  },
};

/**
 * 저장된 기록 → 화면이 보는 프로필.
 *
 * **닉네임·성별이 있는 프로필이 없으면 `null` 이다** — 지역만 골라 둔 사용자는
 * 여전히 `프로필 없음`이고, `viewer` 도 `null` 이다 (`decisions.md` 4.44·4.53).
 *
 * `completionRate` 를 저장하지 않고 읽을 때 세는 것이 요점이다. 지역만 따로
 * 바뀔 수 있게 된 이상 저장해 두면 값이 낡는다.
 */
function effectiveProfile(record: MockUserRecord): UserProfile | null {
  const { profile } = record;
  if (!profile) return null;

  const preferredAreas = record.areas ?? profile.preferredAreas;
  const filled = [
    profile.nickname.length > 0,
    Number.isFinite(profile.birthYear),
    profile.gender === "F" || profile.gender === "M",
    preferredAreas.length > 0,
  ].filter(Boolean).length;

  return {
    ...profile,
    preferredAreas,
    // `completionRate` 의 서버 정의는 미확정이다(10.1). 목은 3.4 의 네 필드로 센다 —
    // 0 으로 두면 프로필을 채운 사용자도 마이페이지 재유도를 받는다 (3.3)
    completionRate: Math.round((filled / 4) * 100),
  };
}

/** 저장 시점의 프로필. 지역과 완성도는 읽을 때 만들므로 여기서는 자리만 채운다 */
function toProfile(input: ProfileInput, existingId: string | undefined): UserProfile {
  return {
    id: existingId ?? "mock-user",
    nickname: input.nickname,
    birthYear: input.birthYear,
    gender: input.gender,
    preferredAreas: input.preferredAreas.slice(0, MAX_PREFERRED_AREAS),
    profileImageUrl: null,
    completionRate: 0,
  };
}

async function read(): Promise<MockUserRecord> {
  const raw = (await cookies()).get(MOCK_USER_COOKIE)?.value;
  if (!raw) return {};

  try {
    return JSON.parse(decodeURIComponent(raw)) as MockUserRecord;
  } catch {
    // 손으로 고쳤거나 형식이 바뀐 쿠키. 프로필 없음으로 떨어뜨린다.
    return {};
  }
}

async function write(record: MockUserRecord): Promise<void> {
  const store = await cookies();
  store.set(
    MOCK_USER_COOKIE,
    encodeURIComponent(JSON.stringify(record)),
    COOKIE_OPTIONS,
  );
}

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
}
