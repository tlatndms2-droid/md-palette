# 6단계 드래그 재사용 — 0.0.12

검증일: 2026-09-21. 대상: Obsidian 1.13.7, 격리 `MDPalette-Stage0-Sandbox-20260918`, 전용 프로필·CDP 포트 19273.

## 승인 범위와 구현

사용자가 HTML에서 1번을 선택했다. 파일 카드는 Main Markdown, 강조·블록은 Main/Sub Markdown 또는 Sub Canvas에 삽입한다. Markdown은 편집 모드 본문을 대상으로 한다. Reference와 Main/Sub 교환은 되살리지 않는다.

드롭 위치에서 Obsidian 기본 메뉴를 표시한다. 파일은 링크·임베드·Markdown 본문, 강조는 텍스트·출처 포함, 블록은 문서에서 링크·임베드와 Canvas에서 내용·링크 카드다. 원본 파일·블록 ID를 수정하지 않는다. 삽입 대상 변경·원문 변경·취소·지원하지 않는 대상은 변경하지 않는다.

## 실제 UI 확인

- CDP 네이티브 마우스 드래그 시작 → 실제 drag payload → drop → 기본 메뉴 항목 클릭으로 실행했다. 삽입 함수를 직접 호출해 성공을 대신하지 않았다.
- Markdown 파일 세 가지 선택, 이미지 임베드와 본문 선택 제외, 다중 행 강조 두 선택, 블록 링크·임베드, Main 강조 삽입의 정확한 문자열·위치를 확인했다.
- Canvas 네 가지 메뉴를 확대·축소·이동 상태에서 확인했다. 실제 카드 왼쪽 위와 마우스 위치 차이가 화면 기준 2px 미만이었다.
- 기본 메뉴 아이콘·한글 제목·취소·테마·위치를 실제 스크린샷으로 확인했다. 승인 HTML의 Main/Sub 삽입 대상과 결과 흐름을 비교했다.
- 메뉴 Esc·밖 클릭·취소 버튼에서 원문이 동일했다. Canvas 메뉴 취소 시 노드 수·내용이 동일했다.
- Main 본문의 Ctrl+Z는 추가한 내용만 되돌렸다. 메뉴가 열린 사이 대상 또는 원문 변경 시 최신 편집을 보존하고 삽입하지 않았다.
- 저장 오류를 주입해 Markdown의 편집기·디스크 원복 및 Canvas 신규 노드 제거·기존 노드 보존을 확인했다.
- 일반 문서·읽기 모드·이미지·PDF·영상·파일 카드→Sub를 거부했다. Tasks는 draggable이 아니었다.
- 기존 Card 삽입 안내선·정렬 드롭이 유지됐고 재사용 메뉴가 나타나지 않았다.

## 재시작·보존·빌드

- TypeScript 검사, 32개 테스트, 빌드 통과. 첫 버전 검사에서 versions.json 최소 앱 버전 불일치를 찾아 manifest와 동일한 1.13.7로 고친 뒤 통과했다.
- Canvas 저장 데이터의 키·노드 배열 순서 차이를 실제 내용 변경과 구분하도록 수정하고 최종 빌드로 UI 검증을 다시 통과했다.
- 전용 프로필·포트에 일치하는 Sandbox 프로세스만 종료·재실행했다. 0.0.12 로드, Main/Sub 역할, 저장된 Main/Sub Markdown·Canvas, 재시작 후 새 드래그 메뉴·취소를 확인했다.
- 기존 파일 2,045개의 SHA-256이 검증 전과 동일하다. 새 시험 자료의 원본 자료·이미지·일반 문서도 유지됐다.
- 로컬과 Sandbox의 main.js·manifest.json·styles.css SHA-256이 일치한다. `.artifacts/stage6/release-ready.json`에 Release 전제 결과를 저장했다.
- 관련 런타임 예외 없음. 실제 작업 Vault 수정 없음. Sandbox·시험 자료·설정을 검토용으로 남겼으며 백업은 `.artifacts/stage6/backup`에 보관한다.

## 증거와 제외

`.artifacts/stage6`: ui-result.json, advanced-result.json, restart-result.json, originals.json, restart-expected.json, release-ready.json, file-drop-menu.png, markdown-result.png, canvas-drop-menu.png, canvas-result.png, restart.png.

BRAT 설치·업데이트는 사용자가 확인한다. 대형 Vault 신규 성능 수치는 측정하지 않았다. Folder/Connections의 추가 재사용, Tasks·각주·URL 드래그, 모바일 및 7단계 통합 검증은 이번 범위 밖이다.
