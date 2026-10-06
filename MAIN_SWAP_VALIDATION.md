# Main/Sub 역할 교환 검증 — 0.1.13

2026-10-06. 사용자 승인: Sub를 Main으로 지정하면 기존 Main을 Sub로 바꾸며, 열린 탭과 화면 위치를 유지한다. 이미 열린 탭은 연결 여부와 무관하게 계속 볼 수 있다.

## 변경과 범위

- Sub의 Markdown 탭 우클릭 → `메인 스페이스로 지정`, 또는 기존 Main 지정/해제 명령으로 두 그룹의 역할을 교환한다.
- 파일을 다시 열거나 이동하지 않는다. 비활성 탭, 일반 그룹, 문서 내용, Main별 가상 폴더를 보존한다.
- 이미 열린 동일 파일의 선택·복원은 허용한다. 새 미연결 파일로 교체하거나 새로 여는 동작에는 기존 연결 제한을 유지한다.
- 일반 그룹에서 새 Main 지정 시 기존 Sub 역할을 해제하는 동작은 유지한다.
- Canvas를 Main으로 지정하는 기능은 이번 변경에 포함하지 않는다. 기존 Canvas 탭 보존만 검증했다.

## 확인 결과

- TypeScript 검사 및 빌드 통과. 자동 테스트 57개 통과(교환·보존·거부 동작 테스트 4개 추가).
- 격리 Obsidian 1.14.4, 플러그인 0.1.13에서 실제 탭 메뉴와 명령 실행.
- A Main / B Sub → B Main / A Sub. Main/Sub 아이콘 각 하나, 같은 그룹 위치와 모든 탭 ID·순서 유지.
- 새 Main과 연결되지 않은 기존 Markdown C 및 Canvas 탭을 실제 클릭해 열람. 새 미연결 N으로 교체는 차단하고 기존 파일 보존.
- 기존 명령으로 역방향 교환. 각 Main의 가상 폴더 표시 복원.
- 여러 단계 아래 Deep을 Main으로 지정한 경우에도 연결을 추가하지 않고 기존 A 탭 열람 가능.
- 세 차례 왕복 교환 후 탭 개수·순서 유지.
- 별도 Sandbox 프로세스 재시작 및 새로운 CDP 대상 발견 후 역할·전체 탭·Main별 폴더 복원 확인. 기존 C/Canvas 선택과 왕복 교환 재확인.
- 시험 Markdown 7개와 Canvas 1개는 준비한 원본 SHA-256과 일치. 완료한 UI·재시작 검증에서 런타임 예외 없음.
- 기준 UI는 기존 화면의 탭 아이콘과 지정 메뉴다. 교환 전후 캡처를 비교해 기존 화면 배치와 테마 표시를 확인했다.

## 재실행

`MD_PALETTE_CDP_PORT`와 `MD_PALETTE_SANDBOX_TITLE`을 현재 대상에 맞춘 뒤 `scripts/main-swap-validation.mjs`의 `install`, `ui`, 프로세스 재시작 후 `restart`를 사용한다. 스크립트는 전용 `MDPalette-Swap-Sandbox-20261006` Vault만 허용한다.

시험 자료·설정 백업과 원시 증거: `.artifacts/main-swap/`. 공개 배포 및 BRAT 결과는 해당 JSON 증거와 후속 배포 기록을 기준으로 한다. 사용자 본인의 BRAT 확인은 자동 검증과 별개다.

## 배포 및 복원 확인

- 공개 [Release 0.1.13](https://github.com/tlatndms2-droid/md-palette/releases/tag/0.1.13), 코드 커밋 `b5a2937`.
- 공개 자산 `main.js`·`manifest.json`·`styles.css`를 다시 다운로드해 검증 빌드와 SHA-256 일치 확인.
- 격리 Sandbox의 BRAT 2.2.0으로 0.1.12→0.1.13 공개 다운로드·활성화 확인. 기존 탐색·카드·연결·가상 폴더 설정 보존.
- BRAT 설치본의 main.js/styles.css는 공개 자산과 해시 일치. manifest는 BRAT가 JSON 공백을 다시 작성하여 바이트 해시는 다르지만 모든 필드가 일치한다.
- 시험 후 플러그인 설정과 workspace.json을 시험 전 백업으로 복원하고 복원 시점의 SHA-256 일치를 확인했다. Markdown/Canvas는 원본 바이트가 유지됐다. 복원 후 Sandbox를 다시 열어 0.1.13, A Main, 기존 오른쪽 Sub 및 BRAT 로드를 확인했다.
- 증거: `docs/handoff/evidence/0.1.13/`. 사용자 직접 확인은 대기 중이다.
