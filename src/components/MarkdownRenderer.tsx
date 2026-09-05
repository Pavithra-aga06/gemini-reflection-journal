import React from 'react';
import Markdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-stone max-w-none text-stone-800 leading-relaxed space-y-3 font-normal text-sm md:text-base selection:bg-amber-100">
      <Markdown>{content}</Markdown>
    </div>
  );
};
