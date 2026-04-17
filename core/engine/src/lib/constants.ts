/** Instrument identifiers used for routing and tab switching */
export type InstrumentId = 'checklists' | 'flight-deck' | 'playbook';

export interface InstrumentTab {
  id: InstrumentId;
  label: string;
  href: string;
}

export const INSTRUMENTS: readonly InstrumentTab[] = [
  { id: 'checklists', label: 'Checklists', href: '/checklists' },
  { id: 'flight-deck', label: 'Flight Deck', href: '/flight-deck' },
  { id: 'playbook', label: 'Playbook', href: '/playbook' },
] as const;

export const DEFAULT_INSTRUMENT: InstrumentId = 'checklists';

/**
 * @deprecated Use config.project.name via getConfig() instead.
 * Project name is now read from .meridian/core/config.yaml at runtime.
 * This constant is retained only for backward compatibility in tests.
 */
export const PROJECT_NAME = 'MDB TaskFlow';
