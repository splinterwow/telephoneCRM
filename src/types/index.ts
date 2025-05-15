
export type Language = "uz_latin" | "uz_cyrillic" | "ru" | "en";

export type UserRole = "superuser" | "admin" | "Naqdier" | "inventory";

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  storeId?: string;
  email?: string;
  phone?: string;
  telegramUsername?: string;
}

export interface Store {
  id: string;
  name: string;
  subscription: SubscriptionTier;
  validUntil: Date;
  owner: string;
  status: "active" | "expired" | "blocked";
  branches?: Branch[];
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  storeId: string;
  registers: Register[];
}

export interface Register {
  id: string;
  name: string;
  branchId: string;
  balance: {
    uzs: number;
    usd: number;
  };
}

export type SubscriptionTier = "free" | "silver" | "gold" | "platinum" | "vip";

export type PaymentMethod = "Naqd" | "card" | "mixed" | "credit" | "installment";

export interface Product {
  id: string;
  name: string;
  barcode?: string;
  category: string;
  price: {
    uzs: number;
    usd: number;
  };
  register: string;
  stock: number;
  minStock: number;
  image?: string;
  storeId: string;
  branchId: string;
}

export interface Sale {
  id: string;
  products: {
    product: Product;
    quantity: number;
    price: number;
    total: number;
  }[];
  total: {
    uzs: number;
    usd: number;
  };
  payment: {
    method: PaymentMethod;
    Naqd?: {
      amount: number;
      currency: "uzs" | "usd";
      change: number;
    };
    card?: {
      amount: number;
      type: string;
    };
    credit?: {
      customer: Customer;
      dueDate: Date;
    };
    installment?: {
      customer: Customer;
      months: number;
      initialPayment: number;
      monthlyPayment: number;
      interestRate: number;
    };
  };
  NaqdierId: string;
  registerId: string;
  branchId: string;
  storeId: string;
  createdAt: Date;
  receiptNo: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  telegramUsername?: string;
  storeId: string;
}

export interface Installment {
  id: string;
  customer: Customer;
  sale: Sale;
  totalAmount: number;
  initialPayment: number;
  remainingAmount: number;
  months: number;
  interestRate: number;
  monthlyPayment: number;
  startDate: Date;
  schedule: InstallmentPayment[];
  status: "active" | "completed" | "overdue";
  storeId: string;
}

export interface InstallmentPayment {
  id: string;
  installmentId: string;
  dueDate: Date;
  amount: number;
  principal: number;
  interest: number;
  isPaid: boolean;
  paidDate?: Date;
  paidAmount?: number;
}

export interface ExchangeRate {
  date: Date;
  usdToUzs: number;
}

export interface SubscriptionPayment {
  id: string;
  storeId: string;
  amount: number;
  date: Date;
  receiptImage?: string;
  status: "pending" | "approved" | "rejected";
  subscriptionTier: SubscriptionTier;
  months: number;
  approvedBy?: string;
  approvedDate?: Date;
}

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  price: number; // monthly price
  features: string[];
  maxProducts: number;
  maxBranches: number;
  maxRegisters: number;
  allowsInstallments: boolean;
  allowsMultipleCurrencies: boolean;
}
