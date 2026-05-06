'use client';

/** Per-post creator switch. Sets `preview_eligible` so non-members can read
 *  the body under the preview-quota cap.
 *
 *  This is a presentational component — the parent owns the persistence
 *  call (PATCH /api/content/:communityId/:postId). */
export interface PreviewToggleProps {
  postId: string;
  enabled: boolean;
  disabled?: boolean;
  onChange: (postId: string, next: boolean) => void;
}

export function PreviewToggle({ postId, enabled, disabled, onChange }: PreviewToggleProps) {
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        userSelect: 'none',
      }}
    >
      <input
        type="checkbox"
        checked={enabled}
        disabled={disabled}
        onChange={(e) => onChange(postId, e.target.checked)}
      />
      <span className="t-xs" style={{ color: enabled ? 'var(--cyan)' : 'var(--text-2)' }}>
        Preview-eligible
      </span>
    </label>
  );
}
