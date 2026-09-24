# MD Palette 0.1.8 검증

2026-09-24. 사용자가 정정한 네 가지 요구 및 미연결 파일의 **열기 차단** 선택을 적용했다.

## 확인한 화면과 동작

- Sub: 미연결 파일 열기, View 교체, 이미 열린 미연결 탭 클릭, 새 탭 열기를 차단한다. 기존 활성 파일·비활성 탭·Main 링크를 보존하며, 연결된 파일 더블클릭은 정상 동작한다. 새로 거절된 빈 탭만 정리하고 이전 활성 파일을 복원한다.
- Card: 목록 고정, 보기 형식 선택 제거, MD+Canvas 복수 필터, 전체 선택 연동, 기존 라벨 필터 조합. Folder 보기 형식은 그대로 유지하며 파일 유형 필터만 공유한다.
- 파일 삽입: 실제 CDP 마우스 제스처로 단일·복수 파일 드래그, 복수 선택 메뉴, 위치 미리보기·겹침 차단·취소·확정·명령으로 되돌리기.
- 폴더 삽입: 선택한 하위 폴더는 4개 노드/3개 연결선, 전체 예제는 7개 노드/6개 연결선. 숨겨진 파일 유형도 폴더 원본 구조에 포함하고 원본 부모·자식을 보존한다.
- 저장 실패 주입 후 이번에 추가된 모든 노드·연결선 원복. 지원하지 않는 파일이 섞이면 전체 삽입 전 차단. 미리보기 도중 같은 탭에서 다른 Canvas로 전환하면 양쪽 파일 모두 변경 없이 취소.
- 원본 Markdown·이미지 내용과 Main 링크 불변. 기본 UI 검사에서 추가한 기존 Canvas 카드 보존.
- Obsidian 프로세스 재시작 후 0.1.8 자동 로드, Canvas 배치·연결선, 복수 필터, 가상 폴더, 목록 보기, Sub 활성 파일 복원.

## 환경과 결과

- 격리 Vault: `C:\Users\tlatn\AppData\Local\Temp\MDPalette-Canvas-Sandbox-20260924`
- 프로필: `MDPalette-Canvas-Profile-20260924`, CDP 19350, Obsidian 1.13.7.
- 47개 테스트 통과, TypeScript 검사·번들 빌드 통과. 로컬/설치본 main.js·manifest.json·styles.css 동일 SHA-256.
- 257개 노드 실제 미리보기에서 50ms 타이머 20회: 평균 52.78ms, 최대 58.30ms. 이 환경의 단기 미리보기 응답 측정이며 사용자 대형 Vault 전체 성능을 뜻하지 않는다.
- Obsidian 등록 View 확인: Markdown, Canvas, PDF, PNG/SVG 이미지, MP4/WebM 영상. 실제 삽입 UI는 Markdown·Canvas·SVG로 확인했으며 PDF/영상 자체의 재생 품질은 검증 대상이 아니다.
- 문서 HTML의 흐름과 목록 참조 이미지에 맞춰 보기 형식 선택 제거, 독립 파일 노드/폴더 관계, 미리보기·확정·취소 버튼과 테마 색상을 확인했다.

검증 스크립트: `scripts/canvas-revision-validation.mjs`, `scripts/canvas-revision-advanced.mjs`. 증거: `docs/handoff/evidence/0.1.8`.

## 보존과 확인 경계

- 실제 Vault와 원본 Planning Pack은 수정하지 않았다. 검증 전 Sandbox workspace·data·Canvas 백업은 `.artifacts/canvas-revision/backup`에 보관한다. 원래 임시 Canvas 파일은 백업과 해시가 일치한다. 검증 자료로 만든 Review-* 파일과 최종 UI는 Sandbox에 남긴다.
- 새 미연결 파일 열기 차단은 기존의 **Sub 지정 시 연결 승인** 기능을 없애지 않는다. 기존 Main 사본 지정 예외와 Main 변경 시 역할 해제도 유지한다.
- 대상 Canvas 자신을 파일 노드로 포함하는 삽입은 사전에 안내하고 취소한다. 여러 Canvas가 열려 있고 대상이 불분명하면 열린 Canvas 목록에서 고른다.
- 마지막 삽입 되돌리기는 현재 플러그인 실행 중 마지막 작업에 적용한다. 앱 재시작 후 배치 자체는 유지되며 별도 되돌리기 기록은 저장하지 않는다.
- 사용자 본인 BRAT 확인은 대기다. 최신 HANDOFF의 분담대로 실제 Vault BRAT 작업은 사용자에게 남기며 자동 확인했다고 기록하지 않는다.
