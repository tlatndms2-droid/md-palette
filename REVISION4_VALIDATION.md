# 0.0.13 검증 기록

2026-09-21 · Obsidian 1.13.7 · 격리 Sandbox · 최종 0.0.13 빌드

- TypeScript·36개 테스트·빌드 통과.
- 이전 단일 Sub 역할을 읽어 Main과 함께 복원하는 것을 설치 직후 확인.
- 실제 CDP 마우스: 한 번 클릭·Ctrl 선택은 열지 않음. 기본 더블클릭은 동일 Sub 탭 교체, Ctrl 더블클릭은 새 탭, Ctrl+Shift 더블클릭을 반복하면 Sub 그룹 추가.
- 마지막 사용 그룹의 교체, 이미지 열기, 같은 파일 탭 재사용, Folder·Connections 더블클릭, 세 Sub 아이콘 확인.
- 실제 드래그: Card → Sub Markdown 링크·임베드·속성 제외 본문, 각주 텍스트·실제 각주, URL 주소·제목 링크를 Main/Sub에 정확한 위치로 삽입. 마지막 사용 그룹이 아닌 다른 Sub도 드롭 허용.
- 기존 각주 mdp-1 보존·mdp-2 생성, 여러 줄 정의, 한 번 Undo로 참조·정의 제거, 메뉴 취소 확인.
- 각주·URL의 네 가지 Sub Canvas 카드 모드 확인. Card → Sub Canvas는 계속 거부.
- 각주 저장 실패를 주입해 편집기·디스크 모두 복구 확인. URL 대상 편집 충돌은 새 편집을 보존하며 삽입 거부. 각주 편집 중 드래그 거부.
- 모든 Sub에서 Main 지정 거부. Main 해제 시 모든 역할·아이콘만 사라지고 탭 ID 전체 보존.
- 동일 Sandbox 프로세스를 종료·재실행하여 세 Sub 그룹·순서·마지막 사용 그룹·아이콘·문서 및 Canvas 저장 복원 확인. 재시작 후 실제 드래그 메뉴 취소·기존 탭 교체 재확인.
- 기존 파일 2,051개 SHA-256 유지. 기존 라벨·배정·필터·문서별 가상 폴더 유지. 실제 작업 Vault 수정 없음.

검증 중 클릭 좌표가 닫기 버튼/이전 시험 탭을 가리키는 테스트 문제를 수정했고, 재시작 시 비활성 탭은 지연 로딩 상태의 저장된 파일 경로로 확인했다. 제품 오류로 판정하지 않았다.

증거와 설정 백업: .artifacts/revision4의 opening-result, drag-result, guards-result, restart-result, release-ready JSON 및 화면. Sandbox와 시험 자료는 유지한다. BRAT 확인은 사용자 담당. 7단계 미시작.

Release: https://github.com/tlatndms2-droid/md-palette/releases/tag/0.0.13 · 구현 커밋 9ba689e. 공개 main.js·manifest.json·styles.css를 다시 내려받아 검증 빌드와 SHA-256 일치 확인. Metadata 웹뷰어 메뉴도 기존 마지막 Sub 탭을 교체하고 Main을 유지하는 것을 실제 클릭으로 추가 확인했다.
