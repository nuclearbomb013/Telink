export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export interface MarkdownSummary {
  lead: string;
  keyPoints: string[];
  sectionTitles: string[];
}

export interface MarkdownDocument {
  html: string;
  toc: TOCItem[];
  readingTime: number;
  summary: MarkdownSummary;
}

export interface ReaderPreferences {
  theme: 'warm' | 'gray' | 'dark';
  fontFamily: 'sans' | 'serif';
  fontSize: 16 | 18 | 20 | 22;
  lineHeight: 1.6 | 1.7 | 1.85 | 2.0;
  contentWidth: 640 | 720 | 820;
  codeWrap: boolean;
}

export const DEFAULT_PREFERENCES: ReaderPreferences = {
  theme: 'warm',
  fontFamily: 'sans',
  fontSize: 18,
  lineHeight: 1.85,
  contentWidth: 720,
  codeWrap: false,
};

export const PREFERENCES_STORAGE_KEY = 'techink_reader_preferences';
