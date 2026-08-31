# entities

도메인 명사 단위. 백엔드 MSA 서비스 경계와 1:1로 대응시킨다.

예: `event`(→ event-service), `user`(→ user-service), `review`(→ review-service), `provider`(→ provider-service)

각 entity 폴더는 `model/types.ts`, `api/*Api.ts`, `ui/*.tsx` 형태를 따르고, 다른 entity를 참조하지 않는다. shared만 참조 가능.
