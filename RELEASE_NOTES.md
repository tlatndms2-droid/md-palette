# 0.0.6 — 속성 연결 누락 수정·Obsidian 기본 로컬 그래프

`child note` 등에 연결된 Markdown이 Card에는 보이지만 Connections에는 빠지던 문제를 수정했습니다. Outgoing Links에 본문뿐 아니라 child note·parent note·link note 등 모든 속성의 Markdown 링크를 표시합니다. 새 연결은 기존처럼 link note에 저장합니다.

별도로 그리던 그래프를 제거하고 Obsidian 기본 Local Graph 화면과 설정을 재사용합니다. 기본 노드 배치·휠 확대·드래그 이동·필터·그룹·표시·장력 설정을 사용할 수 있습니다. Sub/Reference를 열어도 Main을 중심으로 유지하며 일반 Obsidian 그래프의 파일과 설정을 바꾸지 않습니다.

- 목록: 더블클릭 → Sub, 우클릭 → Sub/Reference.
- 그래프: 노드 클릭 → Markdown은 Sub, 다른 파일은 Reference. 우클릭 → 열 위치 선택.
- Connections 목록은 Markdown-only이며 그래프 표시 대상은 Obsidian 기본 동작과 그래프 설정을 따릅니다.
- 영역 높이·접힘·기본 그래프 설정과 기존 Card 정리 상태를 보존합니다.

Obsidian 1.13.7 Sandbox 실제 마우스 입력, 기본 그래프와 동일 구현 확인, 다른 그래프 독립성, 2,011개 파일/401개 그래프 노드/600개 목록 행, 프로세스 재시작, 원문 불변 검증을 통과했습니다. 코어 그래프가 꺼져 있으면 켜는 위치를 안내합니다.

사용자 확인:

- [ ] BRAT 0.0.6 업데이트 → child note의 Markdown이 Outgoing Links에 표시됩니다.
- [ ] Local Graph 설정 버튼 → Obsidian 기본 필터·그룹·표시·장력 메뉴가 열립니다.
- [ ] 노드 클릭·우클릭 → Sub/Reference에서 열리고 Main 기준은 유지됩니다.
- [ ] 그래프 설정·영역 높이 변경 → 재시작 후 유지됩니다.

3단계 수정 버전이며 4단계는 사용자 확인 뒤 진행합니다.
