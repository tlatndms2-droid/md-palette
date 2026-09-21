# MD Palette — Acceptance Criteria

## SPACE
### AC-SPACE-001 Main 지정
- Markdown 활성 Tab에서 지정 가능
- 해당 Tab Group이 Main 역할
- Main 아이콘 표시
- Link/Metadata 기준 변경
- Markdown 내용 변경 없음

### AC-SPACE-002 Main 비-Markdown 활성
- Main 역할은 Tab Group에 유지
- 유효 Main Context 없음
- Link/Metadata Main 기능 비활성
- 매번 Notice 표시
- 다시 Markdown 활성 시 자동 복구

### AC-SPACE-003 Sub 열기
- Main 존재 시 Markdown을 Sub로 열 수 있음
- Main 오른쪽 managed Sub 사용
- Sub 아이콘 표시

### AC-SPACE-004 Reference 열기
- 여러 파일 유형 허용
- 새 파일은 새 Tab
- 동일 Reference 내부 동일 파일은 기존 Tab 활성화
- 마지막 Tab 닫으면 Reference 역할 종료

### AC-SPACE-005 Main/Sub Switch
- 그룹 역할/위치 유지
- 현재 활성 파일만 교환
- 비활성 Tab 유지
- Link/Metadata 기준 갱신
- Sub 없으면 Notice

### AC-SPACE-006 새 Main 지정
- 기존 Main은 일반 Tab Group
- 기존 Sub Markdown 닫음
- Sub 위치는 Obsidian 기본 새 탭 상태로 남김
- 새 탭에는 Sub 아이콘 없음
- Reference 닫음
- 새 Main 기준으로 Link/Metadata 갱신
- 실제 Vault 파일 삭제 없음

### AC-SPACE-007 Sub 마지막 Markdown 직접 닫기
- Sub 역할 종료
- 빈 Sub 역할 유지 안 함

### AC-SPACE-008 Space 순서 보호
- `Main → Sub → Reference` 유지
- 일반 Tab Group이 사이에 들어오면 Space만 재배치
- 일반 Tab Group 삭제/닫기 안 함
- Notice 표시

### AC-SPACE-009 Space 간 같은 파일 중복
- 같은 파일을 Sub와 Reference에 동시에 열 수 있음
- 같은 Reference 내부 동일 파일 중복 Tab은 금지

## LINK
### AC-LINK-001 Main 기준
Main 변경 시 Card/Connections/Folder 모두 새 Main 기준.

### AC-LINK-002 관계 중복
Backlink+Outgoing 동일 파일:
- Card/Folder 1개
- Connections는 방향별 표시 가능

### AC-LINK-003 파일 유형 Filter
Card/Folder 공유, 재시작 복원.

### AC-LINK-004 연결 파일 추가
- Main `link note`에 Outgoing
- View 즉시 갱신
- duplicate link 추가 금지
- Main 없으면 picker 열지 않고 Notice

### AC-LINK-005 Folder 연결 추가 원자성
- Outgoing 생성 + 현재 Virtual Folder 배치 둘 다 성공해야 완료
- 일부만 성공한 상태 최종적으로 남기지 않음
- 이미 다른 Virtual Folder 위치라면 전체 취소 + Notice

## CARD
### AC-CARD-001 표시/Thumbnail
지원 파일 표시, Main 자체 숨김, thumbnail fallback.

### AC-CARD-002 Label
파일당 하나, 교체 즉시, Markdown 불변.

### AC-CARD-003 Multi Label
- multi selection에 Label 일괄 적용/제거
- 서로 다른 기존 Label도 하나로 통일 가능
- 선택되지 않은 파일 영향 없음

### AC-CARD-004 Selection
Single/Ctrl/Shift/Double-click 동작.

### AC-CARD-005 Reorder
single/multi Drag, 상대 순서 유지, Vault 불변.

### AC-CARD-006 Main Drop
Markdown: Link/Embed/Body
비-MD: Link/Embed
취소 시 변경 없음
원본 유지.

## CONNECTIONS
### AC-CONN-001 Backlinks
Markdown-only, 기본 Sub.

### AC-CONN-002 Outgoing
본문 + `link note`.

### AC-CONN-003 세 Section
동시 표시, collapse, divider, persist.

### AC-CONN-004 Local Graph
Main 중심 관계 그래프 탐색 가능.
구현 방식은 Codex 기술 검증 대상.

## FOLDER
### AC-FOLDER-001 Virtual Folder
실제 Vault path와 독립.

### AC-FOLDER-002 삭제
실제 파일 삭제 없음, child 승격.

### AC-FOLDER-003 3 Mode
Composite/Tree/Folder 같은 데이터.

### AC-FOLDER-004 Search/Navigation
Back/Forward/Up/Breadcrumb, current+descendant search.

### AC-FOLDER-005 DnD
file/folder/multi/breadcrumb 허용, cycle 금지.

### AC-FOLDER-006 자동 정렬
- 같은 Folder 내부 manual reorder 표시 반영 X
- 다른 Folder 이동 O
- custom으로 돌아오면 manual order 복원

## METADATA
### AC-META-001 4 Section
각주/Highlight/Task/Block Reference만.

### AC-META-002 Main 갱신
Main 변경 시 즉시 새 Main 기준.

### AC-META-003 Search
4 section 전체, grouping/body order 유지, collapse 복원.

### AC-META-004 Footnote
내용만 edit, conflict 시 old overwrite 금지.

### AC-META-005 Highlight
전체 표시, edit/remove X, Drag 원본 유지.

### AC-META-006 Task
checkbox가 실제 Main과 동기, 실패 rollback.

### AC-META-007 Block Reference
ID+내용, duplicate 개별 표시, Drag 원본 유지.

### AC-META-008 Highlight → Canvas
텍스트 카드/출처 포함 카드, 실제 drop 위치 목표, 원본 유지.

### AC-META-009 Block Ref → Canvas
block content/block link card, 실제 drop 위치 목표, 원본 유지.

### AC-META-010 Metadata → Markdown
Main/Sub/Reference.md 대상으로 정확한 drop 위치 삽입.

### AC-META-011 Invalid Drop
PDF/이미지/영상에는 삽입 안 함, 원본/대상 변경 없음.

### AC-META-012 Empty State
Main 없음과 Metadata 0 상태를 구분.

## PERSISTENCE
### AC-PERSIST-001 정상 재시작
Obsidian이 복원한 Workspace에 역할 재연결.

### AC-PERSIST-002 Main 복원 실패
Sub/Reference 단독 복원 금지, Main 없음 상태.

## DATA SAFETY
### AC-DATA-001
- Virtual Folder → 실제 path 불변
- Label → Markdown 불변
- Card order → Link 관계 불변
- Metadata Drag → 원본 유지
- Plugin Data 손상 → Markdown source overwrite 금지

### AC-DATA-002 실패 상태
가능하면 부분 적용 상태를 남기지 않음.

## UI
### AC-UI-001 Reference 일치성
구현 화면은 제공 UI Reference의 구조/배치/밀도/시각 계층과 최대한 유사해야 함.

### AC-UI-002 문서/이미지 충돌
충돌 또는 새 기능처럼 보이는 이미지 요소는 사용자 확인 전 확정 구현 금지.

## PERFORMANCE
### AC-PERF-001
- 대형 Vault에서도 Obsidian 기본 사용감 심각하게 훼손 금지
- 대량 연결 파일에서 Sidebar가 장시간 멈추지 않음
- Metadata 갱신이 타이핑을 눈에 띄게 방해하지 않음
