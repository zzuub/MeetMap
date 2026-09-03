/** 근거: docs/spec/10-데이터모델.md (12장) */

export interface UserProfile {
  id: string;
  /** ≤ 12자 (3.4) */
  nickname: string;
  /** 1975~2007 (3.4) */
  birthYear: number;
  gender: "F" | "M";
  /** ≤ 3 (3.4) */
  preferredAreas: string[];
  profileImageUrl: string | null;
  /** 0~100. 항목 목록은 서버 정의 미확정 (10.1) */
  completionRate: number;
}

export interface TermsAgreement {
  /** 필수 */
  ageOver19: boolean;
  /** 필수 */
  service: boolean;
  /** 필수 */
  privacy: boolean;
  /** 선택. 알림 설정의 마케팅 수신과 연동된다 (3.2 / 10.3) */
  marketing: boolean;
}

export interface NotificationSettings {
  newInAreaAlert: boolean;
  reviewRequestAlert: boolean;
  recommendationAlert: boolean;
  quietHours: "OFF" | "23_08" | "00_09";
}

/** 위치 권한 상태 (4장) */
export type LocationPermissionState = "asking" | "granted" | "denied";

export interface UserLocation {
  lat: number;
  lng: number;
  /** 역지오코딩 결과. '서울 성동구 성수동' */
  label: string;
}
