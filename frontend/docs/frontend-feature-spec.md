# MeetMap USER — 프론트엔드 기능정의서

> **대상 목업 (claude.ai/design 캔버스)**
> - `MeetMap Onboarding.dc.html` — 로그인 / 약관 / 인트로 / 프로필 설정 / 완료
> - `MeetMap User v2.dc.html` — 홈 / 탐색(리스트·지도) / 찜 / 마이 / 필터 시트 / 마커 시트
> - `MeetMap Actions.dc.html` — 행사 상세 / 외부 신청 모달 / 비교함 / 찜 목록
> - `MeetMap My.dc.html` — 알림함 / 알림 설정 / 후기 목록 / 후기 작성 / 마이페이지
> - `MeetMap Support.dc.html` — 검색 / 위치 권한 / 빈 상태·에러
>
> **작성 원칙**
> 1. 목업에 실제로 그려진 요소만 기능으로 정의한다. 추정이 필요한 항목은 `TBD`로 표기하고 16장에 모은다.
> 2. 목업 우하단의 플로팅 탭바(`상세·신청 / 비교 / 찜` 등)는 **프로토타입 화면 전환용 장치**이며 제품 기능이 아니다. 실제 내비게이션은 하단 4탭(홈/지도/찜/마이) + 라우팅으로 대체한다.
> 3. 기술 스택: **Next.js 16 (App Router) / React 19 / TypeScript / Tailwind CSS v4**. 폴더 구조는 `src/README.md`의 FSD 규칙을 따른다.

---

## 1. 정보 구조(IA) 및 라우팅 맵

```
/onboarding                    온보딩 (로그인 → 약관 → 인트로 → 프로필 → 완료)
/onboarding/location           위치 권한 요청 / 지역 직접 선택

(main)                         하단 4탭 셸 (BottomNav 노출)
  /                            홈
  /explore                     탐색 (?view=list|map)
  /likes                       찜 목록
  /my                          마이페이지

/search                        검색 (전체화면, 탭바 없음)
/events/[eventId]              행사 상세
/compare                       비교함
/my/notifications              알림함
/my/notifications/settings     알림 설정
/my/reviews                    내가 쓴 후기 / 후기 목록
/reviews/write/[eventId]       후기 작성
/my/applications               신청 이력    ← 목업 없음, 진입점만 존재
/my/profile/edit               프로필 수정  ← 목업 없음, 진입점만 존재
/policy/terms                  약관 및 개인정보 ← 목업 없음, 진입점만 존재
```

### 1.1 라우트 그룹 설계

| 그룹 | 경로 | 설명 |
| --- | --- | --- |
| `app/(onboarding)/` | `/onboarding/*` | 하단 탭 없음. 전체화면 + 하단 시트 레이아웃 |
| `app/(main)/` | `/`, `/explore`, `/likes`, `/my` | `layout.tsx`에 `BottomNav` 고정 |
| `app/(stack)/` | `/events/[id]`, `/compare`, `/search`, `/my/**`, `/reviews/**` | 뒤로가기 헤더(`AppHeader`) 레이아웃, 하단 탭 없음 |

### 1.2 화면 전이도

```
[온보딩]
 로그인 ──소셜 인증──▶ 약관 ──필수동의──▶ 인트로 ──┬─"1분 만에 설정"─▶ 프로필 ─▶ 완료 ─▶ 위치권한 ─▶ 홈
                                                  └─"나중에 할래요"─────────────▶ 완료 ─▶ 위치권한 ─▶ 홈

[메인]
 홈 ──지도카드 / 지도탭──▶ 탐색(map) ──마커──▶ 마커 시트 ──▶ 행사 상세
 홈 ──퀵칩 / 전체보기────▶ 탐색(list) ──카드──▶ 행사 상세
 홈 ──검색 아이콘────────▶ 검색 ──결과 카드──▶ 행사 상세
 행사 상세 ──비교 담기──▶ 비교함 ──▶ 행사 상세
 행사 상세 ──신청하기──▶ 외부 이동 확인 모달 ──▶ (주최사 외부 페이지, 새 탭)
 마이 ──▶ 알림함 / 알림 설정 / 후기 목록 / 후기 작성 / 찜 / 비교함
```

---

## 2. 공통 규칙

### 2.1 레이아웃 셸

| 항목 | 값 | 근거 |
| --- | --- | --- |
| 기준 뷰포트 | 모바일 우선, 콘텐츠 `max-width: 430px` 중앙 정렬 | 전 목업 공통 |
| 하단 탭 높이 | 68px, `position: fixed`, `backdrop-filter: blur(10px)` | User v2 |
| 상단 헤더 높이 | 56px, `position: sticky; top: 0`, 반투명 + blur | 전 목업 공통 |
| 본문 하단 여백 | 탭바·고정 CTA와 겹치지 않도록 `padding-bottom` 84~96px | 목업 값 |
| 데스크톱 | 430px 컬럼 유지 + 양옆 배경 그라디언트 (확장 대응은 **TBD**) | |

### 2.2 디자인 토큰 (`shared/config/theme.ts` + Tailwind v4 `@theme`)

**2026-08-31 컬러 시스템 전면 교체.** 기존 딥네이비+민트(oklch) 팔레트를 폐기하고, "보태니컬 화이트 방향" 팔레트로 전 목업(User v2/Admin/Provider/Provider Manage/Support/Onboarding/Actions/My/Admin Manage/Common)에 일괄 적용했다. 값은 hex로 고정한다 — oklch 변환은 구현 시 선택 사항이며 아래 hex가 원본이다.

| 토큰 | 값 | 용도 |
| --- | --- | --- |
| `--color-primary` | `#14382A` | 로고, 헤더 텍스트, 활성 하단내비, secondary 버튼 테두리/텍스트 |
| `--color-secondary` | `#96A377` | 보조 태그, 기본 지도 pin |
| `--color-accent` | `#DDC497` | CTA 버튼, 활성 필터칩 배경, 선택된 지도 pin. **위에 올라가는 텍스트는 반드시 `--color-text`(짙은 블랙 계열), 흰 텍스트 금지** — 흰 텍스트 대비 ≈1.6:1로 WCAG 미달 |
| `--color-accent-soft` | `#F5EEDD` | 배지 배경, 아이콘 박스 등 옅은 강조 배경 |
| `--color-point` | `#A86D58` (테라코타) | 화면별 포인트 강조색. 메인/대표 컬러로 쓰지 않는다 — 인기랭킹 숫자, 여성 신청 비율, 위치 핀, 찜(좋아요) 하트 등 **제한적 포인트 용도 전용** |
| `--color-text` | `#17170F` | 본문(거의 블랙) |
| `--color-text-sub` | `#59503E` | 보조 설명 |
| `--color-border` | `#EDE7D6` | 카드 테두리 |
| `--color-surface` | `#FFFFFF` | 카드/시트/모달 배경 |
| `--color-bg` | `#FBFAF6` | 페이지 배경(거의 화이트에 가까운 아이보리) |
| `--color-active` | `#F0E7D0` | 선택된 칩 배경 |
| `--color-success` | `#4E7B54` | 모집중 배지 (흰 텍스트) |
| `--color-warning` | `#AD6A2E` | 마감임박 배지 (흰 텍스트) |
| `--color-disabled-bg` | `#C9C2AE` | 비활성 버튼/마감 배지 |
| 히어로 예외 | `linear-gradient(135deg, #0A2119, #2E4A34 55%, #96A377)` | 홈/온보딩 히어로 배너에 한해 유지하는 유일한 짙은 배경. "화면 전체는 밝고, 히어로 한 곳만 짙다"는 위계가 이 시스템의 규칙 |
| radius | 카드 16~20px / 버튼 13~14px / 칩 999px | |
| font | 본문 `Pretendard`, 숫자·가격 `Georgia, serif` | 목업 공통 |

> 카카오/네이버 로그인 버튼(3.1)은 이 토큰 체계에서 예외다 — 브랜드 가이드 컬러(카카오 옐로우, 네이버 그린)를 그대로 유지한다.

> **가격·평점·카운터 숫자는 세리프(Georgia)** 로 표기하는 것이 이 디자인의 규칙이다. `shared/ui/Numeric.tsx`로 강제한다.

### 2.3 서버 / 클라이언트 컴포넌트 원칙

| 유형 | 구분 | 이유 |
| --- | --- | --- |
| 페이지 조립부, 목록 초기 렌더 | 서버 컴포넌트 | 초기 데이터 서버 fetch, 번들 절감 |
| 필터·정렬·뷰 토글, 찜 버튼, 시트/모달, 폼, 지도 | 클라이언트 (`"use client"`) | 로컬 상태·이벤트 필요 |
| 하단 탭 | 클라이언트 | `usePathname()`으로 활성 탭 판정 |

### 2.4 상태 관리 원칙

| 상태 | 보관 위치 | 비고 |
| --- | --- | --- |
| 탐색 필터·정렬·뷰 모드 | **URL 쿼리스트링** (`useSearchParams` + `router.replace`) | 공유·뒤로가기·새로고침에 강함 |
| 찜(likedIds) | 서버 상태 + 낙관적 업데이트(`useOptimistic`) | 로그인 필요 |
| 비교함 (최대 3건) | 클라이언트 전역 + `localStorage` 영속 | 서버 저장 여부 **TBD** |
| 최근 검색어 | `localStorage` | 보관 개수 **TBD** |
| 온보딩 입력값 | 단계 간 클라이언트 상태(Context) | 마지막 단계에서 일괄 제출 |
| 알림 읽음 | 서버 상태 | 낙관적 업데이트 |

### 2.5 공통 피드백 패턴

| 패턴 | 사양 | 사용처 |
| --- | --- | --- |
| 토스트 | 화면 하단(고정 CTA 위 ~150px), 1.8초 자동 소멸, `fadeIn 0.16s` | 찜 저장/해제, 비교 담기, 담기 한도 초과 |
| 바텀 시트 | `sheetUp 0.2s`, 딤 `rgba(16,28,38,0.38)`, 딤 클릭 시 닫힘, 그랩 핸들 36×4px | 필터, 지도 마커 |
| 센터 모달 | `popIn 0.18s`, 딤 `rgba(16,28,38,0.42)` | 외부 신청 이동 확인 |
| 비활성 버튼 | 배경 `--color-disabled-bg`, `cursor: not-allowed`, **라벨이 미충족 사유를 안내** | 약관·프로필·후기 제출 |

> 비활성 버튼의 라벨이 사유를 말하는 것(`필수 약관에 동의해주세요`, `후기를 10자 이상 작성해주세요`)이 이 제품의 일관된 패턴이다. 별도 에러 토스트를 띄우지 않는다.

---

## 3. 온보딩

### 3.1 로그인 — `/onboarding`

| 기능 | 트리거 | 동작 | 예외 |
| --- | --- | --- | --- |
| 서비스 소개 히어로 | 진입 | 지도 일러스트 + 마커 2개(`19:30 와인 로테이션`, `22:30 심야 다트`) 정적 표시 | — |
| 카카오 로그인 | 클릭 | OAuth 인증 → 신규 가입자는 약관 단계, 기존 회원은 홈 | 인증 실패 시 에러 토스트 |
| 네이버 로그인 | 클릭 | 상동 | 상동 |
| Google 로그인 | 클릭 | 상동 | 상동 |
| 약관 링크 | 클릭 | 이용약관 / 개인정보 처리방침 상세 | 화면 **TBD** |

- 이메일·비밀번호 가입 없음. **소셜 로그인 3종 전용.**
- 기존 회원 판별은 서버 응답(`isNewUser`)으로 분기한다.

### 3.2 약관 동의 — `/onboarding/terms`

| 순번 | 구분 | 항목 |
| --- | --- | --- |
| 1 | 필수 | 만 19세 이상입니다 |
| 2 | 필수 | 서비스 이용약관 |
| 3 | 필수 | 개인정보 수집 및 이용 |
| 4 | 선택 | 마케팅 정보 수신 동의 |

| 기능 | 동작 |
| --- | --- |
| 전체 동의 | 전체 체크/해제 토글. 4개 모두 ON일 때만 전체 동의 박스가 활성 스타일 |
| 개별 토글 | 체크박스 또는 라벨 영역 클릭으로 토글 |
| 자세히 보기 | 항목별 약관 전문 (화면 **TBD**) |
| 계속하기 | 필수 3개 충족 시 활성. 라벨: `동의하고 계속하기` / `필수 약관에 동의해주세요` |
| 뒤로가기(←) | 로그인 단계로 복귀 |

- 선택 항목(마케팅) 동의값은 알림 설정의 마케팅 수신과 연동된다(알림 설정 하단 안내 문구 근거).

### 3.3 인트로(가치 제안) — `/onboarding/intro`

| 기능 | 동작 |
| --- | --- |
| 혜택 3종 안내 | ① 내 지역의 오늘 모임을 홈 상단에 ② 참가 조건에 맞는 모임만 필터링 ③ 찜한 모임 마감 전 알림 |
| `1분 만에 설정하기` | 프로필 설정 단계로 |
| `나중에 할래요` | 프로필을 건너뛰고 완료 단계로 (프로필 완성도 감점 → 마이페이지에서 재유도) |

### 3.4 프로필 설정 — `/onboarding/profile`

| 필드 | 입력 방식 | 제약 | 필수 |
| --- | --- | --- | --- |
| 닉네임 | 텍스트 | 최대 12자, 실시간 카운터 `N/12자` | ✅ |
| 출생연도 | `select` | 1975 ~ 2007 내림차순, 기본값 1996 | (기본값 존재) |
| 성별 | 2택 1 (여성 / 남성) | — | ✅ |
| 관심 카테고리 | 다중 선택 칩 | 최대 5개, `N개 선택됨`. 한도 초과 시 클릭 무시 | ❌ |
| 선호 지역 | 다중 선택 칩 | 최대 3개, `N개 선택됨` | ❌ |

- 카테고리 마스터: `소개팅파티 / 와인 / 전시 / 러닝 / 보드게임 / 쿠킹 / 음악 / 피크닉`
- 지역 마스터: `성수·건대 / 강남·역삼 / 홍대·연남 / 을지로·종로 / 이태원·한남 / 잠실·송파`
  ※ 위치 권한 화면(Support)에는 `여의도·영등포`, `신촌·이대`가 추가된 8개 목록이 쓰인다 → **지역 마스터 통일 필요**
- 제출 버튼: `닉네임 + 성별` 충족 시 활성. 라벨 `완료하고 시작하기` / `닉네임과 성별을 입력해주세요`
- 우상단 `건너뛰기` 상시 노출 → 완료 단계로 점프
- 시트 최대 높이 `78vh` + 내부 스크롤

> **한도 초과 시 무반응**은 사용자가 원인을 알 수 없다. 토스트(`최대 5개까지 선택할 수 있어요`) 추가를 권장한다 → 16장.

### 3.5 완료 — `/onboarding/done`

| 기능 | 동작 |
| --- | --- |
| 완료 요약 | 선택값 기반 동적 문구: `"{지역들}의 {카테고리들} 모임을 먼저 보여드릴게요"`. 미선택 시 `"언제든 마이페이지에서 관심사를 추가할 수 있어요"` |
| 홈으로 이동 | 위치 권한 화면(4장)을 거쳐 홈 진입 |

---

## 4. 위치 권한 — `/onboarding/location`

3가지 상태를 가진 단일 화면이다.

### 4.1 `asking` (권한 요청)

| 기능 | 동작 |
| --- | --- |
| 혜택 안내 | ① 거리순 정렬 ② 지도 중심 자동 설정 |
| 개인정보 고지 | `"위치 정보는 모임 추천에만 사용되며 저장되지 않습니다"` 고정 문구 |
| `위치 정보 허용하기` | 브라우저 Geolocation 권한 요청 → 허용 시 `granted`, 거부 시 `denied` |
| `지역 직접 선택할게요` | 즉시 `denied`(지역 선택) 화면으로 |

### 4.2 `granted` (권한 허용됨)

| 기능 | 동작 |
| --- | --- |
| 위치 확정 안내 | 역지오코딩 결과 표시: `"서울 성동구 성수동 기준으로 주변 모임 N건을 찾았습니다"` |
| 요약 카드 | `{동} · 반경 3km` / `오늘 저녁 N건 · 심야 N건` |
| `주변 모임 보기` | `/explore?view=map` |
| `권한 요청 화면 다시 보기` | `asking`으로 복귀 — 프로토타입 확인용, 실서비스 노출 여부 **TBD** |

### 4.3 `denied` (권한 거부 → 지역 직접 선택)

| 기능 | 동작 |
| --- | --- |
| 경고 배너 | `"위치 권한이 꺼져 있어요"` + 제약 안내(거리순 정렬·지도 자동 이동 불가) |
| 활동 지역 선택 | 8개 중 최대 3개 다중 선택, `N개 선택됨` |
| 시작 버튼 | 1개 이상 선택 시 활성. 라벨 `N개 지역으로 시작하기` / `지역을 1개 이상 선택해주세요` |
| `위치 권한 다시 허용하기` | Geolocation 재요청 |

- 권한 거부 상태에서는 탐색 화면의 **거리순 정렬·현재 위치 기준 거리 표기·지도 자동 센터링을 비활성**하고, 선택 지역 중심으로 대체한다.

---

## 5. 홈 — `/`

### 5.1 구성 (상단 → 하단)

1. 앱 헤더 (로고 / 검색 / 알림)
2. 헤드라인 + 추천 기준 안내
3. 지도 프로모 카드
4. 퀵 필터 칩 바
5. 섹션 A — 오늘 인기 모임 (가로 스크롤)
6. 섹션 B — 여성 신청 많은 모임 (가로 스크롤)
7. 섹션 C — 지금 신청 가능한 모임 (세로 리스트)
8. 하단 내비게이션

### 5.2 기능

| # | 기능 | 트리거 | 동작 | 비고 |
| --- | --- | --- | --- | --- |
| 5-1 | 로고 | 클릭 | 홈 스크롤 최상단 | |
| 5-2 | 검색 진입 | 아이콘 클릭 | `/search` | |
| 5-3 | 알림 진입 | 아이콘 클릭 | `/my/notifications` | 안읽음 존재 시 우상단 도트 표시 |
| 5-4 | 헤드라인 | 진입 | `"오늘 갈 모임, 위치와 분위기로 골라요"` 고정 카피 | |
| 5-5 | 추천 기준 문구 | 진입 | `"{동} 기준 · {시간대} 모임을 추천했어요"` — 위치 + 현재 시각 기반 | 권한 거부 시 선호 지역명으로 대체 |
| 5-6 | 지도 프로모 카드 | 카드 클릭 | `/explore?view=map` | `내 주변 3km` 라벨, 반경값 설정 연동 **TBD** |
| 5-7 | 지역 바로가기 | 카드 내 칩 클릭 | 해당 지역 필터 적용 후 탐색 이동 | 목업은 4개 지역이 1개 칩에 묶여 있음 — 개별 칩 분리 필요 |
| 5-8 | 퀵 칩 | 칩 클릭 | 탐색 화면으로 이동하며 프리셋 적용 (`오늘`→ALL, `점심`/`저녁`/`심야`→timeSlot, `3만원 이하`→가격 필터) | **단일 선택** |
| 5-9 | 섹션 전체보기 | `전체보기 >` | 해당 정렬 기준이 적용된 `/explore` | |
| 5-10 | 가로 스크롤 | 스와이프 | 카드 폭 196px, `overflow-x: auto` | 키보드 접근 대응 필요 |

### 5.3 섹션별 데이터 규칙

| 섹션 | 정렬 / 필터 | 카드 형태 | 표시 항목 |
| --- | --- | --- | --- |
| 오늘 인기 모임 | `popularity` 내림차순, 최대 6건 | 대형 카드(196px) | 썸네일 + 찜 버튼, 상태 배지, 시간대 배지, 제목(2줄), 일시, 가격 |
| 여성 신청 많은 모임 | `femaleRatio` 내림차순, 최대 6건 | 대형 카드 | `여성 N%` 배지, 제목, **성비 게이지 바**, 가격 |
| 지금 신청 가능한 모임 | `status === '모집중'`, 최대 4건 | 소형 가로 카드 | 썸네일(62px), 제목, `주최사 · 시간대 시각`, 가격, `잔여 N석` |

- 인기순(`popularity`) 산식 — **TBD**
- "여성 신청 많은" 집계 기간·성비 계산 방식 — **TBD**

### 5.4 하단 내비게이션

| 탭 | 라우트 | 활성 표시 |
| --- | --- | --- |
| 홈 | `/` | 도트 색상 `--color-accent` + 라벨 진하게 |
| 지도 | `/explore?view=map` | 상동 |
| 찜 | `/likes` | 상동 |
| 마이 | `/my` | 상동 |

---

## 6. 탐색 — `/explore`

### 6.1 URL 파라미터 설계

```
/explore?view=list|map
        &province=SEOUL
        &district=ALL|GANGNAM|NOWON|DONGDAEMUN|MAPO|SEONGDONG|SONGPA|...
        &slot=ALL|LUNCH|DINNER|LATE_NIGHT
        &sort=popular|latest|priceAsc|priceDesc
        &mood=차분한,트렌디한
        &only20s=1
        &gender=ANY|MALE|FEMALE
        &area=성수·건대
```

- `province`는 MVP1에서 `SEOUL` 고정값만 유효하다. 다른 시/도 값은 아직 서버가 데이터를 갖고 있지 않으므로 파라미터 자체는 미리 설계해두되 UI에서 선택 불가 처리한다(6.3 참조).
- `district`(구)는 `area`(동, 기존 지역 마스터)와 별개 축이다. `area`는 사용자 프로필·온보딩의 선호 지역(동 단위) 표시용으로 남기고, `district`는 지도/탐색 화면의 지역 필터(구 단위) 전용으로 새로 추가한 파라미터다.

### 6.2 상단 컨트롤

| 기능 | 사양 |
| --- | --- |
| 지역 선택 버튼 | `📍 서울 전지역 ▾` (또는 선택된 구 이름). 클릭 시 지역 선택 시트(6.3) | 
| 시간대 칩 | `전체 / 점심 / 저녁 / 심야` **단일 선택**. `flex-wrap`으로 배치 — 가로 스크롤을 만들지 않는다. 좁은 화면에서 넘치는 칩(예: 필터 버튼)은 다음 줄로 자연스럽게 줄바꿈된다 |
| 필터 버튼 | 아이콘 + `필터`. 활성 필터가 있으면 `필터 · N`으로 개수 표시. 클릭 시 필터 시트(6.4) |
| 결과 수 | `총 N개 모임` |
| 정렬 | `select` — 인기순(기본) / 최신순 / 가격 낮은순 / 가격 높은순 |
| 뷰 토글 | 세그먼트 `리스트 / 지도` |

- 활성 필터 개수 = 분위기 선택 수 + (20대 위주 ? 1 : 0) + (성별 조건 ≠ 무관 ? 1 : 0). **지역 선택은 이 카운트에 포함하지 않는다** — 별도 버튼으로 항상 노출되므로 "필터 · N" 배지와 이중으로 세지 않는다.
- 위치 권한 허용 시 `거리순` 정렬 옵션 추가 필요 — 목업 미포함, **TBD**

> ⚠️ **가로 스크롤 금지 원칙.** 2026-08-31 디자인 점검에서 시간대 칩·상태 필터 등 여러 화면의 `overflow-x:auto` 칩 줄이 "지저분하다"는 피드백으로 전부 `flex-wrap` 처리로 교체됐다(User v2/Admin/Provider/My/Admin Manage). 홈 화면의 카드 캐러셀(5.1의 "오늘 인기 모임" 등)은 의도된 스와이프 인터랙션이라 예외이며, 스크롤은 유지하되 스크롤바만 숨긴다. **새 화면에서 칩·필터를 가로 스크롤로 구현하지 않는다.**

### 6.3 지역 선택 시트 (바텀 시트)

MVP1은 서울시로만 서비스 범위를 한정하지만, 향후 경기·인천·대전·부산 등으로 확장할 계획이 있어 처음부터 **시/도 → 시/군/구 2단 계층 구조**로 설계한다.

| 단 | 구성 | 사양 |
| --- | --- | --- |
| 1단 시/도 | 서울 / 경기 / 인천 / 대전 / 부산 | **서울만 선택 가능.** 나머지는 "오픈 예정" 라벨과 함께 비활성(disabled) 처리 |
| 2단 시/군/구 | 서울 전지역 + 실제 행사가 있는 구만 나열(예: 강남구·노원구·동대문구·마포구·성동구·송파구 …) | 구별 행사 건수 표시(`N곳`). 행사가 없는 구는 목록에 노출하지 않는다 |

| 기능 | 동작 |
| --- | --- |
| 진입 | 상단 지역 선택 버튼 클릭 |
| 시/도 전환 | 서울 외 항목 클릭 시 무반응(비활성) — 추후 오픈 시 이 자리에서 바로 전환 가능하도록 구조만 선반영 |
| 구 선택 | 단일 선택. 선택 즉시 상단 버튼 라벨이 `서울 {구}`로 바뀌고 지도/리스트 결과가 갱신 |
| 닫기 | 우상단 X 또는 딤 클릭 |

> 필터 시트(6.4)와 별개의 진입점이다. 지역은 "어디서" 축, 필터 시트는 "어떤 조건" 축으로 UX상 분리한다.
>
> **비즈니스 메모** — 서비스가 서울 외 지역으로 확장될 때, 결제(신청비 등)를 지금처럼 주최사 외부 페이지에 100% 위임하지 않고 MeetMap이 자체 처리하는 방향으로 분리할 계획이 있다(별도 `payment-service`, MSA 구성). 프론트 영향은 크지 않지만 7.3 외부 신청 이동 정책과 13장 API 설계 시 결제 주체 전환 가능성을 염두에 둔다 → 16장에 추적.

### 6.4 필터 시트 (바텀 시트)

| 그룹 | 항목 | 선택 방식 |
| --- | --- | --- |
| 분위기 | 차분한 / 트렌디한 / 활동적인 / 편안한 / 고급스러운 / 네트워킹 | **다중 선택 (OR 조건)** |
| 신청 가능 연령 | `20대 위주` | 토글 1개. 활성 시 `maxAge <= 29`인 행사만 |
| 성별 조건 | 무관 / 남성 참가 / 여성 참가 | **단일 선택** |

| 기능 | 동작 |
| --- | --- |
| 초기화 | 분위기·연령·성별 전부 기본값으로 |
| 결과 보기 | 라벨 `N개 결과 보기` — 실시간 결과 수 반영, 클릭 시 시트 닫힘 |
| 닫기 | 우상단 X 또는 딤 클릭 |
| 최대 높이 | `82vh` + 내부 스크롤 |

> 목업 로직상 **필터는 실시간 반영**된다(적용 버튼 없이 칩 선택 즉시 결과 수 변동). 이 동작을 유지한다.
>
> ⚠️ 성별 조건은 목업 로직에서 `무관`이 아니면 결과가 항상 0건이 되는 미완성 상태다. 행사 측 성별 모집 정책 필드 정의가 선행되어야 한다 → 16장.

### 6.5 리스트 뷰

| 요소 | 사양 |
| --- | --- |
| 카드 | 좌측 썸네일 92px + 우측 정보 |
| 배지 | 상태(모집중 / 마감임박 / 마감) + 시간대 |
| 정보 | 제목 / `주최사 · 날짜 시각 · N~N세` / 가격 |
| 찜 버튼 | 우하단 원형. **카드 클릭 이벤트와 분리** (`stopPropagation`) |
| 카드 클릭 | `/events/[id]` |
| 빈 상태 | `"조건에 맞는 모임이 없어요 / 필터를 조정해 다시 찾아보세요"` (11.2 참조) |

### 6.6 지도 뷰

| 기능 | 사양 |
| --- | --- |
| 지도 영역 | 높이 `calc(100vh - 250px)`, 최소 420px. **실제 지도 SDK 연동 예정**(목업은 플레이스홀더) |
| 마커 라벨 | **시각만 표시**(예: `19:00`). 기존에는 `시각 · 행사명`을 함께 붙였으나 2026-08-31 수정으로 행사명은 제거 — 상세 정보는 마커 탭 시 뜨는 마커 시트에서 확인 |
| 선택 마커 | 강조색(`--color-accent`) + `z-index` 상승 |
| 줌 컨트롤 | 지도 우측 하단 `+ / −` 버튼. 확대/축소 한계에 도달하면 해당 버튼 비활성 스타일로 전환 |
| 마커 클릭 | 하단 마커 시트 오픈 |
| 마커 소스 | 현재 적용된 지역(6.3)·필터(6.4) 결과와 동일 목록 |
| 클러스터링 | 목업 미정의 — **TBD** |

**마커 바텀 시트**

| 요소 | 내용 |
| --- | --- |
| 헤더 | 썸네일 88px + 상태 배지 + 제목 + `주최사 · 날짜 시각` |
| 태그 3종 | `N~N세` / `여성 N%` / `잔여 N석` |
| 하단 | 가격(세리프) + `신청 페이지로 이동` |

> 마커 시트의 `신청 페이지로 이동`은 행사 상세의 `신청하기`와 동일하게 **외부 이동 확인 모달(7.3)** 을 경유해야 한다. 목업은 시트만 닫히지만, 조건 고지 누락은 정책 위반 소지가 있어 모달 경유로 정의한다.

### 6.7 지도 SDK 메모

| 항목 | 내용 |
| --- | --- |
| 후보 | 카카오맵 / 네이버맵 / Google Maps |
| 구현 | 클라이언트 전용 + `next/dynamic(ssr: false)` |
| 위치 | `features/event-map/ui/EventMap.tsx` |
| 선정 | **TBD** (국내 POI 정확도 기준 카카오맵 권장) |
| 줌 컨트롤 | SDK 기본 줌 UI를 쓰지 않고 커스텀 `+/−` 버튼(6.6)으로 대체 — 디자인 시스템 톤 유지 목적. SDK의 `setLevel`/`zoomIn`/`zoomOut` API로 매핑 |
| 구 경계 데이터 | 지역 선택(6.3)의 구 단위 필터를 지도 중심 이동/바운스 박스로 연결하려면 서울 25개 구의 경계(GeoJSON) 또는 중심 좌표 세트가 필요 — **TBD** |

---

## 7. 행사 상세 — `/events/[eventId]`

### 7.1 화면 구성

| 영역 | 내용 |
| --- | --- |
| 히어로 | 대표 이미지 220px |
| 배지 | 모집 상태 + 시간대 |
| 타이틀 | 행사명 |
| 메타 | `주최사 · 날짜(요일) 시각 · 지역 거리km` |
| 정보 카드 | 참가비 / 참가 연령 / 모집 방식(`남녀 균형 · 잔여 N석`) / 여성 신청 비율 |
| 소개 | 행사 설명 본문 |
| 하단 고정 CTA | 찜 / 비교 담기 / 신청하기 |
| 헤더 액션 | `공유` |

### 7.2 하단 고정 CTA

| 버튼 | 비율 | 동작 |
| --- | --- | --- |
| 찜 (원형) | 48px 고정 | 토글. 토스트 `찜 목록에 저장했어요` / `찜을 해제했어요` |
| 비교 담기 | flex 1 | 비교함에 추가. 토스트 `N개 담겼어요`. **3개 초과 시** `최대 3개까지 담을 수 있어요` |
| 신청하기 | flex 1.4 | 외부 이동 확인 모달 오픈 |

**비교 담기 플로팅 바** — 비교함에 1건 이상 있을 때 하단 CTA 위(82px)에 노출

| 요소 | 내용 |
| --- | --- |
| 썸네일 스택 | 담긴 행사 썸네일 30px, `-8px` 겹침 |
| 텍스트 | `N개 담김` / `최대 3개까지 비교할 수 있어요` |
| 버튼 | `비교하기` → `/compare` |

### 7.3 외부 신청 이동 모달 ⚠️ 핵심 정책 화면

MeetMap은 **결제를 대행하지 않는 중개 플랫폼**이다. 신청·결제는 주최사 외부 페이지에서 이뤄진다.

| 요소 | 내용 | 필수 |
| --- | --- | --- |
| 타이틀 | `"외부 신청 페이지로 이동합니다"` | 필수 |
| 고지 | `"신청과 결제는 주최사 페이지에서 진행됩니다. MeetMap은 결제를 대행하지 않습니다."` | **법적 고지 — 필수** |
| 조건 확인 블록 | 참가 연령 / 성별 조건 / 참가비 / 신청 마감 | 필수 |
| 하단 경고 | `"조건에 맞지 않는 신청은 주최사에 의해 취소될 수 있습니다."` | 필수 |
| 취소 | 모달 닫기 | |
| 확인하고 이동 | 외부 URL을 **새 탭**(`target="_blank" rel="noopener noreferrer"`)으로 열고 아웃링크 클릭 이벤트 로깅 | |

- 딤 클릭 시 닫힘.
- 마감된 행사(`status === '마감'`)의 `신청하기` 처리 — 목업 미정의, **TBD**

---

## 8. 비교함 — `/compare`

| 기능 | 사양 |
| --- | --- |
| 최대 담기 수 | **3개** |
| 헤더 | 타이틀 `비교함`, 액션 `전체 비우기` |
| 상단 안내 | `N개 행사를 비교하고 있어요` |
| 컬럼 헤더 | 행사별 썸네일 + 짧은 제목 + 우위 배지 + `빼기` |
| 비교표 행 | 참가비 / 일정 / 거리 / 후기 / 모집 상태 (5행 고정) |
| 우위 하이라이트 | 최저가·최단거리·최고평점 셀을 강조색 + 볼드 |
| 우위 배지 | `가성비`(최저가) / `가까움`(최단거리) / `후기 좋음`(최고평점) — 행사당 1개, 우선순위 가성비 > 가까움 > 후기 좋음 |
| 하단 안내 | `"거리는 현재 위치 기준이며, 후기 점수는 참여 인증 후 작성된 후기만 반영합니다"` |
| 하단 버튼 | `행사 상세로 돌아가기` |
| 그리드 | `84px + 1fr × N` (담긴 개수에 따라 컬럼 가변) |
| 빈 상태 | `"비교함이 비어 있어요 / 행사 상세에서 비교 담기를 누르면 최대 3개까지 나란히 볼 수 있어요"` + `행사 보러 가기` |

- 위치 권한 거부 시 `거리` 행 처리 — **TBD** (`-` 표기 권장)

---

## 9. 찜 목록 — `/likes`

| 기능 | 사양 |
| --- | --- |
| 헤더 | `내 찜 목록` / 액션 `편집` (일괄 삭제 모드 — 동작 **TBD**) |
| 안내 | `찜한 모임 N개 · 마감 전 알림을 보내드려요` |
| 카드 | 썸네일 66px + 상태 배지 + 제목(1줄 말줄임) + `날짜 · 가격 · 거리` + 찜 해제 버튼 |
| 카드 클릭 | `/events/[id]` |
| 찜 해제 | 낙관적 업데이트로 즉시 제거. 되돌리기 제공 여부 **TBD** |
| 빈 상태 | `"아직 찜한 모임이 없어요 / 마음에 드는 모임의 동그라미를 누르면 여기에 저장돼요"` + `모임 탐색하러 가기` |
| 정렬 | 목업 미정의 — 마감 임박순 권장, **TBD** |

- 찜 시 마감 전 알림 발송은 **알림 설정의 `마감임박 알림`(잔여 3석 이하)** 과 연동된다.

---

## 10. 마이 / 알림 / 후기

### 10.1 마이페이지 — `/my`

| 블록 | 요소 | 동작 |
| --- | --- | --- |
| 프로필 카드 | 아바타, 닉네임, `성별 · 출생연도 · 관심지역`, `수정` | `수정` → `/my/profile/edit` (**목업 없음**) |
| 프로필 완성도 | 진행바 + % + 체크리스트 4항목 (닉네임 등록 / 관심 카테고리 3개 이상 / 선호 지역 등록 / 프로필 사진 등록) | 미완료 항목은 강조색·볼드 |
| 카운터 3종 | 찜한 행사 / 신청 이력 / 내 후기 | 각각 해당 목록으로 이동 |
| 후기 작성 유도 배너 | `작성할 후기 N건` + 대상 행사명·참여일 | `/reviews/write/[eventId]` |
| 메뉴 그룹 1 | 찜한 행사 / 신청 이력 / 내가 쓴 후기 / 비교함 | 각 라우트 |
| 메뉴 그룹 2 | 알림함(안읽음 배지) / 알림 설정 / 약관 및 개인정보 / 로그아웃 | 로그아웃 확인 다이얼로그 필요 (**목업 없음**) |
| 헤더 액션 | `설정` → 알림 설정 | |

- 완성도 계산: `완료 항목 / 전체 항목 × 100`(반올림). 항목 목록은 서버 정의 **TBD**

### 10.2 알림함 — `/my/notifications`

| 기능 | 사양 |
| --- | --- |
| 필터 | `전체 N` / `안읽음 N` 단일 선택 |
| 헤더 액션 | `모두 읽음` |
| 알림 카드 | 종류 아이콘 + 종류 태그 + 상대 시각 + 제목 + 본문 + 안읽음 도트 |
| 안읽음 스타일 | 흰 배경 + 제목 볼드(700) / 읽음은 회색 배경 + 600 |
| 카드 클릭 | 읽음 처리 + **딥링크 이동** (마감임박→행사 상세, 신규→탐색, 후기→후기 작성) |
| 빈 상태 | `"안읽은 알림이 없어요 / 새 소식이 오면 여기에 표시됩니다"` |
| 페이지네이션 | 목업 미정의 — 무한 스크롤 권장, **TBD** |

**알림 종류(kind)**

| kind | 태그 | 예시 |
| --- | --- | --- |
| `urgent` | 마감임박 | 찜한 행사가 곧 마감돼요 · 잔여 4석 |
| `new` | 신규 | 관심지역에 새 모임이 등록됐어요 |
| `review` | 후기 | 후기를 작성해주세요 (참여 인증 완료) |
| `info` | 안내 | 알림 설정이 변경되었습니다 |

### 10.3 알림 설정 — `/my/notifications/settings`

| 설정 | 설명 | 기본값 |
| --- | --- | --- |
| 마감임박 알림 | 찜한 행사의 잔여 좌석이 3석 이하일 때 | ON |
| 관심지역 신규 행사 | 설정한 지역에 새 모임이 등록되면 | ON |
| 후기 작성 요청 | 참여 인증 완료 후 후기 작성 안내 | ON |
| 추천 모임 소식 | 주 1회, 내 조건에 맞는 모임 큐레이션 | OFF |
| 방해 금지 시간 | `사용 안 함` / `23시–08시` / `00시–09시` 단일 선택 | 23시–08시 |

- 상단 고지: `"앱 푸시와 이메일로 함께 발송됩니다"`
- 하단 고지: `"마케팅 정보 수신 동의는 마이페이지 > 약관 및 개인정보에서 변경할 수 있습니다"`
- 토글 변경은 **즉시 저장**(별도 저장 버튼 없음). 실패 시 롤백 + 토스트.

### 10.4 후기 목록 — `/my/reviews`

| 블록 | 요소 |
| --- | --- |
| 평점 요약 | 평균 평점(세리프 32px), 별 표시, 총 후기 수, **5~1점 분포 막대**(최대값 기준 비율, 4점 이상 진한 색) |
| 인기 태그 | 참여자가 많이 남긴 태그 Top 5 (`라벨 + 횟수`) |
| 카테고리 필터 | `전체 / 분위기 / 진행 / 장소` 단일 선택 |
| 후기 카드 | 아바타, 작성자, `날짜 · 행사명`, 별점(★☆), 본문, 태그 칩 |

- 이 화면은 **행사별 후기 목록**과 **내가 쓴 후기** 두 용도로 읽힌다. 목업만으로는 구분 불가 → 라우트 분리 필요: `/events/[id]/reviews` vs `/my/reviews`. **TBD**

### 10.5 후기 작성 — `/reviews/write/[eventId]`

| 단계 | 요소 | 검증 |
| --- | --- | --- |
| 대상 행사 | 썸네일 + 행사명 + `참여일 · 주최사` (읽기 전용) | 참여 인증 완료 건만 진입 가능 |
| 별점 | ★ 5개, 클릭 시 1~5 | **필수** |
| 별점 라벨 | 0 `별점을 선택해주세요` / 1 `아쉬웠어요` / 2 `그저 그랬어요` / 3 `괜찮았어요` / 4 `좋았어요` / 5 `아주 좋았어요` | |
| 태그 | 분위기 3 / 진행 3 / 장소 3, 다중 선택 | 선택 |
| 본문 | textarea, **최소 10자 / 최대 500자**, `N/500자` 카운터 | **필수** |
| 정책 고지 | `"참여 인증이 확인된 모임에만 후기를 남길 수 있습니다. 특정인 비방, 개인정보 노출은 삭제될 수 있습니다."` | 필수 노출 |
| 제출 | 별점 > 0 && 본문 ≥ 10자일 때 활성, 라벨이 미충족 사유 안내 | |
| 완료 | `"후기가 등록되었습니다. 감사합니다!"` 인라인 메시지 | 이후 이동 처리 **TBD** |

**태그 마스터**

| 그룹 | 태그 |
| --- | --- |
| 분위기 | 분위기 좋아요 / 대화하기 편했어요 / 조용한 편이에요 |
| 진행 | 진행이 매끄러워요 / 시간 관리가 좋아요 / 진행자가 친절해요 |
| 장소 | 접근성이 좋아요 / 공간이 쾌적해요 / 주차가 편해요 |

---

## 11. 검색 및 공통 상태

### 11.1 검색 — `/search`

| 상태 | 조건 | 화면 |
| --- | --- | --- |
| `idle` | 입력값 없음 | 최근 검색어 + 인기 검색어 |
| `results` | 입력값 있음 & 결과 ≥ 1 | 결과 건수 + 결과 카드 리스트 |
| `empty` | 입력값 있음 & 결과 0 | 추천 검색어 제안 |

| 기능 | 사양 |
| --- | --- |
| 검색 인풋 | 헤더 고정, placeholder `파티명, 지역, 카테고리 검색`, 입력 시 ✕(전체 지우기) 노출 |
| 검색 대상 필드 | 행사명 + 지역 + 카테고리 + 주최사 (부분 문자열 포함) |
| 검색 시점 | 목업은 입력 즉시. **debounce 300ms 권장** |
| 최근 검색어 | 칩 형태, 개별 삭제(✕) + `전체 삭제`. 클릭 시 재검색. `localStorage` 저장 |
| 인기 검색어 | Top 6, `순위 + 키워드 + 증감(+N / — / -N / new)`. 1~3위 강조색. `기준 시각` 표기 |
| 결과 카드 | 썸네일 84px, 상태 배지 + 카테고리 배지, **제목 내 검색어 하이라이트**, `주최사 · 일시 · 지역`, 가격 |
| 결과 필터 | 우상단 `필터` — 탐색 필터 시트 재사용 (**동작 TBD**) |
| 결과 없음 | `"'{키워드}' 검색 결과가 없어요"` + 추천 검색어 칩(와인 / 성수 / 소개팅 / 심야) |

### 11.2 빈 상태 · 에러 (공통 컴포넌트)

| 유형 | 문구 | 액션 |
| --- | --- | --- |
| 검색 결과 없음 | `'{키워드}' 결과가 없어요` / `철자가 맞는지 확인하거나 더 짧은 키워드로 검색해보세요` | 추천 키워드 칩 + `다시 검색하기` |
| 필터 결과 없음 | `조건에 맞는 모임이 없어요` / `적용한 필터를 하나씩 풀어보면 더 많은 모임을 볼 수 있어요` | **적용된 필터 칩 개별 해제(✕)** + `필터 초기화` / `조건 넓혀 보기` |
| 네트워크 오류 | `연결이 불안정해요` / `네트워크 상태를 확인한 뒤 다시 시도해주세요` | 오류 코드·발생 시각 표시 + `다시 시도`(진행 중 `다시 시도하는 중...`으로 라벨·스타일 변경) + `고객센터 문의` |
| 비교함 비어 있음 | 8장 참조 | |
| 찜 목록 비어 있음 | 9장 참조 | |
| 알림 없음 | 10.2 참조 | |

- 에러 카드에 **오류 코드(`NET_TIMEOUT_504`)와 발생 시각**을 노출하는 것이 이 제품의 규칙이다. CS 문의 시 식별자로 쓴다.
- `조건 넓혀 보기`의 완화 규칙 — **TBD**
- Next.js `error.tsx` / `not-found.tsx` / `loading.tsx`를 라우트 그룹별로 배치하고 위 컴포넌트를 재사용한다.

### 11.3 로딩 상태

| 화면 | 처리 |
| --- | --- |
| 홈, 탐색 리스트 | 카드 스켈레톤 (목업 미정의 — 신규 설계 필요) |
| 지도 | 지도 로딩 오버레이 |
| 버튼 액션 | 버튼 내 라벨 교체 방식 (`다시 시도하는 중...` 패턴 준용) |

---

## 12. 데이터 모델 초안

```ts
// entities/event/model/types.ts
export type TimeSlot = 'LUNCH' | 'DINNER' | 'LATE_NIGHT';
export type EventStatus = '모집중' | '마감임박' | '마감';
export type GenderPolicy = 'ANY' | 'BALANCED' | 'MALE_ONLY' | 'FEMALE_ONLY'; // TBD

export interface EventSummary {
  id: string;
  title: string;
  shortTitle: string;          // 비교함 컬럼용 축약 제목
  provider: string;            // 주최사
  category: string;            // 와인 / 전시 / 러닝 ...
  thumbnailUrl: string;
  date: string;                // ISO 8601
  dateLabel: string;           // '8/14(목)'
  timeLabel: string;           // '19:30'
  timeSlot: TimeSlot;
  price: number;               // KRW
  status: EventStatus;
  remainingSeats: number;
  minAge: number;
  maxAge: number;
  femaleRatio: number;         // 0~100
  genderPolicy: GenderPolicy;
  mood: string[];              // 분위기 태그
  area: string;                // '성수동' (동 단위, 온보딩·위치권한 지역 마스터와 연동)
  province: 'SEOUL';           // 시/도 (MVP1은 'SEOUL' 고정. 6.1·6.3 참조)
  district: string;            // '성동구' (구 단위, 지도 지역 필터 전용 — area와 별개 축)
  distanceKm: number | null;   // 위치 권한 없으면 null
  rating: number;              // 0~5
  reviewCount: number;
  popularity: number;          // 정렬용 서버 산출값
  isLiked: boolean;
  lat: number;
  lng: number;
}

export interface EventDetail extends EventSummary {
  description: string;
  applyDeadline: string;       // ISO 8601 — '8/14 18:30'
  externalApplyUrl: string;    // 주최사 외부 신청 페이지
  images: string[];
}
```

```ts
// entities/user/model/types.ts
export interface UserProfile {
  id: string;
  nickname: string;             // ≤ 12자
  birthYear: number;            // 1975~2007
  gender: 'F' | 'M';
  interestCategories: string[]; // ≤ 5
  preferredAreas: string[];     // ≤ 3
  profileImageUrl: string | null;
  completionRate: number;       // 0~100
}

export interface TermsAgreement {
  ageOver19: boolean;   // 필수
  service: boolean;     // 필수
  privacy: boolean;     // 필수
  marketing: boolean;   // 선택
}

export interface NotificationSettings {
  deadlineAlert: boolean;
  newInAreaAlert: boolean;
  reviewRequestAlert: boolean;
  recommendationAlert: boolean;
  quietHours: 'OFF' | '23_08' | '00_09';
}
```

```ts
// entities/notification/model/types.ts
export type NotificationKind = 'urgent' | 'new' | 'review' | 'info';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  tag: string;        // '마감임박' | '신규' | '후기' | '안내'
  title: string;
  body: string;
  createdAt: string;  // ISO — 화면에는 상대 시간으로 표기
  isRead: boolean;
  linkUrl: string;    // 딥링크
}
```

```ts
// entities/review/model/types.ts
export interface Review {
  id: string;
  eventId: string;
  eventTitle: string;
  author: string;
  authorAvatarUrl: string | null;
  rating: 1 | 2 | 3 | 4 | 5;
  body: string;       // 10~500자
  tags: string[];
  tagCategories: ('분위기' | '진행' | '장소')[];
  createdAt: string;
}

export interface ReviewSummary {
  average: number;
  total: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  topTags: { label: string; count: number; category: string }[];
}
```

---

## 13. API 목록 (프론트 관점)

> 백엔드 MSA 서비스 경계와 1:1 대응. 실제 스펙 확정 후 갱신.

| 화면 | 메서드 | 엔드포인트(가안) | 비고 |
| --- | --- | --- | --- |
| 로그인 | `POST` | `/auth/oauth/{provider}` | 응답에 `isNewUser` |
| 약관 | `POST` | `/users/me/terms` | |
| 프로필 설정 | `PUT` | `/users/me/profile` | |
| 홈 | `GET` | `/events/home?lat&lng` | 3개 섹션 일괄 조회 |
| 탐색 목록 | `GET` | `/events?slot&sort&mood&only20s&gender&area&cursor` | 커서 페이지네이션 |
| 지도 마커 | `GET` | `/events/map?bbox&{필터}` | 뷰포트 기준 |
| 행사 상세 | `GET` | `/events/{id}` | |
| 찜 등록/해제 | `POST` / `DELETE` | `/users/me/likes/{eventId}` | |
| 찜 목록 | `GET` | `/users/me/likes` | |
| 비교 | `GET` | `/events/compare?ids=1,2,3` | 클라이언트 조합도 가능 |
| 검색 | `GET` | `/events/search?q` | |
| 인기 검색어 | `GET` | `/search/trending` | 기준 시각 포함 |
| 알림 목록 | `GET` | `/users/me/notifications?unreadOnly` | |
| 알림 읽음 | `PATCH` | `/users/me/notifications/{id}/read`, `/read-all` | |
| 알림 설정 | `GET` / `PUT` | `/users/me/notification-settings` | |
| 후기 목록 | `GET` | `/events/{id}/reviews?category`, `/users/me/reviews` | |
| 후기 작성 | `POST` | `/events/{id}/reviews` | 참여 인증 검증 |
| 아웃링크 로깅 | `POST` | `/events/{id}/outbound-click` | 정산·통계용 |

---

## 14. FSD 컴포넌트 매핑

```
app/
  (onboarding)/onboarding/page.tsx              # 로그인
  (onboarding)/onboarding/terms/page.tsx
  (onboarding)/onboarding/intro/page.tsx
  (onboarding)/onboarding/profile/page.tsx
  (onboarding)/onboarding/done/page.tsx
  (onboarding)/onboarding/location/page.tsx
  (main)/layout.tsx                             # BottomNav 셸
  (main)/page.tsx                               # 홈
  (main)/explore/page.tsx
  (main)/likes/page.tsx
  (main)/my/page.tsx
  (stack)/layout.tsx                            # AppHeader 셸
  (stack)/events/[eventId]/page.tsx
  (stack)/compare/page.tsx
  (stack)/search/page.tsx
  (stack)/my/notifications/page.tsx
  (stack)/my/notifications/settings/page.tsx
  (stack)/my/reviews/page.tsx
  (stack)/reviews/write/[eventId]/page.tsx
  error.tsx / not-found.tsx / loading.tsx

widgets/
  app-header/            AppHeader (로고·검색·알림 / 뒤로가기·타이틀·액션)
  bottom-nav/            BottomNav
  home-feed/             HomeFeed (헤드라인 + 지도카드 + 퀵칩 + 3개 섹션 조립)
  explore-board/         ExploreBoard (컨트롤바 + 리스트/지도 스위칭)
  event-detail/          EventDetailView (히어로 + 정보카드 + 고정 CTA)
  compare-board/         CompareBoard (컬럼 헤더 + 비교표)
  my-summary/            MySummary (프로필 카드 + 완성도 + 카운터 + 메뉴)
  review-board/          ReviewBoard (평점 요약 + 필터 + 후기 리스트)

features/
  auth-social-login/     SocialLoginButtons, useSocialLogin
  terms-agreement/       TermsAgreementForm, useTermsAgreement
  profile-setup/         ProfileSetupForm, useProfileSetup
  location-permission/   LocationPermissionGate, useGeolocation, AreaSelector
  event-filter/          FilterChipBar, FilterSheet, useEventFilter (URL 동기화)
  event-sort/            SortSelect, ViewToggle
  event-like/            LikeButton, useLikeEvent, likeEventApi
  event-compare/         CompareBar, CompareTable, useCompareStore (localStorage)
  event-apply/           ApplyButton, ExternalApplyModal, logOutboundClick
  event-map/             EventMap, EventMarker, MarkerSheet
  event-search/          SearchInput, RecentKeywords, TrendingKeywords, useSearch
  notification-inbox/    NotificationList, NotificationFilter, useMarkRead
  notification-settings/ SettingToggleList, QuietHoursSelector
  review-write/          ReviewForm, StarRating, ReviewTagPicker, useReviewDraft

entities/
  event/                 EventCard(variant), EventStatusBadge, TimeSlotBadge,
                         FemaleRatioBar, PriceText, types, eventApi
  user/                  ProfileCard, CompletionMeter, types, userApi
  notification/          NotificationCard, types, notificationApi
  review/                ReviewCard, RatingDistribution, ReviewTagChip, types, reviewApi

shared/
  ui/                    Chip, TagChip, SegmentedControl, Toggle, Sheet, Modal, Toast,
                         IconButton, PrimaryButton, EmptyState, ErrorState, Skeleton,
                         Numeric(세리프 숫자), Checkbox, StarInput
  lib/                   formatPrice, formatEventDate, formatRelativeTime, cn,
                         highlightKeyword, clampSelection
  api/                   fetchClient (baseURL · 에러 정규화 · 인증 헤더)
  config/                theme.ts, constants.ts (CATEGORIES, AREAS, DISTRICTS, MOOD_TAGS, REVIEW_TAGS)
```

### 14.1 카드 컴포넌트 변형

`EventCard`는 5가지 변형이 필요하다. `variant` prop으로 통합한다.

| variant | 사용처 | 크기 |
| --- | --- | --- |
| `feature` | 홈 가로 스크롤 섹션 | 196px 폭, 썸네일 118px |
| `ratio` | 홈 "여성 신청 많은 모임" | 196px + 성비 바 |
| `compact` | 홈 "지금 신청 가능", 찜 목록 | 썸네일 62~66px 가로형 |
| `list` | 탐색 리스트, 검색 결과 | 썸네일 84~92px 가로형 |
| `sheet` | 지도 마커 시트 | 썸네일 88px |

---

## 15. 접근성 / 반응형

| 항목 | 기준 |
| --- | --- |
| 터치 타깃 | 최소 44×44px (찜 버튼 현재 26~30px → **확대 또는 히트영역 확장 필요**) |
| 가로 스크롤 | 홈 카드 캐러셀(의도된 스와이프)만 해당 — 키보드 탭 이동 및 좌우 화살표 키 지원. 그 외 칩·필터는 가로 스크롤 자체를 쓰지 않는다(6.2) |
| 색상 대비 | 2026-08-31 팔레트 교체로 재검증: 보조 텍스트 `#59503E` on `#FFFFFF` ≈ 4.6~5.2:1 (AA 통과), CTA 흰 텍스트 on `#DDC497` ≈ 1.6:1 → **흰 텍스트 금지, 반드시 `#17170F` 텍스트 사용**(2.2), 상태 배지 흰 텍스트 on `#4E7B54`/`#AD6A2E` ≈ 4.3~4.7:1 (AA 통과) |
| 시맨틱 | 목업의 `div + onClick`을 `button` / `a` / `input`으로 치환. 토글은 `role="switch"`, 별점은 `radiogroup` |
| 시트·모달 | 포커스 트랩, `Esc` 닫기, `aria-modal`, 열릴 때 배경 스크롤 잠금 |
| 상태 배지 | 색상만으로 구분하지 않도록 텍스트 병기 (현재 충족) |
| 이미지 | 모든 썸네일 `alt` = 행사명 |
| 애니메이션 | `prefers-reduced-motion` 대응 |
| 데스크톱 | 430px 컬럼 유지가 기본. 태블릿·데스크톱 2컬럼 대응 여부 **TBD** |

---

## 16. 추후 정의 필요 (Open Items)

### 정책 · 기획

- [ ] 지역 마스터 통일 — 온보딩 6개 vs 위치 권한 8개 (동 단위)
- [ ] 지도 지역 필터(6.3)의 구 단위 마스터 확정 — 현재는 "행사가 있는 구만 노출" 원칙만 정함, 전체 25개 구를 다 보여줄지는 **TBD**
- [ ] 서울 25개 구 경계/중심좌표 데이터 소스 (지도 중심 이동용, 6.7)
- [ ] 경기·인천·대전·부산 등 서비스 지역 확장 시점과 우선순위 (현재는 "오픈 예정" 자리만 선반영)
- [ ] 결제 자체 처리 전환 시점 및 `payment-service` 분리 설계 (dev-plan.md 1장 비즈니스 확장 메모 참조)
- [ ] 성별 조건 필터의 실제 매칭 로직 (행사 측 `genderPolicy` 필드 정의) — 현재 목업은 `무관` 외 선택 시 결과 0건
- [ ] `마감` 상태 행사의 신청 버튼 처리 (비활성 / 숨김 / 알림 신청)
- [ ] 온보딩 선택 한도 초과 시 피드백 (현재 무반응)
- [ ] 비교함 서버 저장 여부 (기기 간 동기화)
- [ ] 찜 해제 시 되돌리기(Undo) 제공 여부
- [ ] 찜 목록 기본 정렬 기준 / `편집` 모드 동작
- [ ] 후기 목록 라우트 분리 (행사 후기 vs 내 후기)
- [ ] 후기 등록 완료 후 이동 처리, 후기 수정·삭제
- [ ] `조건 넓혀 보기` 버튼의 완화 규칙
- [ ] 인기순(`popularity`) 산식
- [ ] "여성 신청 많은 모임" 집계 기간·계산 방식
- [ ] 최근 검색어 최대 보관 개수
- [ ] 로그인 없이 접근 가능한 범위 (찜·비교·후기의 게스트 제한)

### 화면 미제공 (목업 필요)

- [ ] 프로필 수정 `/my/profile/edit`
- [ ] 신청 이력 `/my/applications`
- [ ] 약관 및 개인정보 상세 `/policy/terms`
- [ ] 로그아웃 확인 다이얼로그 / 회원 탈퇴
- [ ] 스켈레톤 로딩
- [ ] 공유 시트 (행사 상세 헤더 `공유`)
- [ ] 고객센터 문의

### 기술 결정

- [ ] 지도 SDK 선정(카카오맵 권장) 및 마커 클러스터링 정책
- [ ] 서버 상태 관리 라이브러리 (TanStack Query 도입 여부 — 현재 의존성 없음)
- [ ] 목록 페이지네이션 방식 (커서 + 무한 스크롤 권장)
- [ ] 이미지 최적화 (`next/image` + 외부 도메인 허용 설정)
- [ ] 아웃링크 클릭 트래킹 및 분석 도구
- [ ] 푸시 알림 채널 (웹 푸시 / 이메일 — 알림 설정 문구상 둘 다 명시됨)
- [ ] 데스크톱 반응형 범위

---

## 17. 구현 우선순위 (제안)

| 단계 | 범위 | 근거 |
| --- | --- | --- |
| **P0** | 공통 셸(헤더·탭·토큰) → 홈 → 탐색 리스트 → 행사 상세 → 외부 신청 모달 | 핵심 탐색-전환 퍼널. 여기까지가 서비스의 최소 가치 |
| **P1** | 온보딩 + 위치 권한 + 찜 + 검색 | 개인화·재방문 기반 |
| **P2** | 탐색 지도 뷰 + 마커 시트 + 비교함 | "지도에서 비교"라는 제품 차별점 |
| **P3** | 마이 + 알림함 + 알림 설정 | 리텐션 |
| **P4** | 후기 목록 + 후기 작성 | 참여 인증 연동 선행 필요 |

---

*목업 5종(Onboarding / User v2 / Actions / My / Support) 기준 작성. 이전 버전(홈 화면 단독 기준)을 대체한다. Provider·Admin 목업이 준비되면 별도 문서로 분리한다.*

*2026-08-31 갱신 — ① 전체 목업 컬러 시스템을 "보태니컬 화이트 방향"으로 교체(2.2), ② User v2 지도 화면에 지역(시/도→구) 선택 시트·마커 시각 전용 라벨·줌 컨트롤 추가(6.2·6.3·6.6), ③ 여러 화면의 `overflow-x:auto` 칩 줄을 `flex-wrap`으로 교체해 불필요한 가로 스크롤 제거. Provider·Admin 목업도 컬러 시스템은 함께 갱신됐으나 화면별 기능정의는 아직 이 문서에 반영되지 않았다.*
