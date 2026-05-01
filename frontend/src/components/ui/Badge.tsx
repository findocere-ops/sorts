'use client';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'cyan' | 'orange' | 'gold' | 'success' | 'warning' | 'danger'
    // legacy aliases from old page.tsx
    | 'teal' | 'accent' | 'amber' | 'rose' | 'purple' | 'emerald';
  className?: string;
}

// Map old/legacy variant names → CSS class names from globals.css
const variantClass: Record<string, string> = {
  default:  'badge-default',
  cyan:     'badge-cyan',
  orange:   'badge-orange',
  gold:     'badge-gold',
  success:  'badge-success',
  warning:  'badge-warning',
  danger:   'badge-danger',
  // legacy aliases
  teal:     'badge-cyan',
  accent:   'badge-cyan',
  amber:    'badge-gold',
  rose:     'badge-danger',
  purple:   'badge-default',
  emerald:  'badge-success',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={['badge', variantClass[variant] ?? 'badge-default', className].filter(Boolean).join(' ')}>
      {children}
    </span>
  );
}

export function PrivacyBadge({ className = '' }: { className?: string }) {
  return (
    <span className={['privacy-badge', className].filter(Boolean).join(' ')}>
      <svg width="10" height="12" viewBox="0 0 10 12" fill="none" aria-hidden="true">
        <path d="M5 0L9.5 2V6C9.5 8.8 7.5 11.2 5 12C2.5 11.2 0.5 8.8 0.5 6V2L5 0Z" fill="currentColor" opacity="0.85" />
      </svg>
      Privacy enforced
    </span>
  );
}
