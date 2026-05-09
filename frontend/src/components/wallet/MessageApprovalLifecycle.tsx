'use client';

import type { MessageApprovalState } from '@sorts/shared';

const STATES: MessageApprovalState[] = [
  'prepared',
  'awaiting-approval',
  'pending-signature',
  'signed',
  'broadcasted',
  'failed',
];

/** 6-state stepper. Read-only on Day 6 — interactive flows are post-MVP. */
export function MessageApprovalLifecycle({ current }: { current: MessageApprovalState }) {
  const failed = current === 'failed';
  return (
    <section
      className="card-elevated"
      style={{ display: 'grid', gap: 10, padding: 18, borderRadius: 14 }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <p className="t-label" style={{ color: 'var(--cyan)' }}>Message approval lifecycle</p>
        <span className="t-xs" style={{ color: 'var(--text-3, #999)' }}>read-only · pre-alpha</span>
      </header>
      <ol style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 0, margin: 0, listStyle: 'none' }}>
        {STATES.filter((s): s is Exclude<MessageApprovalState, 'failed'> => s !== 'failed').map((s, i) => {
          const happy = STATES.filter((st): st is Exclude<MessageApprovalState, 'failed'> => st !== 'failed');
          const idx = current === 'failed' ? -1 : happy.indexOf(current);
          const reached = !failed && idx >= i;
          const active = !failed && current === s;
          return (
            <li
              key={s}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 999,
                background: active
                  ? 'rgba(45,232,224,0.15)'
                  : reached
                    ? 'rgba(45,232,224,0.06)'
                    : 'transparent',
                border: `1px solid ${active ? 'var(--cyan)' : 'var(--border-subtle)'}`,
                color: active ? 'var(--cyan)' : reached ? 'var(--text-1)' : 'var(--text-3, #999)',
                fontSize: 12,
                fontWeight: active ? 600 : 500,
              }}
            >
              <span aria-hidden>{i + 1}</span>
              {s}
            </li>
          );
        })}
      </ol>
      {failed && (
        <p className="t-xs" style={{ color: 'var(--danger)', margin: 0 }}>
          State: failed
        </p>
      )}
    </section>
  );
}
