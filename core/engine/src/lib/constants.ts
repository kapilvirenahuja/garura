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

/** Project name — will be derived from config in future; placeholder for now */
export const PROJECT_NAME = 'MDB TaskFlow';
