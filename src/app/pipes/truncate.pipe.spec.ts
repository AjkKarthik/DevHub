import { TruncatePipe } from './truncate.pipe';

describe('TruncatePipe', () => {
  const pipe = new TruncatePipe();

  it('returns short strings unchanged', () => {
    expect(pipe.transform('Hello', 10)).toBe('Hello');
  });

  it('truncates to the limit and appends trail', () => {
    const result = pipe.transform('Hello World', 5);
    expect(result).toBe('Hello…');
  });

  it('uses custom trail', () => {
    const result = pipe.transform('Hello World', 5, '...');
    expect(result).toBe('Hello...');
  });

  it('default limit is 40', () => {
    const long = 'a'.repeat(45);
    const result = pipe.transform(long);
    expect(result.length).toBe(41); // 40 chars + '…'
  });

  it('string exactly at limit is not truncated', () => {
    const exact = 'a'.repeat(40);
    expect(pipe.transform(exact)).toBe(exact);
  });
});
