import { describe, it, expect } from 'vitest';
import { shouldCommit } from './refresh-insta-profiles.js';

describe('shouldCommit', () => {
  it('기존 파일이 없으면(신규 계정) 항상 커밋한다', () => {
    expect(shouldCommit(null, Buffer.from('new'))).toBe(true);
  });

  it('바이트가 같으면 커밋하지 않는다', () => {
    expect(shouldCommit(Buffer.from('same'), Buffer.from('same'))).toBe(false);
  });

  it('바이트가 다르면 커밋한다', () => {
    expect(shouldCommit(Buffer.from('old'), Buffer.from('new'))).toBe(true);
  });
});
