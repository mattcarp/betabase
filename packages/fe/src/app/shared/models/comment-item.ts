export interface CommentItem {
  body: string;
  createdAt: Date | string;
  htmlBody: string;
  id: number;
  authorId: number;
  plainBody: string;
  public: boolean;
  type: string;
}
