export const TRANSACTION_STATUSES = [
  "pendente",
  "preparando",
  "aguardando_coleta",
  "entregue",
  "cancelado",
] as const;

export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  featured?: boolean;
  discount?: {
    percentOff: number;
    endDate: string;
  };
  isActive: boolean;
  deletedAt?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface User {
  id: string;
  feedzEmployeeId?: number | null;
  email: string;
  role: "admin" | "user";
  name?: string;
  profilePicture?: string;
}

export interface TransactionItem {
  id: string;
  transactionId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productName?: string;
  productImage?: string;
  productUnitPrice?: number;
  createdAt: string;
  product: {
    id: string;
    name: string;
    image?: string;
  };
}

export interface CoinTransaction {
  id: string;
  userId: string;
  feedzEmployeeId: number;
  totalAmount: number;
  type: number;
  description: string;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
  items: TransactionItem[];
  user?: {
    id: string;
    name: string;
    email: string;
  };
  totalItems?: number;
  products?: Array<{
    id: string;
    name: string;
    image?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export interface RedemptionStats {
  totalRedeemed: number;
  totalTransactions: number;
  averagePerTransaction: number;
  byStatus?: Record<string, number>;
}
