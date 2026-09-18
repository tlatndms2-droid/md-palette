# MD Palette

Obsidian의 Main 노트를 중심으로 연결 자료를 탐색·정리하는 데스크톱 플러그인입니다.

## 현재 버전: 0.0.2 — Space·사이드바

기존 Obsidian 탭 그룹에 Main·Sub·Reference 역할을 지정합니다. 역할 아이콘은 각 그룹에서 현재 활성화된 탭 이름 왼쪽에 표시됩니다. 색상은 Obsidian 테마와 강조색을 따릅니다. Obsidian 1.13.7 이상을 대상으로 합니다.

1. Markdown 탭 제목 우클릭 → `메인 스페이스로 지정`.
2. 명령어 팔레트에서 `MD Palette: Sub Space에서 파일 열기` → Markdown 선택. Main 오른쪽에 열리며 이후 같은 Sub를 재사용합니다.
3. `MD Palette: Reference Space에서 파일 열기` → 파일 선택. 참고 자료가 새 탭에 쌓이며 같은 파일은 기존 탭을 활성화합니다. 파일 우클릭 메뉴에서도 Sub·Reference 열기를 사용할 수 있습니다.
4. Main의 활성 탭 제목 우클릭 → `메인 / 서브 전환`. 두 그룹의 활성 파일만 교환하며 다른 탭은 유지합니다.
5. 왼쪽 리본의 `MD Palette 열기`로 사이드바를 열 수 있습니다. Main을 지정하면 사이드바도 열립니다.

새 Main을 지정하면 이전 Main은 일반 그룹으로 돌아가고, 기존 Sub는 Obsidian 기본 새 탭으로 남으며 Reference 탭 그룹은 닫힙니다. 실제 파일은 삭제하지 않습니다. 다시 Sub 파일을 열면 빈 위치를 재사용합니다.

재시작하면 Obsidian이 복원한 기존 그룹에 역할만 다시 연결합니다. 없는 Sub·Reference나 이전 파일을 강제로 다시 열지 않습니다.

**Card·Connections·Folder·Metadata의 실제 내용은 아직 미구현입니다.** 사이드바에는 보기 전환과 준비 중 안내가 표시됩니다. Main 본문 링크 클릭 팝업은 사용자 결정에 따라 보류했습니다.

## BRAT 설치

1. BRAT 설정에서 `Add beta plugin`을 선택합니다.
2. `https://github.com/tlatndms2-droid/md-palette`를 입력해 설치합니다.
3. Obsidian 설정 → 커뮤니티 플러그인에서 `MD Palette`를 활성화합니다.
4. 표시 버전이 `0.0.2`인지 확인합니다. 기존 설치자는 BRAT 업데이트를 실행합니다.

이번 단계의 사용자 확인 후에만 다음 단계인 Card 구현으로 진행합니다.

## 개발

Node.js와 패키지 관리자로 의존성을 설치한 후 다음을 실행합니다.

```sh
npm run build
npm test
```

관리형 환경에서 의존성 설치 후 실행 스크립트 승인이 제한된 경우, 승인 정책을 변경하지 않고 이미 설치된 실행 파일로 검증할 수 있습니다.

```sh
node node_modules/typescript/bin/tsc --noEmit
node esbuild.config.mjs
node --test tests/package.test.mjs
```

빌드 결과 `main.js`, `manifest.json`, `styles.css`가 Release 자산입니다. `scripts/`의 기술 시험은 전용 Sandbox에만 사용하며 일반 Vault에서 실행하지 않습니다.

구현 범위와 단계는 [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md), 이번 검증 기록은 [STAGE1_VALIDATION.md](STAGE1_VALIDATION.md), 초기 기술 시험은 [STAGE0_VALIDATION.md](STAGE0_VALIDATION.md)를 참고하세요.
