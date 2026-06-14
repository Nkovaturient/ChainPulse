'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface Props {
  children: string;
  className?: string;
}

const components: Components = {
  p: ({ children }) => (
    <p className="mb-2.5 last:mb-0 leading-[1.65]">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-2.5 last:mb-0 space-y-1.5 pl-4">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2.5 last:mb-0 space-y-1.5 pl-4 list-decimal">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="leading-[1.65] flex gap-1.5 items-start">
      <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: 'var(--accent3)', opacity: 0.9 }} />
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }) => (
    <strong className="font-bold" style={{ color: 'var(--text-read)' }}>{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic" style={{ color: 'var(--text-muted-read)' }}>{children}</em>
  ),
  h1: ({ children }) => <p className="font-bold mb-1.5" style={{ color: 'var(--text-read)' }}>{children}</p>,
  h2: ({ children }) => <p className="font-bold mb-1.5" style={{ color: 'var(--text-read)' }}>{children}</p>,
  h3: ({ children }) => <p className="font-bold mb-1.5" style={{ color: 'var(--text-read)' }}>{children}</p>,
  blockquote: ({ children }) => (
    <div className="pl-3 border-l-2 mb-2.5" style={{ borderColor: 'rgba(99,102,241,.45)', color: 'var(--text-muted-read)' }}>
      {children}
    </div>
  ),
  code: ({ children }) => (
    <code className="px-1 py-0.5 rounded text-xs font-mono"
      style={{ background: 'rgba(99,102,241,.18)', color: '#a5b4fc' }}>
      {children}
    </code>
  ),
  pre: ({ children }) => <div className="mb-2">{children}</div>,
};

export default function MarkdownBody({ children, className = '' }: Props) {
  return (
    <div
      className={`text-[15px] leading-relaxed ${className}`}
      style={{ color: 'var(--text-read)' }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
