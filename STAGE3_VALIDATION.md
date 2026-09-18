# 3단계 Connections 검증 — 0.0.5

- 사용자 2단계 해결 확인 및 3단계 진행 승인. 문서 기준으로 검색창·필터 제외 확정.
- 타입 검사·빌드·테스트 13개 통과. 최종 빌드 설치본 SHA-256 일치.
- 격리 Obsidian 1.13.7 / MDPalette-Stage0-Sandbox-20260918 / 전용 프로필 / CDP 19273. 실제 Vault 미사용.
- 실제 CDP 입력: Connections 탭, 단일 선택·더블클릭 Sub, 목록 및 그래프 우클릭 Sub/Reference, 연결 추가·취소, 구분선 드래그·Esc 취소, 각 영역 접기·펼치기, 그래프 확대·이동·전체 보기 복귀.
- Markdown-only, 자기 자신/미해결 링크 제외, 방향별 중복 관계 유지. Outgoing은 본문·link note만 표시하며 다른 속성 링크 제외.
- Main 변경·비Markdown·연결 없음·파일 이름 변경 갱신 확인. 220px 사이드바 clientWidth/scrollWidth 모두 220, 세 영역과 그래프 표시. 밝은/어두운 테마를 실제 설정으로 적용해 클래스와 화면 확인.
- 제공 connection view ui / 디테일 / 상세가이드와 구조·접기·구분선·파일 열기를 비교했다. 사용자 확정에 따라 검색·필터는 제외. 색상은 테마·강조색 사용.
- 2,008개 파일, 목록 600행, Main 포함 그래프 401노드: 최종 렌더 약 112.2ms, 자동 입력 왕복 약 5ms. 단일 로컬 시험이며 전체 체감 지연·CPU·메모리 수치가 아니다. 내부 목록 스크롤과 편집 내용 반영 확인.
- 최종 코드로 별도 Sandbox 프로세스 종료/재실행 후 0.0.5, Main/Sub/Reference, Card 상태, Connections 높이·접힘 상태 복원 통과.
- 이전 0.0.4 Card 순서 접두부·라벨·할당·필터·보기·글자·접힘 및 알 수 없는 설정 보존 확인.
- 파일 이름 변경 시험은 Obsidian 자체 링크 갱신을 실행했다. 별도 원문 보존 시험에서 fixture를 원문으로 복구한 뒤 연결 추가를 실행해 link note 외 Main 본문과 다른 6개 파일 불변, 중복 추가 불변을 확인했다.
- 초기 검사 스크립트의 문자열 이스케이프·화면 준비 타이밍·SVG 클릭 좌표·이름 변경 확인창 대기·시험 자료 생성 호출 시간 초과·편집기 포커스 문제를 해결해 최종 UI/고급/성능/재시작 보고서를 모두 통과시켰다.
- 실제 화면에서 발견한 제목 정렬과 좁은 그래프 글자 크기는 수정 후 최종 빌드로 재검증했다.

증거: `.artifacts/stage3/`의 `ui-result.json`, `advanced-result.json`, `performance-result.json`, `restart-result.json`, `release-ready.json` 및 PNG. 실행 스크립트: `scripts/stage3-*.mjs`.

공개 Release·BRAT·Sandbox 원상 복원은 이어서 진행 후 기록한다. 사용자 본인의 0.0.5 확인은 대기하며 4단계 미시작.
