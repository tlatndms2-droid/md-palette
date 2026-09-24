# 기획에서 달라진 결정과 근거

원본 기획은 그대로 보관한다. 아래는 이전 HANDOFF·IMPLEMENTATION_PLAN·검증 보고서·현재 코드에서 확인한 결정이다. 대화 전체를 재검토한 전사본은 아니다. 이유가 명시되지 않은 항목은 사용자 변경 요청으로만 기록하고 심리나 의도를 추측하지 않는다.

이전 문서 원문: [HANDOFF 보관본](history/HANDOFF-before-2026-09-21.md), [계획 보관본](history/IMPLEMENTATION_PLAN-before-2026-09-21.md). 보관본의 “현재”, “다음 단계”는 당시 표현이다.

| 시점 | 이전 방식 → 최종 결정 | 기록된 맥락·이유 | 근거 |
|---|---|---|---|
| 0.1.11 | 양방향 하위 링크·부모별 반복 표시·단계 조절·Metadata 파일 선택 | 실제 플러그인 구조 HTML 시안 승인, 동일 파일은 각 부모 아래 표시하는 추천 방식 승인 | LINK_EXPLORER_VALIDATION.md |
| 0.1.10 | Canvas 안내/취소/되돌리기를 상단 왼쪽으로 이동 | 사용자 이미지의 하단 도구막대 가림 개선 승인 | CANVAS_TOOLBAR_VALIDATION.md |
| 0.1.9 | 직접 드롭 즉시 배치, 메뉴 미리보기 이동·클릭 확정, 입력 방식별 겹침 기준 | 사용자 승인 비교 HTML의 Canvas 동작만 반영. Sub·Card 제외 | CANVAS_PLACEMENT_VALIDATION.md |
| 0.1.8 | 기존 Sub의 미연결 파일 열기 차단, Card 목록 고정·복수 유형, 기존 Canvas 파일/폴더 삽입 | 사용자 HTML 정정 및 열기 차단 선택. 원본 구조·파일 보존, 미리보기 후 확정 | CANVAS_REVISION_VALIDATION.md |
| 0.1.7 | 여러 Sub·전체 높이 강제 → Sub 하나·지정/해제·자유 분할 | 사용자 명시 승인. Ctrl+Shift는 새 일반 그룹. 미연결 파일은 연결하고 지정 또는 취소 | SUB_RULES_VALIDATION.md |
| 0.1.6 | 새 링크 파일은 MD만 → Markdown/Canvas 선택 | 사용자 Canvas 추가 요청 및 생성·연결만 하고 자동으로 열지 않는 방식 승인 | NEW_CANVAS_VALIDATION.md |
| 0.1.5 | 각주 텍스트·실제 각주 → 각주만·본문만·각주와 본문 | 사용자 이미지의 위쪽=본문, 아래쪽=각주. 함께 삽입은 본문에 번호를 붙이고 설명을 문서 아래 연결하도록 명시 승인 | FOOTNOTE_CHOICE_VALIDATION.md |
| 0.1.4 | 고정 글자 크기 → Ctrl+휠 조절·저장; Sub 드래그 첫 진입 수용·위치 표시 재사용 | 사용자 글자 크기 요청 및 “sub 본문이 안되고 그리고 동작에 버벅임이 생김” | METADATA_FONT_DRAG_VALIDATION.md |
| 0.1.3 | 메타데이터 일반 텍스트 → Markdown 서식 표시 | 사용자 이미지의 각주·문맥 가독성 지적 후 “수정해줘” | METADATA_MARKDOWN_VALIDATION.md, src/metadata-view.ts |
| 0.0.3 | 연결 저장 위치 선택 → Main `link note` 속성 | 사용자 “문서방식으로 진행” | 계획 보관본 진행 원칙, STAGE2_VALIDATION.md |
| 0.0.4 | 카드 이동 반응 개선 → 안내선·DOM 재사용·안정된 카드 이동 | Canvas Palette 방식의 드래그 개선 요청 | STAGE2_DRAG_VALIDATION.md |
| 0.0.5 | Connections 검색·필터 추가 가능성 → 제외 | 사용자 “문서대로 진행해” | 계획 보관본, STAGE3_VALIDATION.md |
| 0.0.6 | 제한된 속성 연결·그래프 → 모든 속성 Markdown 연결·Obsidian 기본 그래프 | 속성 연결 누락 및 기본 그래프 사용 요청 | STAGE3_FIX_VALIDATION.md |
| 0.0.7 | 참조에 보이는 일부 정렬 → 문서의 전체 정렬 옵션 | 옵션은 전체, 배치는 참조와 일치하도록 확정 | STAGE4_VALIDATION.md, 이전 HANDOFF |
| 0.0.8 | Main/Sub/Reference·교환 → Main/Sub만, 교환 제거 | 승인한 수정 요청. 더 구체적인 변경 이유는 저장 문서에 없음 | REVISION_VALIDATION.md, 이전 HANDOFF “이번 수정의 확정 동작” |
| 0.0.8 | Main 변경 때 관리 탭 닫기 → 모든 탭 보존·역할만 해제 | 같은 승인 수정의 탭 보존 결정 | REVISION_VALIDATION.md |
| 0.0.8 | 전역 가상 폴더 → Main 문서별 폴더 | 같은 자료를 각 Main에서 다르게 정리 | REVISION_VALIDATION.md, 계획 보관본 2026-09-20 확정 변경 |
| 0.0.8 | 기존 전역 데이터 이전 → 테스트용 폴더·배치만 비움 | 사용자 “그냥 지워줘 어차피 테스트 중이여서 지워도 상관없어”. 실제 파일·라벨 등은 보존 | 이전 HANDOFF 0.0.8 기록 |
| 0.0.8 | 카드 제목·원문 미리보기 → 위쪽 큰 제목·렌더링된 Markdown | 사용자 승인 화면 수정 | REVISION_VALIDATION.md |
| 0.0.9 이후 | 자동 BRAT 확인 → 사용자가 BRAT 확인 | Codex는 검증·Release·자산 확인까지로 최신 역할 분담 | 이전 HANDOFF 0.0.9 및 이후 기록 |
| 0.0.9~10 | Metadata 네 구역 기준 → URL Links를 포함한 다섯 구역 | 0.0.10에서 URL만, 라벨 전체 사용처, Main 링크 Sub 열기, Ctrl 미리보기 확정 | STAGE5_VALIDATION.md, REVISION2_VALIDATION.md |
| 0.0.9~10 | Main 활성 문서 추종 → 지정 Main 탭·문서 고정 | 기록된 Main 고정 및 링크 열기 개선 | STAGE5_VALIDATION.md, README.md |
| 0.0.11 | Folder 기존 보기만 → 제목 카드 기본값 추가 | 승인 HTML의 아이콘·두 줄 제목 형태. 기존 보기 선택 보존 | REVISION3_VALIDATION.md |
| 0.0.11 | Main 지정/해제 별도 명령 → 기존 지정 명령을 토글로 통합 | 승인된 사용 흐름·기존 단축키 보존 | REVISION3_VALIDATION.md |
| 0.0.12 | Reference 포함 드래그 대상 → Card는 Main, 강조·블록은 Main/Sub 및 Sub Canvas | HTML 1번 선택·6단계 승인 | STAGE6_VALIDATION.md, 계획 보관본 |
| 0.0.13 | 다른 파일 새 탭 기본 → 마지막 Sub 탭 교체 / Ctrl 새 탭 / Ctrl+Shift 새 그룹 | 사용자 승인 열기 조합·여러 Sub 저장 | REVISION4_VALIDATION.md |
| 0.0.13 | Card는 Main만, 각주·URL 제외 → Card는 Sub Markdown도, 각주·URL 재사용 추가 | 후속 사용자 요청. Card→Sub Canvas는 계속 제외 | REVISION4_VALIDATION.md |
| 0.0.14 | 기존 파일 연결만 → 빈 Markdown 생성·연결 | 사용자 새 링크 파일 요청, 저장 위치 선택 1번: Obsidian 새 노트 설정 | NEW_NOTE_VALIDATION.md, 계획 보관본 |
| 0.0.15 | Main 옆 아래 절반 Sub → 왼쪽 영상/Main·오른쪽 전체 높이 Sub | 기존 500px Sub 문제를 1000px 작업 영역에서 재현. 사용자 이미지 2·승인 HTML에 맞춤 | SUB_HEIGHT_VALIDATION.md, references/sub-full-height-comparison.html |

위 근거 파일은 경로가 생략된 경우 저장소 루트에 있다. 사용자 정상 작동 확인은 이전 HANDOFF에 0.0.14까지 명시되어 있다. 0.0.12·0.0.13 각각의 독립적인 확인 문장은 확인되지 않아 임의로 추가하지 않는다.

## 오래된 지침·이미지와 충돌하는 지점

현재 `AGENTS.md`는 최신 사용자 결정을 우선한다고 명시하지만, 구현 불변조건에는 여전히 Reference·교환·전역 폴더가 남아 있다. 이들은 위에 기록된 사용자 확정으로 대체된 기능 사양이다. 이번 인계는 AGENTS나 개인 스킬을 수정하지 않았다. 새 PC에서 그 문장만 보고 기능을 되돌리지 않는다.

원본의 Main/Sub 교환 이미지, Reference 열기 메뉴, 전역 폴더 설명은 역사 자료다. Main 링크 선택 팝업 이미지는 보류 기능이다. 이미지가 있다는 이유만으로 구현하지 않는다. 나머지 배치·밀도는 유지하되 최신 승인된 변경 영역에서는 현재 사양을 사용한다.

## 원본 완료 기준 대응표

7단계에서는 [원본 기준](../../MD_Palette_Planning_Pack_Final/14_Acceptance_Criteria.md)을 지우지 말고 아래 변경을 적용해 검증표를 만든다. 이 표는 7단계 통과 보고가 아니다.

| 원본 ID | 현재 해석 |
|---|---|
| AC-SPACE-001 | 지정 가능한 Markdown에 Main 지정. Sub에서 지정 거부, 명령 토글 추가 |
| AC-SPACE-002 | 활성 탭 추종 대신 지정 Main 고정. 지정 탭 닫기·교체 시 해제 |
| AC-SPACE-003 | 모든 지원 파일·여러 Sub·세 가지 열기 조합·오른쪽 전체 높이 |
| AC-SPACE-004, 005 | Reference·교환은 제거됨. 다시 구현하지 않음 |
| AC-SPACE-006 | 새 Main 지정 시 모든 기존 탭 보존·역할 해제 |
| AC-SPACE-007 | Markdown에만 한정하지 않고 Sub의 유효 파일·웹뷰어와 그룹 종료를 확인 |
| AC-SPACE-008, 009 | Main 및 여러 Sub 배치·일반 그룹 보존. 대상 Sub 그룹 내 재사용, 새 그룹의 동일 파일 허용 |
| AC-CARD-004, 006 | 클릭 선택과 세 가지 더블클릭 조합. Card→Main/Sub Markdown, Canvas 제외 |
| AC-CONN-002, 004 | 본문·모든 속성의 Markdown 링크, 기본 Local Graph와 기본 설정 |
| AC-FOLDER-001~006 | 실제 파일 불변 유지. 모든 가상 상태는 Main별. 제목 카드 기본값·기존 보기 보존 추가 |
| AC-META-001, 003 | URL Links 포함 다섯 구역 검색·접힘 |
| AC-META-008~010 | Sub Canvas 및 Main/Sub Markdown. 각주·URL 확장. Reference 대상 제거 |
| AC-PERSIST-001, 002 | Main·여러 Sub·마지막 사용 그룹·문서별 폴더 복원. Main 없는 Sub 단독 복원 금지 |
| AC-LINK-004, 005 / AC-DATA | 기존 연결 추가 기준 유지. 새 링크 파일 생성의 저장 위치·중복·실패 복구 추가 |
| AC-UI / AC-PERF | 폐기 기능을 뺀 참조 비교. 실제 대량 자료·타이핑 영향은 새 측정 조건을 함께 기록 |

별도 변경이 없는 원본 항목은 유지한다. 기록과 코드에서 새 불일치가 발견되면 확인 대상으로 남기고, 현재 코드라는 이유만으로 사용자 승인 사양이라고 단정하지 않는다.

## 2026-09-22 후속 확정 — 0.1.1~0.1.2

- 사용자가 문서에 드롭할 줄과 정확한 글자 위치를 보이게 해 달라고 요청했다. 0.1.1에 세로 커서를 추가했다.
- 사용자가 세로 커서만으로 대상 줄이 잘 보이지 않는다고 피드백하고 줄 전체 옅은 배경 추가를 승인했다. 0.1.2에 줄 강조와 세로 커서를 함께 표시했다.
- 메뉴 선택 중 두 표시 유지, 실제 표시 위치에 삽입, 취소 시 제거. 문서 아래 빈 공간에 빈 줄을 자동 추가하는 방식은 채택하지 않았다.
- 0.1.2 공개·검증 뒤 사용자가 “구현됬어”라고 확인했다. 다음 기능은 지정되지 않았다.
- 장시간 사용·개인 Vault·플러그인 충돌·모바일·별도 창은 사용자가 문제 발생 시 알려주기로 했다. 이번 확인을 해당 환경 전부의 검증 완료로 해석하지 않는다.
