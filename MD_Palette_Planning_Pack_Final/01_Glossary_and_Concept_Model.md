# MD Palette — Glossary & Concept Model

## Tab Group
Obsidian Workspace에서 여러 Tab을 담는 분할 작업 영역.

## Tab
Tab Group 안의 개별 탭.

## WorkspaceLeaf
Obsidian API에서 개별 View/Tab 문맥을 다루는 객체. 구현 세부는 Codex 영역이다.

## Space
Space는 별도 Editor가 아니라 **특정 Obsidian Tab Group에 부여되는 MD Palette의 논리적 역할**이다.
- Main Space
- Sub Space
- Reference Space

기본 관리 순서: `Main → Sub → Reference`

## Main Space
현재 MD Palette의 기준이 되는 Tab Group.
- Main은 Markdown-only
- 현재 Main Tab Group의 유효한 활성 Markdown이 Link View / Metadata View 기준
- 역할 아이콘: 펼쳐진 책

## Sub Space
Main과 연결된 Markdown Note 작업용 Tab Group.
- Markdown-only
- 기본 위치: Main 바로 오른쪽
- 역할 아이콘: Link / Chain

## Reference Space
참고 자료용 Tab Group.
- Markdown / Canvas / PDF / 이미지 / 영상 / 기타 Obsidian 지원 파일
- 기본 위치: Sub가 있으면 Sub 오른쪽, 없으면 Main 오른쪽
- 여러 Tab을 쌓아둘 수 있음
- 역할 아이콘: 돋보기 + 문서

## MD Palette Sidebar
Obsidian Sidebar 안의 Plugin UI.
- Link View
  - Card View
  - Connections View
  - Folder View
- Metadata View

## `link note`
Main에서 연결 파일을 저장하는 Markdown Property.
Hierarchy나 parent/child 의미가 아니라 관련 파일 링크 저장용이다.

## Label
MD Palette Plugin Data.
- Markdown Property 아님
- Obsidian Tag 아님
- 파일 하나당 하나
