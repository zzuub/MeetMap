/**
 * 찜 (7.2 / 9장 — P2-7).
 *
 * 상태는 **화면마다 하나**(`LikeProvider`)이고 버튼은 그것을 읽기만 한다 —
 * 홈은 같은 회차가 섹션 셋에 겹쳐 뜬다 (`decisions.md` 4.59).
 */
export { LIKE_FAILED_TOAST, LIKE_TOAST, likeLabel, type LikeResult } from "./model/copy";
export { toggleLikeAction } from "./api/likeAction";
export { LikeButton } from "./ui/LikeButton";
export { LikeProvider, useLike } from "./ui/LikeProvider";
