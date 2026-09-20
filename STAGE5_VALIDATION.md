# 5단계 Metadata 검증 — 0.0.9

2026-09-20, Obsidian 1.13.7. 격리 Sandbox `MDPalette-Stage0-Sandbox-20260918`, CDP 19273. 실제 작업 Vault는 변경하지 않았다.

## 통과한 흐름

- 탭 메뉴 Main 지정 → Metadata View → 5개 구역의 순서·개수·내용 확인.
- 각주 다중 줄 편집·저장, 편집 중 원문 변경 시 최신 원문 보호.
- Task 원문 체크, 완료 필터, 저장 실패 주입 시 체크 표시·원문 보존.
- 검색 결과 구역 펼침, 검색 해제 시 접힘 복원, Main 변경 시 검색어 유지.
- 중복 블록 ID 각각 표시, 항목 클릭으로 지정한 Main의 실제 블록 줄 이동.
- 내부 파일·이미지 Main 옆 새 탭 열기, 동일 파일 탭 재사용, Main 탭·기준·아이콘 유지.
- 웹 메뉴 네이티브 Web Viewer 열기·동일 URL 탭 재사용. 기본 브라우저는 실제 메뉴 클릭으로 Electron shell.openExternal에 정확한 URL 전달 및 네이티브 Promise 성공 확인. 외부 웹페이지 렌더링은 별도 판정하지 않았다.
- 없는 링크 파일을 만들지 않고 안내. Main 없음은 검색·목록 숨김, 빈 Main은 5개 구역 유지.
- Main 닫기 후 지정 해제 및 나머지 모든 탭 ID 보존.
- 기존 Card→Sub, Connections·Folder 전환, 기존 문서별 가상 폴더·라벨 보존.
- 330px 사이드바: 내용 폭 306px / scrollWidth 306px, 가로 넘침 없음.
- 참조 이미지의 검색 위치·구역 순서·구분선·강조 세로선·Task 상태·블록 ID 비교. 기본 버튼 배경이 남던 CSS 우선순위를 수정하고 재확인했다.

## 대량 자료

한 Main에 Task·Highlight·Block 각각 2,000개. 구역별 100개부터 표시하고 더 보기로 추가하며 검색은 전체를 대상으로 한다.

- Main 지정 작업 약 80ms. 전체 렌더 완료 시간과 동일하지 않다.
- 검색 입력·결과 확인 왕복 약 514ms, 편집 입력 왕복 약 278ms.
- 왕복 값에는 도구의 180~250ms 대기가 포함되므로 순수 UI 지연이나 일반 환경의 성능 보장 수치로 해석하지 않는다.
- 1999번째 항목 검색과 편집 입력 반영을 확인했다.

## 재시작·파일 보호

- 시험 전 `.obsidian`과 기존 파일 해시를 `.artifacts/stage5/backup`, `originals.json`에 보관했다.
- 별도 Sandbox 프로세스 재시작 후 새 CDP 대상으로 0.0.9 로드 확인.
- 옆 자료 탭이 활성화돼 있어도 Main 탭 ID·문서·아이콘 복원. 접힘 복원 및 검색어 초기화.
- 재시작 전후 문서별 폴더·카드·Connections 상태 일치.
- 기존 파일 2,028개 SHA-256 일치. 자료 변경은 신규 Stage5-Review 시험 파일과 Sandbox 설정에 한정했다.
- 로컬·설치본 main.js·manifest.json·styles.css 일치. 최종 검증 Runtime 예외 없음.

## 실행·증거

- TypeScript, esbuild, `node --test tests/*.test.mjs`: 25개 통과.
- scripts/stage5-prepare.mjs, stage5-install.mjs, stage5-ui.mjs, stage5-advanced.mjs, stage5-restart.mjs.
- `.artifacts/stage5`: ui-result.json, advanced-result.json, before-restart.json, restart-result.json, release-ready.json 및 스크린샷.
- Sandbox·시험 자료는 사용자 확인용으로 유지. BRAT 확인은 최신 사용자 요청으로 제외.
- 6단계는 수행하지 않았다. 다음 단계는 사용자 확인·별도 요청 후 진행한다.

## 배포

- 구현 커밋 cef8cf7, GitHub Release 0.0.9 생성.
- 공개 다운로드 main.js·manifest.json·styles.css SHA-256이 로컬·Sandbox 검증 빌드와 모두 일치.
- `.artifacts/stage5/release-verification.json`에 URL·해시 기록. BRAT 자동 확인은 수행하지 않았다.
