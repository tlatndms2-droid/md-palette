# 7단계 통합 검증 — 0.1.0 로컬 후보

검증일: 2026-09-22 KST. 사용자에게 0.0.15 정상 작동 확인과 7단계 진행 승인을 받은 뒤 실행했다.

**현재 상태: 아래 로컬 검증 통과. GitHub push·Release·공개 자산 확인은 미수행이므로 7단계 전체 완료 또는 배포 완료가 아니다.**

## 변경 범위

- 플러그인 기능 소스 `src/`와 `styles.css`는 변경하지 않았다. 기존 기능에서 수정이 필요한 결함을 이번 시험에서 발견하지 않았다.
- 최종 통합 후보의 package/manifest/versions를 0.1.0으로 맞췄다.
- 새 PC의 Sandbox를 지정할 수 있도록 CDP 도구에 포트·창 제목 환경 변수를 추가했다. stage7 시험 스크립트는 이번 전용 Sandbox용이며 일반 Vault에서 실행하지 않는다.
- 기존 0.0.15 사용자 확인은 완료. 0.1.0 사용자 BRAT 확인은 배포 후 별도로 필요하다.

## 실행 환경과 증거

- Windows, Node 24.14.0, pnpm 11.19.0, Obsidian 1.13.7.
- Vault: `C:\Users\User\AppData\Local\Temp\MDPalette-Stage7-Sandbox-20260922`
- 전용 프로필: `C:\Users\User\AppData\Local\Temp\MDPalette-Stage7-Profile-20260922`, CDP 19327.
- 새 프로필이 처음 불러온 1.12.7 대신 이 PC에 이미 설치된 1.13.7 앱 아카이브만 전용 프로필에 복사했다. 개인 Vault·설정·인증은 복사하지 않았다.
- `ProcessStartInfo`로 열었으며, 종료·재시작마다 새 CDP 대상을 조회했다. 최종 PID 33488은 당시 기록일 뿐 다음 실행에 재사용하지 않는다.
- 의존성 파일 설치 후 esbuild의 설치 스크립트 승인 제한을 확인했다. 승인 정책을 변경하지 않고 설치된 tsc·esbuild·Node 테스트 실행기로 검증했다.
- 최종 TypeScript 검사·빌드·41개 테스트 통과. 원시 결과·설정 백업·스크린샷은 `.artifacts/stage7/`에 남겼다. 선별 결과는 `docs/handoff/evidence/stage7/`, 검증한 배포 파일 세 개는 `.artifacts/stage7/release-0.1.0/`에 보관한다.

## 이번에 실제로 확인한 통합 흐름

| 영역 | 확인한 동작 | 증거 파일 (`.artifacts/stage7/`) |
|---|---|---|
| Main/Sub | 우클릭 Main 지정·아이콘, 클릭/Ctrl 선택, 기본 더블클릭 교체·Ctrl 새 탭 및 같은 파일 재사용·Ctrl+Shift 여러 그룹, 왼쪽 위아래 묶음과 오른쪽 전체 높이 | spaces-result.json, spaces-card.png |
| 연결/Card | 본문·속성·역링크 파일 중복 제거, Main 제외, 라벨 만들기, 기존 파일을 link note에 추가 | spaces-result.json |
| Connections | 모든 속성의 Markdown 연결, 기본 Local Graph 표시, 목록 더블클릭, 영역 접기·키보드 높이 조절 | connections-result.json, advanced-result.json |
| Folder | 실제 드래그로 파일 배치, 폴더 이동·하위 순환 금지, 부모 삭제 시 내용 승격, 실제 파일 보존, 3가지 보기·2가지 분할, 정렬 메뉴, 좁은 패널 | folder-result.json, final-checks-result.json |
| Main별 정리 | 다른 Main에 이전 폴더가 나타나지 않음, 원래 Main으로 돌아오면 복원, 기존 탭·파일 보존 | advanced-result.json |
| 새 링크 파일 | 기본·현재 Main 폴더·지정 폴더 위치, Folder 내 생성·연결, 중복 이름·취소, 폴더 저장/연결 실패 시 복구 | folder-result.json, advanced-result.json |
| Metadata | 다섯 구역, Task 원문 반영·저장 실패 복구, 여러 줄 각주 편집, 오래된 각주 편집의 덮어쓰기 방지, 검색과 접힘, 웹뷰어 Sub 열기 | metadata-result.json, advanced-result.json |
| 드래그 재사용 | Card 링크·임베드·본문→Sub 및 링크→Main, 강조·블록·각주·URL의 문서/Canvas 메뉴, 문서 삽입 위치, 한 번 Undo로 각주 참조/정의 제거 | reuse-result.json |
| 드래그 보호 | 취소·저장 실패·대상 편집 충돌, Card→Canvas 거부, 재사용 원본 보존 | reuse-result.json |
| 미디어 | Markdown·이미지·Canvas·PDF·영상 미리보기와 실제 Sub 열기 | final-checks-result.json |
| 손상·복원 실패 | 읽을 수 없는 저장 데이터 덮어쓰기 금지, Main이 없으면 Sub 단독 복원 금지, 시험 후 정상 데이터 복구 | state-guards-result.json |
| 업데이트 | 0.0.15 저장 상태 대비 라벨·폴더·Connections·역할·탭 보존, 파일 2,017개 SHA-256 일치 | upgrade-result.json, pre-upgrade-backup/ |
| 세부 UI | 여러 카드 라벨 적용·삭제, 공유 필터, 묶음 순서 이동 안내선·Esc 취소, Card/Tree/Connections Ctrl 미리보기, Metadata 빈 상태·Main 해제·탭 보존 | details-result.json |
| Canvas 보호 | 확대·이동 두 상태의 놓기 위치 오차 2 화면 픽셀 이내, Esc 취소·저장 실패 시 새 노드만 복구, 이미지/PDF/영상 Drop 거부 | canvas-guards-result.json |
| 프로세스 재시작 | 0.1.0 로드, 20개 leaf의 ID/파일/유형·편집 상태, 역할·마지막 Sub·라벨·폴더 복원, 재시작 후 실제 더블클릭 교체 | restart-result.json, restart.png |

Canvas 내용은 파일 해시로 보존을 확인했다. 화면 크기를 시험용 크기로 바꾸면서 생기는 기본 Canvas 카메라 중심 변화는 탭 복원 동등성 비교에서 제외했다. Canvas 카메라 좌표의 완전 동일 복원을 이번 통과 항목으로 주장하지 않는다.

## 원본 완료 기준 대응

원본 기준과 사양 변경의 상세 대응은 `docs/handoff/DECISIONS.md`를 유지한다. 아래에서 자동 테스트는 실제 UI 조작과 구분한다. 모든 과거 세부 시험을 새 PC에서 전부 반복했다는 의미는 아니다.

| 원본 기준 | 현재 적용과 확인 방법 |
|---|---|
| AC-SPACE-001~003, 006~009 | 고정 Main·여러 Sub·탭 보존 사양 적용. 이번 실제 UI/업데이트/재시작 및 workspace/state 자동 테스트 |
| AC-SPACE-004~005 | Reference·Main/Sub 교환은 사용자 결정으로 제외 |
| AC-LINK-001~005 | Main별 연결, 중복, link note, Folder 실패 복구, 공유 필터 실제 UI·실패 주입·connections 자동 테스트 |
| AC-CARD-001~006 | 미디어·라벨 일괄 적용/관리/삭제·선택·재사용, 묶음 정렬 안내선/취소·Ctrl hover 실제 UI 및 cards/card-reorder 자동 테스트 |
| AC-CONN-001~004 | 모든 속성·기본 그래프로 대체. 이번 목록/그래프 표시/열기/접기·높이 조절 |
| AC-FOLDER-001~006 | Main별 저장 적용. 이번 실제 이동·삭제·보기·정렬 메뉴·검색 성능, folders 자동 테스트 |
| AC-META-001~007 | URL Links를 포함한 5구역. 이번 편집·검색·충돌·실패 복구 및 metadata 자동 테스트 |
| AC-META-008~011 | Main/Sub Markdown과 Sub Canvas 적용. 이번 드래그 메뉴·삽입/취소/실패·확대/이동된 Canvas 좌표·미지원 대상 보호, reuse 자동 테스트 |
| AC-META-012 | Main 지정 중 내용이 없는 상태와 Main 미지정 상태를 실제 UI에서 구분 확인 |
| AC-PERSIST-001~002 | 이번 실제 프로세스 재시작, Main 누락 상태 재로드 |
| AC-DATA-001~002 | 원본 해시, 가상 폴더 삭제/이동, 저장 실패·동시 편집·손상 데이터 보호 |
| AC-UI-001~002 | 원본 Folder/Metadata/Connections 참조와 최신 Sub 배치 증거를 화면과 대조. 폐기 기능은 적용 제외, 테마 색상과 제목 카드·URL 구역은 현재 사양 적용 |
| AC-PERF-001 | 아래의 새 PC 측정. 범용 성능 보장 또는 장시간 시험으로 일반화하지 않음 |

## 성능 측정

연결 파일 2,000개, 강조·Task·블록 각각 500개를 가진 시험 Main을 사용했다.

- Folder 동기 화면 생성 7.5ms, 처음 표시된 Tree 80행·파일 80개.
- Card 동기 화면 생성 51.4ms, 카드 요소 2,000개.
- Folder의 마지막 파일 이름 검색 왕복 약 260ms. 시험 도구의 250ms 대기를 포함한다.
- 10회 입력 확인 왕복: Card 평균 12.1ms/최대 18.0ms, Metadata 평균 9.7ms/최대 11.5ms.
- 입력은 매번 다른 문자열을 보내고 편집기에 나타난 것을 확인했다. 수치는 CDP 통신·명령 처리 포함이며 순수 키 입력 지연이나 전체 렌더링 완료 시간이 아니다.
- CPU 점유율·장시간 메모리 추세·네트워크 사용량은 계측하지 않았다. 다른 PC/실제 Vault에 같은 수치를 보장하지 않는다.

## 남은 항목

1. 이 PC GitHub 인증 후 커밋/push, 새 0.1.0 Release와 세 자산의 공개 다운로드 해시 확인.
2. Release 후 사용자 BRAT 업데이트·확인. 사용자 담당이며 이번에 대신 수행하지 않았다.

Sandbox와 시험 자료·설정·백업은 사용자 확인용으로 남겨 두었다. 개인 Vault, Mobile, 별도 팝아웃 창은 검증하지 않았다.
