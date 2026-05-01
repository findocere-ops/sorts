'use client';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  elevated?: boolean;
}

export function Card({ children, className = '', onClick, elevated }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-xl border border-border
        ${elevated ? 'bg-bg-elevated' : 'bg-bg-surface'}
        ${onClick ? 'cursor-pointer hover:border-border-mid transition-colors duration-150' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function StatCard({ label, value, sub, accent }: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-bg-elevated border border-border rounded-xl p-4">
      <p className="text-text-2 text-xs mb-1.5">{label}</p>
      <p className={`text-xl font-semibold font-mono tabular-nums ${accent ? 'text-accent' : 'text-text-1'}`}>
        {value}
      </p>
      {sub && <p className="text-text-3 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}
