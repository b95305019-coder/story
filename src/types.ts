export enum StoryGenre {
  WHIMSICAL = "whimsical", // 奇幻溫馨
  ADVENTUROUS = "adventurous", // 冒險刺激
  COZY = "cozy", // 溫柔療癒
  MYSTERIOUS = "mysterious", // 神祕探索
}

export interface StoryMetadata {
  title: string;
  theme: string;
  character: string;
  genre: StoryGenre;
}

export interface StoryChapter {
  id: string;
  chapterIndex: number;
  text: string;
  selectedOption: string | null;
  options: string[]; // 3 custom branch options
  illustrationPrompt?: string; // a scene description if needed
}

export interface FairytaleSession {
  id: string;
  metadata: StoryMetadata;
  chapters: StoryChapter[];
  createdAt: string;
  updatedAt: string;
}

export interface StartStoryRequest {
  theme: string;
  character: string;
  genre: StoryGenre;
  customSetup?: string;
}

export interface ContinueStoryRequest {
  history: {
    text: string;
    selectedOption: string | null;
  }[];
  selectedOption: string;
  metadata: StoryMetadata;
}
