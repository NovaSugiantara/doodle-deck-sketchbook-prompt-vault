export type Difficulty = "easy" | "medium" | "hard";
export type Style = "pencil" | "ink" | "watercolor" | "digital";
export type Status = "untried" | "in_progress" | "done";

export interface Prompt {
  id: string;
  /** 1–140 chars, trimmed. */
  text: string;
  difficulty: Difficulty;
  style: Style;
  status: Status;
  /** epoch ms, stable sort anchor */
  createdAt: number;
}

export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
export const STYLES: Style[] = ["pencil", "ink", "watercolor", "digital"];
export const STATUSES: Status[] = ["untried", "in_progress", "done"];
