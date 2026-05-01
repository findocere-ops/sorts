/**
 * SortsLogoMark — circular S mark with cyan→orange gradient stripes.
 * Renders the official PNG asset from /assets/sorts-logo-mark-trans.png.
 *
 * Uses an <img> element (not a CSS background-image div) so the full
 * circular mark is always visible without edge clipping.
 */

import * as React from 'react';

export interface SortsLogoMarkProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function SortsLogoMark({ size = 36, className, style }: SortsLogoMarkProps) {
  return (
    <img
      src="/assets/sorts-logo-mark-trans.png"
      alt="SORTS"
      width={size}
      height={size}
      className={className}
      style={{
        display: 'block',
        flexShrink: 0,
        objectFit: 'contain',
        ...style,
      }}
    />
  );
}
