# 0.1.7 Sub 규칙·지정·배치 검증

공개 Release 0.1.7, 소스 1e61c27. main.js·manifest.json·styles.css를 공개 다운로드하여 최종 검증 빌드의 SHA-256과 모두 일치함을 확인했다. release-verification.json 참조.

2026-09-22, Obsidian 1.13.7. 현재 사용자 결정이 과거 여러 Sub·전체 높이 고정 규칙을 대체한다.

## 범위와 원인 확인

사용자 요청: 모든 지원 파일을 동일 Sub 규칙으로 열기, Sub 지정/해제, 미연결 파일은 연결 승인 또는 취소, Sub 하나, Ctrl+Shift는 새 일반 그룹, Sub 아래 일반 그룹 허용.

0.1.6의 빠른 MD→PNG→Canvas와 기본 openFile 전환에서는 아이콘 소실이 직접 재현되지 않았다. 다만 그룹의 모든 파일이 일시적으로 인식되지 않으면 역할을 삭제하는 조건을 확인했다. 실제 탭을 임시 empty 화면으로 바꾸어 로딩 중 파일 없는 구간을 모사했을 때 기존 버전은 Sub를 제거했다. 수정본은 같은 구간과 이후 이미지 로드에서도 동일 그룹과 아이콘을 유지한다. 사용자 실환경의 정확한 지연·다른 플러그인 영향까지 원인으로 확정하지 않는다.

배치 문제는 매 layout-change에 Sub를 루트 오른쪽 전체 높이로 되돌리는 arrange 호출에 해당한다. 자동 재배치 호출을 제거하고, 신규 그룹 최초 생성 외의 사용자 배치를 건드리지 않는다.

## 통과한 확인

- 44개 단위 테스트, TypeScript 검사, 빌드.
- 0.1.6에서 실제 여러 Sub를 저장한 뒤 0.1.7 설치. 마지막 사용 Sub 하나를 유지하고 모든 탭 ID·파일·그룹 위치 및 기존 정리 설정 보존.
- 실제 Card 더블클릭 MD/PNG/Canvas/MD → 같은 Sub, 아이콘 1개. 빈 중간 화면에서도 역할 유지.
- Ctrl+더블클릭 새 탭과 중복 파일 탭 재사용. Ctrl+Shift+더블클릭은 기존 탭·Main·Sub를 보존하고 일반 그룹 하나 추가.
- 연결된 Canvas 탭 우클릭으로 지정·해제, 토글 명령. 다른 그룹 지정 시 기존 Sub는 일반 그룹이 되며 파일·탭 불변.
- 미연결 이미지 팝업 취소 시 원문·역할 불변. 승인 시 정확한 이미지 wikilink를 Main link note에 넣고 해당 기존 그룹 지정.
- 팝업을 연 뒤 대상 탭을 바꾸면 쓰기 전 거부. 연결 저장 실패 주입 시 역할·Main 내용 불변.
- Obsidian 하단 분할 명령으로 Sub 아래 일반 그룹 생성. 파일 전환 후에도 중첩 배치와 원래 Sub 그룹 유지.
- 전체 프로세스 재시작 후 단일 Sub, 중첩 배치, 연결, 12개 중앙 파일 탭 보존. 이미지·Canvas 교체를 다시 실행.
- 검토용 화면에서는 시험으로 늘어난 일반 그룹의 탭을 한 일반 그룹에 모았다. 탭 ID·파일 전체를 보존한 것을 비교했으며 이는 제품 자동 동작이 아닌 Sandbox 검토 배치다. 비활성 지연 로드 탭도 getViewState 기준으로 포함했다.
- 실제 화면에서 Canvas 탭의 Sub 아이콘 16×16px와 아래 일반 그룹을 확인했다.
- 시험 전 기존 파일 해시 기록. 기존 빈 Canvas 한 개가 Obsidian 종료 과정에서 JSON 들여쓰기만 바뀌어, 원래 해시와 일치하는 JSON 바이트로 복원 후 전체 기존 파일 해시 통과. 복원 전 값도 별도 보존했다.

## 경계와 증거

실제 Vault는 변경하지 않았다. 다른 플러그인 조합·모바일·별도 팝아웃 창은 이번 검증 대상이 아니다. 파일 종류별 모든 외부 뷰어를 검증했다고 주장하지 않는다. 이번 대표 실검증 파일은 Markdown·PNG·Canvas다.

Sandbox: C:\Users\tlatn\AppData\Local\Temp\MDPalette-Metadata-Sandbox-20260922. 전용 Profile, CDP 19330. 최종 재시작 PID 22440, ProcessStartInfo. 백업·시험 자료·검토 화면을 유지한다.

scripts/sub-rules-prepare.mjs, sub-rules-validation.mjs, sub-rules-review.mjs; 증거 docs/handoff/evidence/0.1.7. BRAT 업데이트 및 개인 Vault 확인은 사용자 담당이다.
