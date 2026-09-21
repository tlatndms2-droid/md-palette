# 0.0.14 새 링크 파일 생성 검증

2026-09-21, Obsidian 1.13.7, 격리 Sandbox 백그라운드 CDP. 실제 Vault는 사용하지 않았다.

## 통과한 사용자 흐름

- Card·Connections 상단의 `새 링크 파일 추가` → 이름 입력 → 저장 경로 표시 → `만들고 연결` → 빈 Markdown 생성 및 Main의 `link note` 연결, 목록 갱신.
- Obsidian 새 노트 설정의 Vault 루트·현재 파일 폴더(Main 기준)·지정 폴더를 각각 실제로 확인했다. `.MD` 입력은 `.md`로 정규화한다.
- Folder 루트 및 하위 가상 폴더의 우클릭 메뉴에서 생성·Main 연결·현재 가상 폴더 배치를 확인했다.
- Escape·취소, 빈 이름·잘못된 경로 문자·중복 이름, 입력 창을 연 뒤 Main 변경에서 의도하지 않은 파일 변경이 없었다.
- Main 연결 쓰기 실패, 가상 폴더 저장 실패, 가상 배치 저장 후 연결 쓰기 실패를 주입했다. 새 빈 파일이 남지 않고 가상 상태가 복구됐다.
- 기존 연결 파일 선택 창 유지, 생성된 카드 더블클릭으로 Sub 열기 및 Main 유지.
- 밝은/어두운 테마와 240px 사이드바 확인. 새 버튼은 좁은 폭에서 두 줄로 배치되고 가로 넘침이 없다. 첨부 참조의 상단 버튼 영역 및 기존 필터 배치를 유지한다.
- 별도 Sandbox 프로세스 PID 33296 → 31196 재시작. 0.0.14, 생성 파일 내용, Main 연결, 가상 위치를 복원했으며 재시작 후 생성도 통과했다.

## 자동 검사 및 보존

- TypeScript 검사·빌드, Node 테스트 38개 통과.
- 기존 Sandbox 파일 2,058개의 경로와 SHA-256 보존, 기존 라벨·할당·문서별 가상 폴더 보존.
- 시험 전 `.obsidian` 백업과 기존 파일 해시를 `.artifacts/new-note`에 보관. 시험에서 바꾼 새 노트 저장 설정은 기존 값으로 복원했다.
- 최종 빌드의 main.js·manifest.json·styles.css와 Sandbox 설치본 SHA-256 일치. `release-ready.json` 참조.
- 증거: `ui-result.json`, `visual-result.json`, `release-ready.json`, `dialog-root.png`, `folder.png`, `narrow-dialog.png`, `light-dialog.png`, `restart.png`.
- Sandbox: `C:\Users\tlatn\AppData\Local\Temp\MDPalette-Stage0-Sandbox-20260918`, 전용 프로필 `MDPalette-Stage0-Profile-20260918`, 포트 19273. 새 조회한 CDP 대상을 사용했다.

## 범위

[0.0.14 Release](https://github.com/tlatndms2-droid/md-palette/releases/tag/0.0.14), 구현 커밋 `80ac833`. 공개 자산 main.js·manifest.json·styles.css를 인증 없이 다운로드하여 최종 빌드와 SHA-256 일치를 확인했다. 증거는 `.artifacts/new-note/release-verification.json`에 보관한다.

실제 Vault 및 BRAT 설치·업데이트 검증은 수행하지 않는다. BRAT 확인은 사용자가 담당한다. Sandbox와 시험 자료는 확인용으로 유지한다. 7단계는 진행하지 않았다.
