# MD Palette — Performance & Platform

## Platform
1차 버전: Desktop only.

Mobile:
- 현재 범위에서 제외
- 모바일 대체 UX 설계하지 않음

## 성능 목표
- Vault 파일이 수천 개여도 Plugin 때문에 Obsidian 시작이 심하게 지연되지 않을 것
- Main 연결 파일이 수백 개여도 Card / Folder / Connections 전환이 실사용 가능한 수준일 것
- Metadata 갱신이 Main Markdown 타이핑을 눈에 띄게 방해하지 않을 것
- Thumbnail은 한 번에 전부 만들지 않고 필요한 것부터 처리하는 방향
- 대량 데이터에서 Scroll / Filter / Drag & Drop 입력이 장시간 멈추지 않을 것
- 무거운 Plugin 갱신보다 Markdown 편집 사용성이 우선

구체적인 debounce/cache/virtualization 전략은 Codex 영역.
