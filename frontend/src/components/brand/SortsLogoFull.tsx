/**
 * SortsLogoFull — brand mark + SORTS wordmark, with optional tagline below.
 * Mirrors the lockup defined in handoff/sorts/project/sorts-app.jsx (lines 133-141).
 *
 * The wordmark uses Space Grotesk (loaded in globals.css).
 * The mark renders the official PNG asset via SortsLogoMark.
 */

import * as React from 'react';
import { SortsLogoMark } from './SortsLogoMark';

export interface SortsLogoFullProps {
  markSize?: number;
  wordmarkSize?: number;
  showTagline?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function SortsLogoFull({
  markSize = 30,
  wordmarkSize = 16,
  showTagline = false,
  className,
  style,
}: SortsLogoFullProps) {
  return (
    <div
      className={className}
      style={{ display: 'flex', alignItems: 'center', gap: 12, ...style }}
    >
      <SortsLogoMark size={markSize} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span className="wordmark" style={{ fontSize: wordmarkSize }}>
          SORTS
        </span>
        {showTagline && (
          <span className="tagline">Confidential Community Protocol</span>
        )}
      </div>
    </div>
  );
}
