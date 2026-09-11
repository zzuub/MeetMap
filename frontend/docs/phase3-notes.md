# Phase 3 작업 노트

Phase 3(USER 지도 · 비교) 작업을 **착수할 때** 편다. 진행 현황표는 [progress.md](progress.md) 2장, 계획은 [dev-plan.md](dev-plan.md) 2장 Phase 3 표, 화면 사양은 [spec/05-탐색.md](spec/05-탐색.md) 6.6·6.7 · [spec/07-비교-찜.md](spec/07-비교-찜.md) 8장이다.
Phase 1·2 의 것은 [phase1-notes.md](phase1-notes.md) · [phase2-notes.md](phase2-notes.md) 에 그대로 있다 — **거기 적힌 규칙은 계속 산다.** phase2-notes 의 `막힌 것` 표는 실 API 전환 항목이라 여기서도 유효하다.

---

## 착수 순서

P3-1 지도 SDK + 줌 + **뷰 토글** → P3-2 마커 + 마커 시트 → P3-3 비교함 → P3-4 비교 플로팅 바

## Phase 2 에서 넘어온 것 — 처방이 아니라 확인할 자리다

> `decisions.md` 4.51 표의 넷째·아홉째·열째 줄이 전부 **다음 판에 남긴 처방이 틀린 것**이었다(`상수 하나를 바꾸면 된다` · `revalidatePath 가 처리한다` · `결과 카드는 list`). 아래는 "이렇게 하면 된다"가 아니라 **착수 때 코드로 다시 볼 자리**다.

| 무엇 | 어디 | 근거 |
| --- | --- | --- |
| 뷰 토글(`리스트 / 지도`)을 붙이면서 **지도 자리표시자와 `리스트로 보기` 링크를 지운다** | `app/(main)/explore/page.tsx` 의 `view === "map"` 분기 | 4.29 |
| 거리순 정렬 축. `SORT_OPTIONS` 에 `distance` 를 더하는 순간 테스트가 4장 문구 넷을 되돌리라고 요구한다 | `features/location-permission` 의 `MAP_AXIS_PHRASES` · `locationViews.test.tsx` | 4.56 |
| TanStack Query 를 안 쓴다는 결정의 **번복 조건이 지도의 뷰포트 조회**다 | — | 4.58 |
| 상세 하단 CTA 의 비교 담기 자리가 비어 있다 | `widgets/event-detail` 의 `DetailCtaBar` | 4.36 |
| 비교함 `localStorage` 영속은 최근 검색어 저장소와 같은 문제를 푼다 — 서버는 못 읽는다(`unknown`) · 막힌 브라우저(`unavailable`) · 가짜 `Storage` 테스트 | `features/event-search/model/recentKeywordsStore.ts` | 4.69 |
| 비교함이 id 셋으로 본문을 받으면 `eventApi.getByIds` 의 두 번째 사용처가 된다 | `entities/event` | 4.62 번복 조건 |
| 스택 헤더의 뒤로가기는 **히스토리가 없으면 아무 일도 안 한다**(새 탭으로 연 공유 링크). `/compare` 도 스택 화면이다 | `widgets/app-header/ui/AppHeader.tsx` | 4.66 표 2번 — 별도 작업으로 뺐다 |

## 막힌 것 — 착수 전 확인

| 항목 | 막는 것 |
| --- | --- |
| **지도 SDK 미선정** | **P3-1.** dev-plan 4장 #5 기본안은 카카오맵(국내 POI 정확도). 키 발급·도메인 등록이 필요하다 |
| 서울 25개 구 경계 / 중심좌표 데이터 소스 | P3-1 지도 중심 이동(6.7) — 16장 |
| 마커 클러스터링 정책 | P3-2 — 16장 |
| 실 API 전환 항목(`/events/batch` 상한 · 약관 뒤 세션 갱신 · `/events/search` 페이지네이션 …) | Phase 3 를 막지 않는다 — [phase2-notes.md](phase2-notes.md) `막힌 것` 표 |

---
