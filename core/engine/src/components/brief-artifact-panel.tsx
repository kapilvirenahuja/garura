'use client';

export interface BriefArtifactSummary {
  readonly path: string;
  readonly title: string;
  readonly preview: string;
  readonly content: string;
}

interface BriefArtifactPanelProps {
  readonly artifacts: ReadonlyArray<BriefArtifactSummary>;
}

export function BriefArtifactPanel({ artifacts }: BriefArtifactPanelProps) {
  if (artifacts.length === 0) return null;

  return (
    <div
      data-testid="brief-artifact-panel"
      className="mt-3 rounded-md border border-emerald-900/70 bg-emerald-950/20 px-4 py-3"
    >
      <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
        Available Briefs
      </div>
      <div className="mt-2 space-y-2">
        {artifacts.map((artifact) => (
          <details
            key={artifact.path}
            className="rounded border border-emerald-950/70 bg-black/20 px-3 py-2"
          >
            <summary className="cursor-pointer list-none">
              <div className="text-sm font-medium text-emerald-100">{artifact.title}</div>
              <div className="mt-1 text-xs text-emerald-300/80">{artifact.path}</div>
              <div className="mt-2 text-sm text-slate-300">{artifact.preview}</div>
            </summary>
            <pre className="mt-3 whitespace-pre-wrap border-t border-emerald-950/70 pt-3 text-xs text-slate-300">
              {artifact.content}
            </pre>
          </details>
        ))}
      </div>
    </div>
  );
}
