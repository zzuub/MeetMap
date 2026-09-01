# 폴더 구조 (FSD)

레이어 순서, 이 방향으로만 import 가능 (역방향/동일 레이어 간 참조 금지):

```
app → widgets → features → entities → shared
```

- **app/** — Next.js 라우팅 전용. 페이지는 아래 레이어의 조각을 조립만 한다. 로직을 두지 않는다.
- **widgets/** — 여러 feature/entity를 묶은 화면 블록 (예: 홈 피드, 바텀 내비게이션).
- **features/** — 사용자 행동 단위. 로직(model) + API 호출(api) + UI를 한 세트로 묶는다 (예: 필터링, 찜하기).
- **entities/** — 도메인 명사 단위. 백엔드 MSA 서비스 경계와 1:1로 대응시킨다 (예: event, user, review, provider).
- **shared/** — 도메인 지식이 없는 재사용 자원. `ui`(디자인 시스템 컴포넌트), `lib`(순수 함수), `api`(fetch 클라이언트 공통 설정), `config`(환경변수·상수).

### `shared/config` 의 마스터 데이터 예외

`shared` 는 원칙적으로 도메인 지식을 갖지 않지만, **여러 entity 에 걸쳐 쓰이는 정적 참조 데이터**(카테고리·지역 코드·분위기 태그 등)는 `shared/config/constants.ts` 에 둔다. 기능정의서 14장의 FSD 매핑도 이 배치를 지정한다.

특정 entity 로 내리지 않는 이유는 소유자를 정할 수 없기 때문이다. 예를 들어 `CATEGORIES` 는 event(소개팅 카테고리)와 user(관심 카테고리)가 함께 쓴다. `entities/event` 에 두면 `entities/user` 가 이를 참조해야 하는데, **동일 레이어 간 참조는 금지**되어 있다(린트로 막혀 있다). `shared` 로 끌어올리는 것이 레이어 규칙을 지키는 유일한 배치다.

로직이 아니라 **값의 목록**만 둔다. 도메인 규칙·판정 함수는 여기 두지 않는다.

> 백엔드가 마스터 API 를 제공하면 이 파일은 타입 소스 겸 fallback 으로 남는다.

각 폴더는 `index.ts`로 공개 API만 export하고, 나머지 내부 파일은 외부에서 직접 import하지 않는다.

한 화면에서만 쓰는 컴포넌트는 공통 레이어로 올리지 말고 해당 라우트 옆의 `_components/`에 로컬로 둔다.

## 린트로 강제된다

레이어 방향과 배럴 규칙은 `eslint.config.mjs`의 `no-restricted-imports`로 막아둔다.
문서로만 두면 지켜지지 않는다. 위반하면 빌드 전에 린트에서 걸린다.

## 서버 전용 진입점: `server.ts`

`next/headers`·`cookies()`처럼 서버에서만 동작하는 코드는 `index.ts`에 넣지 않는다.
클라이언트 컴포넌트가 타입 하나 때문에 배럴을 import했다가 서버 모듈까지 끌고 오면 빌드가 깨진다.
슬라이스에 `server.ts`를 따로 두고 서버 컴포넌트만 그쪽을 쓴다.

```
entities/account/
  index.ts    ← 타입·순수 함수. 어디서든 안전
  server.ts   ← getServerSession 등. 서버 컴포넌트 전용
```

## 폴더 이름 앞의 `_`

`app/` 안에서 `_`로 시작하는 폴더는 라우팅에서 제외된다(private folder).
`_components/`가 라우트가 되지 않는 이유이고, 반대로 **실제 라우트 폴더에는 `_`를 붙이면 안 된다**.
