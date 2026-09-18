# MD Palette 작업 인계

갱신일: 2026-09-18
저장소: https://github.com/tlatndms2-droid/md-palette

## 현재 요청과 상태 — 3단계

- 사용자가 2단계 해결 사실을 재확인하고 3단계 진행을 요청했다. 과거 0.0.4 확인 대기 기록으로 재질문하지 않는다.
- 검색·필터의 문서/이미지 차이를 재대조한 뒤 사용자 **문서대로 진행해**로 확정: Connections 검색창·필터 제외. 기존 이미지의 3영역 구조와 파일 열기 동작을 따른다.
- 0.0.5 구현과 타입 검사·13개 테스트·실제 Sandbox UI·프로세스 재시작·최종 자산 일치 확인 통과. 상세 STAGE3_VALIDATION.md.
- [0.0.5 Release](https://github.com/tlatndms2-droid/md-palette/releases/tag/0.0.5) 공개 자산 3개와 검증 빌드 SHA-256 일치. Sandbox BRAT 0.0.4 → 0.0.5 업데이트·활성화·Card/Connections/Space/알 수 없는 데이터 보존 통과.
- Sandbox 종료 및 원래 설정 4개 해시 복원 완료. 시험 파일 2,008개와 검증 설치본은 `.artifacts/stage3/validated-fixtures`, `validated-obsidian`에 보관했다.
- 최신 상태: **3단계 0.0.5 사용자 본인 확인 대기**. 구현 커밋 `24e3e7a`, 검증 STAGE3_VALIDATION.md, 원시 증거 `.artifacts/stage3/`.
- 4단계는 시작하지 않는다. 0.0.5에 대한 사용자 본인의 확인이 필요하다.

## 이전 2단계 기록 (아래 사용자 확인 대기 표기는 당시 상태)

- 최신 요청: 0.0.3 카드 드래그 렉·이동 위치 표시 개선. 같은 계정 Canvas Palette의 이동 방식을 참고하도록 요청받았다.
- 0.0.4에서 카드 크기를 바꾸지 않는 밝은 안내선(다열 세로/단열 가로), 위치 캐시, 기존 카드 재배치로 수정했다. TypeScript·테스트 11개·411개 카드 Sandbox 드래그·재시작 통과. [0.0.4 Release](https://github.com/tlatndms2-droid/md-palette/releases/tag/0.0.4) 자산 일치와 BRAT 0.0.3 → 0.0.4 업데이트·데이터 보존 확인 통과.
- 최신 상태: **2단계 수정 버전 0.0.4 사용자 확인 대기**. Sandbox 종료·원래 설정 4개 해시 복원 완료. 시험 자료와 설치본은 `.artifacts/stage2-drag/validated-fixtures`, `validated-obsidian`에 보존했다. 아래 0.0.3 내용은 이전 구현 기록이다.
- 이번 기록: STAGE2_DRAG_VALIDATION.md, 원시 증거 `.artifacts/stage2-drag/`. 2단계 수정이며 3단계는 시작하지 않는다.

- 사용자 `2단계 진행` → 이전 단계 확인 질문 → `정상 작동했어`로 0.0.2 사용자 확인 완료.
- 연결 저장 위치의 문서·이미지 차이는 `문서방식으로 진행` 답변으로 확정했다. Main의 **`link note` 속성**에 저장하며 본문의 `## link` 목록을 만들지 않는다.
- 2단계 Card 0.0.3 구현, TypeScript·테스트 8개·빌드, Sandbox 실제 UI·프로세스 재시작 검증 통과.
- 공개 Release: https://github.com/tlatndms2-droid/md-palette/releases/tag/0.0.3 . 공개 자산 3개와 검증 빌드의 SHA-256 일치, Sandbox BRAT 0.0.2 → 0.0.3 업데이트·활성화·기존 데이터 보존 확인 통과.
- 현재 **2단계 사용자 BRAT 확인 대기**다. 사용자 본인의 0.0.3 확인은 아직 받지 않았으므로 전체 단계 완료로 처리하지 않는다. 3~7단계는 미시작.
- 전체 기준과 단계: IMPLEMENTATION_PLAN.md. 검증 상세: STAGE2_VALIDATION.md.

## 최신 확정 결정

- 한 구간 구현 → 관련 검사·빌드 → Sandbox 실제 UI·재시작 → GitHub Release → Sandbox BRAT 확인 → 사용자 본인의 확인 순서.
- 사용자 본인의 확인 전에는 다음 단계를 구현하지 않는다.
- UI는 제공 참조 이미지의 배치·비율·밀도를 따르고 색은 Obsidian 테마·강조색을 사용한다. 새 시안 이미지 불필요.
- Main 본문 링크 클릭 팝업은 사용자 결정으로 보류했다. 기존 Obsidian 동작을 유지한다.
- Virtual Folder 구조와 파일 위치는 전역 Plugin Data이며 Main별 사본을 만들지 않는다.
- 사용자 요청 없는 병렬 에이전트·다른 작업으로의 분산 금지.
- 실제 작업 Vault를 테스트하지 않는다. Sandbox의 백그라운드 CDP를 사용하고 Computer Use로 임의 전환하지 않는다.
- 원본 Planning Pack·참조 이미지·ZIP은 수정·이동·삭제하지 않는다.

## 2단계 구현

- Card: Main의 역링크+나가는 링크, 중복 제거·Main 숨김, 기존 파일 연결 추가.
- 문서 방식의 연결 저장: Main `link note` 속성에 wikilink. 일반 Markdown 링크 사용 설정과 무관하게 Properties에서 해석된다.
- 썸네일: Properties 제외 Markdown 본문, 이미지, PDF 첫 페이지, 영상 첫 프레임, Canvas 축소 그림, 실패 시 아이콘·파일명.
- 라벨: 파일당 하나·사용자 이름/색·일괄 적용/제거·마지막 사용 해제 시 소멸. Markdown 불변.
- 파일 유형/복수 라벨 필터·접기, 보기 6종·글자 3종·Ctrl+휠, 단일/Ctrl/Shift/더블클릭, 단일/다중 순서 변경.
- 순서·라벨·필터·보기 저장 및 재시작 복원. Main 변경 중 숨겨진 카드의 위치를 보존한다.
- 미리보기 지연 처리·64개 캐시·화면 밖 카드 렌더링 지연. 본문 갱신 시 카드 스크롤을 보존한다.
- 주요 파일: src/card-view.ts, src/cards-state.ts, src/thumbnails.ts. 기존 Space는 src/main.ts와 workspace-adapter.ts.

## 검증·증거

- 0.0.3 최종 main.js 55,930 bytes. Sandbox 설치본 3개 자산의 로컬 SHA-256 일치.
- 실제 UI: 선택·라벨·필터·메뉴·6종 보기·열기·연결 추가·중복·취소·실패 원문 보존·단일/묶음 드래그·Main 전환·파일명 변경·썸네일 갱신.
- 밝은/어두운 테마, 220px 사이드바 가로 넘침 없음, 참조 이미지 대조.
- 2,013개 파일/411개 연결 카드 시험: 전체 다시 그리기 약 101ms. 입력 확인 약 52ms. 도구 왕복 시간 등이 포함된 제한된 시험이며 일반 사용자 지연이나 CPU 측정이 아니다.
- 별도 프로세스 종료·재실행 후 0.0.3·역할·설정 복원 확인.
- 기본 시험 파일 13개 비교: Main의 link note 외 본문·나머지 파일 불변. 기존 알 수 없는 설정 보존.
- 원시 결과·화면·백업: .artifacts/stage2/. 검증 스크립트: scripts/stage2-*.mjs.
- 0·1단계 기록과 증거는 STAGE0_VALIDATION.md, STAGE1_VALIDATION.md 및 기존 .artifacts 경로에 보존했다.

## Sandbox

- Vault: C:\Users\tlatn\AppData\Local\Temp\MDPalette-Stage0-Sandbox-20260918
- 전용 프로필: C:\Users\tlatn\AppData\Local\Temp\MDPalette-Stage0-Profile-20260918
- CDP: 19273. 재사용할 때 새 대상 탐색 필수.
- BRAT 2.2.0 실제 업데이트 명령으로 0.0.2 → 0.0.3과 활성화·Card 데이터·Space 보존을 확인했다. main.js/styles.css는 배포 자산과 바이트 일치하며 manifest는 BRAT의 공백 재직렬화만 다르고 값은 동일하다.
- 검증 후 별도 프로세스를 중지하고 원래 .obsidian 설정 4개를 복원해 SHA-256 일치를 확인했다. 시험 자료 2,013개와 설치본은 .artifacts/stage2/validated-fixtures 및 validated-obsidian에 이동 보관했다. 삭제하지 않았다.
- 열기: obsidian-sandbox-open. 설치·검증: obsidian-sandbox-validation.

## 후속 범위와 제한

- 3단계 Connections: Markdown 역링크·나가는 링크·Main 중심 그래프, 개별 접기·높이 조절·저장.
- Folder·Metadata·Main 본문 카드 드롭은 후속 단계다. 본 단계에서 제공한다고 설명하지 않는다.
- 지원하지 않는 코덱·손상 파일은 fallback. 별도 팝아웃 창 간 Space 이동은 기존 단계에서도 미검증.
- 다음 단계 착수 전에 원본 문서와 해당 UI 이미지를 다시 대조한다. 기능 충돌은 확인 후 구현한다.
- Release는 검증한 동일 빌드의 main.js·manifest.json·styles.css를 배포하고 공개 버전은 덮어쓰지 않는다.
