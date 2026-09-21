# MD Palette — Space System

## Main 지정
- 활성 Markdown Tab 제목 Context Menu → `메인 스페이스로 지정`
- 사용자 Hotkey
- 해당 활성 Tab이 속한 Tab Group이 Main 역할
- 비-Markdown은 Main 지정 불가
- 현재 Main을 다시 지정해도 해제되지 않음
- Sub에서 Main 지정 불가

## Main Space에서 비-Markdown 활성
- Main 역할 자체는 Tab Group에 유지
- 유효한 Main Context는 없음
- Link View / Metadata View의 Main 기반 동작 비활성
- Notice: `메인 스페이스에서는 Markdown 파일을 활성화해주세요.`
- 같은 상황이 발생할 때마다 Notice 표시
- 다시 Markdown 활성 시 Main Context 자동 복구
- 파일 강제 닫기/이동 없음

## Sub
- Markdown-only
- Main 오른쪽
- Link View Markdown 기본 열기 대상
- 새 연결 Note 기본 열기 대상
- 새 Markdown을 Sub로 열면 기존 managed Sub 재사용

## Reference
- Markdown + Canvas + PDF + 이미지 + 영상 + 기타 지원 파일
- 여러 참고 파일을 Tab으로 쌓아둘 수 있음
- 새 파일을 Reference로 열면 새 Tab 추가
- 같은 파일이 이미 같은 Reference Space에 열려 있으면 새 Tab을 만들지 않고 기존 Tab 활성화
- 다른 Space에 같은 파일이 열려 있어도 허용

## Main ↔ Sub Switch
- Main/Sub Tab Group의 물리적 위치와 역할 유지
- 현재 활성 파일만 서로 교환
- 비활성 Tab 유지
- 새 Main 활성 파일 기준으로 Link View / Metadata View 즉시 갱신
- Sub 없으면 Notice: `서브 스페이스가 없어 전환할 수 없습니다.`

## 새 Main 지정 시 기존 Space 처리
- 기존 Main Tab Group은 일반 Obsidian Tab Group으로 복귀
- 새 Main Tab Group이 Main 역할
- 기존 Sub Tab Group은 위치 자원으로 남김
- 기존 Sub Markdown은 닫고 Obsidian 기본 `새 탭` 화면 상태
- 이 기본 `새 탭`에는 Sub 역할 아이콘 표시하지 않음
- MD Palette 전용 Empty View/안내문구 없음
- 기존 Reference Space는 닫음
- 새 Main 기준 Markdown을 Sub로 열면 기존 빈 Sub 위치 재사용
- 새 Main 기준 Reference 파일을 열면 Reference Space 재생성
- Space 배치는 `Main → Sub → Reference` 규칙에 맞춰 재정렬

## Space 종료
### Main
- Main 종료/삭제 시 자동 successor 없음
- Sub/Reference 역할도 해제
- Sidebar는 Main 없음 상태

### Sub
- 일반 사용 중 Sub의 마지막 Markdown Tab을 직접 닫으면 Sub 역할 종료
- 빈 Sub 역할 유지 안 함
- 단, 새 Main 지정 직후 남겨둔 기본 새 탭은 전환 과정 특수 상태

### Reference
- 일부 Tab 닫기 → 역할 유지
- 마지막 Reference Tab 닫기 → Reference 역할 종료
- 빈 Reference Tab Group 남기지 않음

## 같은 파일 중복
- 같은 파일을 Sub와 Reference에 동시에 열 수 있음
- 같은 Reference Space 내부에서는 동일 파일 중복 Tab 생성 금지

## Space 순서 보호
- 관리 순서: `Main → Sub → Reference`
- 일반 Tab Group이 사이에 끼면 MD Palette Space만 다시 인접하게 재배치
- 일반 Tab Group은 닫거나 삭제하지 않음
- Notice: `스페이스 순서는 변경할 수 없습니다.`
