# Canvas Main 새 Canvas 배치 검증 — 0.1.15

2026-10-06. 사용자 확정: 새 B의 링크 카드를 Main A에 배치한다. 미리보기를 이동하고 클릭하여 확정한다. Esc/취소는 카드 배치만 취소하며 빈 B 파일은 남긴다.

## 확인한 사용자 흐름

- 새 링크 파일 창에 Markdown/Canvas 형식이 표시되고 Canvas 선택 시 `만들고 위치 선택`으로 바뀐다.
- 빈 B 생성 후 Main A에서 기존 스타일의 미리보기와 취소 안내를 표시한다. B를 자동으로 열지 않는다.
- 미리보기 중에는 A 내용에 변경이 없다. 실제 포인터 이벤트 위치와 저장한 카드 좌표를 비교했다.
- 배치 후 A→B가 Obsidian 연결 색인과 팔레트에 나타나며 B는 빈 Canvas로 유지된다.
- Esc와 취소 버튼은 미리보기만 없앤다. 빈 B 파일은 보존하며 연결되지 않는다.
- Folder에서 시작한 경우 배치 성공 후 가상 위치를 기록한다.
- 저장 실패와 Folder 저장 실패를 주입해 기존 A 노드·연결선과 Folder 상태가 복원되는지 확인했다.
- 기존 마지막 삽입 되돌리기는 추가한 카드만 제거하고 B 파일을 보존한다.
- Main이 바뀌면 진행 중 미리보기를 취소하고 다른 Canvas에 쓰지 않는다.
- Markdown 생성은 선택한 노트의 link note에 A 링크를 쓰는 이전 방식이며 카드를 추가하지 않는다.
- 같은 Sandbox 프로세스를 종료·재시작하여 정확한 카드 좌표, A→B 연결, Folder 상태와 취소한 빈 B를 확인했다.

## 검증 환경과 결과

- 격리 Sandbox: `C:\Users\tlatn\AppData\Local\Temp\MDPalette-Swap-Sandbox-20261006`
- Obsidian 1.14.4, MD Palette 0.1.15, CDP 19410. 실제 사용자 Vault는 사용하지 않았다.
- TypeScript 검사·빌드 및 자동 테스트 64개 통과.
- 최종 빌드를 설치한 뒤 위 UI·실패 보호·재시작 확인을 수행했다.
- 250개 연결 노트/노트당 Task 40개 시험: 최종 측정 첫 표시 약 281ms, 후속 최대 프레임 간격 약 83ms. 검색 입력과 필터 결과를 확인했다. 실제 사용자 Vault 전체의 성능 보장은 아니다.
- 비교 기준은 새 승인 동작과 기존 Canvas 배치 UI다. 별도 새 시안 이미지는 없다.
- 설정·작업 공간·기존 파일의 백업과 해시 목록은 `.artifacts/canvas-new-placement`에 보관했다.

## Release·BRAT·복원 결과

- [공개 0.1.15](https://github.com/tlatndms2-droid/md-palette/releases/tag/0.1.15), 구현 커밋 30d6f41. 필수 자산 3개를 공개 URL에서 다운로드하고 최종 빌드의 SHA-256과 대조했다.
- BRAT 2.2.0으로 0.1.14→0.1.15 업데이트·활성화를 확인했다. Main·Folder·Card·탐색 설정을 보존했다.
- 설치 main.js/styles.css는 바이트가 동일하다. BRAT가 다시 저장한 manifest.json은 공백만 달라 모든 필드를 비교했다.
- 기존 파일 17개 SHA-256 동일. 시험 전 workspace.json과 data.json을 복원하고 백업 해시와 대조했다.
- 시험 자료/최종 설정을 별도로 백업한 뒤 일시 생성 파일 22개를 정리하고 새 A 시험 Canvas를 최초 상태로 복원했다. 기존 사용자 시험 자료는 보존했다.
- 복원 후 Sandbox에서 MD Palette 0.1.15, BRAT 2.2.0, 기존 Swap-Review/A.md Main 로드를 확인했다. Sandbox는 열어 두었다.
- 사용자 본인의 BRAT 설치·사용 확인은 대기 중이며 자동 검증으로 대신하지 않는다.

[스크린샷과 실행 결과](docs/handoff/evidence/0.1.15).
