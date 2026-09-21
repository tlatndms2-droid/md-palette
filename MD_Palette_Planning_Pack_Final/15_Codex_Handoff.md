# MD Palette — Codex Handoff

## 먼저 읽을 문서
1. Glossary
2. Space System
3. Link View / Card / Connections / Folder
4. Metadata
5. Data/Persistence
6. UI Reference Policy
7. Acceptance Criteria

## Codex가 결정
- API 선택
- 클래스/함수/파일 구조
- 알고리즘
- 캐시
- debounce/throttle
- virtualization
- 내부 state management
- 테스트 프레임워크

## Codex가 임의로 바꾸면 안 되는 것
- 사용자 흐름
- 기능 결과
- Space 역할 규칙
- 데이터 불변조건
- UI Reference 충돌 규칙
- Acceptance Criteria

## 기술 검증 필요
개발 시작 시 Codex가 공식 Obsidian API/현재 버전 기준으로 검증:
- Tab Group / WorkspaceLeaf 기반 Space 추적 및 재배치
- Local Graph 구현/재사용 가능 범위
- Canvas 카드 생성 및 drop 좌표 처리
- Hover preview 재사용
- file rename/delete/external change 이벤트
- thumbnail 생성 가능 범위

이 항목들은 구현 방법만 미정이며 기능 요구사항은 본 기획서를 따른다.

## UI 구현
UI Reference는 개발 스펙 이미지다.
이미지와 Markdown이 충돌하면:
- 추측 금지
- 사용자에게 직접 질문
- 확인 전 해당 영역 확정 구현 금지

문서에 없는 순수 시각 세부:
- 이미지 참고 가능

이미지에 문서에 없는 기능/버튼/동작:
- 반드시 사용자 확인

## 데이터 안전
- 실제 Vault 파일 삭제/이동/수정은 명시된 경우만
- Virtual Folder는 실제 Folder가 아님
- Label은 Markdown에 기록하지 않음
- Plugin Data 손상 복구로 Markdown 덮어쓰기 금지

## 최종 완료 조건
`14_Acceptance_Criteria.md`를 구현 완료 체크리스트로 사용.
기능이 동작해도 UI Reference와 현저히 다르면 UI 완료로 보지 않는다.
