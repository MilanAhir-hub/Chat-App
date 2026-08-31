import { useEffect, useState } from 'react';

const DEFAULT_PLACEHOLDERS = [
  'Say something...',
  'Type a message...',
  'Share your thoughts...',
  'Join the conversation...',
  'Send an emoji...',
  'Share a file...',
];

interface AnimatedPlaceholderProps {
  placeholders?: string[];
  /** Stops the animation loop entirely (e.g. while the user is typing). */
  paused?: boolean;
}

/**
 * Self-contained typing animation for the input placeholder.
 *
 * All animation state lives in this component so the parent chat page
 * never re-renders while the placeholder cycles (previously the animation
 * state sat in the page component and re-rendered the whole chat 10-20
 * times per second).
 */
export const AnimatedPlaceholder = ({
  placeholders = DEFAULT_PLACEHOLDERS,
  paused = false,
}: AnimatedPlaceholderProps) => {
  const [text, setText] = useState('');
  const [index, setIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (paused) return;

    const currentFullText = placeholders[index] ?? '';
    const atEnd = !isDeleting && text.length === currentFullText.length;
    const atStart = isDeleting && text.length === 0;

    // Hold at the ends like a real typing animation, otherwise type/delete per tick.
    const delay = atEnd ? 2000 : atStart ? 400 : isDeleting ? 50 : 100;

    const timeout = window.setTimeout(() => {
      if (atEnd) {
        setIsDeleting(true);
      } else if (atStart) {
        setIsDeleting(false);
        setIndex((current) => (current + 1) % placeholders.length);
      } else {
        setText(
          isDeleting
            ? currentFullText.substring(0, text.length - 1)
            : currentFullText.substring(0, text.length + 1)
        );
      }
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, isDeleting, index, placeholders, paused]);

  return <>{paused ? '' : text}</>;
};
