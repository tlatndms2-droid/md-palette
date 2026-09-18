# 0단계 검증 기록

검증일: 2026-09-18

대상: MD Palette 0.0.1 / Windows / 격리 Obsidian 1.13.7.
실제 작업 Vault는 설치·검증 대상에 포함하지 않았다.

## 검증 범위

- 기본 플러그인 TypeScript 검사·빌드 및 패키지 검사 2개 통과.
- Sandbox 설치 자산 세 파일의 SHA-256이 로컬 빌드와 일치.
- 실제 설정 창의 MD Palette 토글을 CDP 마우스 입력으로 끄기·켜기. 표시와 로드 상태 일치, 작업 공간 불변.
- Main / 일반 / Sub / Reference 시험 그룹을 Main / Sub / Reference / 일반 순서로 이동. 그룹과 탭 객체를 보존하고 일반 그룹의 두 탭 및 비활성 탭을 유지.
- 별도 시험용 drop 이벤트 처리기로 실제 Canvas에 CDP dragEnter/dragOver/drop 입력. 기본 배율·0.5배·약 1.41배 및 이동된 화면에서 카드 생성 지점 오차가 각 축 0.3px 이내.
- 시험 원본 Markdown 6개 내용 불변.
- 동일 Sandbox 프로세스를 종료하고 다시 실행한 후 0.0.1 활성 상태, 그룹 순서·탭 및 Canvas 카드 3개 복원 확인.
- 최종 성공 시험에서 런타임 예외 없음. 초기 시험의 위치 옵션 오류는 시험 스크립트에서 수정 후 재시험했다.

## 기술적 결론과 한계

- 공식 Workspace API는 그룹·탭 추적과 전체 레이아웃 입출력을 제공하지만, 그룹을 보존하며 직접 이동하는 `insertChild` / `removeChild`는 공개 타입에 없다. 이번 시험은 현재 런타임의 내부 메서드로 같은 부모 아래의 그룹 이동 가능성을 확인했다. 중첩 분할·창 간 이동·연속 사용자 드래그와 역할 관리 전체는 1단계 검증 대상이다.
- Canvas 좌표 변환 `posFromEvt` 및 카드 생성 `createTextNode` 역시 내부 메서드다. 향후 기능에서는 지원 여부를 확인하고 지원하지 않는 경우 변경 없이 취소해야 한다. 이번에 검증한 것은 드롭 좌표와 카드 생성 가능성이며, 제품의 Metadata 드래그·선택 팝업은 6단계 대상이다.
- 공식 Obsidian 타입에서 파일 rename/delete 이벤트 및 hover-link 등록을 확인했다. 런타임에서 Graph와 Page preview 코어 플러그인의 존재를 확인했다. 그래프 재사용·파일별 썸네일 구현의 기능 검증은 해당 단계에서 수행한다.
- 0단계에는 제품 전용 화면이 없으므로 참조 이미지의 Space 아이콘·사이드바 배치 구현은 다음 단계 대상이다. 원본 UI Reference를 보존했다.
- 초기 플러그인은 이벤트 감시·파일 스캔·타이머·네트워크 호출을 등록하지 않는다. 대형 Vault 성능 수치는 측정하지 않았으며 전체 제품의 성능을 보장하는 결과가 아니다.

## 재검증 도구

- `scripts/cdp.mjs`: 이름·URL로 격리 Sandbox를 확인하고 매 연결마다 현재 대상을 탐색.
- `scripts/stage0-probe.mjs`: 시험 자료 구성, 그룹 이동, Canvas 드롭 및 원본 내용 확인.
- `scripts/check-install-ui.mjs`: 실제 커뮤니티 플러그인 설정 창의 활성 토글 검사.
- `scripts/check-restart.mjs`: 프로세스 재시작 후 저장 상태 검사.

원시 측정 JSON·화면 캡처·설정 백업은 로컬 `.artifacts/`에 보관한다. 원본 기획 문서·이미지·ZIP과 시험 자료는 공개 커밋에 포함하지 않는다.

## 배포 및 사용자 확인

- [0.0.1 Release](https://github.com/tlatndms2-droid/md-palette/releases/tag/0.0.1)의 세 자산을 인증 없이 공개 URL에서 다시 내려받아 로컬 빌드와 SHA-256 일치를 확인했다.
- BRAT 2.2.0의 Add beta plugin 화면에 공개 저장소를 입력하고 Latest version을 선택해 실제 설치했다. 수동 설치본은 먼저 별도 보관하여 새 설치 경로를 확인했다.
- BRAT 설치 후 MD Palette 0.0.1 로드·활성 상태 및 BRAT 추적 목록을 확인했다. 설정 토글 및 프로세스 재시작 후 상태도 재확인했다.
- `main.js`: `dd3fc02d2667e31ae7327c9eeeed83c5cb72d1fb744f49ea18f76869f5e963d8`.
- `styles.css`: `050ad5d1504563b54225e50ebba9eb761e1eab5ae09922a8f536f791151eef02`.
- Release `manifest.json`: `f6de260369cb0bfb97d82c2eb057d2a3a04b1e5ffe34aa4b990997ef3a289901`.
- BRAT 설치 `manifest.json`: `ae89e14edca44f63deaf9ed05da26e489f89fd9661255f59712b6f0ffd2ce061`. BRAT의 JSON 재직렬화로 공백·줄바꿈만 다르며 파싱한 모든 값이 동일하다.
- 검증 후 Sandbox 프로세스를 중지했다. 시험용 설치 상태·자료는 `.artifacts/validated-obsidian`, `.artifacts/validated-fixtures`에 보관하고 원래 설정을 복원했다. `app.json`, `appearance.json`, `core-plugins.json`, `workspace.json` 모두 백업과 SHA-256 일치.
- 사용자 본인의 BRAT 확인은 아직 미수행이다. 현재는 **사용자 확인 대기**이며, 그 확인과 다음 단계 진행 의사 확인 전에는 1단계를 시작하지 않는다.
