# MD Palette — Card View

## 목적
현재 Main의 Backlink + Outgoing 연결 파일을 Thumbnail 중심으로 탐색/정리.

## 표시
- Markdown
- Canvas
- PDF
- 이미지
- 영상
- 기타
- 현재 Main 자체는 숨김
- 같은 파일이 Backlink + Outgoing 둘 다여도 카드 1개

## Thumbnail
- Markdown: YAML/Properties 제외 본문 Preview
- PDF: 첫 페이지
- Image: 자체 이미지
- Video: 대표 Frame
- Canvas: 축소 Preview
- 기타: 가능하면 Preview, 실패 시 fallback icon + filename

## Label
- Plugin Data
- 파일당 하나
- 이름/색 사용자 정의
- 다른 Label 선택 시 즉시 교체
- Multi-select 일괄 적용/제거
- 이름/색 변경 시 전체 반영
- 사용 파일 0개면 자동 소멸
- Markdown에는 기록하지 않음

## Filter
- Label Filter multi-select
- All 선택 시 specific label 해제
- specific label 선택 시 All 해제
- 접기/펼치기
- 접어도 Filter 상태 유지
- 재시작 후 복원

## 보기 형식
- 큰 아이콘
- 중간 아이콘
- 작은 아이콘
- 목록
- 자세히
- 타일
- Ctrl + mouse wheel 단계 전환 가능
- 텍스트 크기: 작게 / 보통 / 크게

## Selection
- Single
- Ctrl Multi
- Shift Range
- Active
- Double-click 시 기존 Multi 해제 후 단일 Active
- 다른 View와 selection 공유 안 함

## Ordering
- 사용자 지정 순서
- 새 카드는 끝
- Main이라 숨겨진 카드 위치 기억
- 다시 보이면 기존 위치 복원
- single/multi Drag reorder
- multi 상대 순서 유지
- 실제 Vault path / Link 관계 변경 없음

## Context Menu
Markdown:
- Sub Space에서 열기
- Reference Space에서 열기
- Label 지정/교체
- Label 제거
- 새 Label
- Label 관리

비-MD:
- Reference Space에서 열기
- Label 메뉴

Multi:
- Label 일괄 적용/제거
- 새 Label
- Label 관리

## Main으로 Drag
Markdown:
- Link
- Embed
- Body Markdown

비-MD:
- Link
- Embed

Body Markdown:
- YAML/Properties 제외
- Markdown 유지
- 인위적 filename heading 추가 없음

원본 파일 유지.
