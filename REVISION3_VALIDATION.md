# 0.0.11 Folder 제목 카드·Main 토글 검증

검증일 2026-09-21, Obsidian 1.13.7. 실제 작업 Vault 대신 MDPalette-Stage0-Sandbox-20260918에서 검증했다.

- 승인 HTML과 실제 화면 비교: 작은 파일/폴더 아이콘, 66px 카드, 두 줄 말줄임 제목, 전체 이름·실제/가상 경로 tooltip. 620px 패널의 여러 열과 330px 패널의 한 열에서 가로 넘침 없음.
- 제목 카드 렌더링 중 연결 파일 read/cachedRead/readBinary 호출 0회, 본문·썸네일·추가 정보 DOM 없음.
- 실제 마우스로 단일·Ctrl 선택, 폴더 드래그 이동, 폴더 탐색, 파일 더블클릭 Sub 열기, 우클릭 메뉴, Ctrl 기본 미리보기 통과.
- 기존 6가지 보기 및 제목 카드 메뉴 전환, Ctrl+휠 전환, 정렬 전체 옵션과 이름/내림차순 선택 확인. Tree에는 제목 카드 전용 표시가 적용되지 않음.
- 기존 문서별 Folder 설정 전체 비교 일치. 새 Main은 compact 기본값. 7가지 보기 값의 저장·복원 및 가상 정리 보존 자동 테스트 통과.
- 기존 set-main 식별자에 Sandbox 단축키 Ctrl+Shift+M을 업데이트 전에 설정. 업데이트 뒤 실제 키 입력으로 Main 지정→해제→재지정→다른 Markdown Main 변경 확인. 별도 해제 명령 없음.
- Sub Markdown·Canvas·이미지에서 단축키를 눌러도 기존 Main 유지. 해제 후 역할 아이콘 제거, 모든 기존 탭 보존 확인.
- 27개 자동 테스트·TypeScript·빌드 통과. 최종 0.0.11 설치본으로 Sandbox 프로세스 재시작 후 Main·문서별 보기·가상 폴더·Card 설정·단축키 복원 확인.
- 기존 파일 2,039개 SHA-256 일치. 빌드와 Sandbox의 main.js·manifest.json·styles.css 일치. 런타임 예외 없음.
- 증거·백업: .artifacts/revision3. UI 결과, 재시작 결과, 최종 자산 해시와 compact/hover/narrow/restart 화면 캡처를 보관한다.
- Sandbox와 시험 자료는 그대로 남겼다. BRAT 확인은 사용자 담당으로 실행하지 않았으며 6단계는 시작하지 않았다.

공개 배포: [0.0.11 Release](https://github.com/tlatndms2-droid/md-palette/releases/tag/0.0.11), 구현 커밋 a63e414. main.js·manifest.json·styles.css를 공개 다운로드하여 최종 검증 빌드와 SHA-256 일치를 확인했다.
