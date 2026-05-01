/**
 * Icon — single inline-SVG icon set ported from
 * handoff/sorts/project/sorts-app.jsx (lines 85-124).
 *
 * Keeping this self-contained avoids a 100KB icon-library dependency
 * and matches the design handoff exactly.
 */

import * as React from 'react';

export type IconName =
  | 'grid'
  | 'home'
  | 'plus'
  | 'file'
  | 'book'
  | 'calendar'
  | 'layers'
  | 'invite'
  | 'chart'
  | 'bot'
  | 'shield'
  | 'settings'
  | 'feed'
  | 'library'
  | 'trophy'
  | 'crown'
  | 'user'
  | 'bell'
  | 'search'
  | 'lock'
  | 'eye'
  | 'eye_off'
  | 'check'
  | 'chevron_right'
  | 'chevron_down'
  | 'arrow_right'
  | 'copy'
  | 'qr'
  | 'wallet'
  | 'play'
  | 'upload'
  | 'download'
  | 'bolt'
  | 'gift';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  className?: string;
  'aria-label'?: string;
}

export function Icon({
  name,
  size = 16,
  color = 'currentColor',
  className,
  'aria-label': ariaLabel,
}: IconProps) {
  const stroke = {
    stroke: color,
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  const paths: Record<IconName, React.ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" {...stroke} />
        <rect x="14" y="3" width="7" height="7" rx="1" {...stroke} />
        <rect x="3" y="14" width="7" height="7" rx="1" {...stroke} />
        <rect x="14" y="14" width="7" height="7" rx="1" {...stroke} />
      </>
    ),
    home: <path d="M3 12L12 3l9 9M5 10v10h14V10" {...stroke} />,
    plus: <path d="M12 5v14M5 12h14" {...stroke} />,
    file: (
      <>
        <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z" {...stroke} />
        <path d="M14 3v6h6" {...stroke} />
      </>
    ),
    book: (
      <>
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20V3H6.5A2.5 2.5 0 004 5.5v14z" {...stroke} />
        <path d="M4 19.5V21h16" {...stroke} />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" {...stroke} />
        <path d="M3 9h18M8 3v4M16 3v4" {...stroke} />
      </>
    ),
    layers: (
      <>
        <path d="M12 3l9 5-9 5-9-5 9-5z" {...stroke} />
        <path d="M3 13l9 5 9-5M3 18l9 5 9-5" {...stroke} />
      </>
    ),
    invite: (
      <>
        <path d="M3 7l9 6 9-6M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" {...stroke} />
      </>
    ),
    chart: <path d="M3 21V3M3 21h18M7 14l4-4 3 3 5-6" {...stroke} />,
    bot: (
      <>
        <rect x="4" y="8" width="16" height="12" rx="2" {...stroke} />
        <path d="M9 14h.01M15 14h.01M12 4v4M8 8h8" {...stroke} />
      </>
    ),
    shield: <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" {...stroke} />,
    settings: (
      <>
        <circle cx="12" cy="12" r="3" {...stroke} />
        <path
          d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1A1.7 1.7 0 008 19.4a1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H2a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H8a1.7 1.7 0 001-1.5V2a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V8a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"
          {...stroke}
        />
      </>
    ),
    feed: (
      <>
        <path d="M4 11a8 8 0 018 8M4 4a16 16 0 0116 16M5 18a1 1 0 100 2 1 1 0 000-2z" {...stroke} />
      </>
    ),
    library: <path d="M3 5a2 2 0 012-2h2v18H5a2 2 0 01-2-2V5zM10 3h4v18h-4zM17 3l4 1-3 17-4-1z" {...stroke} />,
    trophy: <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM3 7a3 3 0 003 3M21 7a3 3 0 01-3 3" {...stroke} />,
    crown: <path d="M2 7l5 4 5-7 5 7 5-4-2 11H4z" {...stroke} />,
    user: (
      <>
        <circle cx="12" cy="8" r="4" {...stroke} />
        <path d="M4 21a8 8 0 0116 0" {...stroke} />
      </>
    ),
    bell: <path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9zM10 21a2 2 0 004 0" {...stroke} />,
    search: (
      <>
        <circle cx="11" cy="11" r="7" {...stroke} />
        <path d="M21 21l-4.35-4.35" {...stroke} />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="11" width="16" height="11" rx="2" {...stroke} />
        <path d="M8 11V7a4 4 0 018 0v4" {...stroke} />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" {...stroke} />
        <circle cx="12" cy="12" r="3" {...stroke} />
      </>
    ),
    eye_off: (
      <path
        d="M9.9 4.24A9.12 9.12 0 0112 4c6 0 10 7 10 7a17.5 17.5 0 01-3.36 4.06M6.61 6.61A17.5 17.5 0 002 11s4 7 10 7a9.12 9.12 0 005.39-1.61M14.12 14.12A3 3 0 119.88 9.88M1 1l22 22"
        {...stroke}
      />
    ),
    check: <path d="M5 12l5 5L20 7" {...stroke} />,
    chevron_right: <path d="M9 6l6 6-6 6" {...stroke} />,
    chevron_down: <path d="M6 9l6 6 6-6" {...stroke} />,
    arrow_right: <path d="M5 12h14M13 5l7 7-7 7" {...stroke} />,
    copy: (
      <>
        <rect x="9" y="9" width="13" height="13" rx="2" {...stroke} />
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" {...stroke} />
      </>
    ),
    qr: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" {...stroke} />
        <rect x="14" y="3" width="7" height="7" rx="1" {...stroke} />
        <rect x="3" y="14" width="7" height="7" rx="1" {...stroke} />
        <path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20v1" {...stroke} />
      </>
    ),
    wallet: (
      <>
        <rect x="2" y="6" width="20" height="14" rx="2" {...stroke} />
        <path d="M22 12h-4a2 2 0 100 4h4" {...stroke} />
      </>
    ),
    play: <path d="M6 4l14 8-14 8z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" fill="none" />,
    upload: <path d="M12 3v14M5 10l7-7 7 7M3 21h18" {...stroke} />,
    download: <path d="M12 21V7M5 14l7 7 7-7M3 3h18" {...stroke} />,
    bolt: <path d="M13 2L3 14h7l-2 8 10-12h-7l2-8z" {...stroke} />,
    gift: (
      <>
        <rect x="3" y="8" width="18" height="13" rx="1" {...stroke} />
        <path d="M3 12h18M12 8v13M7 8a3 3 0 010-6 4 4 0 015 4 4 4 0 015-4 3 3 0 010 6" {...stroke} />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={{ display: 'block', flexShrink: 0 }}
      role={ariaLabel ? 'img' : 'presentation'}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    >
      {paths[name]}
    </svg>
  );
}
