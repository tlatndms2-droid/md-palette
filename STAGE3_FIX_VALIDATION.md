# 3단계 수정 검증 — 0.0.6

## 수정 범위

사용자가 child note 연결 누락과 자체 SVG 그래프를 지적하고 수정 진행을 승인했다. Outgoing은 모든 속성의 Markdown 연결을 포함한다. 그래프는 등록된 Obsidian localgraph View·renderer·engine·설정 UI를 재사용하며 파일 열기만 Sub/Reference로 연결한다. 목록은 Markdown-only, 그래프는 기본 Obsidian 표시 동작을 따른다.

## 통과한 확인

- 타입 검사·빌드·테스트 13개. 최종 설치 자산 SHA-256 일치.
- 실제 Sandbox의 child note·parent note·link note·본문 링크: Outgoing 5개, Backlinks 2개. Card의 Markdown 집합과 일치. 시험 원문 10개 불변.
- 그래프는 별도 네이티브 Local Graph 탭과 생성자가 동일하고 실제 canvas·기본 설정 UI를 사용한다. 자체 SVG 화면 제거.
- 실제 CDP 입력: 기본 표시 설정 펼치기·화살표 켜기·설정 닫기·휠 확대·빈 공간 이동·노드 클릭 Sub·노드 우클릭 Reference·목록 더블클릭·구분선 높이·그래프 접기/펼치기.
- Main 전환 반영, Sub/Reference 활성화 후에도 그래프 Main 유지. 별도로 연 기본 Local Graph의 Other.md/설정 불변.
- 밝은/어두운 화면, 240px 사이드바 가로 넘침 없음. 변경 없는 갱신에서 네이티브 인스턴스 유지. 5회 Card/Connections 전환 시 이전 View unload, Worker terminate 호출 확인, 최종 iframe 1개.
- 2,011개 파일, 목록 600행, 기본 그래프 401노드. 변경 없는 목록 갱신 약 1.2ms, 자동 입력 왕복 약 3ms. native graph 전체 프레임 시간·CPU·메모리 수치가 아니며 제한된 단일 시험이다. 확대·이동·실제 편집 내용 반영 확인.
- 대량 파일 복사 뒤 부분 인식 상태에서는 판정하지 않았고, 재시작 및 Metadata 인식 완료 뒤 검사를 통과했다. Worker는 terminate 후에도 객체가 남는 기본 구현이므로 존재 여부가 아닌 실제 terminate 호출을 검증했다.
- 최종 빌드 프로세스 재시작 후 0.0.6, 기본 그래프 화살표·확대/접힘 설정, 영역 높이, Card 상태, Main/Sub/Reference 복원 통과.
- 이전 0.0.5 Card 순서·라벨·할당·보기·필터·글자·접힘 보존, 원문 불변.

## 기술 범위

공개 임베드 API가 없어 native-local-graph.ts에서 등록된 localgraph 생성 경로를 사용한다. 내부 기능 유무를 검사하고 사용할 수 없으면 안내하며 자체 그래프로 대체하지 않는다. 실제 확인 버전은 Obsidian 1.13.7이다. 사용자 요청에 따라 기본 그래프 설정 UI를 유지한다.

## 사용자 확인용 Sandbox

- Vault: C:\Users\tlatn\AppData\Local\Temp\MDPalette-Stage0-Sandbox-20260918
- 프로필: C:\Users\tlatn\AppData\Local\Temp\MDPalette-Stage0-Profile-20260918
- CDP 19273. 사용 시 새 타깃 검색.
- Connections-Review/Main.md와 Connections 화면을 남긴다. 검증 후 종료·원상 복원하지 않는 사용자 최신 지시를 따른다.
- 기존 설정 백업과 해시: .artifacts/stage3-fix/backup-obsidian, backup-hashes.json. 실제 Vault 미접근.
- 시험 화면·보고서: .artifacts/stage3-fix. scripts/stage3-fix-*.mjs.

공개 [0.0.6 Release](https://github.com/tlatndms2-droid/md-palette/releases/tag/0.0.6), 구현 커밋 500e11d. 공개 main.js/manifest.json/styles.css가 검증 빌드와 SHA-256 일치. 실제 Sandbox BRAT 2.2.0 업데이트 명령으로 0.0.5 → 0.0.6 활성화·Card/Space/영역 높이/접힘 및 알 수 없는 설정 보존 확인. main.js/styles.css 바이트 일치, manifest는 BRAT 공백 재직렬화만 다르고 값 일치.

BRAT 검사의 최초 비교는 시험용 0.0.6 그래프 옵션까지 포함한 뒤 0.0.5로 내려 검증해 실패했다. 0.0.5에서 지원하는 높이·접힘을 비교하도록 수정해 통과했다. 네이티브 그래프 옵션의 보존은 별도 0.0.6 프로세스 재시작에서 통과했고, BRAT 후 사용자 확인 화면에도 이를 다시 적용·확인했다.

마지막 확인: 0.0.6, Connections-Review/Main.md, 목록 7행, native graph 8노드. Sandbox·자료·설정은 그대로 열어두었다. 사용자 확인은 대기하며 4단계 미시작.
