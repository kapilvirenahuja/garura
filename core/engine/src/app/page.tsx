import ChecklistsPage from './checklists/page';

/**
 * Root page — renders the Checklists instrument directly so that
 * GET / returns HTTP 200 (not a 307 redirect).
 *
 * Fulfills: VAL-FOUND-001
 */
export default function HomePage() {
  return <ChecklistsPage />;
}
