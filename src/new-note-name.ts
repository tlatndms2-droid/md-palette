export type NewNoteFormat = 'md' | 'canvas';
export function newNoteName(input: string, format: NewNoteFormat = 'md'): string {
  if (format !== 'md' && format !== 'canvas') throw Error('지원하지 않는 파일 형식입니다.');
  const name = input.trim().replace(/\.(md|canvas)$/i, '');
  if (!name || name === '.' || name === '..') throw Error('파일 이름을 입력해주세요.');
  if (/[\x00-\x1f<>:"/\\|?*#\[\]^]/.test(name) || /[. ]$/.test(name)) {
    throw Error('파일 이름에 경로 구분자나 링크에 사용할 수 없는 문자가 있습니다.');
  }
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name)) throw Error('이 이름은 파일 이름으로 사용할 수 없습니다.');
  if (name.length > 180) throw Error('파일 이름은 180자 이내로 입력해주세요.');
  return name + '.' + format;
}
