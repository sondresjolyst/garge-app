'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

interface MarkdownTextProps {
    children: string | null | undefined;
    className?: string;
}

export default function MarkdownText({ children, className = '' }: MarkdownTextProps) {
    if (!children) return null;
    return (
        <div className={className}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
                components={{
                    a: ({ ...props }) => (
                        <a
                            {...props}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-400 hover:text-sky-300 underline break-all"
                        />
                    ),
                    ul: ({ ...props }) => <ul {...props} className="list-disc list-inside space-y-0.5 text-xs text-gray-500" />,
                    ol: ({ ...props }) => <ol {...props} className="list-decimal list-inside space-y-0.5 text-xs text-gray-500" />,
                    li: ({ ...props }) => <li {...props} className="text-xs text-gray-500 break-words" />,
                    strong: ({ ...props }) => <strong {...props} className="font-semibold text-gray-300" />,
                    em: ({ ...props }) => <em {...props} className="italic text-gray-400" />,
                    p: ({ ...props }) => <p {...props} className="text-xs text-gray-500 break-words" />,
                    code: ({ ...props }) => <code {...props} className="px-1 py-0.5 rounded bg-gray-800/60 text-gray-300 text-[11px] font-mono" />,
                    h1: ({ ...props }) => <h1 {...props} className="text-sm font-semibold text-gray-200 mt-1" />,
                    h2: ({ ...props }) => <h2 {...props} className="text-sm font-semibold text-gray-200 mt-1" />,
                    h3: ({ ...props }) => <h3 {...props} className="text-xs font-semibold text-gray-200 mt-1" />,
                    blockquote: ({ ...props }) => <blockquote {...props} className="border-l-2 border-gray-700 pl-2 text-xs text-gray-500 italic" />,
                }}
            >
                {children}
            </ReactMarkdown>
        </div>
    );
}
