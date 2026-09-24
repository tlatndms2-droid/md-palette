# MD Palette 작업 인계 — 다른 PC 재개 시작점

갱신일: 2026-09-24. 저장소: https://github.com/tlatndms2-droid/md-palette
기본·작업 브랜치: `codex/planning`. 공개 버전: **0.1.9**.

## 현재 상태

**최신 기준은 0.1.9입니다.** 파일을 Canvas에 드래그하면 놓은 위치에 즉시 배치합니다. 메뉴 삽입은 미리보기가 마우스를 따라 이동하고 첫 클릭으로 배치하며 Esc로 취소합니다. 직접 드래그·메뉴 단일 카드는 기존 내용과 겹침을 허용하고, 메뉴 다중 카드 묶음은 겹침을 차단합니다. 47개 테스트·빌드·Sandbox 실제 드래그/메뉴/취소·저장 실패 원상복구·프로세스 재시작 검증을 통과했습니다. [검증](CANVAS_PLACEMENT_VALIDATION.md). Sub·Card는 사용자 완료 확인을 받았으며 이번 변경에 포함하지 않았습니다. 0.1.9 BRAT 업데이트 확인은 사용자가 담당합니다.

### 이전 0.1.8 기록

**현재 기준은 0.1.8이다.** 미연결 파일의 Sub 열기를 차단하고 이전 파일·탭을 유지합니다. Card는 목록으로 고정하며 파일 유형을 복수 선택합니다. 파일 목록과 가상 폴더를 기존 Canvas에 위치 지정 → 미리보기 → 겹침 확인 → 확정으로 삽입합니다. 47개 테스트·빌드·격리 Sandbox 실제 UI·프로세스 재시작을 통과했다. [검증 보고서](CANVAS_REVISION_VALIDATION.md), [Release](https://github.com/tlatndms2-droid/md-palette/releases/tag/0.1.8). 사용자 BRAT 확인 대기이며 다음 작업을 자동으로 시작하지 않는다. 이전 버전의 사용자 확인을 완료 처리한 것은 아니다.

- 현재 Sandbox: `C:\Users\tlatn\AppData\Local\Temp\MDPalette-Canvas-Sandbox-20260924`, 프로필 `MDPalette-Canvas-Profile-20260924`, CDP 19350. 시험 자료와 최종 UI를 유지한다.
- 미연결 파일을 기존 Sub에서 열 때는 차단한다. 기존 **Sub 지정 시 연결 승인 팝업**은 유지한다. Main 변경은 기존대로 역할을 해제하고 탭을 보존한다.
- 사용법: Card 파일 우클릭 `현재 Canvas에 삽입…` 또는 드래그. Folder 폴더 우클릭/전체 루트 우클릭으로 폴더 삽입. 마지막 삽입은 명령 팔레트에서 되돌린다.

### 이전 0.1.7 기록

**당시 재개 기준은 공개 0.1.7이었다. 단일 Sub 지정·해제, 미연결 파일 연결 팝업, Ctrl+Shift 새 일반 그룹, 자유 분할을 Sandbox UI·업데이트·재시작·공개 자산 SHA-256까지 검증했다. 사용자 BRAT 확인 대기이며 자동으로 시작할 다음 기능은 없다. 과거 여러 Sub·전체 높이 강제 규칙은 최신 사용자 승인으로 폐기됐다.**

- 0.1.7 소스: `1e61c27`. [Release](https://github.com/tlatndms2-droid/md-palette/releases/tag/0.1.7), [검증](SUB_RULES_VALIDATION.md), [증거](docs/handoff/evidence/0.1.7). 미연결 지정은 연결하고 지정/취소. 기존 여러 그룹은 마지막 사용 Sub 하나만 남기며 다른 그룹·파일은 보존한다.

- 0.1.6 소스: `a970682`. [Release](https://github.com/tlatndms2-droid/md-palette/releases/tag/0.1.6), [검증](NEW_CANVAS_VALIDATION.md), [증거](docs/handoff/evidence/0.1.6). 기본 Markdown, Canvas 선택 가능. 두 형식 모두 새 노트 위치 설정을 따르고 생성·연결 후 자동으로 열지 않는다.

- 0.1.5 소스: `e60fa99`. [Release](https://github.com/tlatndms2-droid/md-palette/releases/tag/0.1.5), [검증](FOOTNOTE_CHOICE_VALIDATION.md), [증거](docs/handoff/evidence/0.1.5). 본문은 표시된 본문 문맥이며 함께 삽입하면 본문 뒤 번호와 문서 끝 설명을 연결한다.

- 0.1.4 소스: `f2cc389`. [Release](https://github.com/tlatndms2-droid/md-palette/releases/tag/0.1.4), [검증 보고서](METADATA_FONT_DRAG_VALIDATION.md), [증거](docs/handoff/evidence/0.1.4).
- Metadata View 본문 위에서 Ctrl+휠로 10~32px 조절, 재시작 후 복원. Sub 새 줄 진입 직후 놓기와 긴 문서 드래그를 검증했다. 개인 Vault에서의 체감과 BRAT 확인은 사용자가 담당한다.

- 0.1.3 소스: `b7791cc`. [Release](https://github.com/tlatndms2-droid/md-palette/releases/tag/0.1.3), [검증 보고서](METADATA_MARKDOWN_VALIDATION.md), [화면·실행·자산 증거](docs/handoff/evidence/0.1.3).
- 각주 본문·문맥과 메타데이터를 Markdown 서식으로 표시한다. 원문 편집·원문 이동·Task 체크·드래그는 유지한다.
- 이번 검증 Sandbox: `C:\Users\tlatn\AppData\Local\Temp\MDPalette-Metadata-Sandbox-20260922`, 전용 프로필 `MDPalette-Metadata-Profile-20260922`, 당시 CDP 19330. 사용자 확인용으로 열어 두었다. 다른 PC에서는 실행 상태를 새로 확인한다.

- 이전 배포 소스 커밋: `0863eb8` (태그 `0.1.2`). 새 PC에서는 태그에 머무르지 말고 `codex/planning` 최신 커밋을 받는다.
- 새 PC에서 [NEW_PC.md](docs/handoff/NEW_PC.md)의 복제 절차와 시작 메시지를 사용한다. 먼저 현재 상태를 파악하고 사용자가 지정하는 다음 작업을 진행한다.

- [0.1.2 Release](https://github.com/tlatndms2-droid/md-palette/releases/tag/0.1.2), [줄 강조 검증](LINE_HIGHLIGHT_VALIDATION.md). 현재 대상 줄 전체를 옅은 강조색으로 표시하고 메뉴 선택 중에도 유지한다.

- [0.1.1 Release](https://github.com/tlatndms2-droid/md-palette/releases/tag/0.1.1), [이번 변경 검증](CARET_VALIDATION.md). 세로 커서는 실제 글자 사이 삽입 위치를 표시하며, 삽입 메뉴가 열린 동안에도 유지된다.

- 통합 검증은 [7단계 보고서](STAGE7_VALIDATION.md), 이후 드롭 위치 개선은 [0.1.1](CARET_VALIDATION.md)·[0.1.2](LINE_HIGHLIGHT_VALIDATION.md) 보고서를 따른다. 과거 보고서의 당시 확인 대기 문구를 현재 대기 상태로 해석하지 않는다.
- 장시간 사용·다른 플러그인 충돌·개인 Vault·모바일·별도 창은 사용자가 사용 중 문제를 알려주기로 했다. 이를 추가 배포 전 검증이나 자동 구현 작업으로 확장하지 않는다.

- 0.0.15 당시 구현 커밋: `9761cff`. 당시 배포 기록 커밋: `fbd11ad`.
- [0.1.0 Release](https://github.com/tlatndms2-droid/md-palette/releases/tag/0.1.0). 공개 자산 `main.js`, `manifest.json`, `styles.css`의 SHA-256은 검증 빌드와 각각 일치한다.
- 0.0.15 수정: 영상과 Main의 위아래 묶음을 왼쪽에 보존하고 Sub를 오른쪽 전체 높이에 배치. 여러 Sub와 기존 더블클릭 조합 유지.
- 당시 41개 테스트·빌드·Sandbox 실제 UI·재시작·기존 파일 2,065개 보존·공개 자산 3개 SHA-256 일치 통과 기록. [검증 보고서](SUB_HEIGHT_VALIDATION.md).
- 0.0.15 사용자 정상 작동 확인을 2026-09-22에 받았다.
- BRAT 설치·업데이트 확인은 사용자가 담당한다. Codex가 대신 수행하는 것으로 되돌리지 않는다.
- 2026-09-21 인계는 문서 전달만 수행했다. 2026-09-22에는 별도 승인에 따라 새 PC의 격리 Sandbox에서 최종 통합 검증을 수행했다.

## 읽는 순서와 문서 관계

1. 현재 사용자 요청과 [프로젝트 지침](AGENTS.md).
2. 이 HANDOFF 및 [현재 확정 사양](docs/handoff/CURRENT_SPEC.md).
3. [기획 변경 이력·원본 완료 기준 대응표](docs/handoff/DECISIONS.md).
4. [현재 진행 계획](IMPLEMENTATION_PLAN.md)과 [새 PC 준비·재개 방법](docs/handoff/NEW_PC.md).
5. 변경 대상의 코드·검증 보고서·원본 기획·해당 참조 이미지.

원본 기획과 AGENTS의 일부 기능 문구에는 Reference·Main/Sub 교환·전역 가상 폴더가 남아 있다. 이는 이후 명시적인 사용자 결정으로 대체되었다. 현재 사양과 변경 이력에 근거를 모았으며, 원본이나 지침 자체는 고치지 않았다. 새 충돌을 발견하면 코드만 보고 의도를 확정하지 말고 구체적인 불일치를 확인한다.

이전 HANDOFF·계획 전체는 [history](docs/handoff/history/HANDOFF-before-2026-09-21.md)에 보존했다. 그 안의 '다음 6단계', '6~7단계 미구현', 오래된 포트·버전·확인 대기는 당시 기록이며 현재 지시가 아니다.

## 기능을 되돌리지 않기 위한 핵심

- Main/Sub만 사용. Reference와 활성 파일 교환 없음. Main 변경·해제는 탭 보존·역할 해제.
- 지정 Main 문서 고정. 기본 더블클릭은 단일 Sub 현재 탭 교체, Ctrl은 Sub 새 탭, Ctrl+Shift는 새 일반 그룹.
- Sub는 그룹에 지정하며 파일 종류·로딩 중 빈 탭과 무관하게 유지한다. Sub 아래 일반 그룹 분할을 허용하고 배치를 강제하지 않는다. 탭 우클릭/명령으로 지정·해제하며 미연결 파일은 연결 승인 또는 취소.
- 가상 폴더는 Main 문서별. 0.0.8의 테스트용 전역 데이터 초기화는 일회성 승인이다.
- Connections는 모든 속성의 Markdown 연결과 기본 Local Graph. 별도 검색·필터 제외.
- Metadata는 URL Links 포함 다섯 구역. Main 본문 별도 링크 선택 팝업은 보류.
- Folder 제목 카드 기본값·기존 보기 보존. 파일 카드와 Metadata의 드래그는 현재 사양의 대상표를 따른다.
- 새 링크 파일은 Obsidian 새 노트 저장 설정에 따라 생성·연결하고 자동으로 열지 않는다.
- 문서 드래그: 화면상 대상 줄 전체의 옅은 강조 배경 + 글자 사이 세로 커서. 메뉴 선택 중에도 유지하며 삽입·취소 시 함께 제거한다. 문서 아래 빈 공간에 새 빈 줄을 자동 생성하지 않는다.

## 단계별 진행과 증거

| 단계·후속 변경 | 배포 | 상태·근거 |
|---|---|---|
| 0 실행 기반 | 0.0.1 | STAGE0_VALIDATION.md |
| 1 Space·사이드바 | 0.0.2 | 사용자 확인 기록, STAGE1_VALIDATION.md. 이후 Main/Sub 사양으로 변경 |
| 2 Card·라벨·드래그 정렬 | 0.0.3~4 | 사용자 확인 후 다음 단계 진행, STAGE2_VALIDATION.md / STAGE2_DRAG_VALIDATION.md |
| 3 Connections | 0.0.5~6 | 사용자 확인, STAGE3_VALIDATION.md / STAGE3_FIX_VALIDATION.md |
| 4 Folder 및 Main/Sub·문서별 정리 개편 | 0.0.7~8 | 사용자 확인, STAGE4_VALIDATION.md / REVISION_VALIDATION.md |
| 5 Metadata·URL·라벨 관리·미리보기 | 0.0.9~10 | 후속 사용자 확인, STAGE5_VALIDATION.md / REVISION2_VALIDATION.md |
| Folder 제목 카드·Main 토글 | 0.0.11 | 사용자 확인, REVISION3_VALIDATION.md |
| 6 드래그 재사용·여러 Sub·각주·URL 확장 | 0.0.12~13 | 구현·검증·배포 기록, STAGE6_VALIDATION.md / REVISION4_VALIDATION.md |
| 새 링크 파일 | 0.0.14 | 사용자 정상 작동 확인, NEW_NOTE_VALIDATION.md |
| Sub 전체 높이 | 0.0.15 | 검증·배포·사용자 정상 작동 확인, SUB_HEIGHT_VALIDATION.md |
| 7 최종 통합 | 0.1.0 | 통합·업데이트·재시작·공개 자산 검증 완료, STAGE7_VALIDATION.md |
| 글자 사이 드롭 커서 | 0.1.1 | 검증·배포 완료, 사용자 화면 확인 후 줄 강조 추가 요청, CARET_VALIDATION.md |
| 드롭 대상 줄 강조 | 0.1.2 | 검증·배포·사용자 정상 작동 확인 완료, LINE_HIGHLIGHT_VALIDATION.md |
| 각주·메타데이터 Markdown 표시 | 0.1.3 | 검증·배포·사용자 확인 완료, METADATA_MARKDOWN_VALIDATION.md |
| 글자 크기·Sub 드래그 개선 | 0.1.4 | 검증·배포·사용자 확인 완료, METADATA_FONT_DRAG_VALIDATION.md |
| 각주 드래그 내용 선택 | 0.1.5 | 검증·배포 완료, 사용자 확인 대기, FOOTNOTE_CHOICE_VALIDATION.md |
| MD/Canvas 새 링크 파일 | 0.1.6 | 검증·배포 완료, NEW_CANVAS_VALIDATION.md |
| 단일 Sub·토글·일반 그룹·자유 배치 | 0.1.7 | 검증·배포 완료, 사용자 확인 대기, SUB_RULES_VALIDATION.md |

각 버전의 자동·Sandbox 검증은 사용자 직접 확인과 별개다. 0.0.12/13의 개별 사용자 확인 문장을 추정해서 추가하지 않는다. 코드가 배포되어 있다는 사실만으로 최종 통합 완료를 선언하지 않는다.

## 다음 작업

1. 다른 PC에서 `codex/planning` 최신 상태를 받아 manifest `0.1.7`과 Git 변경사항을 확인한다.
2. 0.1.7 사용자 BRAT 확인은 대기 중이다. 새 후속 기능은 아직 지정되지 않았다.
3. 이미 완료한 통합 검증과 배포를 인계만을 이유로 반복하지 않는다. 후속 코드 변경에는 변경 범위에 맞는 검증·배포 절차를 적용한다.

별도 팝아웃 창 배치는 0.0.15 검증 범위에 포함되지 않았다. 지원 확대를 이번 인계로 승인받은 것으로 간주하지 않는다. 미검증·미수행은 통합 완료 보고에서 구분한다.

## 전달된 자료와 실행 환경

- 원본 Planning Pack·UI 이미지 46개를 폴더 그대로 Git 추적에 추가. 원본 ZIP은 중복이므로 로컬에 보존한다.
- 코드·tests·scripts·설정·lockfile·검증 보고서, 새 인계 자료를 포함한다.
- [최신 배치 시안](docs/handoff/references/sub-full-height-comparison.html), [수정 전](docs/handoff/evidence/before.png), [수정 후](docs/handoff/evidence/after.png), [재시작 후](docs/handoff/evidence/restart.png), [릴리즈 해시 확인 기록](docs/handoff/evidence/release-verification.json)을 선별 보관한다. 화면은 당시 증거이며 이번에 앱을 재검증한 결과가 아니다.
- [전달 파일 목록·SHA-256](docs/handoff/TRANSFER_MANIFEST.json)은 원본과 선별 자료의 목록이다.
- 새 PC의 실행 절차와 스크립트 이식 제한은 [NEW_PC.md](docs/handoff/NEW_PC.md)를 따른다. 기존 개인 스킬과 전역 설정은 자동으로 복제되지 않는다.
- 0.1.2 최신 화면·UI 및 재시작 결과는 `docs/handoff/evidence/0.1.2/`에 선별 보관한다. `.github/release-assets/0.1.2/`에는 검증한 배포 파일 세 개와 SHA256SUMS가 있다. 설치는 공개 Release를 기준으로 한다.

기존 PC의 Sandbox 위치는 `C:\Users\tlatn\AppData\Local\Temp\MDPalette-Stage0-Sandbox-20260918`, 별도 프로필은 `MDPalette-Stage0-Profile-20260918`, 당시 포트는 19273이다. 현재 실행 여부는 이번에 확인하지 않았다. 새 PC에서 이 경로·포트·PID를 그대로 사용하지 않는다. 기존 Sandbox는 사용자 확인용으로 유지하는 상태이며 이번 인계에서 종료·정리하지 않았다.

현재 대화 전체, 개인 Vault·플러그인 사용자 데이터, Sandbox 전체 백업, 원시 .artifacts 전체는 전달하지 않는다. 과거 승인 시안 전체가 확보된 것은 아니며, 필요한 경우 해당 자료를 별도로 확인한다. 기능별 결정의 확인 가능한 근거와 확인되지 않은 부분은 변경 이력에 명시했다.
