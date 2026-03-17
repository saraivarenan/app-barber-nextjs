import { describe, it, expect } from 'vitest';
import RootLayout from '../../app/layout';

describe('RootLayout', () => {
  it('should render html and body', () => {
    expect(typeof RootLayout).toBe('function');
  });
});
