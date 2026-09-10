/**
 * 클라이언트에서도 안전한 공개 API.
 * `userApi` 는 쿠키(`next/headers`)를 쓰므로 `@/entities/user/server` 에 있다.
 */
export { onboardingSummary } from "./model/labels";
export {
  allTermsAgreed,
  EMPTY_AGREEMENT,
  requiredTermsMet,
  setAllTerms,
  type TermsKey,
} from "./model/terms";
export type { AuthContext, ProfileInput, UserApi } from "./model/ports";
export {
  BIRTH_YEARS,
  isProfileGender,
  isProfileReady,
  normalizeAreas,
  normalizeBirthYear,
  normalizeNickname,
  type ProfileGender,
} from "./model/profileInput";
export type {
  LocationPermissionState,
  NotificationSettings,
  TermsAgreement,
  UserLocation,
  UserProfile,
} from "./model/types";
