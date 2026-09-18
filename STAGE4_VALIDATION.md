# 4단계 Folder View 검증 — 0.0.7

검증일: 2026-09-18

## 범위와 확정

- 사용자 `4단계 진행` 및 정렬 전체 옵션 구현 승인.
- 기능은 기획 문서, 정렬 위치·화면 구조는 참조 이미지 기준. 메뉴 안에 전체 옵션을 넣어 기존 구조를 유지했다.
- Main별 연결 파일 표시, 전역 Virtual Folder/파일당 한 위치, 실제 파일 경로·내용 보호.
- 현재 상태: 코드·Sandbox·재시작 검사 통과. 공개 Release·BRAT 확인 대기.

## 실행 결과

- TypeScript 검사·빌드·18개 테스트 통과.
- 실제 Sandbox: 세 가지 보기, 6가지 표시 형식, 생성·이름 변경·삭제·자식 승격, 단일·Ctrl·Shift 선택, 단일/다중/폴더 이동, breadcrumb·빈 공간 이동, 자기 자신·하위 폴더 차단, Esc 취소.
- 뒤로·앞으로·위로·경로 탐색, 현재+하위 검색·가상 경로 표시, 파일 유형 필터의 Card 공유, Markdown Sub/비-MD Reference 열기.
- Folder 모든 자동 정렬과 오름·내림 결과를 실제 파일 정보에서 계산한 기대 순서와 비교. Tree 이름 정렬, 사용자 지정 순서 보존, 자동 정렬 중 같은 폴더 재정렬 차단 및 다른 폴더 이동 허용.
- Main을 바꿔 동일 파일의 가상 위치 유지 및 다른 Main에서 한 이동 반영 확인.
- 연결 추가 성공·중복·다른 위치 충돌·Esc 취소, 저장 오류와 frontmatter 오류를 주입해 Markdown/가상 데이터/디스크 rollback 확인.
- 영역 분할 드래그·상하/좌우 배치, 밝은/어두운 테마, 240px 사이드바 가로 넘침 없음.
- Sandbox 프로세스 재시작 후 0.0.7과 가상 폴더·위치·순서·보기·정렬·분할·기존 Card/Connections/Space 상태 일치. 검색어는 비워짐.
- 기존 파일의 경로와 SHA-256 전부 일치. 외부 이름 변경 시 가상 위치 추적 후 시험 이름을 복구.

## 대량 자료

2,000개 연결 파일: 첫 목록 생성 약 35.8ms(각 영역 첫 80개 DOM 생성), 스크롤로 2,000개 모두 도달 확인. 화면 밖 자료도 검색됨. 검색 입력 도구 왕복 약 342ms, 본문 입력 확인 약 110ms. 검색 값에는 검사 스크립트의 250ms 대기가 포함되므로 실제 사용자 입력 지연·CPU 측정값으로 해석하지 않는다. 이름 비교기 재사용, 분리된 DOM 조립, 화면에 가까운 항목부터 추가 표시를 적용했다.

## 증거와 환경

- `.artifacts/stage4/`: ui-result, advanced-result, performance-result, scroll-result, restart-result, release-ready 및 스크린샷.
- Sandbox: `C:\Users\tlatn\AppData\Local\Temp\MDPalette-Stage0-Sandbox-20260918`.
- 전용 프로필: `C:\Users\tlatn\AppData\Local\Temp\MDPalette-Stage0-Profile-20260918`, CDP 19273, Obsidian 1.13.7.
- 기존 설정·설치 자산: `.artifacts/stage4/backup-obsidian`. 원본 파일 해시: originals.json.
- 사용자 요청대로 Sandbox와 시험 자료를 남긴다. 사용자 본인의 BRAT 확인은 자동 검사로 대신하지 않는다.
