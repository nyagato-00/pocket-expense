export interface ExpenseRequestInput {
  title: string;
  amount: number;
  description?: string;
  category?: string;
  receiptUrl?: string;
}

export interface ApprovalInput {
  status: RequestStatus;
  comment?: string;
}

export interface CommentInput {
  content: string;
}

export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum UserRole {
  USER = 'USER',
  APPROVER = 'APPROVER',
  ADMIN = 'ADMIN'
}

export enum ExpenseCategory {
  TRAVEL = '交通費',
  ACCOMMODATION = '宿泊費',
  MEALS = '食費',
  SUPPLIES = '備品',
  ENTERTAINMENT = '接待費',
  OTHER = 'その他'
}
