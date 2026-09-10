// 서버 전용 모듈이다. 쓰기(`saveTerms`·`saveProfile`)는 쿠키를 심으므로
// Server Action 안에서만 부를 수 있다.
import { cookies } from "next/headers";
import { MAX_PREFERRED_AREAS, MOCK_LATENCY_MS } from "@/shared/config";
import type { ProfileInput, UserApi } from "../model/ports";
import type { TermsAgreement, UserProfile } from "../model/types";

/**
 * 목 모드의 내 계정 저장소 (P2-2 · P2-4).
 *
 * 백엔드가 없으므로 **브라우저 쿠키 한 장이 저장소다.** 모듈 스코프 변수로 두면
 * 모든 브라우저가 같은 프로필을 보게 되고, `localStorage` 는 서버 컴포넌트가
 * 못 읽는다 — 홈·탐색이 `viewer` 를 서버에서 읽어야 하므로 쿠키뿐이다.
 *
 * 약관과 프로필을 한 쿠키에 담는 이유는 개수다. 이미 세션 쿠키가 둘(역할 스위치,
 * 목 세션) 있어서 여기서 또 둘로 나누면 넷이 된다.
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
}

export const mockUserApi: UserApi = {
  async getMyProfile() {
    await delay();
    return (await read()).profile ?? null;
  },

  async saveTerms(agreement: TermsAgreement) {
    await delay();
    await write({ ...(await read()), terms: agreement });
  },

  async saveProfile(input: ProfileInput) {
    await delay();

    const record = await read();
    const profile = toProfile(input, record.profile?.id);

    await write({ ...record, profile });
    return profile;
  },
};

/**
 * 저장 시점에 프로필을 완성한다.
 *
 * `completionRate` 는 **서버 정의가 미확정**이다(10.1). 목은 3.4 의 네 필드를
 * 채웠는지로 센다 — 마이페이지의 재유도 문구(3.3)가 이 값을 볼 자리라 0 으로
 * 두면 프로필을 채운 사용자도 재유도를 받는다.
 */
function toProfile(input: ProfileInput, existingId: string | undefined): UserProfile {
  const areas = input.preferredAreas.slice(0, MAX_PREFERRED_AREAS);
  const filled = [
    input.nickname.length > 0,
    Number.isFinite(input.birthYear),
    input.gender === "F" || input.gender === "M",
    areas.length > 0,
  ].filter(Boolean).length;

  return {
    id: existingId ?? "mock-user",
    nickname: input.nickname,
    birthYear: input.birthYear,
    gender: input.gender,
    preferredAreas: areas,
    profileImageUrl: null,
    completionRate: Math.round((filled / 4) * 100),
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
