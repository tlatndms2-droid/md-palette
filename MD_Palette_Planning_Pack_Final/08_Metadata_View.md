# MD Palette — Metadata View

## 대상
현재 Main Markdown.

## 섹션
1. 각주
2. Highlights
3. Tasks
4. Block Reference

Heading / Callout 제외.

## 공통
- Main body order
- Section count
- Section collapse
- collapse 상태 저장
- Main content 변경 자동 갱신
- cursor movement만으로 Metadata 자동 이동 없음

## Search
- 4개 Section 전체
- grouping 유지
- body order 유지
- 결과 있는 접힌 Section은 검색 중 자동 확장
- 검색 종료 시 기존 collapse 상태 복원
- 검색 중 수동 collapse/expand 가능
- Main 변경 시 query 유지, 결과만 갱신
- query 재시작 저장 안 함

## 각주
- 본문 문맥 + 각주 내용
- 클릭 → Main 위치
- 읽기 상태
- `편집` → 각주 내용만 inline edit
- 본문 문맥 read-only
- 저장/취소
- 저장 → 실제 footnote definition
- conflict 시 Main 최신 우선, 오래된 값 overwrite 금지

## Highlight
- 전체 텍스트
- 여러 줄
- 직접 편집/제거 X
- click → Main 위치
- Drag 가능
- 원본 유지

## Tasks
- 완료/미완료 모두
- completed muted
- All / Incomplete / Complete
- text click → Main line
- checkbox → Main markdown toggle
- 실패 시 rollback + Notice
- Drag X

## Block Reference
- Block ID + full block text
- 여러 줄
- click → Main block
- ID 직접 수정 X
- duplicate ID 각각 표시
- 자동 merge/fix X
- 중복 badge
- Drag 가능

## Empty State
### Main 없음
- search 숨김
- 4 section 숨김
- 안내 상태

### Main은 있지만 Metadata 0
- 정상 Metadata 구조 유지
- 각 section count 0
- `항목 없음`
