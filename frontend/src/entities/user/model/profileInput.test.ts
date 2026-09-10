import { describe, expect, it } from "vitest";
import {
  AREAS,
  BIRTH_YEAR_DEFAULT,
  BIRTH_YEAR_MAX,
  BIRTH_YEAR_MIN,
  MAX_PREFERRED_AREAS,
  NICKNAME_MAX_LENGTH,
} from "@/shared/config";
import {
  BIRTH_YEARS,
  isProfileGender,
  isProfileReady,
  normalizeAreas,
  normalizeBirthYear,
  normalizeNickname,
} from "./profileInput";

describe("출생연도 목록 (3.4)", () => {
  it("내림차순이고 양 끝이 마스터와 같다", () => {
    expect(BIRTH_YEARS[0]).toBe(BIRTH_YEAR_MAX);
    expect(BIRTH_YEARS[BIRTH_YEARS.length - 1]).toBe(BIRTH_YEAR_MIN);
    expect(BIRTH_YEARS).toHaveLength(BIRTH_YEAR_MAX - BIRTH_YEAR_MIN + 1);
  });

  it("기본값이 목록 안에 있다", () => {
    expect(BIRTH_YEARS).toContain(BIRTH_YEAR_DEFAULT);
  });

  it("정렬이 실제로 뒤집혀 있다", () => {
    // 오름차순이면 여기서 깨진다 — 배열이 이미 정렬돼 있어 생기는 착시를 막는다
    const descending = [...BIRTH_YEARS].every(
      (year, index) => index === 0 || BIRTH_YEARS[index - 1] > year,
    );
    expect(descending).toBe(true);
  });
});

describe("제출 가능 판정 (3.4)", () => {
  it("닉네임과 성별이 둘 다 있어야 활성이다", () => {
    expect(isProfileReady({ nickname: "민지", gender: "F" })).toBe(true);
    expect(isProfileReady({ nickname: "민지", gender: null })).toBe(false);
    expect(isProfileReady({ nickname: "", gender: "F" })).toBe(false);
  });

  it("공백만 채운 닉네임은 채운 것이 아니다", () => {
    expect(isProfileReady({ nickname: "   ", gender: "M" })).toBe(false);
  });
});

describe("입력 정규화", () => {
  it("닉네임은 앞뒤 공백을 버리고 한도에서 자른다", () => {
    expect(normalizeNickname("  민지  ")).toBe("민지");
    expect(normalizeNickname("가".repeat(30))).toHaveLength(NICKNAME_MAX_LENGTH);
  });

  it("지역은 마스터에 있는 값만 받는다", () => {
    expect(normalizeAreas([AREAS[0], "화성시", AREAS[1]])).toEqual([
      AREAS[0],
      AREAS[1],
    ]);
  });

  it("지역 중복을 접고 한도에서 자른다", () => {
    const many = normalizeAreas([...AREAS, AREAS[0]]);

    expect(many).toHaveLength(MAX_PREFERRED_AREAS);
    expect(new Set(many).size).toBe(many.length);
  });

  it("범위 밖 출생연도는 기본값으로 떨어진다", () => {
    expect(normalizeBirthYear(BIRTH_YEAR_MIN - 1)).toBe(BIRTH_YEAR_DEFAULT);
    expect(normalizeBirthYear(BIRTH_YEAR_MAX + 1)).toBe(BIRTH_YEAR_DEFAULT);
    expect(normalizeBirthYear("1996")).toBe(1996);
    expect(normalizeBirthYear("스물아홉")).toBe(BIRTH_YEAR_DEFAULT);
    expect(normalizeBirthYear(null)).toBe(BIRTH_YEAR_DEFAULT);
    expect(normalizeBirthYear(1996.5)).toBe(BIRTH_YEAR_DEFAULT);
  });

  it("성별은 두 값만 통과한다", () => {
    expect(isProfileGender("F")).toBe(true);
    expect(isProfileGender("M")).toBe(true);
    expect(isProfileGender("X")).toBe(false);
    expect(isProfileGender(undefined)).toBe(false);
  });
});
