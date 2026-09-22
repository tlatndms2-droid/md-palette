# 0.1.5 각주 드래그 선택 검증

2026-09-22. Obsidian 1.13.7, 최종 빌드 0.1.5.

사용자 이미지에서 위쪽은 본문 문맥, 아래쪽은 각주 설명이다. `각주만`은 설명 텍스트, `본문만`은 표시된 본문 문맥, `각주와 본문`은 본문 뒤의 새 참조 번호와 문서 끝의 각주 정의를 삽입한다. 원문 Markdown을 유지하며 본문 범위는 기존 표시 문맥(각주가 달린 줄)과 동일하다.

## 통과

- 42개 테스트·TypeScript 검사·빌드.
- 실제 마우스 이동과 놓기로 메뉴를 열고 세 항목 및 취소를 클릭했다. Sub의 Source mode·Live Preview에서 결과 원문과 저장 파일을 비교했다.
- Main 문서와 Sub Canvas에서도 세 선택지 및 취소 확인. Canvas는 선택한 내용을 한 텍스트 카드로 만든다.
- 기존 mdp-1 번호가 있는 문서에는 mdp-2를 부여하며 여러 줄·굵게·강조·목록을 유지한다.
- 본문+각주 삽입은 실제 Ctrl+Z 한 번으로 함께 취소된다. 메뉴 취소는 원문을 바꾸지 않으며 위치 표시도 제거한다.
- 같은 Sandbox 전체 재시작 후 버전 0.1.5·저장된 삽입 결과·기존 18px 글자 크기를 확인하고 Sub의 모든 선택을 다시 실행했다.
- 읽기 화면에서 본문 뒤 각주 번호와 문서 아래의 각주 설명이 실제 각주로 표시되는지 확인했다.
- 시험 전 기존 Vault 파일 해시를 기록하고 Main/Sub 시험 변경을 복원한 뒤 모두 비교했다. 기존 사용자 설정은 백업했다. 검증용 Footnote Choice Review.md/.canvas와 백업은 보존한다.

Sandbox: `C:\Users\tlatn\AppData\Local\Temp\MDPalette-Metadata-Sandbox-20260922`, 별도 Profile, CDP 19330. 재시작 ProcessStartInfo, PID 34332. 실제 사용자 Vault는 변경하거나 검증하지 않았다. 실행 스크립트: scripts/footnote-choice-validation.mjs. 증거: docs/handoff/evidence/0.1.5.

BRAT 업데이트와 개인 Vault 확인은 기존 합의대로 사용자가 담당한다.
