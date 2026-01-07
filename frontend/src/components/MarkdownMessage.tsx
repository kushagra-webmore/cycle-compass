import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export function MarkdownMessage({ content, className }: MarkdownMessageProps) {
  return (
    <div className={cn('prose prose-sm max-w-none dark:prose-invert', className)}>
      <ReactMarkdown
        components={{
          // Paragraphs
          p: ({ node, children, ...props }) => <p className="mb-2 last:mb-0" {...props}>{children}</p>,
          
          // Bold text
          strong: ({ node, children, ...props }) => <strong className="font-semibold text-foreground" {...props}>{children}</strong>,
          
          // Italic text
          em: ({ node, children, ...props }) => <em className="italic" {...props}>{children}</em>,
          
          // Lists
          ul: ({ node, children, ...props }) => <ul className="list-disc list-inside space-y-1 my-2" {...props}>{children}</ul>,
          ol: ({ node, children, ...props }) => <ol className="list-decimal list-inside space-y-1 my-2" {...props}>{children}</ol>,
          li: ({ node, children, ...props }) => <li className="ml-2" {...props}>{children}</li>,
          
          // Headings
          h1: ({ node, children, ...props }) => <h1 className="text-xl font-bold mt-4 mb-2" {...props}>{children}</h1>,
          h2: ({ node, children, ...props }) => <h2 className="text-lg font-semibold mt-3 mb-2" {...props}>{children}</h2>,
          h3: ({ node, children, ...props }) => <h3 className="text-base font-semibold mt-2 mb-1" {...props}>{children}</h3>,
          
          // Code
          code: ({ node, className, children, ...props }: any) => {
            const isInline = !className;
            return isInline ? (
              <code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono" {...props}>{children}</code>
            ) : (
              <code className="block p-2 rounded bg-muted text-sm font-mono overflow-x-auto" {...props}>{children}</code>
            );
          },
          
          // Links
          a: ({ node, children, href, ...props }) => (
            <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props}>
              {children}
            </a>
          ),
          
          // Blockquotes
          blockquote: ({ node, children, ...props }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic my-2" {...props}>{children}</blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
