# 2단계 Card — 0.0.3 검증 기록

2026-09-18. 사용자가 0.0.2의 정상 작동을 확인하고 2단계를 승인했다. 문서·이미지의 연결 저장 위치 차이는 사용자 답변 `문서방식으로 진행`에 따라 Main의 `link note` 속성으로 확정했다.

## 빌드와 자동 검사

- TypeScript 검사, 빌드, 테스트 8개 통과.
- 최종 main.js 55,930 bytes. 실행 코드에는 시험용 계측·파일시스템 직접 쓰기를 포함하지 않는다.
- 검증 빌드와 Sandbox 설치본의 main.js·manifest.json·styles.css SHA-256 일치.
- 시험 자료와 설정을 변경 전에 백업했다. 원시 결과·스크린샷·백업은 `.artifacts/stage2/`에 보관한다.

## 실제 Sandbox UI

- 대상: `MDPalette-Stage0-Sandbox-20260918`, 별도 프로필, CDP 19273, Obsidian 1.13.7. 실제 작업 Vault는 사용하지 않았다.
- Main 제외·역링크/나가는 링크 중복 제거·연결 파일 자동 갱신.
- Markdown Properties를 제외한 본문, 이미지, Canvas 축소 그림, PDF 첫 페이지, 영상 프레임과 잘못된 PDF/기타 파일 fallback.
- 단일/Ctrl/Shift 선택, 더블클릭 단일화, Sub·Reference 열기.
- 두 카드 라벨 생성, 서로 다른 라벨의 일괄 교체, 선택 항목만 제거, 마지막 사용 파일에서 제거된 라벨의 자동 소멸, 이름·색 사용자 설정.
- 파일 유형·복수 라벨 필터, All 해제 규칙, 접은 상태의 필터 유지.
- 6종 보기, 글자 크기, Ctrl+휠 전환.
- 실제 HTML drag 시작 및 CDP drop으로 단일/다중 재정렬과 Esc 취소, 묶음 내부 상대 순서 유지.
- Main/Sub 전환 중 숨겨진 카드의 기존 순서 복원, 이름 변경 시 라벨·순서 유지.
- `연결 파일 추가`로 `link note`만 변경, 중복 선택·선택창 취소 시 원문 동일. Obsidian의 쓰기 실패를 주입했을 때 원문/연결 불변.
- Markdown 링크 사용 설정에서도 Properties는 정상 해석되는 wikilink로 저장.
- 본문 변경 시 썸네일 캐시 갱신, 갱신 전후 스크롤 위치 191px 유지.
- 밝은/어두운 테마와 220px 사이드바 확인. 가로 넘침 없음. 제공 Card Reference의 필터·컨트롤·카드 배치·메뉴를 대조했다.
- 별도 Sandbox 프로세스를 종료 후 새로 실행하여 0.0.3·Space·라벨·순서·필터·접기·보기 형식·글자 크기·이전 데이터 복원 확인.

## 대량 자료 시험

Vault 파일 2,013개, Main 연결 카드 411개. 화면 밖 카드의 렌더링을 지연하고 최근 썸네일 64개를 재사용한다.

| 항목 | 최종 시험값 |
|---|---:|
| 전체 카드 다시 그리기 동기 구간 | 101.2ms |
| PDF 필터 클릭과 결과 확인 | 415.7ms |
| 스크롤 입력과 결과 확인 | 205.3ms |
| 실제 편집기 텍스트 입력과 결과 확인 | 52.0ms |

UI 자동 조작의 고정 대기·통신 왕복 시간이 포함된다. CPU 점유율·전체 사용자 지연·모든 Vault의 성능을 뜻하지 않는다. 자동 카드 갱신 중 본문 입력과 스크롤이 수행됐으며 미처리 런타임 예외는 없었다.

## 원문·범위

기본 시험 파일 13개를 바이트 비교했다. Main만 `link note`에 Extra 연결이 추가됐고 Main 본문과 나머지 12개 파일은 동일하다. 기존 알 수 없는 플러그인 설정도 유지됐다.

Connections·Folder·Metadata·Main 본문 카드 드롭은 2단계 범위에 포함하지 않는다. 지원하지 않는 영상 코덱이나 손상 파일은 fallback을 사용한다. 사용자 본인의 BRAT 확인은 Sandbox 검증으로 대신하지 않는다.

## 배포 상태

- [0.0.3 공개 Release](https://github.com/tlatndms2-droid/md-palette/releases/tag/0.0.3), 구현 커밋 `63abd00`.
- main.js·manifest.json·styles.css를 공개 다운로드하여 로컬 검증 빌드와 SHA-256 일치를 확인했다.
- Sandbox BRAT 2.2.0의 실제 업데이트 명령으로 **0.0.2 → 0.0.3**, 활성화·기존 Space·Card 설정·알 수 없는 데이터 보존을 확인했다.
- BRAT 설치 main.js/styles.css는 Release와 바이트 일치. manifest는 BRAT의 JSON 공백 재직렬화 차이만 있으며 모든 값이 동일하다.
- 검증 후 Sandbox 프로세스를 중지했다. 시험 자료 2,013개와 설치본은 각각 `.artifacts/stage2/validated-fixtures`, `validated-obsidian`으로 이동 보관했으며 삭제하지 않았다.
- 원래 Sandbox 설정 4개를 복원하고 SHA-256 일치를 확인했다. `restoration.json`에 기록했다.
- 현재 상태는 **2단계 사용자 BRAT 확인 대기**다. 사용자 본인의 확인 전에는 단계 전체 완료로 처리하거나 3단계로 넘어가지 않는다.
