# 0.1.4 메타데이터 글자 크기·Sub 드래그 검증

2026-09-22. 최종 빌드 0.1.4, Obsidian 1.13.7.

## 수정과 원인

- Ctrl+휠로 메타데이터 본문·각주 문맥·편집창을 10~32px 범위에서 1px씩 조절한다. 일반 스크롤과 주변 UI 크기는 유지한다. 기존 기본 크기는 첫 조절 전까지 보존하며 선택한 크기는 plugin data에 저장한다.
- Sub 본문의 새 줄로 이동한 직후 놓는 네이티브 드래그에서 `dragenter → dragend`만 발생하고 `drop`이 누락되는 조건을 재현했다. 기존 처리는 `dragover`에만 반응해 새 줄의 첫 진입을 삽입 대상으로 받지 못했다. `dragenter`에서도 같은 대상 검사를 적용해 해당 실패를 해결했다.
- 드래그마다 지우고 다시 만들던 줄 강조·커서를 재사용한다. CodeMirror 문서가 그대로이면 원문 스냅샷을 재사용하며 편집이 발생하면 새로 읽는다. 실제 저장 전 충돌 검사는 유지한다.

## 검증 결과

- 41개 기존 테스트, TypeScript 검사와 빌드 통과.
- 실제 Ctrl+휠 위/아래, 일반 스크롤, 상·하한, 앱·Main 글자 크기 불변 확인.
- 각주 편집 중 입력 내용·선택 영역·textarea 동일성 유지, 보기 반복 전환 후 한 번씩만 확대되는지 확인.
- 기존 라벨·폴더·연결·역할 상태 보존, 시험 Vault 모든 기존 파일 해시 불변 확인.
- 실제 마우스 이동·놓기를 사용하는 네이티브 드래그에서 각주 문맥·각주 내용·Highlights·Block Reference·URL 모두 Sub Live Preview에 메뉴가 뜨고 글자 위치 2에 삽입됨을 확인했다. Source mode도 확인했다.
- 805,407글자 Sub, 메타데이터 1,503개(Highlights 최초 표시 100개) 조건에서 이동 이벤트 121회, 원문 전체 읽기 1회, 표시 요소 2개 재사용. 처리 평균 약 0.10ms, 최대 0.5ms는 Sandbox 내부 핸들러 시간이며 OS·화면 전체 응답 시간을 뜻하지 않는다.
- 긴 문서에서 메뉴 취소 후 삽입 없음·두 위치 표시 제거를 확인했고 시험용 Main/Sub 본문을 원래 값으로 복원하여 해시를 확인했다.
- 동일 Sandbox를 종료한 뒤 재실행하여 0.1.4 자동 로드, 글자 크기 18px 복원, Ctrl+휠, 네이티브 Sub 드래그를 재검증했다.

Sandbox: `C:\Users\tlatn\AppData\Local\Temp\MDPalette-Metadata-Sandbox-20260922`. 별도 프로필: `MDPalette-Metadata-Profile-20260922`, CDP 19330. 백업과 원문 해시는 `.artifacts/metadata-font/backup.json`, 긴 문서 시험 백업은 `.artifacts/metadata-drag/performance-backup.json`에 보존했다. Sandbox는 사용자 확인용으로 유지한다.

드래그 중 문서가 편집되면 원문 캐시가 갱신되는 것도 확인했다.

0.1.4 공개 완료: 소스 `f2cc389`. 공개 다운로드한 main.js·manifest.json·styles.css의 SHA-256이 최종 검증 빌드와 모두 일치한다. [Release](https://github.com/tlatndms2-droid/md-palette/releases/tag/0.1.4).

선별 증거: [evidence/0.1.4](docs/handoff/evidence/0.1.4). 실제 Vault·다른 플러그인 조합은 변경하거나 검증하지 않았다. BRAT 업데이트와 개인 Vault에서의 최종 확인은 기존 합의대로 사용자가 담당한다.
