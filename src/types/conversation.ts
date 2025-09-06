export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
  isActive?: boolean;
  isPinned?: boolean;
  tags?: string[];
  model?: string;
  messages?: {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: Date;
  }[];
}

export interface ConversationFilters {
  search?: string;
  showPinned?: boolean;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ConversationActions {
  onSelect: (conversation: Conversation) => void;
  onCreate: () => void;
  onDelete: (conversationId: string) => void;
  onPin: (conversationId: string) => void;
  onUnpin: (conversationId: string) => void;
  onRename: (conversationId: string, newTitle: string) => void;
  onDuplicate?: (conversationId: string) => void;
  onArchive?: (conversationId: string) => void;
}

export interface ConversationManagerState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  filters: ConversationFilters;
  totalCount: number;
}

export interface ConversationStorage {
  save: (conversations: Conversation[]) => Promise<void>;
  load: () => Promise<Conversation[]>;
  clear: () => Promise<void>;
  export: () => Promise<string>;
  import: (data: string) => Promise<Conversation[]>;
}
