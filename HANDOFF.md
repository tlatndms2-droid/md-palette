# MD Palette 작업 인계 — 다른 PC 재개 시작점

갱신일: 2026-09-22. 저장소: https://github.com/tlatndms2-droid/md-palette
기본·작업 브랜치: `codex/planning`. 공개 버전: **0.1.0**.

## 현재 상태

**0.1.0 공개 Release와 공개 자산 세 개의 SHA-256 일치 확인까지 완료했다. 사용자 BRAT 업데이트·정상 작동 확인은 아직 남아 있으므로 7단계 전체 완료로 선언하지 않는다.**

- 최신 실행 결과는 [7단계 검증 보고서](STAGE7_VALIDATION.md)를 따른다. 기능 소스 변경 없이 최종 버전을 검증·공개했다.
- 다음 작업은 사용자의 0.1.0 BRAT 업데이트·정상 작동 확인이다. 통과한 검증 빌드가 바뀌면 관련 재검증이 필요하다.

- 구현 커밋: `9761cff`. 이전 배포 기록 커밋: `fbd11ad`.
- [0.1.0 Release](https://github.com/tlatndms2-droid/md-palette/releases/tag/0.1.0). 공개 자산 `main.js`, `manifest.json`, `styles.css`의 SHA-256은 검증 빌드와 각각 일치한다.
- 최신 수정: 영상과 Main의 위아래 묶음을 왼쪽에 보존하고 Sub를 오른쪽 전체 높이에 배치. 여러 Sub와 기존 더블클릭 조합 유지.
- 당시 41개 테스트·빌드·Sandbox 실제 UI·재시작·기존 파일 2,065개 보존·공개 자산 3개 SHA-256 일치 통과 기록. [검증 보고서](SUB_HEIGHT_VALIDATION.md).
- 0.0.15 사용자 정상 작동 확인을 2026-09-22에 받았다.
- BRAT 설치·업데이트 확인은 사용자가 담당한다. Codex가 대신 수행하는 것으로 되돌리지 않는다.
- 2026-09-21 인계는 문서 전달만 수행했다. 2026-09-22에는 별도 승인에 따라 새 PC의 격리 Sandbox에서 최종 통합 검증을 수행했다.

## 읽는 순서와 문서 관계

1. 현재 사용자 요청과 [프로젝트 지침](AGENTS.md).
2. 이 HANDOFF 및 [현재 확정 사양](docs/handoff/CURRENT_SPEC.md).
3. [기획 변경 이력·원본 완료 기준 대응표](docs/handoff/DECISIONS.md).
4. [현재 진행 계획](IMPLEMENTATION_PLAN.md)과 [새 PC 준비·재개 방법](docs/handoff/NEW_PC.md).
5. 변경 대상의 코드·검증 보고서·원본 기획·해당 참조 이미지.

원본 기획과 AGENTS의 일부 기능 문구에는 Reference·Main/Sub 교환·전역 가상 폴더가 남아 있다. 이는 이후 명시적인 사용자 결정으로 대체되었다. 현재 사양과 변경 이력에 근거를 모았으며, 원본이나 지침 자체는 고치지 않았다. 새 충돌을 발견하면 코드만 보고 의도를 확정하지 말고 구체적인 불일치를 확인한다.

이전 HANDOFF·계획 전체는 [history](docs/handoff/history/HANDOFF-before-2026-09-21.md)에 보존했다. 그 안의 '다음 6단계', '6~7단계 미구현', 오래된 포트·버전·확인 대기는 당시 기록이며 현재 지시가 아니다.

## 기능을 되돌리지 않기 위한 핵심

- Main/Sub만 사용. Reference와 활성 파일 교환 없음. Main 변경·해제는 탭 보존·역할 해제.
- 지정 Main 문서 고정. 기본 더블클릭은 마지막 Sub 탭 교체, Ctrl은 새 탭, Ctrl+Shift는 새 그룹.
- Sub는 Main을 포함한 위아래 묶음의 오른쪽 전체 높이.
- 가상 폴더는 Main 문서별. 0.0.8의 테스트용 전역 데이터 초기화는 일회성 승인이다.
- Connections는 모든 속성의 Markdown 연결과 기본 Local Graph. 별도 검색·필터 제외.
- Metadata는 URL Links 포함 다섯 구역. Main 본문 별도 링크 선택 팝업은 보류.
- Folder 제목 카드 기본값·기존 보기 보존. 파일 카드와 Metadata의 드래그는 현재 사양의 대상표를 따른다.
- 새 링크 파일은 Obsidian 새 노트 저장 설정에 따라 생성·연결하고 자동으로 열지 않는다.

## 단계별 진행과 증거

| 단계·후속 변경 | 배포 | 상태·근거 |
|---|---|---|
| 0 실행 기반 | 0.0.1 | STAGE0_VALIDATION.md |
| 1 Space·사이드바 | 0.0.2 | 사용자 확인 기록, STAGE1_VALIDATION.md. 이후 Main/Sub 사양으로 변경 |
| 2 Card·라벨·드래그 정렬 | 0.0.3~4 | 사용자 확인 후 다음 단계 진행, STAGE2_VALIDATION.md / STAGE2_DRAG_VALIDATION.md |
| 3 Connections | 0.0.5~6 | 사용자 확인, STAGE3_VALIDATION.md / STAGE3_FIX_VALIDATION.md |
| 4 Folder 및 Main/Sub·문서별 정리 개편 | 0.0.7~8 | 사용자 확인, STAGE4_VALIDATION.md / REVISION_VALIDATION.md |
| 5 Metadata·URL·라벨 관리·미리보기 | 0.0.9~10 | 후속 사용자 확인, STAGE5_VALIDATION.md / REVISION2_VALIDATION.md |
| Folder 제목 카드·Main 토글 | 0.0.11 | 사용자 확인, REVISION3_VALIDATION.md |
| 6 드래그 재사용·여러 Sub·각주·URL 확장 | 0.0.12~13 | 구현·검증·배포 기록, STAGE6_VALIDATION.md / REVISION4_VALIDATION.md |
| 새 링크 파일 | 0.0.14 | 사용자 정상 작동 확인, NEW_NOTE_VALIDATION.md |
| Sub 전체 높이 | 0.0.15 | 검증·배포·사용자 정상 작동 확인, SUB_HEIGHT_VALIDATION.md |
| 7 최종 통합 | 0.1.0 | 공개 Release·자산 해시 확인 완료, 사용자 BRAT 확인 대기, STAGE7_VALIDATION.md |

각 버전의 자동·Sandbox 검증은 사용자 직접 확인과 별개다. 0.0.12/13의 개별 사용자 확인 문장을 추정해서 추가하지 않는다. 코드가 배포되어 있다는 사실만으로 최종 통합 완료를 선언하지 않는다.

## 다음 작업

1. 사용자의 0.1.0 BRAT 업데이트·정상 작동 확인을 기다린다.

별도 팝아웃 창 배치는 0.0.15 검증 범위에 포함되지 않았다. 지원 확대를 이번 인계로 승인받은 것으로 간주하지 않는다. 미검증·미수행은 통합 완료 보고에서 구분한다.

## 전달된 자료와 실행 환경

- 원본 Planning Pack·UI 이미지 46개를 폴더 그대로 Git 추적에 추가. 원본 ZIP은 중복이므로 로컬에 보존한다.
- 코드·tests·scripts·설정·lockfile·검증 보고서, 새 인계 자료를 포함한다.
- [최신 배치 시안](docs/handoff/references/sub-full-height-comparison.html), [수정 전](docs/handoff/evidence/before.png), [수정 후](docs/handoff/evidence/after.png), [재시작 후](docs/handoff/evidence/restart.png), [릴리즈 해시 확인 기록](docs/handoff/evidence/release-verification.json)을 선별 보관한다. 화면은 당시 증거이며 이번에 앱을 재검증한 결과가 아니다.
- [전달 파일 목록·SHA-256](docs/handoff/TRANSFER_MANIFEST.json)은 원본과 선별 자료의 목록이다.
- 새 PC의 실행 절차와 스크립트 이식 제한은 [NEW_PC.md](docs/handoff/NEW_PC.md)를 따른다. 기존 개인 스킬과 전역 설정은 자동으로 복제되지 않는다.

기존 PC의 Sandbox 위치는 `C:\Users\tlatn\AppData\Local\Temp\MDPalette-Stage0-Sandbox-20260918`, 별도 프로필은 `MDPalette-Stage0-Profile-20260918`, 당시 포트는 19273이다. 현재 실행 여부는 이번에 확인하지 않았다. 새 PC에서 이 경로·포트·PID를 그대로 사용하지 않는다. 기존 Sandbox는 사용자 확인용으로 유지하는 상태이며 이번 인계에서 종료·정리하지 않았다.

현재 대화 전체, 개인 Vault·플러그인 사용자 데이터, Sandbox 전체 백업, 원시 .artifacts 전체는 전달하지 않는다. 과거 승인 시안 전체가 확보된 것은 아니며, 필요한 경우 해당 자료를 별도로 확인한다. 기능별 결정의 확인 가능한 근거와 확인되지 않은 부분은 변경 이력에 명시했다.
