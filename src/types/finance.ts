export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  imageUrl?: string;
  iconName?: string;
}

export interface IncomeItem {
  id: string;
  description: string;
  amountUSD: number;
  date: string;
  categoryId: string;
  status: 'depositado' | 'pendiente';
  createdAt: string;
  depositedAt?: string;
  bankAccount?: string;
}

export interface ExpenseItem {
  id: string;
  description: string;
  amountUSD: number;
  date: string;
  dueDate?: string;
  categoryId: string;
  status: 'pagado' | 'pendiente';
  createdAt: string;
  paidAt?: string;
}

export interface DebtPayment {
  id: string;
  amountUSD: number;
  date: string;
  note?: string;
}

export interface DebtItem {
  id: string;
  description: string;
  creditor: string;
  totalAmountUSD: number;
  date: string;
  dueDate?: string;
  payments: DebtPayment[];
  status: 'activa' | 'pagada';
  createdAt: string;
  paidAt?: string;
}

export interface ReceivableItem {
  id: string;
  description: string;
  clientName: string;
  clientPhone?: string;
  amountUSD: number;
  date: string;
  dueDate?: string;
  status: 'pendiente' | 'pagado';
  paidAt?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  title: string;
  avatarUrl: string;
  accountType?: 'personal' | 'negocio' | 'empresa' | 'inversion' | 'otro';
  colorTag?: string;
  createdAt?: string;
}

export type ActiveModule = 'inicio' | 'ingresos' | 'egresos' | 'pendientes' | 'deudas' | 'cobrar' | 'calendario';

export interface FinanceData {
  bcvRate: number;
  lastBcvUpdate: string;
  profile: UserProfile;
  categories: Category[];
  incomes: IncomeItem[];
  expenses: ExpenseItem[];
  debts: DebtItem[];
  receivables: ReceivableItem[];
}

export interface StorageStats {
  totalRecords: number;
  incomesCount: number;
  expensesCount: number;
  debtsCount: number;
  receivablesCount: number;
  categoriesCount: number;
  storageSizeKB: number;
  lastSavedAt: string;
  isLocalStorageSupported: boolean;
}

export interface BackupSummary {
  totalIncomes: number;
  totalExpenses: number;
  totalDebts: number;
  totalReceivables: number;
  totalCategories: number;
  netBalanceUSD: number;
  bcvRate: number;
}

export interface BackupFileStructure {
  version: string;
  appName: string;
  exportedAt: string;
  author: string;
  summary: BackupSummary;
  data: FinanceData;
}

export interface RestoreResult {
  success: boolean;
  message: string;
  recordsCount?: number;
  preview?: {
    exportedAt: string;
    profileName: string;
    bcvRate: number;
    incomesCount: number;
    expensesCount: number;
    debtsCount: number;
    receivablesCount: number;
    categoriesCount: number;
    netBalanceUSD: number;
  };
}

export type CloudSyncStatus = 'synced' | 'syncing' | 'offline' | 'unauthenticated' | 'error';

export interface CloudSyncState {
  userEmail: string | null;
  userName: string | null;
  userId: string | null;
  status: CloudSyncStatus;
  lastSyncedAt: string | null;
  isSyncing: boolean;
  errorMessage: string | null;
}
