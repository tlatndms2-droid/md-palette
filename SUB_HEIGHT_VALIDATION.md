# 0.0.15 Sub 전체 높이 배치

[0.0.15 Release](https://github.com/tlatndms2-droid/md-palette/releases/tag/0.0.15), 구현 커밋 `9761cff`. 공개 main.js·manifest.json·styles.css를 인증 없이 다운로드해 최종 검증 빌드와 SHA-256 일치를 확인했다. `.artifacts/sub-height/release-verification.json` 참조.

2026-09-21, Obsidian 1.13.7, 격리 Sandbox 백그라운드 CDP.

- 기존 0.0.14에서 영상 위/Main 아래 배치 후 실제 카드 더블클릭으로 문제 재현: 작업 영역 1000px, Sub 500px.
- 최종 0.0.15 업데이트로 기존 Sub가 오른쪽 전체 높이 1000px로 이동했다. Main은 왼쪽 아래 500px, 영상은 왼쪽 위에 유지됐다.
- 새 Sub를 처음 여는 흐름, 기본 더블클릭의 현재 탭 교체, Ctrl+더블클릭 새 탭, Ctrl+Shift+더블클릭 추가 Sub 그룹 모두 실제 클릭으로 확인했다. 각 Sub는 전체 높이를 사용했다.
- 기존 일반 탭을 닫지 않았으며 새 Sub 열기 전 모든 leaf ID가 유지됐다. 최종 화면은 기존 탭을 보존하며 큰 Sub 한 그룹으로 정리했다.
- 사용자 이미지 및 승인 HTML의 왼쪽 영상/Main·오른쪽 전체 높이 Sub 배치와 비교했다. 역할 아이콘·탭·활성 학습 노트가 정상이다.
- Sandbox 프로세스 PID 31196 → 34332 재시작, 새 CDP 대상 조회. 저장된 역할·모든 탭 ID·배치를 복원했고 재시작 후 파일 교체도 통과했다.
- TypeScript 검사·빌드·41개 테스트 통과. 배치 회귀 테스트는 중첩된 위아래 구조, 여러 Sub, 일반 그룹 보존 및 이미 올바른 배치의 반복 변경 방지를 검사한다.
- 기존 파일 2,065개 SHA-256 보존, 라벨·할당·기존 문서별 가상 폴더 보존. 최종 빌드와 Sandbox 설치 자산 3개 해시 일치.

증거·백업: `.artifacts/sub-height/backup`, `originals.json`, `before.json`, `ui-result.json`, `release-ready.json`, `before.png`, `upgraded.png`, `multiple.png`, `after.png`, `restart.png`.

Sandbox 경로: `C:\Users\tlatn\AppData\Local\Temp\MDPalette-Stage0-Sandbox-20260918`, 전용 프로필 `MDPalette-Stage0-Profile-20260918`, 포트 19273, `ProcessStartInfo` 방식 재시작. 자료와 화면을 사용자 확인용으로 남겼다.

실제 Vault 및 BRAT 설치·업데이트는 수행하지 않았다. BRAT은 사용자 담당이며 별도 팝아웃 창 배치는 이번 검증 범위에 포함하지 않았다. 7단계는 진행하지 않았다.
