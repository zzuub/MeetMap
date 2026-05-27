# MeetMap

## 프로젝트 소개

**MeetMap**은 2030 사용자를 위한 소개팅·미팅 행사 통합 탐색 플랫폼입니다.

지도에서 주변 행사를 찾고, 카드 형태로 행사 정보를 비교하며, 사용자 후기와 참여 인증을 기반으로 신뢰도 높은 소개팅 정보를 제공하는 것을 목표로 합니다.

기존 소개팅 행사 정보가 여러 업체와 플랫폼에 흩어져 있는 문제를 해결하기 위해, 행사 정보 검색·비교·저장·후기 확인·외부 신청 URL 이동을 한 곳에서 제공하는 서비스를 지향합니다.

> 소개팅판 “여기어때”를 목표로 하는 지도 기반 소개팅 행사 비교 플랫폼

---

## 주요 기능

### 사용자 기능

- 소셜 로그인 기반 회원가입 / 로그인
- 관심 지역, 성별, 출생연도 등 프로필 등록
- 소개팅 행사 리스트 조회 및 비교
- 날짜, 지역, 가격, 연령대, 분위기 태그 기반 필터링
- 지도 기반 행사 조회
- 행사 상세 정보 확인
- 외부 신청 URL 이동 및 클릭 로그 추적
- 관심 행사 찜하기
- 참여 인증 기반 후기 작성
- 행사 / 후기 / 업체 신고 기능
- 마이페이지 알림 기능

### 관리자 기능

- 관리자 로그인 및 권한 관리
- 제공업체 관리
- 행사 등록 / 수정 / 삭제
- 태그 관리
- 후기 검수 및 블라인드 처리
- 행사 정보 오류 제보 관리
- 추천 행사 및 배너 관리
- 행사 조회수, 신청 클릭수, 찜 수, 후기 수 등 통계 관리

---

## 핵심 서비스 방향

MeetMap은 단순히 소개팅 행사 정보를 나열하는 서비스가 아니라, 사용자가 행사 선택 전에 필요한 정보를 빠르게 비교할 수 있도록 설계합니다.

주요 차별점은 다음과 같습니다.

- 지도 기반 행사 탐색
- 카드형 행사 비교 UI
- 분위기 태그 기반 필터링
- 외부 신청 URL 클릭 추적
- 참여 이력 기반 후기 작성
- 관리자 검수를 통한 후기 신뢰도 관리
- 업체별 행사 성과 통계 관리

---

## 기술 스택

### Frontend

| 구분 | 기술 |
| --- | --- |
| Language | TypeScript |
| Framework | Next.js |
| UI | React |
| Package Manager | npm |
| Build Tool | Next.js Build |
| Routing | Next.js App Router |

### Backend

| 구분 | 기술 |
| --- | --- |
| Language | Java 17 |
| Framework | Spring Boot |
| Build Tool | Gradle |
| ORM | Spring Data JPA |
| Database | MariaDB |
| Library | Lombok |
| API Docs | Swagger / Springdoc OpenAPI |

### DevOps / CI

| 구분 | 기술 |
| --- | --- |
| Version Control | Git / GitHub |
| CI | GitHub Actions |
| Build Check | Frontend Build, Backend Build |
| Deployment | 추후 Docker 기반 배포 자동화 예정 |

---
