export type Candidate = {
  id: string; // raw_item id
  title: string;
  content: string;
  source_id: string | null;
  source_name: string;
  url: string | null;
  trust: number;
};

export type Scored = {
  id: string;
  category_slug: string | null;
  audience: string[];
  relevance: number; // AI ↔ entrepreneur-buildable relevance (the core filter)
  importance: number;
  novelty: number;
  risk: number;
  is_tool: boolean; // a launchable tool/product (-> عُدّة الشاهين)
  summary: string;
  reason: string; // how a founder could act on it
};

export type MainStory = {
  news_id: string;
  source_url: string | null;
  title: string;
  what: string;
  why: string;
  who: string;
  how: string;
  warning: string;
  our_take: string; // «بعين الشاهين»
};

export type RoundupItem = {
  news_id: string;
  source_url: string | null;
  title: string;
  blurb: string;
};

export type ToolItem = {
  news_id: string;
  source_url: string | null;
  name: string;
  blurb: string;
};

export type IssueBody = {
  tldr_bullets: string[];
  main: MainStory | null;
  roundup: RoundupItem[];
  tools: ToolItem[];
};

export type BrandVoice = {
  name: string;
  tone: string;
  bannedWords: string[];
};
