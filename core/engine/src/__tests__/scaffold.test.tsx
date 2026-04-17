import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ChecklistsPage from '@/app/checklists/page';
import FlightDeckPage from '@/app/flight-deck/page';
import PlaybookPage from '@/app/playbook/page';

// Mock next/navigation (needed by client components)
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/checklists',
}));

describe('MDB Scaffold — Instrument Pages', () => {
  it('renders the Checklists page', () => {
    render(<ChecklistsPage />);
    expect(screen.getByTestId('checklists-view')).toBeInTheDocument();
  });

  it('renders the Flight Deck page', () => {
    render(<FlightDeckPage />);
    expect(screen.getByText('Flight Deck')).toBeInTheDocument();
  });

  it('renders the Playbook page', () => {
    render(<PlaybookPage />);
    expect(screen.getByText('Playbook Reader')).toBeInTheDocument();
  });
});
