# MD Palette — Exceptions & Notices

## Notice 원칙
- Obsidian 기본 Notice
- 한글
- 짧게
- 사용자 행동으로 잘못된 상태가 발생할 때마다 표시
- 불필요한 custom modal 지양

## 확정 Notice
- `메인 스페이스를 먼저 지정해주세요.`
- `스페이스 순서는 변경할 수 없습니다.`
- `서브 스페이스가 없어 전환할 수 없습니다.`
- `메인 스페이스는 Markdown 파일만 지정할 수 있습니다.`
- `메인 스페이스에서는 Markdown 파일을 활성화해주세요.`
- `이미 다른 가상 폴더에 배치된 파일입니다.`

## Plugin Data 손상
- Markdown source 보호
- 복구 가능한 UI 상태만 reset
- 파괴적 overwrite 금지
- 필요 시 Notice

## Unresolved Links
Obsidian 기본 unresolved behavior 존중.
가짜 파일 자동 생성 X.

## Broken Metadata Syntax
인식 가능한 정상 syntax만 표시.
작성 중 깨진 syntax는 잠시 제외.
불필요한 Notice X.

## Save
Main switch / Space change / Reference change 시 별도 save dialog/temp copy 없음.
Obsidian 기본 저장 흐름 사용.
