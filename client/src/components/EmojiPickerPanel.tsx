import EmojiPicker, { Theme, EmojiStyle } from 'emoji-picker-react';

interface EmojiPickerPanelProps {
  dark: boolean;
  height?: number;
  onEmojiClick: (emoji: string) => void;
}

/**
 * Lazy chunk boundary for emoji-picker-react (~200KB+).
 *
 * The chat pages import this component with React.lazy and render it only
 * when the emoji picker is opened, so the library is fetched on first use
 * instead of being bundled into the main chunk.
 */
const EmojiPickerPanel = ({ dark, height = 400, onEmojiClick }: EmojiPickerPanelProps) => (
  <div className="overflow-hidden rounded-2xl shadow-2xl">
    <EmojiPicker
      theme={dark ? Theme.DARK : Theme.LIGHT}
      emojiStyle={EmojiStyle.APPLE}
      width="100%"
      height={height}
      onEmojiClick={(emojiData) => onEmojiClick(emojiData.emoji)}
    />
  </div>
);

export default EmojiPickerPanel;
