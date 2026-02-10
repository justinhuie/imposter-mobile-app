export type WordEntry = {
  word: string;
  hint?: string;
};

export type Category = {
  id: string;
  name: string;
  words: WordEntry[];      
  isCustom?: boolean;
};
