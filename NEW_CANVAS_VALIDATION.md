# 0.1.6 새 Canvas 생성·연결 검증

공개 Release 0.1.6, 소스 a970682. main.js·manifest.json·styles.css 공개 다운로드 SHA-256이 최종 검증 빌드와 모두 일치한다. 증거 release-verification.json 참조.

2026-09-22, Obsidian 1.13.7. 사용자가 승인한 범위: 새 링크 파일에서 MD/Canvas 선택, 생성·연결만 수행하고 자동 열기 없음.

## 결과

- 43개 테스트·TypeScript 검사·빌드 통과.
- 실제 UI에서 파일 형식을 선택하고 파일 이름을 입력하여 생성했다. 기본값 Markdown, 선택 형식에 맞는 저장 위치 미리보기, 확장자 정규화 확인.
- 같은 이름의 MD와 Canvas를 별개로 생성. Canvas는 nodes/edges가 빈 유효 JSON이며 중복 Canvas 생성은 거부하고 기존 파일 보존.
- Card에서 현재 폴더/루트, Connections에서 지정 폴더, Folder 메뉴에서 선택한 가상 폴더 배치를 확인했다. 생성 전후 열린 파일·탭 목록이 동일하다.
- Obsidian이 non-MD 이름을 첨부파일로 취급하여 현재 폴더 설정을 무시하는 현상을 실제 UI에서 발견했다. 부모 위치는 Markdown 이름으로 조회하고 선택 확장자를 붙여 두 형식 모두 새 노트 설정을 따르도록 수정·재검증했다.
- 취소는 파일 생성 없음. Main 연결 저장 실패를 주입하여 수정되지 않은 신규 Canvas만 제거되고 부분 파일이 남지 않는지 확인.
- 같은 Sandbox 프로세스 재시작 후 0.1.6, Main·연결·가상 폴더 복원 확인. 생성된 Canvas를 실제 더블클릭하여 정상 Canvas 화면이 열리는지 확인했다.
- 모든 기존 Sandbox 파일의 SHA-256 불변 확인. 새 노트 저장 설정은 시험 전 값으로 복원. 시험용 CanvasCreate-Review 자료 및 백업은 사용자 확인용으로 유지.

실제 Vault는 변경하지 않았다. Sandbox: C:\Users\tlatn\AppData\Local\Temp\MDPalette-Metadata-Sandbox-20260922, 전용 Profile, CDP 19330. 재시작 ProcessStartInfo PID 12744. scripts/new-canvas-validation.mjs 및 docs/handoff/evidence/0.1.6에 증거를 보관한다. BRAT 업데이트·개인 Vault 확인은 기존 합의대로 사용자 담당.
