export interface TicketItem {
  createdAt: Date | string;
  description: string;
  id: number;
  priority: string;
  rawSubject: string;
  status: string;
  subject: string;
  type: string;
  updatedAt: Date | string;
}
