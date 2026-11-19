export type RoleKey = "user" | "assistant" | "system" | "tool" | "other";

export type Message = {
  role: string;
  roleKey: RoleKey;
  time?: string;
  text: string;
};

export type TableData = {
  name: string;
  headers: string[];
  rows: string[][];
};

export type TreeNode = {
  id: string;
  label: string;
  detail?: string;
  active?: boolean;
  children: TreeNode[];
};

export type FolioDoc = {
  id: string;
  title: string;
  sourceName: string;
  kind: string;
  kindLabel: string;
  summary: string;
  messages: Message[];
  tables: TableData[];
  tree: TreeNode | null;
  prose: string | null;
};

export type Issue = { file: string; message: string };

export type Bundle = {
  id: string;
  title: string;
  createdAt: string;
  detected: string;
  docs: FolioDoc[];
  issues: Issue[];
};

export type SourceInput = {
  name: string;
  text?: string;
  bytes?: Uint8Array;
};
