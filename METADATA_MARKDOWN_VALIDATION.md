# 0.1.3 각주·메타데이터 Markdown 표시 검증

2026-09-22. Obsidian 1.13.7, 최종 빌드 0.1.3.

- 0.1.2에서 각주·본문 문맥의 Markdown 기호가 그대로 표시되는 현상을 격리 Sandbox에서 재현했다.
- 41개 기존 테스트, TypeScript 검사, 빌드 통과.
- 최종 0.1.3 설치 파일 3개의 SHA-256이 빌드와 일치한다.
- 각주 및 문맥의 굵게·기울임·강조·취소선·코드·내부 링크·여러 줄 목록, Highlights·Tasks·Block Reference·URL 제목의 서식을 실제 화면에서 확인했다.
- 실제 마우스/키보드 입력으로 각주 편집·취소·저장, 할 일 체크·해제, 원문 위치 이동, URL 메뉴, 검색·보기 전환·구역 접기를 확인했다.
- 검색 반복 시 Markdown 표시용 객체가 누적되지 않음을 확인했다. 표시용 객체는 다시 그리거나 닫을 때 해제한다.
- 실제 드래그 시작 시 각주 Markdown 원문이 유지되는지 확인하고 취소했다. 이번 변경에서 삽입 엔진은 변경하지 않았다.
- 밝은/어두운 테마를 화면으로 확인하고 280px 사이드바의 가로 넘침이 없음을 확인했다.
- 프로세스 재시작(1580 → 21612) 후 새 CDP 대상으로 0.1.3 자동 로드·Main 복원·Markdown 표시·파일 해시를 재확인했다.
- 시험 중 편집·체크한 원문은 복원했고 시험 파일 SHA-256이 원래와 일치한다. 실제 Vault는 사용하지 않았다.

시험 위치: `C:\Users\tlatn\AppData\Local\Temp\MDPalette-Metadata-Sandbox-20260922`, 전용 프로필 `MDPalette-Metadata-Profile-20260922`, CDP 19330. Sandbox는 사용자 확인용으로 열어 두었다. 변경 전 설정 백업은 `.artifacts/metadata-markdown/backup-obsidian` 및 `backup-012`에 있다.

화면 및 실행 결과: [evidence/0.1.3](docs/handoff/evidence/0.1.3). BRAT 업데이트와 개인 Vault 확인은 기존 합의대로 사용자가 담당한다. 대량 자료 성능·별도 창·타 플러그인과의 조합은 이번 변경에서 별도로 재검증하지 않았다.
