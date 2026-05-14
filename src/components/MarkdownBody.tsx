'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface Props {
  children: string;
  className?: string;
}

const components: Components = {
  // Paragraphs
  p: ({ children }) => (
    <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
  ),
  // Bullet + ordered lists
  ul: ({ children }) => (
    <ul className="mb-2 last:mb-0 space-y-1 pl-4">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 last:mb-0 space-y-1 pl-4 list-decimal">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed flex gap-1.5 items-start">
      <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: 'var(--accent)', opacity: 0.7 }} />
      <span>{children}</span>
    </li>
  ),
  // Bold
  strong: ({ children }) => (
    <strong className="font-semibold" style={{ color: 'var(--text)' }}>{children}</strong>
  ),
  // Italic
  em: ({ children }) => (
    <em className="italic opacity-80">{children}</em>
  ),
  // No headers — strip them gracefully to bold text
  h1: ({ children }) => <p className="font-semibold mb-1">{children}</p>,
  h2: ({ children }) => <p className="font-semibold mb-1">{children}</p>,
  h3: ({ children }) => <p className="font-semibold mb-1">{children}</p>,
  // Blockquotes
  blockquote: ({ children }) => (
    <div className="pl-3 border-l-2 border-indigo-400/40 opacity-70 mb-2">{children}</div>
  ),
  // Inline code
  code: ({ children }) => (
    <code className="px-1 py-0.5 rounded text-xs font-mono"
      style={{ background: 'rgba(99,102,241,.12)', color: 'var(--accent)' }}>
      {children}
    </code>
  ),
  // No block-level pre
  pre: ({ children }) => <div className="mb-2">{children}</div>,
};

export default function MarkdownBody({ children, className = '' }: Props) {
  return (
    <div
      className={`text-sm leading-relaxed ${className}`}
      style={{ color: 'var(--text)' }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
