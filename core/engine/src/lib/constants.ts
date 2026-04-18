/** Instrument identifiers used for routing and tab switching */
export type InstrumentId = 'product' | 'checklists' | 'flight-deck' | 'playbook';

export interface InstrumentTab {
  id: InstrumentId;
  label: string;
  href: string;
}

export const INSTRUMENTS: readonly InstrumentTab[] = [
  { id: 'product', label: 'Product', href: '/product' },
  { id: 'checklists', label: 'Playbook', href: '/checklists' },
  { id: 'flight-deck', label: 'Auto Pilot', href: '/flight-deck' },
  { id: 'playbook', label: 'Explorer', href: '/playbook' },
] as const;

export const DEFAULT_INSTRUMENT: InstrumentId = 'checklists';

/**
 * @deprecated Use config.project.name via getConfig() instead.
 * Project name is now read from .garura/core/config.yaml at runtime.
 * This constant is retained only for backward compatibility in tests.
 */
export const PROJECT_NAME = 'Garura';
