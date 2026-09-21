# MD Palette — Connections View

## 목적
현재 Main과 연결된 Markdown 관계를 방향별로 탐색.

## 대상
Markdown-only.

## 섹션
1. Backlinks
2. Outgoing Links
3. Local Graph

한 화면에 동시에 존재.

## Backlinks
Main을 참조하는 Markdown.

## Outgoing
Main 본문 Link + `link note` Link.

## Local Graph
Main 중심 관계를 그래프로 탐색하는 영역.
Obsidian Local Graph와 유사한 사용 경험이 목표.
구현 방식/공식 API 재사용 가능성 검증은 Codex 영역.

## 열기
Markdown 항목:
- 기본 열기 → Sub
- 우클릭 → Sub / Reference

## Section UI
- 각 Section 개별 collapse
- Divider drag
- 내부 scroll
- 높이 / collapse 상태 저장
- 권장 초기 비율 25 / 25 / 50
