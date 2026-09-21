# MD Palette — Folder View

## 목적
실제 Vault Folder와 독립적인 Virtual Folder 구조로 연결 파일 정리.

## 모드
1. Composite
2. Tree
3. Folder

같은 Virtual Data를 본다.

## Virtual Folder
- 파일 하나는 Virtual 위치 하나
- root 가능
- nested 가능
- create / rename / move / delete
- 실제 Vault path는 변경하지 않음

## Virtual Folder 삭제
- 실제 파일 삭제 없음
- 내부 file/child folder를 한 단계 위로 승격
- child 구조 유지

## Tree Section
- nested tree
- collapse/expand
- file/folder selection
- DnD
- 정렬: 사용자 지정 / 이름

## Folder Section
Navigation:
- Back
- Forward
- Up
- Breadcrumb

Search:
- 현재 Folder + descendants
- file/folder name
- 결과에 Virtual path
- query 재시작 저장 안 함

View:
- 큰 아이콘
- 중간
- 작은
- 목록
- 자세히
- 타일

Sort:
- 사용자 지정
- 이름
- 유형
- 수정 날짜
- 크기
- 오름/내림

## 자동 정렬 + Drag
- 자동 정렬 상태에서는 같은 Folder 내부 수동 재정렬이 표시 순서에 반영되지 않음
- 다른 Virtual Folder로 이동하는 Drag는 허용
- `사용자 지정`으로 돌아오면 저장된 manual order 사용
- 자동 정렬 전환만으로 manual order 삭제 안 함

## DnD
허용:
- file → folder
- folder → folder
- multi selection
- breadcrumb upper path
- empty-space current folder/root

금지:
- folder → self
- folder → descendant
- cycle

실제 Vault path / Link 관계 변경 없음.

## 파일 열기
Markdown → Sub
비-MD → Reference
