# MD Palette — Data, Persistence & Restart

## Markdown Source of Truth
- `link note`
- footnote
- task checkbox
- highlight syntax
- Block ID

## Plugin Data
- Labels
- File↔Label
- Card order
- Card text size
- filters
- Virtual Folder structure/positions/manual order
- Tree collapse
- current virtual folder
- Folder view mode/display/split/sort
- Connections layout
- Metadata collapse
- Space restore metadata

## Restart Restore
Obsidian이 먼저 자체 Workspace를 복원한다.

MD Palette는:
- 이미 존재하는 Tab Group/파일에 역할만 다시 연결
- 없는 Sub/Reference 자동 생성 안 함
- 이전 파일 강제 재오픈 안 함

Main이 유효하게 복원되지 않으면:
- Space 역할 복원 전체 중단
- Main 없음 상태
- Sub/Reference 단독 복원 안 함

복원 실패로 Vault 파일이나 Markdown을 수정하지 않음.

## Persist
- Card ordering
- Labels
- Virtual Folder
- filters
- view modes
- section collapse/height
- Space restore metadata

## Do Not Persist
- Metadata search query
- Folder search query

## 작업 데이터 초기화
1차 버전에서 별도 전체 작업 데이터 초기화 기능을 제공하지 않음.
