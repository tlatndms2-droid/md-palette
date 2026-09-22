# 0.1.2 드롭 대상 줄 강조

2026-09-22, 격리 MDPalette-Stage7-Sandbox / Obsidian 1.13.7.

공개 Release: https://github.com/tlatndms2-droid/md-palette/releases/tag/0.1.2
공개 다운로드·SHA-256 검증 성공: https://github.com/tlatndms2-droid/md-palette/actions/runs/35671840502
공개 자산 세 개가 Sandbox 검증본과 일치함을 Release API에서도 확인했다.

- 실제 Metadata 링크 드래그에서 글자 사이 커서와 줄 전체 강조 배경을 함께 확인했다. 배경은 편집 영역 안에 표시되고 입력을 가로채지 않는다.
- 서로 다른 글자 위치, 빈 줄, 자동 줄바꿈된 문장, 문서 끝에서 강조 줄·커서·정확한 삽입 결과가 일치했다.
- Source mode·Live Preview, 메뉴가 열린 동안 표시 유지, Esc·메뉴 취소·삽입 후 표시 제거, 편집 충돌 시 삽입 거부를 확인했다.
- Sandbox 프로세스를 종료·재시작한 뒤 0.1.2로 동일 시험 통과. TypeScript·빌드·41개 테스트 통과, 런타임 예외 없음.
- 시험 전 설정·문서 백업을 보관했다. 대상 문서 내용은 시험 후 복원했고 원본 Main 변경 없음도 확인했다.
- 증거: `.artifacts/caret-line/ui-result.json`, `restart-result.json`, `caret.png`.
- 사용자 BRAT 업데이트 확인은 기존 합의대로 사용자가 수행한다.
