import { useState } from 'preact/hooks';

interface ExpandableTextProps {
  text: string;
  collapsedLines?: 2 | 3;
  textClassName?: string;
}

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

function renderLineWithLinks(line: string, lineIndex: number) {
  const parts = line.split(URL_PATTERN);
  return parts.map((part, partIndex) => {
    if (/^https?:\/\/\S+$/.test(part)) {
      return (
        <a
          key={`l-${lineIndex}-${partIndex}`}
          href={part}
          class="link link-primary break-all"
          target="_blank"
          rel="noopener noreferrer"
        >
          {part}
        </a>
      );
    }
    return <span key={`t-${lineIndex}-${partIndex}`}>{part}</span>;
  });
}

export function ExpandableText({
  text,
  collapsedLines = 3,
  textClassName = 'text-base-content/70',
}: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const lines = text.split('\n');

  if (!text) return null;

  return (
    <div class="space-y-2">
      <p class={`${textClassName} ${!expanded ? (collapsedLines === 2 ? 'line-clamp-2' : 'line-clamp-3') : ''}`}>
        {lines.map((line, index) => (
          <span key={`line-${index}`}>
            {index > 0 && <br />}
            {renderLineWithLinks(line, index)}
          </span>
        ))}
      </p>
      <button
        type="button"
        class="btn btn-ghost btn-xs px-1 min-h-0 h-auto"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class={`h-3.5 w-3.5 ${expanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.169l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
        {expanded ? '閉じる' : '続きを読む'}
      </button>
    </div>
  );
}
