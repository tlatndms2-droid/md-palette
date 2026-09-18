# Card 드래그 개선 — 0.0.4

사용자 요청: 카드 드래그의 심한 렉과 이동 위치의 불명확함을 해결하고, 같은 GitHub 계정의 Canvas Palette 항목 이동 방식과 비슷하게 만들기.

## 참고와 원인

- `tlatndms2-droid/canvas-palette`의 GitHub HEAD와 로컬 HEAD `c43662c`가 일치함을 확인했다. 참조 저장소는 수정하지 않았다.
- `mountViewportReorder`의 위치 캐시·프레임 단위 갱신·별도 밝은 안내선·다열 좌우/단열 상하 판정을 참고했다.
- MD Palette 0.0.3은 dragover마다 안내 테두리를 지웠다가 4px로 바꾸어 카드 크기·행 위치가 변했다. 실제 Sandbox에서도 위치 흔들림을 확인했다. Drop 후 전체 카드를 다시 만들었다.
- 0.0.4는 별도 고정 안내선만 갱신하며 카드 배치는 변하지 않는다. 이동할 때 기존 DOM·썸네일을 그대로 재배치하고 순서만 저장한다.

## 검증

- TypeScript·빌드·자동 검사 11개 통과.
- 기존 격리 Sandbox에 보관된 2,013개 파일을 사용, 411개 연결 카드에서 비교.
- 실제 HTML 드래그 시작 → CDP 드래그 경로 → Drop을 실행했다. 단일/다중 이동, 내부 상대 순서, 다열 세로선·목록 가로선, 안내 위치와 결과 일치, Esc 취소·표시 정리를 확인했다.
- 0.0.3/0.0.4 동일 36회 이동 시험: LayoutCount 71 → 36, LayoutDuration 313.287ms → 2.300ms. 카드 위치는 흔들림 → 고정, Drop 후 카드 DOM은 재생성 → 재사용.
- 위 값은 제한된 자동 드래그 구간의 화면 배치 계산 합계이며 전체 사용자 지연이나 CPU 사용률이 아니다.
- 최종 0.0.4로 별도 프로세스를 종료·재시작하여 카드 순서·라벨·설정·Space 복원을 확인했다.
- 시험 파일 2,013개의 내용은 드래그로 변경되지 않았다. Main에 추가한 400개 시험 링크는 시험 준비 변경으로 별도 비교했다.
- 최종 자산 3개와 Sandbox 설치본 SHA-256 일치. 원시 결과·화면·백업은 `.artifacts/stage2-drag/`에 있다.

## 배포

- [0.0.4 공개 Release](https://github.com/tlatndms2-droid/md-palette/releases/tag/0.0.4), 구현 커밋 `7000bb0`. 공개 다운로드 3개 자산과 최종 빌드 SHA-256 일치.
- BRAT 2.2.0 실제 업데이트 명령으로 **0.0.3 → 0.0.4**, 활성화·Card 순서/라벨·Space·기존 데이터 보존 확인. main.js/styles.css 바이트 일치, manifest는 JSON 공백 차이만 존재.
- 검증 후 Sandbox 프로세스를 중지하고 원래 설정 4개를 복원·해시 비교했다. 시험 자료와 설치본은 `.artifacts/stage2-drag/validated-fixtures`, `validated-obsidian`에 보관했다.
- 사용자 본인의 0.0.4 확인 대기. 3단계는 시작하지 않았다.
