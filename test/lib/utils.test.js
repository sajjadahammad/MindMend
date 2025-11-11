// test/lib/utils.test.js
import {
  extractUserName,
  getEmotionColor,
  getWelcomeMessage,
  buildContextPrefix,
  storeUserName,
  getUserName,
  cn
} from '@/lib/utils';

describe('Utils - extractUserName', () => {
  it('should extract name from "my name is X"', () => {
    expect(extractUserName('my name is John')).toBe('John');
    expect(extractUserName('My name is Sarah')).toBe('Sarah');
  });

  it('should extract name from "I\'m X"', () => {
    expect(extractUserName("I'm Alex")).toBe('Alex');
    expect(extractUserName("im Mike")).toBe('Mike');
  });

  it('should extract name from "call me X"', () => {
    expect(extractUserName('call me David')).toBe('David');
  });

  it('should extract single word names', () => {
    expect(extractUserName('Emma')).toBe('Emma');
  });

  it('should return null for invalid names', () => {
    expect(extractUserName('a')).toBeNull(); // too short
    expect(extractUserName('x'.repeat(25))).toBeNull(); // too long
    expect(extractUserName('123')).toBeNull(); // numbers only
  });

  it('should capitalize names correctly', () => {
    expect(extractUserName('my name is john')).toBe('John');
    expect(extractUserName('SARAH')).toBe('Sarah');
  });

  it('should take only first name from multiple words', () => {
    expect(extractUserName('my name is John Smith')).toBe('John');
  });
});

describe('Utils - getEmotionColor', () => {
  it('should return correct color for emotions', () => {
    expect(getEmotionColor('joy')).toBe('text-emerald-500');
    expect(getEmotionColor('sadness')).toBe('text-blue-500');
    expect(getEmotionColor('anger')).toBe('text-red-500');
    expect(getEmotionColor('fear')).toBe('text-amber-500');
  });

  it('should handle case insensitivity', () => {
    expect(getEmotionColor('JOY')).toBe('text-emerald-500');
    expect(getEmotionColor('Sadness')).toBe('text-blue-500');
  });

  it('should return default color for unknown emotions', () => {
    expect(getEmotionColor('unknown')).toBe('text-gray-500');
    expect(getEmotionColor(null)).toBe('text-gray-500');
  });
});

describe('Utils - getWelcomeMessage', () => {
  it('should return personalized message with name', () => {
    const message = getWelcomeMessage('John');
    expect(message).toContain('John');
    expect(message).toContain('Welcome back');
  });

  it('should return generic message without name', () => {
    const message = getWelcomeMessage('');
    expect(message).toContain('MindMend');
    expect(message).toContain("What's your name");
  });
});

describe('Utils - buildContextPrefix', () => {
  it('should build context with user name', () => {
    const context = buildContextPrefix('John');
    expect(context).toContain('John');
    expect(context).toContain('Context');
  });

  it('should return empty string without name', () => {
    expect(buildContextPrefix('')).toBe('');
    expect(buildContextPrefix(null)).toBe('');
  });
});

describe('Utils - localStorage functions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should store and retrieve user name', () => {
    storeUserName('John');
    expect(getUserName()).toBe('John');
  });

  it('should return null when no name stored', () => {
    expect(getUserName()).toBeNull();
  });

  it('should overwrite existing name', () => {
    storeUserName('John');
    storeUserName('Sarah');
    expect(getUserName()).toBe('Sarah');
  });
});

describe('Utils - cn (className merger)', () => {
  it('should merge class names', () => {
    const result = cn('text-red-500', 'bg-blue-500');
    expect(result).toContain('text-red-500');
    expect(result).toContain('bg-blue-500');
  });

  it('should handle conditional classes', () => {
    const result = cn('base-class', true && 'conditional-class');
    expect(result).toContain('base-class');
    expect(result).toContain('conditional-class');
  });
});
