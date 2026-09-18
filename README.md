# MD Palette

Obsidian의 Main 노트를 중심으로 연결 자료를 탐색·정리하는 데스크톱 플러그인입니다.

## 현재 버전: 0.0.4 — 카드 드래그 개선

기존 Obsidian 탭 그룹에 Main·Sub·Reference 역할을 지정합니다. 역할 아이콘은 각 그룹에서 현재 활성화된 탭 이름 왼쪽에 표시됩니다. 색상은 Obsidian 테마와 강조색을 따릅니다. Obsidian 1.13.7 이상을 대상으로 합니다.

1. Markdown 탭 제목 우클릭 → `메인 스페이스로 지정`.
2. 명령어 팔레트에서 `MD Palette: Sub Space에서 파일 열기` → Markdown 선택. Main 오른쪽에 열리며 이후 같은 Sub를 재사용합니다.
3. `MD Palette: Reference Space에서 파일 열기` → 파일 선택. 참고 자료가 새 탭에 쌓이며 같은 파일은 기존 탭을 활성화합니다. 파일 우클릭 메뉴에서도 Sub·Reference 열기를 사용할 수 있습니다.
4. Main의 활성 탭 제목 우클릭 → `메인 / 서브 전환`. 두 그룹의 활성 파일만 교환하며 다른 탭은 유지합니다.
5. 왼쪽 리본의 `MD Palette 열기`로 사이드바를 열 수 있습니다. Main을 지정하면 사이드바도 열립니다.

새 Main을 지정하면 이전 Main은 일반 그룹으로 돌아가고, 기존 Sub는 Obsidian 기본 새 탭으로 남으며 Reference 탭 그룹은 닫힙니다. 실제 파일은 삭제하지 않습니다. 다시 Sub 파일을 열면 빈 위치를 재사용합니다.

재시작하면 Obsidian이 복원한 기존 그룹에 역할만 다시 연결합니다. 없는 Sub·Reference나 이전 파일을 강제로 다시 열지 않습니다.

## 연결 파일 Card

Main 지정 → 사이드바 `Link View → Card`에서 나가는 링크와 역링크의 파일을 함께 봅니다. 같은 파일은 한 번만 표시하며 Main 자체는 숨깁니다.

- `연결 파일 추가` → 기존 Vault 파일 선택 → Main 상단 `link note` 속성에 링크를 추가합니다. 본문의 별도 링크 목록은 만들지 않으며, 이미 연결된 파일을 중복 추가하지 않습니다.
- 한 번 클릭은 선택, Ctrl+클릭은 추가/해제, Shift+클릭은 범위 선택입니다. 더블클릭하면 단일 선택으로 바뀌고 Markdown은 Sub, 다른 파일은 Reference에서 열립니다. Markdown 우클릭 메뉴에서는 Reference로도 열 수 있습니다.
- 카드 우클릭 → `새 Label 만들기` 또는 `Label 지정/교체`. 여러 카드를 선택하면 한꺼번에 적용하거나 제거합니다. 라벨 관리에서 이름·색을 바꾸면 사용 중인 카드에 함께 반영되며, 마지막 파일에서 제거된 라벨은 사라집니다.
- 파일 유형과 여러 라벨로 필터링합니다. 라벨의 `All`은 개별 라벨 선택을 해제합니다. 필터를 접어도 선택 조건은 유지됩니다.
- 선택한 카드를 드래그하면 Canvas Palette와 같은 밝은 삽입 안내선이 나타납니다. 여러 열에서는 카드 사이 세로선, 목록·한 열에서는 가로선을 기준으로 놓습니다. 카드가 흔들리지 않으며 놓을 때 기존 카드를 그대로 이동합니다. 묶음 내부 순서를 유지하고 Esc로 취소할 수 있습니다.
- 보기 형식 6종과 글자 크기 3종을 제공합니다. 카드 영역에서 Ctrl+마우스 휠로 보기 형식을 전환합니다.
- Markdown 본문, 이미지, PDF 첫 페이지, Canvas 축소 그림, 영상 첫 프레임을 미리 봅니다. 지원하지 않거나 읽을 수 없는 자료는 파일 아이콘과 이름으로 표시합니다. 미리보기는 보이는 카드부터 처리하고 최근 결과를 재사용합니다.

라벨·필터·보기 형식·글자 크기·카드 순서는 재시작 후 복원됩니다. 라벨과 순서 변경은 Markdown 내용이나 실제 파일 위치를 바꾸지 않습니다.

**Connections·Folder·Metadata와 카드를 Main 본문에 드롭하는 기능은 후속 단계입니다.** Main 본문 링크 클릭 팝업은 사용자 결정에 따라 보류했습니다.

## BRAT 설치

1. BRAT 설정에서 `Add beta plugin`을 선택합니다.
2. `https://github.com/tlatndms2-droid/md-palette`를 입력해 설치합니다.
3. Obsidian 설정 → 커뮤니티 플러그인에서 `MD Palette`를 활성화합니다.
4. 표시 버전이 `0.0.4`인지 확인합니다. 기존 설치자는 BRAT 업데이트를 실행합니다.

이번 Card 단계의 사용자 확인 후에만 다음 Connections 단계로 진행합니다.

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
node --test tests/*.test.mjs
```

빌드 결과 `main.js`, `manifest.json`, `styles.css`가 Release 자산입니다. `scripts/`의 기술 시험은 전용 Sandbox에만 사용하며 일반 Vault에서 실행하지 않습니다.

구현 범위와 단계는 [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md), 이번 검증 기록은 [STAGE2_VALIDATION.md](STAGE2_VALIDATION.md), 이전 단계는 [STAGE1_VALIDATION.md](STAGE1_VALIDATION.md), 초기 기술 시험은 [STAGE0_VALIDATION.md](STAGE0_VALIDATION.md)를 참고하세요.
