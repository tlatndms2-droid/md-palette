# 0.0.10 후속 수정 검증

검증일: 2026-09-21. Obsidian 1.13.7, 분리된 MDPalette-Stage0-Sandbox-20260918. 실제 작업 Vault는 수정하지 않았다.

## 통과한 화면 흐름

- Metadata Links: 본문·속성의 같은 웹 URL은 한 번 표시. MD·Canvas·이미지 링크는 제외. Highlights·Task는 유지.
- Main 링크: 읽기 모드 본문·속성, Live Preview의 Ctrl+클릭으로 Sub에서 열기. heading 대상 유지, 같은 파일 탭 재사용, 기존 Sub 탭으로 포커스 이동. Canvas 지원. 일반 문서 링크는 기존 탭 동작 유지.
- 웹 주소: 실제 메뉴로 웹뷰어 Sub 열기·같은 주소 재사용. 기본 브라우저 선택은 Electron의 URL 전달까지 검증했으며 사용자 브라우저를 실제로 열지는 않았다.
- 라벨 관리: 현재 Main 연결 목록에 없는 파일을 포함한 전체 Vault 사용 개수·목록 표시. 삭제 취소와 확정, 해당 라벨·할당·필터 제거, 다른 라벨·파일 보존.
- 기본 페이지 미리보기: Card 6가지 보기, Folder 파일 카드·Tree 파일 행, Connections 파일 목록. Ctrl 없이 미리보기가 뜨지 않고, 호버 중 Ctrl을 눌러도 뜨는 동작 확인. 버튼·가상 폴더는 제외.
- 참조 비교: 기존 메뉴·패널 배치와 테마를 유지. 라벨 관리에 파일 목록·개수·삭제만 추가. 기본 Obsidian 미리보기 창 사용.

## 검증 결과

- TypeScript 검사, 26개 테스트, 최종 0.0.10 빌드 통과.
- Sandbox에 최종 자산 설치 후 실제 CDP 마우스·키보드 입력으로 검증. 개발용 직접 상태 설정은 시험 자료 준비에만 사용했다.
- 편집 모드 속성 링크의 기존 Sub 활성화 문제를 발견해 수정 후 재검증했다.
- Sandbox 프로세스 재시작: Main과 웹뷰어만 남은 Sub의 역할·아이콘, 라벨 삭제·남은 라벨, 가상 폴더·연결 설정 복원 통과.
- 기존 파일 2,033개 SHA-256 보존. 새 시험 파일 6개 재시작 전후 일치. 로컬 빌드와 Sandbox 자산 세 개 일치.
- 시험 중 창 최소화로 발생한 캡처 실패는 Sandbox 창 복원·실제 창 크기 정정으로 해결했다. 정상 스크린샷을 직접 비교했다.
- 증거: .artifacts/revision2의 ui-partial.json, ui-result.json, restart-result.json, release-ready.json 및 화면 캡처. 원본 설정 백업을 보관하며 Sandbox와 시험 자료를 남겼다.
- BRAT 설치·업데이트는 사용자 담당으로 미실행. 다음 단계 구현 미실행.

## 공개 Release

[0.0.10 Release](https://github.com/tlatndms2-droid/md-palette/releases/tag/0.0.10), 구현 커밋 1343b3a. main.js·manifest.json·styles.css를 공개 다운로드하여 최종 Sandbox 빌드와 SHA-256 일치를 확인했다. BRAT은 사용자 확인 대기다.
