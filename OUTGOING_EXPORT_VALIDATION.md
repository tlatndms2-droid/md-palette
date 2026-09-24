# 0.1.12 검증

하위 목록은 아웃고잉 링크만 표시합니다. Folder에서 Canvas로 내보내면 선택한 연결 깊이까지 부모 파일·하위 파일·연결선을 함께 배치합니다. 접힌 항목도 포함하며, 같은 파일은 부모별 카드로 표시하고 원본은 하나로 유지합니다.

## 통과한 검증

- 53개 단위 테스트, TypeScript 검사, 최종 0.1.12 빌드.
- 격리 Sandbox Card/Folder/Metadata 선택기: 백링크 전용 자식 제외, 공통 아웃고잉 자식은 각 부모 아래 표시. Main 직접 백링크는 유지.
- 실제 폴더 우클릭 메뉴와 Canvas 클릭 배치: 폴더 1개 + 부모 파일 2개 + 하위 파일 카드 2개, 올바른 연결선 4개. 접힌 자식도 포함.
- Esc 취소, 전체 삽입 되돌리기, 깊이 변경 시 오래된 미리보기 취소. 깊이 3의 추가 자식 포함.
- 원본 파일 전체 내용·해시 및 가상 폴더 상태 보존. Canvas 시험 결과는 원본으로 복원.
- 별도 프로세스 재시작 후 0.1.12, 깊이·펼침·선택 파일·라벨·폴더 유지 및 내보낼 관계 재확인.
- 관련 런타임 예외 없음.

## 환경과 증거

Obsidian 1.13.7, MDPalette-Link-Sandbox-20260924, 전용 프로필 MDPalette-Link-Profile-20260924, CDP 19361. 실제 사용자 Vault는 변경하지 않았습니다.

스크립트: scripts/outgoing-export-validation.mjs, scripts/outgoing-export-restart.mjs. 초기 실행 도중 시험 코드의 메서드 호출 및 Canvas 열 위치를 바로잡은 후 전체 검증을 다시 실행하여 통과했습니다.

[검증 자료](docs/handoff/evidence/0.1.12). 백업은 .artifacts/outgoing-export/before에 유지합니다.

[공개 Release 0.1.12](https://github.com/tlatndms2-droid/md-palette/releases/tag/0.1.12)의 세 자산을 다시 다운로드해 SHA-256 일치를 확인했습니다. Sandbox BRAT 2.2.0의 공개 다운로드로 0.1.11→0.1.12 업데이트·활성화·기존 설정 보존을 확인했습니다. 최초 시도에서는 0.1.11이 내려왔고 재시도 후 0.1.12가 정상 설치됐습니다. BRAT의 manifest는 JSON 서식만 달라 내용 비교로 확인했습니다. 사용자 본인의 BRAT 확인은 대기.
