import { clsx } from 'clsx';

type Glow = 'teal' | 'purple' | 'none';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  glow?: Glow;
  as?: 'div' | 'section' | 'article';
}

export default function GlassPanel({
  children,
  className,
  glow = 'teal',
  as: Tag = 'div',
}: GlassPanelProps) {
  return (
    <Tag
      className={clsx(
        'glass-read',
        glow === 'purple' && 'glass-panel-glow-purple',
        glow === 'none' && '!shadow-[var(--shadow-lg)]',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
