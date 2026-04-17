import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Components
import { ReadinessGauge } from '@/components/readiness-gauge';
import { StatusBadge } from '@/components/status-badge';
import { CrossRefToken } from '@/components/cross-ref-token';
import { ActionCard } from '@/components/action-card';
import { ContentSlot } from '@/components/content-slot';
import { WikiTag } from '@/components/wiki-tag';
import { CTAButton } from '@/components/cta-button';
import { InlineExpansion } from '@/components/inline-expansion';
import { SearchBar } from '@/components/search-bar';
import { InstrumentSwitcher } from '@/components/instrument-switcher';
import { MetricTile } from '@/components/metric-tile';
import { EpicSummary } from '@/components/epic-summary';
import { ChecklistItem } from '@/components/checklist-item';
import { Breadcrumb } from '@/components/breadcrumb';
import type { BreadcrumbSegment } from '@/components/breadcrumb';

// Mock next/navigation for shell-mode components
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
  vi.useFakeTimers();
  mockPathname.mockReturnValue('/checklists');
});

// =============================================================================
// VAL-FOUND-046: ReadinessGauge Renders Correctly
// =============================================================================
describe('ReadinessGauge — Rendering (VAL-FOUND-046)', () => {
  it('renders a numeric score and visual fill indicator', () => {
    render(<ReadinessGauge score={65} />);
    expect(screen.getByTestId('readiness-gauge')).toBeInTheDocument();
    expect(screen.getByTestId('readiness-gauge-score')).toHaveTextContent('65');
    expect(screen.getByTestId('readiness-gauge-fill')).toHaveStyle({ width: '65%' });
  });

  it('renders a visual bar (track) element', () => {
    render(<ReadinessGauge score={50} />);
    expect(screen.getByTestId('readiness-gauge-track')).toBeInTheDocument();
  });
});

// =============================================================================
// VAL-FOUND-047: ReadinessGauge Edge Values
// =============================================================================
describe('ReadinessGauge — Edge Values (VAL-FOUND-047)', () => {
  it('renders 0 with empty gauge', () => {
    render(<ReadinessGauge score={0} />);
    expect(screen.getByTestId('readiness-gauge-score')).toHaveTextContent('0');
    expect(screen.getByTestId('readiness-gauge-fill')).toHaveStyle({ width: '0%' });
  });

  it('renders 100 with full gauge', () => {
    render(<ReadinessGauge score={100} />);
    expect(screen.getByTestId('readiness-gauge-score')).toHaveTextContent('100');
    expect(screen.getByTestId('readiness-gauge-fill')).toHaveStyle({ width: '100%' });
  });

  it('clamps negative values to 0', () => {
    render(<ReadinessGauge score={-5} />);
    expect(screen.getByTestId('readiness-gauge-score')).toHaveTextContent('0');
    expect(screen.getByTestId('readiness-gauge-fill')).toHaveStyle({ width: '0%' });
  });

  it('clamps values above 100 to 100', () => {
    render(<ReadinessGauge score={150} />);
    expect(screen.getByTestId('readiness-gauge-score')).toHaveTextContent('100');
    expect(screen.getByTestId('readiness-gauge-fill')).toHaveStyle({ width: '100%' });
  });

  it('rounds fractional scores', () => {
    render(<ReadinessGauge score={42.7} />);
    expect(screen.getByTestId('readiness-gauge-score')).toHaveTextContent('43');
  });
});

// =============================================================================
// VAL-FOUND-048: StatusBadge All States
// =============================================================================
describe('StatusBadge — All States (VAL-FOUND-048)', () => {
  const states = [
    { status: 'passing', label: 'Passing' },
    { status: 'failing', label: 'Failing' },
    { status: 'in-progress', label: 'In Progress' },
    { status: 'pending', label: 'Pending' },
    { status: 'warning', label: 'Warning' },
  ];

  states.forEach(({ status, label }) => {
    it(`renders '${status}' with label '${label}'`, () => {
      render(<StatusBadge status={status} />);
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveTextContent(label);
      expect(badge).toHaveAttribute('data-status', status);
    });
  });

  it('each state has distinct data-status attribute', () => {
    const { unmount } = render(<StatusBadge status="passing" />);
    expect(screen.getByTestId('status-badge')).toHaveAttribute('data-status', 'passing');
    unmount();

    render(<StatusBadge status="failing" />);
    expect(screen.getByTestId('status-badge')).toHaveAttribute('data-status', 'failing');
  });
});

// =============================================================================
// VAL-FOUND-049: StatusBadge Unknown State
// =============================================================================
describe('StatusBadge — Unknown State (VAL-FOUND-049)', () => {
  it('renders a neutral "Unknown" badge for unrecognised status', () => {
    render(<StatusBadge status="nonexistent" />);
    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveTextContent('Unknown');
    expect(badge).toHaveAttribute('data-status', 'unknown');
  });

  it('does not crash on empty string status', () => {
    render(<StatusBadge status="" />);
    expect(screen.getByTestId('status-badge')).toHaveTextContent('Unknown');
  });

  it('renders fallback for prototype keys like toString and constructor', () => {
    const protoKeys = ['toString', 'constructor', 'hasOwnProperty', 'valueOf'];
    protoKeys.forEach((key) => {
      const { unmount } = render(<StatusBadge status={key} />);
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveTextContent('Unknown');
      expect(badge).toHaveAttribute('data-status', 'unknown');
      unmount();
    });
  });
});

// =============================================================================
// VAL-FOUND-050: CrossRefToken Clickable
// =============================================================================
describe('CrossRefToken — Clickable (VAL-FOUND-050)', () => {
  it('renders the token text with brackets', () => {
    render(<CrossRefToken refId="F1" />);
    expect(screen.getByTestId('cross-ref-token')).toHaveTextContent('[F1]');
  });

  it('fires onClick with the reference ID when clicked', () => {
    const handleClick = vi.fn();
    render(<CrossRefToken refId="F1" onClick={handleClick} />);
    fireEvent.click(screen.getByTestId('cross-ref-token'));
    expect(handleClick).toHaveBeenCalledWith('F1');
  });

  it('fires onClick with complex reference ID', () => {
    const handleClick = vi.fn();
    render(<CrossRefToken refId="SC-AUTH-001" onClick={handleClick} />);
    fireEvent.click(screen.getByTestId('cross-ref-token'));
    expect(handleClick).toHaveBeenCalledWith('SC-AUTH-001');
  });

  it('stores ref-id as data attribute', () => {
    render(<CrossRefToken refId="ADR-003" />);
    expect(screen.getByTestId('cross-ref-token')).toHaveAttribute('data-ref-id', 'ADR-003');
  });
});

// =============================================================================
// VAL-FOUND-051: CrossRefToken Dangling Visual
// =============================================================================
describe('CrossRefToken — Dangling Visual (VAL-FOUND-051)', () => {
  it('applies line-through styling when dangling', () => {
    render(<CrossRefToken refId="F99" dangling />);
    const token = screen.getByTestId('cross-ref-token');
    expect(token.className).toContain('line-through');
  });

  it('applies dashed border when dangling', () => {
    render(<CrossRefToken refId="F99" dangling />);
    const token = screen.getByTestId('cross-ref-token');
    expect(token.className).toContain('border-dashed');
  });

  it('does not apply dangling styles when not dangling', () => {
    render(<CrossRefToken refId="F1" />);
    const token = screen.getByTestId('cross-ref-token');
    expect(token.className).not.toContain('line-through');
    expect(token.className).not.toContain('border-dashed');
  });

  it('accessible label includes "dangling" when dangling', () => {
    render(<CrossRefToken refId="F99" dangling />);
    expect(screen.getByTestId('cross-ref-token')).toHaveAttribute(
      'aria-label',
      'Reference F99 (dangling)',
    );
  });
});

// =============================================================================
// VAL-FOUND-052: ActionCard Renders
// =============================================================================
describe('ActionCard — Rendering (VAL-FOUND-052)', () => {
  it('renders title, description, and status', () => {
    render(
      <ActionCard title="Prepare Epic" description="Run the prepare-epic play" status="pending" />,
    );
    expect(screen.getByTestId('action-card-title')).toHaveTextContent('Prepare Epic');
    expect(screen.getByTestId('action-card-description')).toHaveTextContent(
      'Run the prepare-epic play',
    );
    expect(screen.getByTestId('status-badge')).toBeInTheDocument();
  });

  it('renders CTA button when provided', () => {
    const handleExecute = vi.fn();
    render(
      <ActionCard
        title="Quality Check"
        description="Run quality analysis"
        status="in-progress"
        cta={{ label: 'Run QA', playName: 'quality-check' }}
        onExecute={handleExecute}
      />,
    );
    expect(screen.getByTestId('cta-button')).toBeInTheDocument();
    expect(screen.getByText('Run QA')).toBeInTheDocument();
  });

  it('does not render CTA button when not provided', () => {
    render(<ActionCard title="Some Card" description="Desc" status="passing" />);
    expect(screen.queryByTestId('cta-button')).not.toBeInTheDocument();
  });
});

// =============================================================================
// VAL-FOUND-053: ContentSlot Renders
// =============================================================================
describe('ContentSlot — Rendering (VAL-FOUND-053)', () => {
  it('shows placeholder in idle state', () => {
    render(<ContentSlot state="idle" />);
    const slot = screen.getByTestId('content-slot');
    expect(slot).toHaveAttribute('data-state', 'idle');
    expect(slot).toHaveTextContent('Waiting for output…');
  });

  it('shows custom placeholder in idle state', () => {
    render(<ContentSlot state="idle" placeholder="Loading data..." />);
    expect(screen.getByTestId('content-slot')).toHaveTextContent('Loading data...');
  });

  it('shows streaming content in active state', () => {
    render(<ContentSlot state="active" content="Output line 1" />);
    const slot = screen.getByTestId('content-slot');
    expect(slot).toHaveAttribute('data-state', 'active');
    expect(screen.getByTestId('content-slot-content')).toHaveTextContent('Output line 1');
  });

  it('shows progress indicator when progress is provided', () => {
    render(<ContentSlot state="active" content="..." progress={0.5} />);
    expect(screen.getByTestId('content-slot-progress')).toBeInTheDocument();
    expect(screen.getByTestId('content-slot-progress')).toHaveStyle({ width: '50%' });
  });

  it('hides progress indicator when not provided', () => {
    render(<ContentSlot state="active" content="data" />);
    expect(screen.queryByTestId('content-slot-progress')).not.toBeInTheDocument();
  });
});

// =============================================================================
// VAL-FOUND-054: WikiTag Three States
// =============================================================================
describe('WikiTag — Three States (VAL-FOUND-054)', () => {
  it('renders pending state with tag text and play icon area', () => {
    render(<WikiTag text="research:query" state="pending" />);
    const tag = screen.getByTestId('wiki-tag');
    expect(tag).toHaveAttribute('data-state', 'pending');
    expect(screen.getByTestId('wiki-tag-text')).toHaveTextContent('research:query');
  });

  it('renders running state with spinner', () => {
    render(<WikiTag text="research:query" state="running" />);
    const tag = screen.getByTestId('wiki-tag');
    expect(tag).toHaveAttribute('data-state', 'running');
    expect(screen.getByTestId('wiki-tag-spinner')).toBeInTheDocument();
  });

  it('renders complete state with expand control', () => {
    render(<WikiTag text="research:query" state="complete" result="Found 3 results" />);
    const tag = screen.getByTestId('wiki-tag');
    expect(tag).toHaveAttribute('data-state', 'complete');
    expect(screen.getByTestId('wiki-tag-expand')).toBeInTheDocument();
  });

  it('complete state expands to show result on click', () => {
    render(<WikiTag text="research:query" state="complete" result="Found 3 results" />);
    expect(screen.queryByTestId('wiki-tag-result')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('wiki-tag-expand'));
    expect(screen.getByTestId('wiki-tag-result')).toHaveTextContent('Found 3 results');
  });

  it('complete state expand button toggles collapse', () => {
    render(<WikiTag text="research:query" state="complete" result="Found 3 results" />);
    fireEvent.click(screen.getByTestId('wiki-tag-expand'));
    expect(screen.getByTestId('wiki-tag-result')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('wiki-tag-expand'));
    expect(screen.queryByTestId('wiki-tag-result')).not.toBeInTheDocument();
  });

  it('all three states are visually distinct (different data-state)', () => {
    const { unmount: u1 } = render(<WikiTag text="t" state="pending" />);
    expect(screen.getByTestId('wiki-tag')).toHaveAttribute('data-state', 'pending');
    u1();

    const { unmount: u2 } = render(<WikiTag text="t" state="running" />);
    expect(screen.getByTestId('wiki-tag')).toHaveAttribute('data-state', 'running');
    u2();

    render(<WikiTag text="t" state="complete" />);
    expect(screen.getByTestId('wiki-tag')).toHaveAttribute('data-state', 'complete');
  });
});

// =============================================================================
// VAL-FOUND-055: CTAButton Renders
// =============================================================================
describe('CTAButton — Rendering (VAL-FOUND-055)', () => {
  it('renders a styled button with label', () => {
    render(<CTAButton label="Run Analysis" playName="quality-check" />);
    expect(screen.getByTestId('cta-button')).toHaveTextContent('Run Analysis');
  });

  it('stores play name as data attribute', () => {
    render(<CTAButton label="Execute" playName="specify-product" />);
    expect(screen.getByTestId('cta-button')).toHaveAttribute('data-play', 'specify-product');
  });

  it('fires onExecute with play name on click', () => {
    const handleExecute = vi.fn();
    render(<CTAButton label="Go" playName="prepare-epic" onExecute={handleExecute} />);
    fireEvent.click(screen.getByTestId('cta-button'));
    expect(handleExecute).toHaveBeenCalledWith('prepare-epic', undefined);
  });

  it('fires onExecute with play name and args on click', () => {
    const handleExecute = vi.fn();
    render(
      <CTAButton
        label="Go"
        playName="prepare-epic"
        args={{ epic: 'E1' }}
        onExecute={handleExecute}
      />,
    );
    fireEvent.click(screen.getByTestId('cta-button'));
    expect(handleExecute).toHaveBeenCalledWith('prepare-epic', { epic: 'E1' });
  });
});

// =============================================================================
// VAL-FOUND-056: InlineExpansion Open/Close
// =============================================================================
describe('InlineExpansion — Open/Close Toggle (VAL-FOUND-056)', () => {
  it('starts collapsed by default', () => {
    render(
      <InlineExpansion summary="Details">
        <p>Hidden content</p>
      </InlineExpansion>,
    );
    expect(screen.getByTestId('inline-expansion')).toHaveAttribute('data-open', 'false');
    expect(screen.queryByTestId('inline-expansion-content')).not.toBeInTheDocument();
  });

  it('opens when toggle is clicked', () => {
    render(
      <InlineExpansion summary="Details">
        <p>Revealed content</p>
      </InlineExpansion>,
    );
    fireEvent.click(screen.getByTestId('inline-expansion-toggle'));
    expect(screen.getByTestId('inline-expansion')).toHaveAttribute('data-open', 'true');
    expect(screen.getByTestId('inline-expansion-content')).toBeInTheDocument();
    expect(screen.getByText('Revealed content')).toBeInTheDocument();
  });

  it('closes when toggle is clicked again', () => {
    render(
      <InlineExpansion summary="Details">
        <p>Content</p>
      </InlineExpansion>,
    );
    fireEvent.click(screen.getByTestId('inline-expansion-toggle'));
    expect(screen.getByTestId('inline-expansion-content')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('inline-expansion-toggle'));
    expect(screen.queryByTestId('inline-expansion-content')).not.toBeInTheDocument();
  });

  it('toggle has correct aria-expanded attribute', () => {
    render(
      <InlineExpansion summary="Details">
        <p>Content</p>
      </InlineExpansion>,
    );
    const toggle = screen.getByTestId('inline-expansion-toggle');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('can start open with defaultOpen', () => {
    render(
      <InlineExpansion summary="Details" defaultOpen>
        <p>Pre-opened</p>
      </InlineExpansion>,
    );
    expect(screen.getByTestId('inline-expansion')).toHaveAttribute('data-open', 'true');
    expect(screen.getByText('Pre-opened')).toBeInTheDocument();
  });

  it('displays summary text', () => {
    render(
      <InlineExpansion summary="Entity details for F1">
        <p>Content</p>
      </InlineExpansion>,
    );
    expect(screen.getByTestId('inline-expansion-toggle')).toHaveTextContent(
      'Entity details for F1',
    );
  });
});

// =============================================================================
// VAL-FOUND-057: SearchBar Component
// =============================================================================
describe('SearchBar — Interactive (VAL-FOUND-057)', () => {
  it('triggers onSearch on Enter key', () => {
    const handleSearch = vi.fn();
    render(<SearchBar onSearch={handleSearch} />);
    const input = screen.getByTestId('search-bar-input');
    fireEvent.change(input, { target: { value: 'authentication' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(handleSearch).toHaveBeenCalledWith('authentication');
  });

  it('triggers onSearch after debounce delay', () => {
    const handleSearch = vi.fn();
    render(<SearchBar onSearch={handleSearch} debounceMs={300} />);
    const input = screen.getByTestId('search-bar-input');

    fireEvent.change(input, { target: { value: 'timeout' } });
    expect(handleSearch).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(handleSearch).toHaveBeenCalledWith('timeout');
  });

  it('clears input on Escape key', () => {
    render(<SearchBar onSearch={vi.fn()} />);
    const input = screen.getByTestId('search-bar-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'query' } });
    expect(input.value).toBe('query');

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input.value).toBe('');
  });

  it('shows loading indicator when isLoading is true', () => {
    render(<SearchBar isLoading />);
    expect(screen.getByTestId('search-bar-loading')).toBeInTheDocument();
  });

  it('does not show loading indicator by default', () => {
    render(<SearchBar />);
    expect(screen.queryByTestId('search-bar-loading')).not.toBeInTheDocument();
  });

  it('does not trigger onSearch for empty/whitespace queries on Enter', () => {
    const handleSearch = vi.fn();
    render(<SearchBar onSearch={handleSearch} />);
    const input = screen.getByTestId('search-bar-input');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(handleSearch).not.toHaveBeenCalled();
  });

  it('cancels debounce on Enter (fires immediately)', () => {
    const handleSearch = vi.fn();
    render(<SearchBar onSearch={handleSearch} debounceMs={500} />);
    const input = screen.getByTestId('search-bar-input');

    fireEvent.change(input, { target: { value: 'fast' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(handleSearch).toHaveBeenCalledTimes(1);
    expect(handleSearch).toHaveBeenCalledWith('fast');

    // Advancing timers should NOT trigger a second call
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(handleSearch).toHaveBeenCalledTimes(1);
  });
});

// =============================================================================
// VAL-FOUND-058: InstrumentSwitcher Component
// =============================================================================
describe('InstrumentSwitcher — Library Mode (VAL-FOUND-058)', () => {
  it('renders three instrument tabs', () => {
    render(<InstrumentSwitcher active="checklists" onChange={vi.fn()} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
  });

  it('highlights the active tab', () => {
    render(<InstrumentSwitcher active="checklists" onChange={vi.fn()} />);
    expect(screen.getByTestId('tab-checklists')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('tab-flight-deck')).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByTestId('tab-playbook')).toHaveAttribute('aria-selected', 'false');
  });

  it('fires onChange with the selected instrument id on click', () => {
    const handleChange = vi.fn();
    render(<InstrumentSwitcher active="checklists" onChange={handleChange} />);
    fireEvent.click(screen.getByTestId('tab-flight-deck'));
    expect(handleChange).toHaveBeenCalledWith('flight-deck');
  });

  it('fires onChange for playbook tab', () => {
    const handleChange = vi.fn();
    render(<InstrumentSwitcher active="checklists" onChange={handleChange} />);
    fireEvent.click(screen.getByTestId('tab-playbook'));
    expect(handleChange).toHaveBeenCalledWith('playbook');
  });

  it('renders buttons (not links) when onChange is provided', () => {
    render(<InstrumentSwitcher active="checklists" onChange={vi.fn()} />);
    const tab = screen.getByTestId('tab-checklists');
    expect(tab.tagName).toBe('BUTTON');
  });
});

// =============================================================================
// VAL-FOUND-059: MetricTile Component
// =============================================================================
describe('MetricTile — Rendering (VAL-FOUND-059)', () => {
  it('renders a label and numeric value', () => {
    render(<MetricTile label="Epics" value={3} />);
    expect(screen.getByTestId('metric-tile-label')).toHaveTextContent('Epics');
    expect(screen.getByTestId('metric-tile-value')).toHaveTextContent('3');
  });

  it('renders an optional icon', () => {
    render(<MetricTile label="Issues" value={7} icon={<span data-testid="icon">🔥</span>} />);
    expect(screen.getByTestId('metric-tile-icon')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('does not render icon wrapper when icon is not provided', () => {
    render(<MetricTile label="Devs" value={2} />);
    expect(screen.queryByTestId('metric-tile-icon')).not.toBeInTheDocument();
  });

  it('renders 0 value correctly', () => {
    render(<MetricTile label="Empty" value={0} />);
    expect(screen.getByTestId('metric-tile-value')).toHaveTextContent('0');
  });
});

// =============================================================================
// VAL-FOUND-060: EpicSummary Component
// =============================================================================
describe('EpicSummary — Rendering (VAL-FOUND-060)', () => {
  const defaultProps = {
    name: 'E1: Authentication',
    developer: 'kapil',
    stage: 'Implementation',
    timestamp: '15m ago',
    statusColor: 'green' as const,
  };

  it('renders all required fields', () => {
    render(<EpicSummary {...defaultProps} />);
    expect(screen.getByTestId('epic-summary-name')).toHaveTextContent('E1: Authentication');
    expect(screen.getByTestId('epic-summary-developer')).toHaveTextContent('kapil');
    expect(screen.getByTestId('epic-summary-stage')).toHaveTextContent('Implementation');
    expect(screen.getByTestId('epic-summary-timestamp')).toHaveTextContent('15m ago');
  });

  it('renders green status color indicator', () => {
    render(<EpicSummary {...defaultProps} statusColor="green" />);
    const status = screen.getByTestId('epic-summary-status');
    expect(status.className).toContain('bg-emerald-500');
  });

  it('renders yellow status color indicator', () => {
    render(<EpicSummary {...defaultProps} statusColor="yellow" />);
    const status = screen.getByTestId('epic-summary-status');
    expect(status.className).toContain('bg-amber-500');
  });

  it('renders red status color indicator', () => {
    render(<EpicSummary {...defaultProps} statusColor="red" />);
    const status = screen.getByTestId('epic-summary-status');
    expect(status.className).toContain('bg-red-500');
  });

  it('status indicator has accessible label', () => {
    render(<EpicSummary {...defaultProps} statusColor="yellow" />);
    expect(screen.getByTestId('epic-summary-status')).toHaveAttribute(
      'aria-label',
      'Status: yellow',
    );
  });
});

// =============================================================================
// VAL-FOUND-061: ChecklistItem All States
// =============================================================================
describe('ChecklistItem — All States (VAL-FOUND-061)', () => {
  it('renders done state with ● icon, non-interactive', () => {
    const handleClick = vi.fn();
    render(<ChecklistItem label="Step 1" state="done" onClick={handleClick} />);
    const item = screen.getByTestId('checklist-item');
    expect(item).toHaveAttribute('data-state', 'done');
    expect(screen.getByTestId('checklist-item-icon')).toHaveTextContent('●');
    fireEvent.click(item);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders in-progress state with ◐ icon, interactive', () => {
    const handleClick = vi.fn();
    render(<ChecklistItem label="Step 2" state="in-progress" onClick={handleClick} />);
    const item = screen.getByTestId('checklist-item');
    expect(item).toHaveAttribute('data-state', 'in-progress');
    expect(screen.getByTestId('checklist-item-icon')).toHaveTextContent('◐');
    fireEvent.click(item);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders pending state with ○ icon, interactive', () => {
    const handleClick = vi.fn();
    render(<ChecklistItem label="Step 3" state="pending" onClick={handleClick} />);
    const item = screen.getByTestId('checklist-item');
    expect(item).toHaveAttribute('data-state', 'pending');
    expect(screen.getByTestId('checklist-item-icon')).toHaveTextContent('○');
    fireEvent.click(item);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders locked state with ◌ icon, non-interactive', () => {
    const handleClick = vi.fn();
    render(<ChecklistItem label="Step 4" state="locked" onClick={handleClick} />);
    const item = screen.getByTestId('checklist-item');
    expect(item).toHaveAttribute('data-state', 'locked');
    expect(screen.getByTestId('checklist-item-icon')).toHaveTextContent('◌');
    fireEvent.click(item);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('locked state has muted visual (reduced opacity)', () => {
    render(<ChecklistItem label="Locked" state="locked" />);
    const item = screen.getByTestId('checklist-item');
    expect(item.className).toContain('opacity-50');
  });

  it('done state has line-through text', () => {
    render(<ChecklistItem label="Done" state="done" />);
    const label = screen.getByTestId('checklist-item-label');
    expect(label.className).toContain('line-through');
  });

  it('interactive items have role="button" and are keyboard-accessible', () => {
    render(<ChecklistItem label="Pending" state="pending" onClick={vi.fn()} />);
    const item = screen.getByTestId('checklist-item');
    expect(item).toHaveAttribute('role', 'button');
    expect(item).toHaveAttribute('tabindex', '0');
  });

  it('non-interactive items do not have role="button"', () => {
    render(<ChecklistItem label="Done" state="done" />);
    const item = screen.getByTestId('checklist-item');
    expect(item).not.toHaveAttribute('role');
  });
});

// =============================================================================
// VAL-FOUND-062: Breadcrumb Component
// =============================================================================
describe('Breadcrumb — Library Mode (VAL-FOUND-062)', () => {
  const segments: BreadcrumbSegment[] = [
    { label: 'Home', href: '/checklists' },
    { label: 'Playbook', href: '/playbook' },
    { label: 'E1' },
  ];

  it('renders navigation segments separated by ›', () => {
    render(<Breadcrumb segments={segments} onNavigate={vi.fn()} />);
    const separators = screen.getAllByText('›');
    expect(separators).toHaveLength(2);
  });

  it('renders first two segments as clickable links', () => {
    render(<Breadcrumb segments={segments} onNavigate={vi.fn()} />);
    expect(screen.getByTestId('breadcrumb-link-0')).toBeInTheDocument();
    expect(screen.getByTestId('breadcrumb-link-1')).toBeInTheDocument();
  });

  it('renders last segment as plain text (not a link)', () => {
    render(<Breadcrumb segments={segments} onNavigate={vi.fn()} />);
    const lastSegment = screen.getByText('E1');
    expect(lastSegment).toHaveAttribute('aria-current', 'page');
    expect(lastSegment.tagName).toBe('SPAN');
  });

  it('fires onNavigate callback when a link segment is clicked', () => {
    const handleNavigate = vi.fn();
    render(<Breadcrumb segments={segments} onNavigate={handleNavigate} />);
    fireEvent.click(screen.getByTestId('breadcrumb-link-0'));
    expect(handleNavigate).toHaveBeenCalledWith('/checklists');
  });

  it('fires onNavigate for second segment', () => {
    const handleNavigate = vi.fn();
    render(<Breadcrumb segments={segments} onNavigate={handleNavigate} />);
    fireEvent.click(screen.getByTestId('breadcrumb-link-1'));
    expect(handleNavigate).toHaveBeenCalledWith('/playbook');
  });

  it('renders buttons (not anchor links) when onNavigate is provided', () => {
    render(<Breadcrumb segments={segments} onNavigate={vi.fn()} />);
    const link = screen.getByTestId('breadcrumb-link-0');
    expect(link.tagName).toBe('BUTTON');
  });

  it('renders with single segment (just current page)', () => {
    render(<Breadcrumb segments={[{ label: 'Home' }]} onNavigate={vi.fn()} />);
    expect(screen.getByText('Home')).toHaveAttribute('aria-current', 'page');
    expect(screen.queryAllByText('›')).toHaveLength(0);
  });
});
