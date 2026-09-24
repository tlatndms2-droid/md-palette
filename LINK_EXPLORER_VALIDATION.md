# 하위 링크 탐색과 Metadata 파일 선택 — 0.1.11

2026-09-24. 승인한 실제 플러그인 구조의 HTML 시안을 기준으로 구현했다. 실제 Vault는 사용하지 않았다.

## 확정한 동작

- Card / Connections / Folder에서 나가는 링크와 들어오는 링크를 모두 탐색한다. 부모 옆 화살표로 하위 링크를 펼치며, 연결선·여백·파일별 방향 설명으로 소속을 구분한다.
- 같은 파일이 여러 부모에 연결되어 있으면 각 부모 아래에 표시한다. 원본 복사나 가상 폴더 위치 추가가 아니다.
- 같은 탐색 경로의 조상은 다시 표시하지 않아 순환을 막는다. 깊이는 Main에서 1~5단계, 기본 2단계다. 펼친 경로와 깊이를 저장한다.
- 하위 링크는 가상 위치를 옮기는 대상이 아니다. 파일 더블클릭/Enter로 Sub에 열거나 파일·메타데이터를 기존 허용 대상에 재사용한다. Sub에서는 선택한 깊이 이내의 연결 파일을 허용한다.
- Metadata View 상단 `정보를 볼 파일`에서 Main과 연결 트리를 탐색해 Markdown 파일 하나를 선택한다. Main 지정은 바뀌지 않는다. 파일별 각주·Highlights·Tasks·Block Reference·Links를 기존 영역에서 본다.
- 선택한 파일의 Task·각주만 편집하고, 원문이 바뀌면 오래된 내용으로 덮어쓰지 않는다. 편집 중에는 파일 전환을 막는다. 메타데이터 파일 선택은 Main별로 저장한다.
- Card의 파일 유형·Label, Folder의 파일 유형 필터를 하위 항목에도 적용한다. 기존 가상 폴더의 직접 연결 파일 정리와 저장 위치는 유지한다.

## 자동 검증

- TypeScript 검사·번들 빌드, 51개 테스트 통과. 양방향 출처·공유 하위 파일·순환·깊이·설정 복원·5,000개 노드 인덱스 시험 포함.
- Obsidian 1.13.7, `MDPalette-Link-Sandbox-20260924`, 전용 프로필 `MDPalette-Link-Profile-20260924`, CDP 19361.
- 실제 마우스/키보드로 Card 펼침·접힘·깊이 선택, Folder와 Connections 전환, Metadata 파일 선택·검색·Task 체크·각주 저장·취소를 수행했다.
- 같은 산책 메모가 서로 다른 부모 아래에 나타나며, 들어오는/나가는 링크의 방향 문구를 확인했다.
- 하위 파일의 Sub 열기, 미연결 파일 차단, 강조문 드래그 후 Sub 텍스트 삽입, 하위 파일의 Canvas 메뉴 삽입을 확인했다.
- 외부 원문 변경 반영, 오래된 원문으로 수정 거부, 각주 편집 중 파일 전환 차단을 확인했다.
- 밝은/어두운 테마와 288px 사이드바에서 가로 넘침 없이 표시됨을 확인하고 실제 화면을 승인 시안의 탭·목록·부모 묶음·Metadata 파일 선택 위치와 비교했다.
- 하위 링크 300개를 가진 노트는 50개씩 표시하고 `더 보기`로 100개까지 늘어나는 동작, 동시에 문서 입력을 확인했다. 첫 펼침 263ms는 자동 클릭 대기 180ms가 포함된 단일 측정이다.
- 선택 파일에 Highlights 1,501개와 Tasks 1,501개를 넣어 각 영역 최초 100개 표시와 200개 확장을 확인했다. 파일 읽기·폴링·클릭 대기를 포함한 단일 측정 약 1.19초이며 다른 PC의 성능 보장은 아니다.
- Enter로 펼침 버튼을 조작해도 부모 파일을 Sub에 열지 않는 것을 확인했다.
- 별도 Obsidian 프로세스를 종료·재실행하고 새 CDP 대상을 발견했다. 0.1.11, Main/Sub, Metadata 선택 파일, 깊이·펼침 상태, 라벨·가상 폴더 상태 복원을 확인했다.
- 시험 전에 설정과 워크스페이스를 백업했다. 편집·Canvas 시험 원본은 복원하여 9개 파일의 바이트/해시를 대조했고 대량 시험 자료는 정리했다. Sandbox는 최종 빌드와 기본 시연 자료를 남겨 둔다.

## 증거 및 재실행

- `scripts/link-explorer-setup.mjs`, `link-explorer-validation.mjs`, `link-explorer-advanced.mjs`, `link-explorer-restart.mjs`.
- `.artifacts/link-explorer`에 원본 백업·해시·상세 결과·스크린샷. 재개용 핵심 증거는 `docs/handoff/evidence/0.1.11`.
- 검증 빌드의 세 자산 해시는 `restart-result.json`과 `release-ready.json`에 기록한다. 공개 다운로드 및 BRAT 검증은 별도 보고서로 구분한다.
- 사용자 본인의 BRAT 업데이트 확인은 자동 검증으로 대신하지 않으며 사용자 답변 대기다.

## 공개 및 BRAT 결과

- [0.1.11 Release](https://github.com/tlatndms2-droid/md-palette/releases/tag/0.1.11)는 공개 일반 릴리즈다. `main.js`, `manifest.json`, `styles.css`를 비인증 공개 URL에서 다시 내려받아 검증 빌드의 SHA-256과 일치함을 확인했다.
- 별도 Sandbox에서 기존 0.1.10 설치 후 BRAT 2.2.0의 공개 다운로드·재설치·재로드로 0.1.11을 확인했다. 탐색 상태·라벨·Connections 설정·가상 폴더 보존을 대조했다. BRAT이 manifest를 다시 직렬화하므로 JSON 값은 같고 해당 파일 바이트 해시는 다르며, JS/CSS는 바이트까지 같다.
- 상세 결과: `docs/handoff/evidence/0.1.11/release-verification.json`, `brat-verification.json`. 사용자 본인의 업데이트 확인은 여전히 대기다.
