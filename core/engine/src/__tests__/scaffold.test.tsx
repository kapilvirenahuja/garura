import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HomePage from '@/app/page';

describe('MDB Scaffold', () => {
  it('renders the home page with title', () => {
    render(<HomePage />);
    expect(screen.getByText('MDB — Meridian Artifact Browser')).toBeInTheDocument();
  });

  it('renders the description text', () => {
    render(<HomePage />);
    expect(
      screen.getByText('AI-powered engineering cockpit for Meridian product artifacts'),
    ).toBeInTheDocument();
  });
});
