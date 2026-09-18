# MD Palette

Obsidian의 Main 노트를 중심으로 연결 자료를 탐색·정리하는 데스크톱 플러그인입니다.

## 현재 버전: 0.0.1 — 0단계

설치·활성화 기반을 제공하는 초기 버전입니다. **아직 Space 지정, 사이드바, Card, Connections, Folder, Metadata 또는 드래그 기능은 제공하지 않습니다.** 켜도 새 버튼이나 패널이 나타나지 않는 것이 현재 버전의 정상 동작입니다.

별도 Sandbox에서 탭 그룹 재배치와 Canvas 드롭 좌표 처리 가능 여부를 시험했습니다. 시험 코드는 배포 플러그인에 포함되지 않습니다. 이 버전은 파일·작업 공간·플러그인 데이터를 변경하거나 주기적 작업을 실행하지 않습니다.

## BRAT 설치

1. BRAT 설정에서 `Add beta plugin`을 선택합니다.
2. `https://github.com/tlatndms2-droid/md-palette`를 입력해 설치합니다.
3. Obsidian 설정 → 커뮤니티 플러그인에서 `MD Palette`를 활성화합니다.
4. 표시 버전이 `0.0.1`인지 확인합니다.

사용자 설치 확인 후 다음 단계인 Space·사이드바 구현으로 진행합니다.

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

구현 범위와 단계는 [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md), 기술 시험의 범위와 결과는 [STAGE0_VALIDATION.md](STAGE0_VALIDATION.md)를 참고하세요.
