# 0.1.1 글자 사이 드롭 위치 표시

2026-09-22, Obsidian 1.13.7의 MDPalette-Stage7-Sandbox에서 확인.

- Metadata 링크를 실제 드래그하여 같은 줄의 두 위치, 빈 줄, 자동 줄바꿈된 문장 중간, 문서 끝에 표시되는 세로 커서와 삽입 결과를 대조했다.
- Source mode와 Live Preview에서 이전 편집 커서와 무관하게 드롭 위치에 정확한 URL이 삽입됐다.
- 메뉴 선택 중 위치 표시 유지, Esc 및 메뉴 취소 시 표시 제거·미삽입, 중간 편집 충돌 시 삽입 거부를 확인했다.
- 별도 Sandbox 프로세스를 종료·재시작하고 0.1.1에서 위 동작을 다시 통과했다.
- TypeScript, build, 기존 41개 테스트 통과. 런타임 예외 없음.
- 시험 전 설정 백업 보관. 대상 문서는 시험 전 내용으로 복구했고 원본 Main 내용이 변하지 않았음을 확인했다.
- 결과 및 SHA-256: `.artifacts/caret/ui-result.json`, `.artifacts/caret/restart-result.json`. 화면: `.artifacts/caret/caret.png`.
- 글자가 없는 문서 아래 영역에 새 빈 줄을 자동 생성하지 않는다. 실제 문서 끝을 표시한다.
- BRAT 업데이트 확인은 기존 합의대로 사용자가 수행한다.
