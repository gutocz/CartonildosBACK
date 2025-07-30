import emojiRegex from 'emoji-regex';

const emotes = ['🐧', '🐙', '🦄', '🤖', '👻', '👽', '🤡', '🐸'];

export const getRandomEmote = (): string => {
  const randomIndex = Math.floor(Math.random() * emotes.length);
  return emotes[randomIndex];
};

export function removeEmoji(username: string | undefined): string {
  if (!username) {
    return "";
  }
  return username.replace(emojiRegex(), '').trim();
}