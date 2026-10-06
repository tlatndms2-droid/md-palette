# Canvas Main 검증 — 0.1.14

2026-10-06. 사용자 승인: Canvas도 Main으로 지정하고 Main/Sub를 교환할 수 있게 한다. Canvas Main에서 새 연결을 추가할 때는 선택한 Markdown 노트의 `link note`에 Canvas 링크를 저장하며, Canvas에 파일 카드를 추가하지 않는다.

## 화면과 저장 동작

- Markdown과 Canvas 탭 우클릭 및 기존 명령으로 Main 지정·해제. Sub에서 지정하면 기존 Main과 그룹 역할만 교환한다. 열린 탭과 화면 위치는 보존한다.
- Canvas Main의 연결 추가는 Markdown 노트를 대상으로 한다. 선택한 노트에 `[[Canvas 경로]]`를 저장하며 기존 속성·본문을 보존한다. 이미 연결된 파일은 중복 추가하지 않는다.
- 새 링크 파일 추가는 Canvas Main일 때 Markdown 형식으로 생성하고 그 노트에 역방향 링크를 저장한다. Markdown Main의 기존 Markdown/Canvas 생성 선택은 유지한다.
- 기존 Canvas 파일 카드의 아웃고잉과 Markdown 노트에서 들어오는 백링크를 Obsidian의 연결 정보로 표시한다. 기존에 연결된 비-Markdown 파일을 Folder에 정리하는 동작은 유지한다.
- Canvas별 가상 폴더는 기존 Main별 저장 방식으로 보존한다. Canvas 자체의 JSON은 Metadata로 해석하지 않고, 연결된 Markdown 노트를 골라 Metadata를 볼 수 있게 안내한다.

## 검증

- TypeScript 검사·빌드 및 63개 자동 테스트 통과. Canvas 역할 교환, 역방향 링크, 중복 방지, 잘못된 속성, 미지원 대상, 취소된 Sub 지정의 원상복구, Canvas별 폴더 저장 검증 포함.
- 격리 Obsidian 1.14.4 / MD Palette 0.1.14 / CDP 19410. 실제 Canvas 탭 메뉴와 명령에서 Main 지정, Markdown↔Canvas 역할 교환, 비활성 탭 보존 확인.
- 실제 연결 파일 선택 창에서 Reverse.md를 고른 뒤 대상 노트의 `link note`만 추가되고 기존 topic 속성·다른 링크·본문이 유지됨을 확인. Canvas SHA-256·노드·연결선 불변.
- Card에서 연결된 노트를 더블클릭해 Sub로 열기, 중복 연결 시 파일 바이트 불변, Connections의 아웃고잉/백링크 표시 확인.
- Metadata의 Canvas 안내 및 연결된 노트의 Task 표시 확인. Canvas별 Folder 생성·연결 및 새로운 Markdown 링크 파일 생성 확인.
- 미연결 Sub 지정 취소 시 노트 불변. 승인 시 대상 노트에 Canvas 링크 추가. 저장 실패 시 Folder 배치 복원. 대상 탭 변경 시 추가한 역방향 링크를 원상복구하고 원본 노트 바이트·기존 Sub 보존.
- 별도 Sandbox 프로세스 재시작 후 새 CDP 대상을 찾아 Canvas Main, Sub, 열린 탭, Canvas별 Folder 상태 복원 및 역방향 역할 교환 재확인.
- 250개 연결 노트(각 Task 40개) 시험: 목록 첫 표시 약 45ms, 이후 0.9초 관측 최대 프레임 간격 약 28ms. Metadata 검색 입력과 필터 정상. 제한된 시험 결과이며 실제 대형 Vault 전체의 성능을 보장하는 수치는 아니다. 시험 자료와 상태는 확인 후 복원했다.
- 통과한 UI·재시작·예외 처리·성능 검증에서 런타임 예외 없음. 기존 테마·탭 아이콘·메뉴 배치와 화면 캡처 비교.

## 증거 및 재실행

`scripts/canvas-main-validation.mjs`의 install/ui/restart, `canvas-main-guards.mjs`, `canvas-main-performance.mjs`를 사용한다. 각 스크립트는 전용 Sandbox 이름을 확인한다. 원시 백업은 `.artifacts/canvas-main/`, 선별 증거는 `docs/handoff/evidence/0.1.14/`에 있다. 공개 배포와 BRAT 결과는 후속 배포 기록을 따른다. 사용자 본인의 확인은 자동 검증과 별개다.

## 배포 및 복원

- 공개 [Release 0.1.14](https://github.com/tlatndms2-droid/md-palette/releases/tag/0.1.14), 코드 커밋 `61325ab`. 세 자산을 공개 URL에서 다시 다운로드해 검증 빌드의 SHA-256과 일치 확인.
- 격리 Sandbox BRAT 2.2.0으로 0.1.13→0.1.14 업데이트 및 활성화 확인. 구버전의 실제 Markdown Main 설정을 기준으로 탐색·Card·Connections·Folder 보존을 비교했다. 구버전에 새 Canvas 데이터를 읽히는 다운그레이드 검증으로 대체하지 않았다.
- BRAT 설치 main.js/styles.css 해시 일치. manifest는 BRAT가 JSON 공백을 다시 작성하므로 파싱한 전체 필드가 일치함을 확인했다. 업데이트 후 Canvas Main 데이터 복원 및 로드 확인.
- 시험 노트 9개와 시험 전 설정·workspace.json을 복원하고 복원 시점 SHA-256 일치 확인. 기존 Swap-Review 파일 해시도 전부 일치. 새 노트 생성 시험 파일은 내용 확인 및 백업 후 제거했으며 성능 시험 자료도 제거했다.
- 복원 후 Sandbox를 다시 열어 0.1.14, 기존 A Main, BRAT 2.2.0을 확인했다. 실제 작업 Vault는 변경하지 않았다. 사용자 본인의 BRAT 확인은 대기 중이다.
