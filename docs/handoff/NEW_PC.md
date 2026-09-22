# 다른 PC에서 이어가기

이 저장소는 개발 자료 인계다. 개인 Obsidian Vault, 현재 열린 창, Sandbox 전체, Codex 대화·전역 지침·설치 스킬·인증 정보는 포함하지 않는다. 기존 의사결정은 [현재 사양](CURRENT_SPEC.md)과 [변경 이력](DECISIONS.md)으로 전달한다.

## 사용자가 할 일

1. 새 PC의 GitHub Desktop에서 같은 GitHub 계정으로 로그인한다.
2. `File → Clone repository → URL`에 `https://github.com/tlatndms2-droid/md-palette`를 입력하고 저장할 폴더를 선택한다.
3. `Current branch`가 **codex/planning**인지 확인하고 `Fetch origin` 후 변경이 있으면 `Pull origin`을 누른다. 이 저장소의 기본 브랜치는 main이 아니라 codex/planning이다.
4. 새 PC의 Codex에서 복제한 폴더를 프로젝트로 연다.
5. 아래 문장을 입력한다.

> 이 저장소의 AGENTS.md, HANDOFF.md, docs/handoff/CURRENT_SPEC.md, docs/handoff/DECISIONS.md, IMPLEMENTATION_PLAN.md, docs/handoff/NEW_PC.md를 읽고 codex/planning 최신 Git 상태와 manifest 0.1.2를 확인해줘. 0.1.2는 줄 강조·세로 커서 개선까지 배포되고 사용자 정상 작동 확인도 완료된 상태야. 현재 기능과 재개 지점을 짧게 설명해줘. 완료한 작업을 반복하지 말고, 내가 지정하는 다음 작업을 이어가면 돼. 검증이 필요할 때는 이 PC의 실행 환경·Sandbox 스킬·새 대상 경로와 포트를 확인하고 과거 시험 스크립트를 그대로 실행하지 마.

터미널을 사용하는 경우, 비어 있는 새 작업 위치에서 다음 명령으로 복제할 수 있다.

```sh
git clone --branch codex/planning https://github.com/tlatndms2-droid/md-palette.git
cd md-palette
git status --short --branch
```

이미 복제한 폴더라면 먼저 `git status`로 미전송 변경을 확인하고, 같은 브랜치에서 `git pull --ff-only`로 받는다. 변경이나 분기가 있으면 강제 덮어쓰기하지 말고 차이를 확인한다.

복제한 뒤 다른 PC에서 실제 재개가 성공했는지는 그 PC에서 확인해야 한다. 이번 인계가 그 검증을 대신하지 않는다.

## Codex 환경 준비

- 저장소 루트에서 작업한다. 최근 검증 환경은 Node.js **24.14.0**, pnpm **11.19.0**, Obsidian **1.13.7**이다. 새 PC에 설치되어 있다는 의미는 아니다. 최소 Obsidian 버전은 manifest 기준 1.13.7이다.
- Git·Node.js·pnpm·Obsidian 존재와 버전을 먼저 확인한다. 의존성은 포함된 pnpm-lock.yaml로 설치한다. 설치가 필요하면 해당 PC의 패키지 도구 경로를 확인한다.
- 이후 검증을 요청받았을 때 프로젝트 루트에서:

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm run build
```

- lockfile 호환 오류가 나면 기존 파일을 새로 쓰지 말고 패키지 관리자 버전을 먼저 맞춘다. 의존성 설치 스크립트가 제한될 때는 전역 승인 정책을 바꾸지 않는다. 이미 설치된 실행 파일이 사용 가능한 경우 아래 기존 경로를 사용할 수 있다.

```sh
node node_modules/typescript/bin/tsc --noEmit
node esbuild.config.mjs
node --test tests/*.test.mjs
```

- 결과물은 main.js·manifest.json·styles.css. 루트 main.js는 빌드 산출물이어서 Git 추적 제외다. 검증된 현재 설치 파일은 [0.1.2 Release](https://github.com/tlatndms2-droid/md-palette/releases/tag/0.1.2)에 있고, 정확한 배포본은 `.github/release-assets/0.1.2/`에도 보관한다.
- Git push 인증은 새 PC의 GitHub Desktop/Git 인증을 사용한다. 기존 PC 인증 파일을 복사하지 않는다.

## Sandbox와 스크립트의 이식 제한

기존 검증 스크립트는 **완성된 범용 설치 도구가 아니라 당시 전용 Sandbox 시험 기록**이다. `scripts/`를 처음부터 일괄 실행하지 않는다.

- `scripts/cdp.mjs`: `MD_PALETTE_CDP_PORT`, `MD_PALETTE_SANDBOX_TITLE`로 새 대상을 지정할 수 있다. 미지정 시 과거 기본값(19273, MDPalette-Stage0-Sandbox)이 사용되므로 그대로 실행하지 않는다. `caret-validation.mjs`도 당시 Review 자료·역할·Sandbox 이름에 의존한다.
- prepare/install/restart/brat 스크립트에는 기존 경로·버전·앞 단계 시험 자료·.artifacts 결과 파일에 대한 의존이 있다. 설치·설정·파일 변경을 수행하는 스크립트도 있다.
- 새 PC의 Sandbox Vault·별도 프로필·Obsidian 실행 파일·빈 포트·현재 CDP 대상·Node 경로를 새로 확인한다. PID나 탭 ID를 재사용하지 않는다.
- 실제 Vault는 검증에 사용하지 않는다. `obsidian-sandbox-open`으로 열고 성공 후 `obsidian-sandbox-validation`으로 설치·검증하는 기존 절차를 따른다. 스킬이 새 PC에 없으면 누락 사실을 알리고 스킬 준비가 필요하다. 스킬 본문·전역 설정은 이 저장소로 자동 이식하지 않았다.
- 앱 동작 자동화만 필요하면 `obsidian-sandbox-automation`을 확인한다. 코드 Release가 필요한 후속 작업은 관련 Release 스킬을 확인하되, BRAT은 사용자 담당이라는 최신 결정을 유지한다.
- 승인된 검증 범위에서 새 시험 자료를 준비하고, 이전 스크립트에서 필요한 부분만 새 대상에 맞춰 사용한다. 포트만 바꿔 곧바로 실행하지 않는다.
- 시험 전 설정·자료 백업, 결과 확인, 기존 자료 보존을 수행한다. 사용자 요청에 따라 Sandbox와 시험 자료를 확인용으로 유지하는 결정이 있다. 임의 종료·정리를 하지 않는다.
- `scripts/release.mjs`와 `.github/workflows/publish-*.yml`은 당시 버전별 배포 절차다. 환경 준비 명령이 아니며 재실행하지 않는다. 새 버전 작업에서 경로와 검증 상태를 점검한다. 공개된 버전·태그·자산을 덮어쓰지 않는다.

## 전달 자료와 빠진 자료

| 포함 | 설명 |
|---|---|
| src / tests / scripts / styles.css / 설정·lockfile | 개발·검증 코드. scripts는 위 이식 제한 적용 |
| AGENTS.md / README.md / HANDOFF.md / IMPLEMENTATION_PLAN.md | 프로젝트 지침·사용법·현재 재개 지점 |
| docs/handoff | 현재 사양·변경 이력·이전 문서·새 PC 절차·최신 시안·검증 화면 |
| MD_Palette_Planning_Pack_Final / md palette ui image | 원본 기획 문서·참조 이미지 46개, 원본 내용 보존 |
| 루트의 검증 보고서와 RELEASE_NOTES.md | 단계별 구현·검증·배포 이력 |

중복 ZIP은 올리지 않았다. 해제된 원본 폴더와 이미지가 포함되어 있다. .artifacts 전체·node_modules·Sandbox 백업·개인 Vault는 제외했다. Sub 배치의 before/after/restart와 0.1.2 줄 강조 화면·UI/재시작 결과를 선별 포함했다. 0.1.2 증거는 `docs/handoff/evidence/0.1.2/`에서 확인한다.

과거 승인 HTML 전체나 모든 사용자 첨부 이미지가 완전하게 보존된 것은 아니다. 이번에 확보한 0.0.15 배치 비교 HTML은 references 폴더에 있다. 다른 승인 화면이 반드시 필요한 후속 변경에서는 보고서로 추정하지 말고 빠진 원본을 확인한다. 개인 노트의 현재 정리 상태를 새 PC Obsidian에도 옮기는 작업은 별도 Vault 동기화 범위다.

## PC를 번갈아 쓸 때

작업을 마친 PC에서 코드와 최신 HANDOFF를 커밋·push한 뒤, 다른 PC에서 Fetch/Pull하고 시작한다. 두 PC에 미저장·미전송 수정이 동시에 있을 때는 덮어쓰지 말고 Git 차이를 먼저 확인한다.
