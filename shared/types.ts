export interface ExpenseRequestInput {
  title: string;
  amount: number;
  description?: string;
  receiptUrl?: string;
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