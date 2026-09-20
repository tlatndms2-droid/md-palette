# MD Palette 작업 인계

갱신일: 2026-09-20
저장소: https://github.com/tlatndms2-droid/md-palette
작업 경로: `C:\Users\tlatn\OneDrive\문서\ChatGPT\obsidian md pallete`

## 현재 상태 — 0.0.9 Release 완료, 사용자 BRAT 확인 대기

- [0.0.9 Release](https://github.com/tlatndms2-droid/md-palette/releases/tag/0.0.9), 구현 커밋 `cef8cf7`. 공개 자산 main.js·manifest.json·styles.css를 다시 내려받아 검증 빌드와 SHA-256 일치를 확인했다.

- 사용자는 0.0.8 정상 동작을 확인하고 5단계 진행을 승인했다. HTML 계획 확인 후 `진행해`로 구현을 요청했다.
- 각주·Highlights·Tasks·Block Reference·Links, 검색·접힘·원문 이동·각주 편집·Task 체크, Main 탭 고정과 Main 옆 링크 열기를 구현했다.
- 25개 테스트·빌드·Sandbox 실제 UI·프로세스 재시작·기존 파일 2,028개 보존 검증 통과. STAGE5_VALIDATION.md 참조.
- 최신 사용자 확정: Codex는 GitHub Release까지 진행하고 BRAT 확인은 사용자가 담당한다. BRAT 설치·업데이트를 자동 실행하지 않는다.
- 최신 예상 28~45분은 실측 전 잠정 계획이며 이전 시간 추정을 대체한다.
- 6~7단계 미시작. 사용자 0.0.9 확인과 별도 다음 단계 요청을 기다린다.

## 0.0.8 당시 기록 — 사용자 확인 완료

- 4단계 0.0.7은 사용자가 정상 작동을 확인했다. 5~7단계는 아직 시작하지 않았다.
- 최신 요청은 HTML로 확인한 수정 내용을 구현하는 `수정 진행해줘`다.
- 0.0.8: Main/Sub만 사용, 모든 지원 파일 Sub 새 탭·동일 파일 재사용, Main 변경·해제 시 탭 보존, Card/Folder 파일 제목 상단 확대, Markdown 미리보기 렌더링, Main 문서별 가상 폴더 저장을 구현했다.
- 기존 테스트용 전역 가상 폴더·배치만 초기화한다. 사용자가 `그냥 지워줘 어차피 테스트 중이여서 지워도 상관없어`로 승인했다. 실제 파일·본문·연결·라벨은 보존한다.
- 최종 0.0.8 빌드의 실제 Sandbox UI·프로세스 재시작·기존 파일 2,020개 해시 검증을 통과했다. 공개 Release 자산 일치 및 Sandbox BRAT 0.0.7 → 0.0.8 업데이트도 통과했다.
- 원본 Planning Pack과 AGENTS에 남아 있는 Reference·교환·전역 가상 폴더 규칙은 최신 사용자 결정으로 대체됐다. 원본 자료나 지침 파일은 수정하지 않았다.
- 다음 5단계 Metadata는 이번 수정에 포함하지 않는다. 사용자 본인의 0.0.8 확인 및 별도 진행 요청을 기다린다.

## 0.0.8 배포 결과

- [0.0.8 Release](https://github.com/tlatndms2-droid/md-palette/releases/tag/0.0.8).
- 구현 커밋: `3750ec7`. 최종 자산 세 개를 공개 다운로드해 검증 빌드와 SHA-256 일치를 확인했다.
- Sandbox BRAT 2.2.0의 실제 업데이트 명령으로 0.0.7 → 0.0.8 설치·활성화 확인. 문서별 가상 폴더·Main/Sub 역할·Card·Connections·기타 데이터가 유지됐다.
- BRAT 설치본의 main.js·styles.css 바이트 일치, manifest.json은 공백 재직렬화만 다르고 모든 JSON 값이 동일하다.
- 실제 UI·재시작·원본 보존 및 성능 검증 세부는 `REVISION_VALIDATION.md`에 기록했다. Sandbox는 열린 상태로 남긴다.

## 이번 수정의 확정 동작

- Main과 Sub는 기존 Obsidian 탭 그룹 역할이다. Reference 역할·메뉴·명령과 Main/Sub 교환을 제거한다.
- Card·Folder·Connections·기본 그래프·파일 메뉴·Sub 파일 선택 명령은 모두 Sub로 연다. 다른 파일은 새 탭, 같은 파일은 기존 탭이다.
- 새 Main 지정: 이전 Main·Sub 탭은 보존하고 역할·아이콘만 제거한다. 이전 Sub를 새 Main에 자동 연결하지 않는다.
- Main 탭 우클릭 → 메인 스페이스 지정 해제: 모든 탭을 보존하고 사이드바를 Main 없음으로 만든다.
- 파일 제목은 Card와 Folder 파일 카드 상단에 크게 표시한다. Tree와 가상 폴더 이름은 기존 크기다.
- Markdown 미리보기는 제목·강조·목록·링크를 렌더링한다. 본문 임베드는 링크로 표시한다. 원본 수정·영상 자동 재생 같은 별도 기능을 추가하지 않는다.
- 가상 폴더·배치·Folder 보기 상태는 Main 경로별 Plugin Data다. Main 변경·복귀·재시작 후 각 문서 상태를 복원한다. 같은 자료를 Main마다 다른 가상 위치에 놓을 수 있다.
- 기존 전역 가상 정리는 복사·이전하지 않고 비운다. 기존 보기 기본값·Card·Connections·기타 데이터는 유지하고 새 문서별 정리는 반복 초기화하지 않는다.
- 이후 6단계의 Markdown·Canvas 드래그 대상은 Sub로 계획한다. 세부 구현은 해당 단계에서 진행한다.

## 단계별 진행 상황

| 단계 | 구현 결과 | 배포 버전 | 현재 상태 |
|---|---|---|---|
| 0 | 플러그인 실행 기반·기술 확인 | 0.0.1 | 완료, 후속 단계 진행 |
| 1 | Main·Sub·Reference Space와 사이드바 | 0.0.2 | 사용자 확인 완료 |
| 2 | Card·썸네일·라벨·필터·선택·순서 변경 | 0.0.3, 드래그 개선 0.0.4 | 사용자 확인 후 3단계 진행 |
| 3 | Connections·역링크·Outgoing·기본 Local Graph | 0.0.5, 속성 연결·그래프 수정 0.0.6 | 사용자 확인 완료 |
| 4 | 전역 가상 폴더·세 가지 보기·탐색·검색·정렬 | 0.0.7 | **사용자 정상 작동 확인 완료** |
| 5 | Metadata 5개 구역·Main 고정·링크 옆 탭 열기 | 0.0.9 | 검증·Release 완료, 사용자 BRAT 확인 대기 |
| 6 | Card·Metadata를 Markdown·Canvas에 드래그해 재사용 | 미배포 | 미시작 |
| 7 | 최종 통합 검증 | 최종 목표 0.1.0 | 미시작 |

## 0.0.7 당시의 4단계 기능 기록 — 위 0.0.8 변경이 우선

- `Link View → Folder`: 복합뷰(Tree + Folder) / Tree뷰 / Folder뷰. 같은 전역 가상 폴더 데이터를 보여준다.
- 가상 폴더 생성·이름 변경·이동·삭제. 삭제 시 바로 안의 파일과 하위 폴더를 한 단계 위로 옮기며 자식 구조를 유지한다. 실제 파일은 삭제·이동하지 않는다.
- 단일·Ctrl·Shift 선택과 묶음 드래그, 폴더·상위 경로·빈 공간으로 이동, 자기 자신·하위 폴더 이동 금지, Esc 취소.
- 뒤로·앞으로·위로·경로 탐색. 현재 폴더와 하위 폴더의 파일·폴더 이름 검색 및 가상 경로 표시.
- Folder 정렬: 사용자 지정 / 이름 / 유형 / 수정 날짜 / 크기. 자동 정렬에서 오름차순·내림차순을 제공한다.
- Tree 정렬: 사용자 지정 / 이름. 자동 정렬로 바꿔도 저장된 수동 순서는 유지하고, 다른 폴더로 이동하는 드래그는 허용한다.
- 표시 형식 6종, 상하·좌우 분할, 영역 크기 조절·저장. Card와 파일 유형 필터를 공유하고 기존 라벨을 표시한다.
- 빈 공간 우클릭 → 연결 파일 추가: Main의 `link note` 연결과 현재 가상 폴더 배치가 함께 성공해야 완료한다. 이미 다른 가상 위치에 배치된 파일이면 둘 다 취소한다.
- Markdown 더블클릭 → Sub, 다른 파일 → Reference. Markdown 우클릭에서 Reference도 선택할 수 있다.
- Main을 바꿔도 전역 폴더 구조와 파일의 가상 위치는 유지한다. 검색어는 Main 변경·재시작 시 비운다.
- 대량 목록은 화면에 가까운 항목부터 이어 표시한다. 검색은 전체 자료를 대상으로 한다.

### 사용자 확정 사항

- **정렬 기능 범위는 문서의 전체 옵션을 따른다.** 참조 이미지에 일부 옵션만 보이는 것은 기능 제한이 아니다.
- 정렬 컨트롤 위치·크기·스타일·전체 화면 배치는 참조 이미지와 최대한 유사하게 유지한다. 전체 옵션은 기존 메뉴 안에 넣었다.
- 옵션 추가를 위해 이미지 구조를 크게 바꿔야 한다면 임의 재설계하지 말고 확인받는다.

## 0.0.7 검증·Release·BRAT 기록

- [0.0.7 Release](https://github.com/tlatndms2-droid/md-palette/releases/tag/0.0.7).
- TypeScript 검사·빌드·18개 자동 테스트 통과.
- Obsidian 1.13.7 Sandbox에서 실제 클릭·키보드·드래그로 보기·생성·이름 변경·삭제·탐색·검색·정렬·다중 선택·이동·취소를 확인했다.
- 연결 추가 성공·중복·다른 위치 충돌·취소, 저장 오류와 본문 변경 오류 시 가상 상태·Markdown·저장 데이터 복구를 확인했다.
- 밝은/어두운 테마, 240px 사이드바 가로 넘침 없음, 참조 이미지 구조 대조 통과.
- 별도 Sandbox 프로세스 재시작 후 0.0.7·가상 폴더·위치·정렬·보기·분할 및 기존 Card·Connections·Space 상태 복원 확인.
- 2,000개 연결 파일에서 최초 목록 생성 약 35.8ms(각 영역 첫 80개 항목). 실제 휠 스크롤로 2,000개 모두 도달하고 전체 자료 검색을 확인했다. 일반 사용자 지연이나 전체 목록 동시 렌더링 수치로 해석하지 않는다.
- 기존 파일 경로와 SHA-256 일치 확인. 실제 작업 Vault는 테스트하지 않았다.
- 공개 자산 `main.js`, `manifest.json`, `styles.css`가 검증 빌드와 SHA-256 일치.
- Sandbox BRAT 2.2.0의 실제 업데이트 명령으로 **0.0.6 → 0.0.7** 설치·활성화·이전 상태 보존 확인. manifest는 BRAT의 공백 재직렬화만 다르고 JSON 값은 동일하다.
- 자동 검증과 별개로 **사용자의 정상 작동 확인까지 받았다.**

## 저장소와 관련 파일

- 현재 브랜치: `codex/planning`.
- 구현 커밋: `f5cef8a` — Add stage 4 global virtual Folder View.
- Release·BRAT 결과 기록 커밋: `f7a5245` — Record stage 4 release and BRAT verification. 두 커밋 모두 원격에 push했다.
- 미추적 Planning Pack·이미지·ZIP은 원본 자료이므로 그대로 보존한다.
- Folder: `src/folder-view.ts`, `src/folders-state.ts`.
- 공통 연결·저장·Space: `src/main.ts`, `src/state.ts`, `src/workspace-adapter.ts`, `src/sidebar.ts`.
- Card: `src/card-view.ts`, `src/cards-state.ts`, `src/card-reorder.ts`, `src/thumbnails.ts`.
- Connections: `src/connections-view.ts`, `src/connections-state.ts`, `src/native-local-graph.ts`.
- 이번 검증 보고서: `REVISION_VALIDATION.md`. 이전 Folder 보고서: `STAGE4_VALIDATION.md`. 이전 단계는 `STAGE0_VALIDATION.md`, `STAGE1_VALIDATION.md`, `STAGE2_VALIDATION.md`, `STAGE2_DRAG_VALIDATION.md`, `STAGE3_VALIDATION.md`, `STAGE3_FIX_VALIDATION.md`.
- 4단계 원시 증거·화면·사전 백업: `.artifacts/stage4/`. 검증 스크립트: `scripts/stage4-*.mjs`.

## Sandbox 인계

- Vault: `C:\Users\tlatn\AppData\Local\Temp\MDPalette-Stage0-Sandbox-20260918`.
- 전용 프로필: `C:\Users\tlatn\AppData\Local\Temp\MDPalette-Stage0-Profile-20260918`.
- CDP: `19273`. 재사용 시 실제 실행 여부를 확인하고 새 CDP 대상을 탐색한다. 과거 PID·대상 ID를 그대로 쓰지 않는다.
- 이번 0.0.8 검증에 같은 격리 Sandbox를 사용했고 프로세스 재시작도 확인했다. 최종 빌드와 시험 자료·설정을 남긴다.
- 확인 화면: `Revision-Review/Main-A.md → MD Palette → Link View → Folder`. Main-B.md는 독립적인 여행 준비 폴더를 가진다.
- 이번 사전 설정·설치 자산 백업: `.artifacts/revision/backup-obsidian`. 기존 파일 해시: `.artifacts/revision/originals.json`. 화면·결과: `.artifacts/revision/`. 검증 스크립트: `scripts/revision-*.mjs`.
- **사용자의 최신 요청에 따라 검증 후 자동 종료·원상 복원하지 않는다.** 종료·정리는 별도 요청이 있을 때만 사용자 변경 내용을 보존한 뒤 진행한다.
- 열기: `obsidian-sandbox-open`. 설치·검증: `obsidian-sandbox-validation`. 실제 Vault로 대체하지 않는다.

## 유지해야 할 확정 결정

- 한 단계씩 구현 → 관련 검사·빌드 → Sandbox 실제 UI·재시작 → GitHub Release → Sandbox BRAT → 사용자 본인 확인 순서로 진행한다.
- 이전 단계 사용자 확인을 받았어도 다음 단계의 별도 진행 요청 전에는 구현하지 않는다.
- Main은 기존 Obsidian Tab Group에 부여하는 역할이다. Main/Sub 교환은 제거했고, Main 변경·해제 시 일반 Tab을 포함한 기존 탭을 보존한다.
- Main 본문 링크 클릭 팝업은 보류. 기존 Obsidian 동작을 유지한다.
- 연결 추가는 Main의 `link note` 속성에 저장한다. 별도 본문 `## link` 목록을 만들지 않는다.
- Connections 목록은 Markdown-only, 본문과 모든 속성의 연결을 포함한다. 별도 목록 검색창·필터는 제외한다.
- Local Graph는 Obsidian 기본 View·renderer·engine·설정 UI를 재사용하고 Main에 고정한다. 내부 API 접근은 `native-local-graph.ts`에 격리했다.
- Virtual Folder와 파일 배치는 Main별 Plugin Data다. 파일 하나는 각 Main 안에서 가상 위치 하나만 가진다.
- 라벨·가상 폴더 조작으로 Markdown 내용이나 실제 Vault 경로를 바꾸지 않는다. 업데이트 시 이전 설정을 보존하며, 예외는 삭제 승인된 기존 테스트용 전역 가상 폴더·배치뿐이다.
- UI는 제공 이미지의 배치·비율·밀도, 색상은 Obsidian 테마·강조색을 따른다. 새 시안 이미지는 불필요하다고 확정했다.
- 사용자 요청 없는 병렬 에이전트·별도 작업 분산 금지. Sandbox 검증은 백그라운드 CDP가 기본이다.
- 원본 `MD_Palette_Planning_Pack_Final`, `md palette ui image`, ZIP은 수정·이동·삭제하지 않는다.

## 다음 작업 — 사용자 확인 후 별도 요청 시 6단계

1. 현재 사용자 요청, 프로젝트 AGENTS, 이 HANDOFF, IMPLEMENTATION_PLAN, Git 상태·버전을 다시 확인한다.
2. 먼저 사용자의 0.0.9 BRAT 확인을 기다린다. Codex가 BRAT을 대신 설치·업데이트하지 않는다.
3. 6단계의 재사용 드래그 문서와 최신 Main/Sub 결정을 대조한다. 기존 Reference·교환 규칙을 되살리지 않는다.
4. 별도 6단계 요청이 있을 때만 계획·구현한다. 실제 Sandbox UI·재시작 검증 후 새 버전 Release까지 진행하고 기존 공개 버전을 덮어쓰지 않는다.
5. 사용자 본인의 다음 단계 확인을 받기 전에는 그다음 단계로 넘어가지 않는다.

현재 6~7단계는 미구현이다. 지원하지 않는 미디어의 썸네일은 아이콘·파일명으로 대체하며, 별도 팝아웃 창 간 Space 이동은 기존 검증 범위에 포함되지 않았다.
