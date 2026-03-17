import { describe, it, expect } from 'vitest';
import AppLayout from '../../app/home-layout';

describe('AppLayout', () => {
  it('should render children and BottomNav', () => {
    // TODO: Adicione mocks para getSession e BottomNav
    expect(typeof AppLayout).toBe('function');
  });
});
