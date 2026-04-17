import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ReadinessMiniGauge } from '@/components/readiness-mini-gauge';
import { SearchBar } from '@/components/search-bar';
import { InstrumentSwitcher, resolveActiveInstrument } from '@/components/instrument-switcher';
import { Breadcrumb, deriveBreadcrumbs } from '@/components/breadcrumb';
import { TopBar } from '@/components/top-bar';
import { AppShell } from '@/components/app-shell';
import { INSTRUMENTS } from '@/lib/constants';

// Mock next/navigation
const mockPush = vi.fn();
const mockPathname = vi.fn<() => string>().mockReturnValue('/checklists');

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => mockPathname(),
  useSearchParams: () => new URLSearchParams(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockPathname.mockReturnValue('/checklists');
});

// ---------------------------------------------------------------------------
// VAL-FOUND-002: Top Bar Renders Project Name
// ---------------------------------------------------------------------------
describe('TopBar — Project Name (VAL-FOUND-002)', () => {
  it('renders the default project name when no prop is provided', () => {
    render(<TopBar />);
    expect(screen.getByTestId('project-name')).toHaveTextContent('Untitled Project');
  });

  it('renders project name from config prop', () => {
    render(<TopBar projectName="My Custom Project" />);
    expect(screen.getByTestId('project-name')).toHaveTextContent('My Custom Project');
  });

  it('top bar is present with data-testid', () => {
    render(<TopBar />);
    expect(screen.getByTestId('top-bar')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// VAL-FOUND-003: Readiness Mini-Gauge Always Visible
// ---------------------------------------------------------------------------
describe('ReadinessMiniGauge — Visibility (VAL-FOUND-003)', () => {
  it('renders the readiness mini-gauge with a score', () => {
    render(<ReadinessMiniGauge score={42} />);
    expect(screen.getByTestId('readiness-mini-gauge')).toBeInTheDocument();
    expect(screen.getByTestId('readiness-mini-gauge-score')).toHaveTextContent('42');
  });

  it('renders with default score of 0', () => {
    render(<ReadinessMiniGauge />);
    expect(screen.getByTestId('readiness-mini-gauge-score')).toHaveTextContent('0');
  });

  it('clamps negative scores to 0', () => {
    render(<ReadinessMiniGauge score={-10} />);
    expect(screen.getByTestId('readiness-mini-gauge-score')).toHaveTextContent('0');
  });

  it('clamps scores above 100 to 100', () => {
    render(<ReadinessMiniGauge score={150} />);
    expect(screen.getByTestId('readiness-mini-gauge-score')).toHaveTextContent('100');
  });

  it('renders the visual bar indicator', () => {
    render(<ReadinessMiniGauge score={50} />);
    const fill = screen.getByTestId('readiness-mini-gauge-fill');
    expect(fill).toBeInTheDocument();
    expect(fill).toHaveStyle({ width: '50%' });
  });

  it('mini-gauge is present in the top bar', () => {
    render(<TopBar />);
    expect(screen.getByTestId('readiness-mini-gauge')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// VAL-FOUND-004: Search Bar Renders in Top Bar
// ---------------------------------------------------------------------------
describe('SearchBar — Rendering (VAL-FOUND-004)', () => {
  it('renders a search input with placeholder text', () => {
    render(<SearchBar />);
    const input = screen.getByTestId('search-bar-input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Search artifacts...');
  });

  it('accepts text input', () => {
    render(<SearchBar />);
    const input = screen.getByTestId('search-bar-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'authentication' } });
    expect(input.value).toBe('authentication');
  });

  it('is keyboard-focusable', () => {
    render(<SearchBar />);
    const input = screen.getByTestId('search-bar-input');
    input.focus();
    expect(document.activeElement).toBe(input);
  });

  it('search bar is present in the top bar', () => {
    render(<TopBar />);
    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// VAL-FOUND-005: Three Instrument Tabs Render
// ---------------------------------------------------------------------------
describe('InstrumentSwitcher — Three Tabs (VAL-FOUND-005)', () => {
  it('renders exactly three instrument tabs', () => {
    render(<InstrumentSwitcher />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
  });

  it('renders tabs with correct labels', () => {
    render(<InstrumentSwitcher />);
    expect(screen.getByText('Checklists')).toBeInTheDocument();
    expect(screen.getByText('Flight Deck')).toBeInTheDocument();
    expect(screen.getByText('Playbook')).toBeInTheDocument();
  });

  it('all tabs are clickable (have href)', () => {
    render(<InstrumentSwitcher />);
    INSTRUMENTS.forEach((instrument) => {
      const tab = screen.getByTestId(`tab-${instrument.id}`);
      expect(tab).toHaveAttribute('href', instrument.href);
    });
  });

  it('instrument switcher is present in top bar', () => {
    render(<TopBar />);
    expect(screen.getByTestId('instrument-switcher')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// VAL-FOUND-006, 007, 008: Tab Switch Navigation
// ---------------------------------------------------------------------------
describe('InstrumentSwitcher — Tab Switching (VAL-FOUND-006, 007, 008)', () => {
  it('highlights Checklists tab when on /checklists', () => {
    mockPathname.mockReturnValue('/checklists');
    render(<InstrumentSwitcher />);
    const tab = screen.getByTestId('tab-checklists');
    expect(tab).toHaveAttribute('aria-selected', 'true');
  });

  it('highlights Flight Deck tab when on /flight-deck', () => {
    mockPathname.mockReturnValue('/flight-deck');
    render(<InstrumentSwitcher />);
    const tab = screen.getByTestId('tab-flight-deck');
    expect(tab).toHaveAttribute('aria-selected', 'true');
  });

  it('highlights Playbook tab when on /playbook', () => {
    mockPathname.mockReturnValue('/playbook');
    render(<InstrumentSwitcher />);
    const tab = screen.getByTestId('tab-playbook');
    expect(tab).toHaveAttribute('aria-selected', 'true');
  });

  it('non-active tabs are not selected', () => {
    mockPathname.mockReturnValue('/checklists');
    render(<InstrumentSwitcher />);
    expect(screen.getByTestId('tab-flight-deck')).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByTestId('tab-playbook')).toHaveAttribute('aria-selected', 'false');
  });

  it('tab links have correct hrefs for navigation', () => {
    render(<InstrumentSwitcher />);
    expect(screen.getByTestId('tab-checklists')).toHaveAttribute('href', '/checklists');
    expect(screen.getByTestId('tab-flight-deck')).toHaveAttribute('href', '/flight-deck');
    expect(screen.getByTestId('tab-playbook')).toHaveAttribute('href', '/playbook');
  });
});

// ---------------------------------------------------------------------------
// VAL-FOUND-009: Active Tab Persistence on Refresh (URL routing)
// ---------------------------------------------------------------------------
describe('InstrumentSwitcher — URL-Based Active State (VAL-FOUND-009)', () => {
  it('resolves checklists from /checklists pathname', () => {
    expect(resolveActiveInstrument('/checklists')).toBe('checklists');
  });

  it('resolves flight-deck from /flight-deck pathname', () => {
    expect(resolveActiveInstrument('/flight-deck')).toBe('flight-deck');
  });

  it('resolves playbook from /playbook pathname', () => {
    expect(resolveActiveInstrument('/playbook')).toBe('playbook');
  });

  it('resolves playbook from /playbook/context subpath', () => {
    expect(resolveActiveInstrument('/playbook/e1-auth')).toBe('playbook');
  });

  it('defaults to checklists for unknown pathname', () => {
    expect(resolveActiveInstrument('/')).toBe('checklists');
    expect(resolveActiveInstrument('/unknown')).toBe('checklists');
  });
});

// ---------------------------------------------------------------------------
// VAL-FOUND-010: Breadcrumb Updates on Navigation
// ---------------------------------------------------------------------------
describe('Breadcrumb — Navigation Path (VAL-FOUND-010)', () => {
  it('shows Home › Checklists breadcrumb on /checklists', () => {
    mockPathname.mockReturnValue('/checklists');
    render(<Breadcrumb />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Checklists')).toBeInTheDocument();
  });

  it('shows Home › Flight Deck breadcrumb on /flight-deck', () => {
    mockPathname.mockReturnValue('/flight-deck');
    render(<Breadcrumb />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Flight Deck')).toBeInTheDocument();
  });

  it('shows Home › Playbook breadcrumb on /playbook', () => {
    mockPathname.mockReturnValue('/playbook');
    render(<Breadcrumb />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Playbook')).toBeInTheDocument();
  });

  it('renders separator between segments', () => {
    mockPathname.mockReturnValue('/checklists');
    render(<Breadcrumb />);
    expect(screen.getByText('›')).toBeInTheDocument();
  });

  it('last segment is not a link (current page)', () => {
    mockPathname.mockReturnValue('/checklists');
    render(<Breadcrumb />);
    // Last segment should have aria-current="page"
    const currentSegment = screen.getByText('Checklists');
    expect(currentSegment).toHaveAttribute('aria-current', 'page');
  });

  it('breadcrumb derives correct segments', () => {
    const checklistSegments = deriveBreadcrumbs('/checklists');
    expect(checklistSegments).toHaveLength(2);
    expect(checklistSegments[0]?.label).toBe('Home');
    expect(checklistSegments[1]?.label).toBe('Checklists');

    const flightDeckSegments = deriveBreadcrumbs('/flight-deck');
    expect(flightDeckSegments).toHaveLength(2);
    expect(flightDeckSegments[1]?.label).toBe('Flight Deck');

    const playbookSegments = deriveBreadcrumbs('/playbook');
    expect(playbookSegments).toHaveLength(2);
    expect(playbookSegments[1]?.label).toBe('Playbook');
  });

  it('breadcrumb component is present', () => {
    render(<Breadcrumb />);
    expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// VAL-FOUND-011: Readiness Gauge Click Navigates to Checklists
// ---------------------------------------------------------------------------
describe('ReadinessMiniGauge — Click Navigation (VAL-FOUND-011)', () => {
  it('clicking the gauge navigates to /checklists', () => {
    render(<ReadinessMiniGauge score={42} />);
    fireEvent.click(screen.getByTestId('readiness-mini-gauge'));
    expect(mockPush).toHaveBeenCalledWith('/checklists');
  });

  it('clicking the gauge from any context always navigates to /checklists', () => {
    mockPathname.mockReturnValue('/flight-deck');
    render(<ReadinessMiniGauge score={75} />);
    fireEvent.click(screen.getByTestId('readiness-mini-gauge'));
    expect(mockPush).toHaveBeenCalledWith('/checklists');
  });
});

// ---------------------------------------------------------------------------
// AppShell Integration
// ---------------------------------------------------------------------------
describe('AppShell — Integration', () => {
  it('renders children within the shell', () => {
    render(
      <AppShell>
        <div data-testid="child-content">Hello</div>
      </AppShell>,
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('renders top bar and breadcrumb in shell', () => {
    render(
      <AppShell>
        <div>Content</div>
      </AppShell>,
    );
    expect(screen.getByTestId('top-bar')).toBeInTheDocument();
    expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
  });

  it('top bar contains project name, gauge, tabs, and search', () => {
    render(
      <AppShell>
        <div>Content</div>
      </AppShell>,
    );
    expect(screen.getByTestId('project-name')).toBeInTheDocument();
    expect(screen.getByTestId('readiness-mini-gauge')).toBeInTheDocument();
    expect(screen.getByTestId('instrument-switcher')).toBeInTheDocument();
    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
  });

  it('passes projectName prop through to TopBar', () => {
    render(
      <AppShell projectName="Config Project Name">
        <div>Content</div>
      </AppShell>,
    );
    expect(screen.getByTestId('project-name')).toHaveTextContent('Config Project Name');
  });

  it('shows default project name when projectName prop is not provided', () => {
    render(
      <AppShell>
        <div>Content</div>
      </AppShell>,
    );
    expect(screen.getByTestId('project-name')).toHaveTextContent('Untitled Project');
  });
});
