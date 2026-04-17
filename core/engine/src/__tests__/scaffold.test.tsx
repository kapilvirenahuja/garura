import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ChecklistsPage from '@/app/checklists/page';
import FlightDeckPage from '@/app/flight-deck/page';
import PlaybookPage from '@/app/playbook/page';

describe('MDB Scaffold — Instrument Pages', () => {
  it('renders the Checklists page', () => {
    render(<ChecklistsPage />);
    expect(screen.getByText('Checklists')).toBeInTheDocument();
  });

  it('renders the Flight Deck page', () => {
    render(<FlightDeckPage />);
    expect(screen.getByText('Flight Deck')).toBeInTheDocument();
  });

  it('renders the Playbook page', () => {
    render(<PlaybookPage />);
    expect(screen.getByText('Playbook')).toBeInTheDocument();
  });
});
