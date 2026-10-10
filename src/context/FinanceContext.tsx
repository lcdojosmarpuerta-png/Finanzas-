import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Category,
  ExpenseItem,
  FinanceData,
  IncomeItem,
  ReceivableItem,
  DebtItem,
  UserProfile,
  ActiveModule,
  StorageStats,
  BackupFileStructure,
  RestoreResult,
  BackupSummary,
  CloudSyncState,
} from '../types/finance.ts';
import { fetchLiveBCVRate } from '../services/bcvService.ts';

const PROFILES_LIST_KEY = 'FINANZAS_BCV_PROFILES_V2';
const ACTIVE_PROFILE_KEY = 'FINANZAS_BCV_ACTIVE_PROFILE_ID_V2';
const LEGACY_STORAGE_KEY = 'FINANZAS_BCV_DATA_V1';
const getProfileStorageKey = (profileId: string) => `FINANZAS_BCV_DATA_${profileId}`;

export const DEFAULT_PROFILE: UserProfile = {
  id: 'prof-default',
  name: 'Josmar Puerta',
  title: 'Administrador Financiero',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  accountType: 'personal',
  colorTag: '#FFD700',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const INITIAL_CATEGORIES: Category[] = [
  // Income categories
  { id: 'cat-inc-1', name: 'Salario / Nómina', type: 'income', color: '#2ECC71' },
  { id: 'cat-inc-2', name: 'Ventas de Negocio', type: 'income', color: '#FFD700' },
  { id: 'cat-inc-3', name: 'Servicios Profesionales', type: 'income', color: '#3498DB' },
  { id: 'cat-inc-4', name: 'Inversiones y Dividendos', type: 'income', color: '#9B59B6' },
  { id: 'cat-inc-5', name: 'Otros Ingresos', type: 'income', color: '#1ABC9C' },
  // Expense categories
  { id: 'cat-exp-1', name: 'Alimentación y Supermercado', type: 'expense', color: '#E67E22' },
  { id: 'cat-exp-2', name: 'Servicios Públicos e Internet', type: 'expense', color: '#E74C3C' },
  { id: 'cat-exp-3', name: 'Vivienda / Alquiler', type: 'expense', color: '#C0392B' },
  { id: 'cat-exp-4', name: 'Transporte y Combustible', type: 'expense', color: '#F39C12' },
  { id: 'cat-exp-5', name: 'Salud y Farmacia', type: 'expense', color: '#16A085' },
  { id: 'cat-exp-6', name: 'Educación y Capacitación', type: 'expense', color: '#2980B9' },
  { id: 'cat-exp-7', name: 'Proveedores e Inventario', type: 'expense', color: '#8E44AD' },
  { id: 'cat-exp-8', name: 'Otros Gastos', type: 'expense', color: '#7F8C8D' },
];

const INITIAL_DATA: FinanceData = {
  bcvRate: 71.85,
  lastBcvUpdate: new Date().toISOString(),
  profile: DEFAULT_PROFILE,
  categories: INITIAL_CATEGORIES,
  incomes: [
    {
      id: 'inc-1',
      description: 'Honorarios Asesoría Web & Sistemas',
      amountUSD: 850.0,
      date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
      categoryId: 'cat-inc-3',
      status: 'depositado',
      depositedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'inc-2',
      description: 'Liquidación Quincenal',
      amountUSD: 520.0,
      date: new Date(Date.now() - 86400000 * 6).toISOString().split('T')[0],
      categoryId: 'cat-inc-1',
      status: 'depositado',
      depositedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    },
    {
      id: 'inc-3',
      description: 'Venta de Equipos Electrónicos',
      amountUSD: 340.0,
      date: new Date(Date.now() - 86400000 * 10).toISOString().split('T')[0],
      categoryId: 'cat-inc-2',
      status: 'pendiente',
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
  ],
  expenses: [
    {
      id: 'exp-1',
      description: 'Compra de Alimentos y Víveres',
      amountUSD: 145.0,
      date: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
      categoryId: 'cat-exp-1',
      status: 'pagado',
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      paidAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    {
      id: 'exp-2',
      description: 'Factura Servicio de Internet Fibra Óptica',
      amountUSD: 45.0,
      date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
      categoryId: 'cat-exp-2',
      status: 'pagado',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      paidAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'exp-3',
      description: 'Mantenimiento Preventivo Vehículo',
      amountUSD: 95.0,
      date: new Date().toISOString().split('T')[0],
      categoryId: 'cat-exp-4',
      status: 'pendiente',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp-4',
      description: 'Cuota Seguro Médico Familiar',
      amountUSD: 80.0,
      date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      categoryId: 'cat-exp-5',
      status: 'pendiente',
      createdAt: new Date().toISOString(),
    },
  ],
  debts: [
    {
      id: 'debt-1',
      description: 'Préstamo Equipamiento de Oficina',
      creditor: 'Banco Universal / Inversiones',
      totalAmountUSD: 600.0,
      date: new Date(Date.now() - 86400000 * 20).toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
      payments: [
        {
          id: 'pay-1',
          amountUSD: 200.0,
          date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
          note: 'Primera cuota acordada',
        },
      ],
      status: 'activa',
      createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    },
    {
      id: 'debt-2',
      description: 'Factura Proveedor de Mercancía',
      creditor: 'Distribuidora Central C.A.',
      totalAmountUSD: 250.0,
      date: new Date(Date.now() - 86400000 * 8).toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0],
      payments: [],
      status: 'activa',
      createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    },
  ],
  receivables: [
    {
      id: 'rec-1',
      description: 'Diseño y Maquetación de Tienda Online',
      clientName: 'Carlos Mendoza (Comercializadora)',
      clientPhone: '+584145558899',
      amountUSD: 320.0,
      date: new Date(Date.now() - 86400000 * 12).toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      status: 'pendiente',
      createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    },
    {
      id: 'rec-2',
      description: 'Auditoría de Procesos Contables',
      clientName: 'Dra. María Elena Rivas',
      clientPhone: '+584241234567',
      amountUSD: 180.0,
      date: new Date(Date.now() - 86400000 * 15).toISOString().split('T')[0],
      dueDate: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
      status: 'pagado',
      paidAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    },
  ],
};

interface FinanceContextType {
  data: FinanceData;
  activeModule: ActiveModule;
  setActiveModule: (module: ActiveModule) => void;
  // BCV Rate
  bcvRate: number;
  setBcvRate: (rate: number) => void;
  refreshBcvRate: () => Promise<{ success: boolean; message: string }>;
  isSyncingBcv: boolean;
  bcvStatusMessage: string | null;
  // Profile Management (Multi-Profile)
  profiles: UserProfile[];
  activeProfileId: string;
  activeProfile: UserProfile;
  switchProfile: (profileId: string) => void;
  createProfile: (profile: Omit<UserProfile, 'id'>, copyCategories?: boolean) => void;
  deleteProfile: (profileId: string) => { success: boolean; message: string };
  updateProfile: (profile: Partial<UserProfile>) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  // Incomes
  addIncome: (income: Omit<IncomeItem, 'id' | 'createdAt'>) => void;
  updateIncome: (id: string, income: Partial<IncomeItem>) => void;
  deleteIncome: (id: string) => void;
  markIncomeAsDeposited: (id: string) => void;
  markIncomeAsPending: (id: string) => void;
  toggleIncomeDepositStatus: (id: string) => void;
  markAllIncomesAsDeposited: () => void;
  markSelectedIncomesAsDeposited: (ids: string[]) => void;
  clearIncomes: () => void;
  // Expenses
  addExpense: (expense: Omit<ExpenseItem, 'id' | 'createdAt'>) => void;
  updateExpense: (id: string, expense: Partial<ExpenseItem>) => void;
  deleteExpense: (id: string) => void;
  markExpenseAsPending: (id: string) => void;
  markExpenseAsPaid: (id: string) => void;
  clearExpenses: () => void;
  clearPendingExpenses: () => void;
  // Debts
  addDebt: (debt: Omit<DebtItem, 'id' | 'createdAt' | 'payments' | 'status'>) => void;
  updateDebt: (id: string, debt: Partial<DebtItem>) => void;
  deleteDebt: (id: string) => void;
  abonarDebt: (debtId: string, amountUSD: number, date: string, note?: string, registerExpense?: boolean) => void;
  payDebtFull: (debtId: string, date: string, registerExpense?: boolean) => void;
  clearDebts: () => void;
  // Receivables
  addReceivable: (receivable: Omit<ReceivableItem, 'id' | 'createdAt' | 'status'>) => void;
  updateReceivable: (id: string, receivable: Partial<ReceivableItem>) => void;
  deleteReceivable: (id: string) => void;
  markReceivableAsPaid: (id: string) => void;
  clearReceivables: () => void;
  // Categories
  addCategory: (category: Omit<Category, 'id'>) => void;
  deleteCategory: (id: string) => void;
  // Global
  resetAllData: () => void;
  // Financial Totals
  totalIncomeUSD: number;
  totalIncomeDepositedUSD: number;
  totalIncomePendingUSD: number;
  totalExpensesPaidUSD: number;
  totalExpensesPendingUSD: number;
  totalReceivablesPendingUSD: number;
  totalReceivablesPaidUSD: number;
  totalDebtsOriginalUSD: number;
  totalDebtsRemainingUSD: number;
  netAvailableBalanceUSD: number;
  // Helpers
  getCategoryById: (id: string) => Category | undefined;
  // Offline & Storage Status
  isOnline: boolean;
  isSimulatingOffline: boolean;
  toggleSimulateOffline: () => void;
  effectiveIsOnline: boolean;
  checkConnectivity: () => Promise<boolean>;
  storageStats: StorageStats;
  lastConnectionEvent: { type: 'online' | 'offline'; timestamp: number } | null;
  clearConnectionEvent: () => void;
  offlineBannerDismissed: boolean;
  setOfflineBannerDismissed: (dismissed: boolean) => void;
  isOfflineStatusModalOpen: boolean;
  setIsOfflineStatusModalOpen: (open: boolean) => void;
  // Backup & Restore
  exportBackupJSON: () => string;
  downloadBackupFile: () => void;
  parseBackupFile: (jsonText: string) => RestoreResult;
  restoreFromBackup: (backupData: BackupFileStructure, mode: 'replace' | 'merge') => RestoreResult;
  isBackupModalOpen: boolean;
  setIsBackupModalOpen: (open: boolean) => void;
  // Local Storage State (Compatibility)
  cloudSyncState: CloudSyncState;
  loginWithGoogleAction: () => Promise<void>;
  logoutAction: () => Promise<void>;
  forceSyncToCloudAction: () => Promise<{ success: boolean; message: string }>;
  isCloudModalOpen: boolean;
  setIsCloudModalOpen: (open: boolean) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Multi-Profile List State
  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    try {
      const stored = localStorage.getItem(PROFILES_LIST_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading profiles list:', e);
    }

    try {
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        const parsedLegacy = JSON.parse(legacy);
        if (parsedLegacy && parsedLegacy.profile) {
          return [
            {
              id: parsedLegacy.profile.id || DEFAULT_PROFILE.id,
              name: parsedLegacy.profile.name || DEFAULT_PROFILE.name,
              title: parsedLegacy.profile.title || DEFAULT_PROFILE.title,
              avatarUrl: parsedLegacy.profile.avatarUrl || DEFAULT_PROFILE.avatarUrl,
              accountType: parsedLegacy.profile.accountType || 'personal',
              colorTag: parsedLegacy.profile.colorTag || '#FFD700',
              createdAt: parsedLegacy.profile.createdAt || new Date().toISOString(),
            },
          ];
        }
      }
    } catch (e) {
      console.error('Error reading legacy profile:', e);
    }

    return [DEFAULT_PROFILE];
  });

  // 2. Active Profile ID
  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    try {
      const storedActive = localStorage.getItem(ACTIVE_PROFILE_KEY);
      if (storedActive) return storedActive;
    } catch {}
    return DEFAULT_PROFILE.id;
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // 3. Active Profile's FinanceData (isolated per profile)
  const [data, setData] = useState<FinanceData>(() => {
    let initialProfileId = DEFAULT_PROFILE.id;
    try {
      const storedActive = localStorage.getItem(ACTIVE_PROFILE_KEY);
      if (storedActive) initialProfileId = storedActive;
    } catch {}

    const profileKey = getProfileStorageKey(initialProfileId);
    try {
      const storedProfileData = localStorage.getItem(profileKey);
      if (storedProfileData) {
        return JSON.parse(storedProfileData);
      }
    } catch (e) {
      console.error('Error loading profile data:', e);
    }

    // Try legacy storage
    try {
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (parsed) {
          localStorage.setItem(profileKey, legacy);
          return {
            ...parsed,
            profile: {
              ...parsed.profile,
              id: initialProfileId,
              accountType: parsed.profile?.accountType || 'personal',
              colorTag: parsed.profile?.colorTag || '#FFD700',
            },
          };
        }
      }
    } catch (e) {
      console.error('Error migrating legacy data:', e);
    }

    return INITIAL_DATA;
  });

  const [activeModule, setActiveModule] = useState<ActiveModule>('inicio');
  const [isSyncingBcv, setIsSyncingBcv] = useState<boolean>(false);
  const [bcvStatusMessage, setBcvStatusMessage] = useState<string | null>(null);

  // Network connection state & LocalStorage monitoring
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [isSimulatingOffline, setIsSimulatingOffline] = useState<boolean>(false);
  const [lastConnectionEvent, setLastConnectionEvent] = useState<{
    type: 'online' | 'offline';
    timestamp: number;
  } | null>(null);
  const [offlineBannerDismissed, setOfflineBannerDismissed] = useState<boolean>(false);
  const [isOfflineStatusModalOpen, setIsOfflineStatusModalOpen] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string>(() => new Date().toISOString());

  // Local Storage State (All finances are 100% saved locally on device)
  const [cloudSyncState] = useState<CloudSyncState>({
    userId: null,
    userEmail: null,
    userName: null,
    status: 'synced',
    lastSyncedAt: new Date().toISOString(),
    isSyncing: false,
    errorMessage: null,
  });
  const [isCloudModalOpen, setIsCloudModalOpen] = useState<boolean>(false);

  const loginWithGoogleAction = async () => {};
  const logoutAction = async () => {};
  const forceSyncToCloudAction = async (): Promise<{ success: boolean; message: string }> => {
    return {
      success: true,
      message: 'Todos tus datos se guardan de forma local en tu dispositivo con máxima privacidad.',
    };
  };

  const effectiveIsOnline = isOnline && !isSimulatingOffline;

  // Listen to browser network changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastConnectionEvent({ type: 'online', timestamp: Date.now() });
      setOfflineBannerDismissed(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setLastConnectionEvent({ type: 'offline', timestamp: Date.now() });
      setOfflineBannerDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleSimulateOffline = () => {
    setIsSimulatingOffline((prev) => {
      const next = !prev;
      setLastConnectionEvent({
        type: next ? 'offline' : 'online',
        timestamp: Date.now(),
      });
      setOfflineBannerDismissed(false);
      return next;
    });
  };

  const clearConnectionEvent = () => {
    setLastConnectionEvent(null);
  };

  // Test real network connectivity
  const checkConnectivity = async (): Promise<boolean> => {
    if (isSimulatingOffline) {
      return false;
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      return false;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      await fetch(`https://ve.dolarapi.com/v1/dolares/oficial?_t=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      setIsOnline(true);
      return true;
    } catch {
      const online = typeof navigator !== 'undefined' ? navigator.onLine : false;
      setIsOnline(online);
      return online;
    }
  };

  // Sync profiles list to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PROFILES_LIST_KEY, JSON.stringify(profiles));
    } catch (e) {
      console.error('Error saving profiles list:', e);
    }
  }, [profiles]);

  // Sync active profile ID to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_PROFILE_KEY, activeProfileId);
    } catch (e) {
      console.error('Error saving active profile ID:', e);
    }
  }, [activeProfileId]);

  // Sync active profile's FinanceData to its isolated localStorage key
  useEffect(() => {
    try {
      const profileKey = getProfileStorageKey(activeProfileId);
      localStorage.setItem(profileKey, JSON.stringify(data));
      // Keep legacy key updated with active profile data for backward compatibility
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(data));
      setLastSavedTimestamp(new Date().toISOString());
    } catch (e) {
      console.error('Error saving data to profile localStorage:', e);
    }
  }, [data, activeProfileId]);

  // Compute live storage stats
  const storageStats: StorageStats = useMemo(() => {
    let sizeKB = 0;
    let isLocalStorageSupported = true;
    try {
      const jsonStr = JSON.stringify(data);
      const sizeBytes = new Blob([jsonStr]).size;
      sizeKB = Number((sizeBytes / 1024).toFixed(2));
      localStorage.setItem('__test_ls_finanzas__', '1');
      localStorage.removeItem('__test_ls_finanzas__');
    } catch {
      isLocalStorageSupported = false;
    }

    const totalRecords =
      data.incomes.length +
      data.expenses.length +
      data.debts.length +
      data.receivables.length +
      data.categories.length;

    return {
      totalRecords,
      incomesCount: data.incomes.length,
      expensesCount: data.expenses.length,
      debtsCount: data.debts.length,
      receivablesCount: data.receivables.length,
      categoriesCount: data.categories.length,
      storageSizeKB: sizeKB,
      lastSavedAt: lastSavedTimestamp,
      isLocalStorageSupported,
    };
  }, [data, lastSavedTimestamp]);

  // Attempt live BCV rate update on initial mount if older than 4 hours
  useEffect(() => {
    const checkRate = async () => {
      if (!effectiveIsOnline) return;
      const last = new Date(data.lastBcvUpdate).getTime();
      const now = Date.now();
      if (now - last > 1000 * 60 * 60 * 4) {
        await refreshBcvRate();
      }
    };
    checkRate();
  }, [effectiveIsOnline]);

  const setBcvRate = (rate: number) => {
    if (rate <= 0 || isNaN(rate)) return;
    const now = new Date().toISOString();
    const cleanRate = Number(rate.toFixed(4));
    setData((prev) => ({
      ...prev,
      bcvRate: cleanRate,
      lastBcvUpdate: now,
    }));
  };

  const refreshBcvRate = async (): Promise<{ success: boolean; message: string }> => {
    if (!effectiveIsOnline) {
      const msg = `Modo sin conexión: se conserva la tasa oficial en memoria local (Bs. ${data.bcvRate.toFixed(2)}).`;
      setBcvStatusMessage(msg);
      setTimeout(() => setBcvStatusMessage(null), 5000);
      return { success: false, message: msg };
    }

    setIsSyncingBcv(true);
    setBcvStatusMessage('Consultando tasa oficial del BCV en línea...');
    try {
      const res = await fetchLiveBCVRate();
      setIsSyncingBcv(false);
      if (res.success && res.rate > 0) {
        setData((prev) => ({
          ...prev,
          bcvRate: res.rate,
          lastBcvUpdate: res.date,
        }));
        const msg = `Tasa BCV actualizada a Bs. ${res.rate.toFixed(2)} ($)`;
        setBcvStatusMessage(msg);
        setTimeout(() => setBcvStatusMessage(null), 5000);
        return { success: true, message: msg };
      } else {
        const msg = res.error || 'No se pudo obtener la tasa en línea. Manteniendo tasa actual.';
        setBcvStatusMessage(msg);
        setTimeout(() => setBcvStatusMessage(null), 6000);
        return { success: false, message: msg };
      }
    } catch (err) {
      setIsSyncingBcv(false);
      const msg = 'Error de conexión al consultar el BCV. Se mantiene la tasa guardada en el dispositivo.';
      setBcvStatusMessage(msg);
      setTimeout(() => setBcvStatusMessage(null), 6000);
      return { success: false, message: msg };
    }
  };

  const activeProfile = useMemo<UserProfile>(() => {
    return profiles.find((p) => p.id === activeProfileId) || data.profile || DEFAULT_PROFILE;
  }, [profiles, activeProfileId, data.profile]);

  const switchProfile = (profileId: string) => {
    if (profileId === activeProfileId) return;

    // 1. Save current profile data first
    try {
      localStorage.setItem(getProfileStorageKey(activeProfileId), JSON.stringify(data));
    } catch (e) {
      console.error('Error saving current profile data before switch:', e);
    }

    // 2. Find target profile metadata
    const targetProfile = profiles.find((p) => p.id === profileId);
    if (!targetProfile) return;

    // 3. Load target profile data
    let targetData: FinanceData | null = null;
    try {
      const stored = localStorage.getItem(getProfileStorageKey(profileId));
      if (stored) {
        targetData = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading target profile data:', e);
    }

    if (!targetData) {
      targetData = {
        bcvRate: data.bcvRate,
        lastBcvUpdate: new Date().toISOString(),
        profile: targetProfile,
        categories: INITIAL_CATEGORIES,
        incomes: [],
        expenses: [],
        debts: [],
        receivables: [],
      };
    } else {
      targetData.profile = targetProfile;
    }

    setActiveProfileId(profileId);
    setData(targetData);
  };

  const createProfile = (
    newProfileData: Omit<UserProfile, 'id'>,
    copyCategories = true
  ) => {
    const newId = `prof-${Date.now()}`;
    const newProfile: UserProfile = {
      ...newProfileData,
      id: newId,
      createdAt: new Date().toISOString(),
    };

    const newDataset: FinanceData = {
      bcvRate: data.bcvRate,
      lastBcvUpdate: new Date().toISOString(),
      profile: newProfile,
      categories: copyCategories ? [...data.categories] : INITIAL_CATEGORIES,
      incomes: [],
      expenses: [],
      debts: [],
      receivables: [],
    };

    try {
      localStorage.setItem(getProfileStorageKey(newId), JSON.stringify(newDataset));
    } catch (e) {
      console.error('Error saving new profile data:', e);
    }

    // Update profiles list and switch to the new profile
    setProfiles((prev) => [...prev, newProfile]);
    setActiveProfileId(newId);
    setData(newDataset);
  };

  const updateProfile = (profileUpdate: Partial<UserProfile>) => {
    const updated = { ...data.profile, ...profileUpdate };
    setData((prev) => ({
      ...prev,
      profile: updated,
    }));

    setProfiles((prev) =>
      prev.map((p) => (p.id === activeProfileId ? { ...p, ...profileUpdate } : p))
    );
  };

  const deleteProfile = (profileId: string): { success: boolean; message: string } => {
    if (profiles.length <= 1) {
      return {
        success: false,
        message: 'No puedes eliminar el único perfil disponible en el sistema.',
      };
    }

    const nextProfiles = profiles.filter((p) => p.id !== profileId);
    try {
      localStorage.removeItem(getProfileStorageKey(profileId));
    } catch {}

    setProfiles(nextProfiles);

    if (activeProfileId === profileId) {
      const fallbackId = nextProfiles[0].id;
      switchProfile(fallbackId);
    }

    return {
      success: true,
      message: 'Perfil y todos sus datos han sido eliminados correctamente.',
    };
  };

  // Categories
  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...category,
      id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setData((prev) => ({
      ...prev,
      categories: [...prev.categories, newCat],
    }));
  };

  const deleteCategory = (id: string) => {
    setData((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== id),
    }));
  };

  const getCategoryById = (id: string) => {
    return data.categories.find((c) => c.id === id);
  };

  // Incomes
  const addIncome = (income: Omit<IncomeItem, 'id' | 'createdAt'>) => {
    const isDeposited = income.status === 'depositado';
    const newItem: IncomeItem = {
      ...income,
      id: `inc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      status: income.status || 'pendiente',
      depositedAt: isDeposited ? (income.depositedAt || new Date().toISOString()) : undefined,
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      incomes: [newItem, ...prev.incomes],
    }));
  };

  const markIncomeAsDeposited = (id: string) => {
    setData((prev) => ({
      ...prev,
      incomes: prev.incomes.map((i) => {
        if (i.id !== id) return i;
        return { ...i, status: 'depositado', depositedAt: new Date().toISOString() };
      }),
    }));
  };

  const markIncomeAsPending = (id: string) => {
    setData((prev) => ({
      ...prev,
      incomes: prev.incomes.map((i) => {
        if (i.id !== id) return i;
        return { ...i, status: 'pendiente', depositedAt: undefined };
      }),
    }));
  };

  const toggleIncomeDepositStatus = (id: string) => {
    setData((prev) => ({
      ...prev,
      incomes: prev.incomes.map((i) => {
        if (i.id !== id) return i;
        const willBeDeposited = i.status !== 'depositado';
        return {
          ...i,
          status: willBeDeposited ? 'depositado' : 'pendiente',
          depositedAt: willBeDeposited ? new Date().toISOString() : undefined,
        };
      }),
    }));
  };

  const markAllIncomesAsDeposited = () => {
    const now = new Date().toISOString();
    setData((prev) => ({
      ...prev,
      incomes: prev.incomes.map((i) => {
        if (i.status === 'pendiente') {
          return { ...i, status: 'depositado', depositedAt: i.depositedAt || now };
        }
        return i;
      }),
    }));
  };

  const markSelectedIncomesAsDeposited = (ids: string[]) => {
    const idSet = new Set(ids);
    const now = new Date().toISOString();
    setData((prev) => ({
      ...prev,
      incomes: prev.incomes.map((i) => {
        if (idSet.has(i.id) && i.status === 'pendiente') {
          return { ...i, status: 'depositado', depositedAt: i.depositedAt || now };
        }
        return i;
      }),
    }));
  };

  const updateIncome = (id: string, updated: Partial<IncomeItem>) => {
    setData((prev) => ({
      ...prev,
      incomes: prev.incomes.map((i) => {
        if (i.id !== id) return i;
        return { ...i, ...updated };
      }),
    }));
  };

  const deleteIncome = (id: string) => {
    setData((prev) => ({
      ...prev,
      incomes: prev.incomes.filter((i) => i.id !== id),
    }));
  };

  const clearIncomes = () => {
    setData((prev) => ({ ...prev, incomes: [] }));
  };

  // Expenses
  const addExpense = (expense: Omit<ExpenseItem, 'id' | 'createdAt'>) => {
    const isPaid = expense.status === 'pagado';
    const newItem: ExpenseItem = {
      ...expense,
      id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      paidAt: isPaid ? (expense.paidAt || new Date().toISOString()) : undefined,
    };
    setData((prev) => ({
      ...prev,
      expenses: [newItem, ...prev.expenses],
    }));
  };

  const updateExpense = (id: string, updated: Partial<ExpenseItem>) => {
    setData((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) => {
        if (e.id !== id) return e;
        const newStatus = updated.status ?? e.status;
        const paidAt = newStatus === 'pagado' ? (e.paidAt || new Date().toISOString()) : undefined;
        return { ...e, ...updated, paidAt };
      }),
    }));
  };

  const deleteExpense = (id: string) => {
    setData((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== id),
    }));
  };

  const markExpenseAsPending = (id: string) => {
    setData((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) => {
        if (e.id !== id) return e;
        return { ...e, status: 'pendiente', paidAt: undefined };
      }),
    }));
  };

  const markExpenseAsPaid = (id: string) => {
    setData((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) => {
        if (e.id !== id) return e;
        return { ...e, status: 'pagado', paidAt: new Date().toISOString() };
      }),
    }));
  };

  const clearExpenses = () => {
    setData((prev) => ({ ...prev, expenses: [] }));
  };

  const clearPendingExpenses = () => {
    setData((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.status !== 'pendiente'),
    }));
  };

  // Debts
  const addDebt = (debt: Omit<DebtItem, 'id' | 'createdAt' | 'payments' | 'status'>) => {
    const newItem: DebtItem = {
      ...debt,
      id: `debt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      payments: [],
      status: 'activa',
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      debts: [newItem, ...prev.debts],
    }));
  };

  const updateDebt = (id: string, updated: Partial<DebtItem>) => {
    setData((prev) => ({
      ...prev,
      debts: prev.debts.map((d) => {
        if (d.id !== id) return d;
        return { ...d, ...updated };
      }),
    }));
  };

  const deleteDebt = (id: string) => {
    setData((prev) => ({
      ...prev,
      debts: prev.debts.filter((d) => d.id !== id),
    }));
  };

  const abonarDebt = (
    debtId: string,
    amountUSD: number,
    date: string,
    note?: string,
    registerExpense: boolean = true
  ) => {
    if (amountUSD <= 0) return;
    const payment = {
      id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      amountUSD,
      date,
      note,
    };

    setData((prev) => {
      let targetDebt: DebtItem | undefined;
      const updatedDebts = prev.debts.map((debt) => {
        if (debt.id !== debtId) return debt;
        const allPayments = [...debt.payments, payment];
        const paidSoFar = allPayments.reduce((acc, p) => acc + p.amountUSD, 0);
        const isFullyPaid = paidSoFar >= debt.totalAmountUSD - 0.001;
        targetDebt = {
          ...debt,
          payments: allPayments,
          status: (isFullyPaid ? 'pagada' : 'activa') as 'activa' | 'pagada',
          paidAt: isFullyPaid ? new Date().toISOString() : undefined,
        };
        return targetDebt;
      });

      let updatedExpenses = prev.expenses;
      if (registerExpense && targetDebt) {
        const createdExpense: ExpenseItem = {
          id: `exp-debt-${Date.now()}`,
          description: `Abono Deuda: ${targetDebt.creditor} (${targetDebt.description})`,
          amountUSD,
          date,
          categoryId: 'cat-exp-8',
          status: 'pagado',
          createdAt: new Date().toISOString(),
          paidAt: new Date().toISOString(),
        };
        updatedExpenses = [createdExpense, ...prev.expenses];
      }

      return {
        ...prev,
        debts: updatedDebts,
        expenses: updatedExpenses,
      };
    });
  };

  const payDebtFull = (debtId: string, date: string, registerExpense: boolean = true) => {
    setData((prev) => {
      let debtAmountToPay = 0;
      let targetDebt: DebtItem | undefined;

      const updatedDebts = prev.debts.map((debt) => {
        if (debt.id !== debtId) return debt;
        const paidSoFar = debt.payments.reduce((acc, p) => acc + p.amountUSD, 0);
        debtAmountToPay = Math.max(0, debt.totalAmountUSD - paidSoFar);

        const fullPayment = {
          id: `pay-${Date.now()}`,
          amountUSD: debtAmountToPay,
          date,
          note: 'Liquidación total de deuda',
        };

        targetDebt = {
          ...debt,
          payments: [...debt.payments, fullPayment],
          status: 'pagada' as const,
          paidAt: new Date().toISOString(),
        };
        return targetDebt;
      });

      let updatedExpenses = prev.expenses;
      if (registerExpense && targetDebt && debtAmountToPay > 0) {
        const createdExpense: ExpenseItem = {
          id: `exp-debt-full-${Date.now()}`,
          description: `Liquidación Total Deuda: ${targetDebt.creditor} (${targetDebt.description})`,
          amountUSD: debtAmountToPay,
          date,
          categoryId: 'cat-exp-8',
          status: 'pagado',
          createdAt: new Date().toISOString(),
          paidAt: new Date().toISOString(),
        };
        updatedExpenses = [createdExpense, ...prev.expenses];
      }

      return {
        ...prev,
        debts: updatedDebts,
        expenses: updatedExpenses,
      };
    });
  };

  const clearDebts = () => {
    setData((prev) => ({ ...prev, debts: [] }));
  };

  // Receivables
  const addReceivable = (receivable: Omit<ReceivableItem, 'id' | 'createdAt' | 'status'>) => {
    const newItem: ReceivableItem = {
      ...receivable,
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      status: 'pendiente',
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      receivables: [newItem, ...prev.receivables],
    }));
  };

  const updateReceivable = (id: string, updated: Partial<ReceivableItem>) => {
    setData((prev) => ({
      ...prev,
      receivables: prev.receivables.map((r) => {
        if (r.id !== id) return r;
        return { ...r, ...updated };
      }),
    }));
  };

  const deleteReceivable = (id: string) => {
    setData((prev) => ({
      ...prev,
      receivables: prev.receivables.filter((r) => r.id !== id),
    }));
  };

  const markReceivableAsPaid = (id: string) => {
    setData((prev) => ({
      ...prev,
      receivables: prev.receivables.map((r) => {
        if (r.id !== id) return r;
        return { ...r, status: 'pagado', paidAt: new Date().toISOString() };
      }),
    }));
  };

  const clearReceivables = () => {
    setData((prev) => ({ ...prev, receivables: [] }));
  };

  // Global reset
  const resetAllData = () => {
    const emptyDataset: FinanceData = {
      bcvRate: data.bcvRate || 71.85,
      lastBcvUpdate: new Date().toISOString(),
      profile: data.profile,
      categories: INITIAL_CATEGORIES,
      incomes: [],
      expenses: [],
      debts: [],
      receivables: [],
    };
    setData(emptyDataset);
  };

  // Calculated totals
  const totalIncomeUSD = useMemo(() => {
    return data.incomes.reduce((acc, curr) => acc + (curr.amountUSD || 0), 0);
  }, [data.incomes]);

  const totalIncomeDepositedUSD = useMemo(() => {
    return data.incomes
      .filter((i) => i.status === 'depositado' || (!i.status && i.status !== 'pendiente'))
      .reduce((acc, curr) => acc + (curr.amountUSD || 0), 0);
  }, [data.incomes]);

  const totalIncomePendingUSD = useMemo(() => {
    return data.incomes
      .filter((i) => i.status === 'pendiente')
      .reduce((acc, curr) => acc + (curr.amountUSD || 0), 0);
  }, [data.incomes]);

  const totalExpensesPaidUSD = useMemo(() => {
    return data.expenses
      .filter((e) => e.status === 'pagado')
      .reduce((acc, curr) => acc + (curr.amountUSD || 0), 0);
  }, [data.expenses]);

  const totalExpensesPendingUSD = useMemo(() => {
    return data.expenses
      .filter((e) => e.status === 'pendiente')
      .reduce((acc, curr) => acc + (curr.amountUSD || 0), 0);
  }, [data.expenses]);

  const totalReceivablesPendingUSD = useMemo(() => {
    return data.receivables
      .filter((r) => r.status === 'pendiente')
      .reduce((acc, curr) => acc + (curr.amountUSD || 0), 0);
  }, [data.receivables]);

  const totalReceivablesPaidUSD = useMemo(() => {
    return data.receivables
      .filter((r) => r.status === 'pagado')
      .reduce((acc, curr) => acc + (curr.amountUSD || 0), 0);
  }, [data.receivables]);

  const totalDebtsOriginalUSD = useMemo(() => {
    return data.debts.reduce((acc, d) => acc + (d.totalAmountUSD || 0), 0);
  }, [data.debts]);

  const totalDebtsRemainingUSD = useMemo(() => {
    return data.debts
      .filter((d) => d.status === 'activa')
      .reduce((acc, d) => {
        const paid = d.payments.reduce((pAcc, p) => pAcc + p.amountUSD, 0);
        return acc + Math.max(0, d.totalAmountUSD - paid);
      }, 0);
  }, [data.debts]);

  // Exact formula specified in prompt:
  // (Sumatoria de Ingresos Confirmados/Depositados + Cuentas por Cobrar Pagadas) - Egresos Pagados
  const netAvailableBalanceUSD = useMemo(() => {
    return totalIncomeDepositedUSD + totalReceivablesPaidUSD - totalExpensesPaidUSD;
  }, [totalIncomeDepositedUSD, totalReceivablesPaidUSD, totalExpensesPaidUSD]);

  // Backup & Restore Implementation
  const exportBackupJSON = (): string => {
    const summary: BackupSummary = {
      totalIncomes: data.incomes.length,
      totalExpenses: data.expenses.length,
      totalDebts: data.debts.length,
      totalReceivables: data.receivables.length,
      totalCategories: data.categories.length,
      netBalanceUSD: netAvailableBalanceUSD,
      bcvRate: data.bcvRate,
    };

    const backup: BackupFileStructure = {
      version: '1.0',
      appName: 'FinanzasBCV',
      exportedAt: new Date().toISOString(),
      author: data.profile.name || 'Josmar Puerta',
      summary,
      data: JSON.parse(JSON.stringify(data)),
    };

    return JSON.stringify(backup, null, 2);
  };

  const downloadBackupFile = () => {
    const jsonStr = exportBackupJSON();
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}`;
    const fileName = `FinanzasBCV_Backup_${dateStr}_${timeStr}.json`;

    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const parseBackupFile = (jsonText: string): RestoreResult => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, message: 'El archivo JSON no tiene un formato válido.' };
      }

      // Check if it's wrapped in BackupFileStructure (.data) or raw FinanceData
      const source: any = parsed.data && typeof parsed.data === 'object' ? parsed.data : parsed;

      if (!Array.isArray(source.incomes) || !Array.isArray(source.expenses)) {
        return {
          success: false,
          message: 'El archivo no contiene la estructura requerida de FinanzasBCV (falta listado de ingresos o egresos).',
        };
      }

      const incomesCount = Array.isArray(source.incomes) ? source.incomes.length : 0;
      const expensesCount = Array.isArray(source.expenses) ? source.expenses.length : 0;
      const debtsCount = Array.isArray(source.debts) ? source.debts.length : 0;
      const receivablesCount = Array.isArray(source.receivables) ? source.receivables.length : 0;
      const categoriesCount = Array.isArray(source.categories) ? source.categories.length : 0;
      const profileName = source.profile?.name || parsed.author || 'Usuario';
      const bcvRate = typeof source.bcvRate === 'number' && source.bcvRate > 0 ? source.bcvRate : 71.85;

      const incTotal = (source.incomes || [])
        .filter((i: any) => i.status === 'depositado' || (!i.status && i.status !== 'pendiente'))
        .reduce((acc: number, i: any) => acc + (Number(i.amountUSD) || 0), 0);
      const paidRecTotal = (source.receivables || [])
        .filter((r: any) => r.status === 'pagado')
        .reduce((acc: number, r: any) => acc + (Number(r.amountUSD) || 0), 0);
      const paidExpTotal = (source.expenses || [])
        .filter((e: any) => e.status === 'pagado')
        .reduce((acc: number, e: any) => acc + (Number(e.amountUSD) || 0), 0);
      const netBal = incTotal + paidRecTotal - paidExpTotal;

      return {
        success: true,
        message: 'Archivo de copia de seguridad validado exitosamente.',
        recordsCount: incomesCount + expensesCount + debtsCount + receivablesCount + categoriesCount,
        preview: {
          exportedAt: parsed.exportedAt || new Date().toISOString(),
          profileName,
          bcvRate,
          incomesCount,
          expensesCount,
          debtsCount,
          receivablesCount,
          categoriesCount,
          netBalanceUSD: netBal,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Error al leer el archivo JSON: ${err.message || 'Sintaxis inválida'}`,
      };
    }
  };

  const restoreFromBackup = (
    backupPayload: BackupFileStructure,
    mode: 'replace' | 'merge' = 'replace'
  ): RestoreResult => {
    try {
      const source: FinanceData =
        backupPayload.data && typeof backupPayload.data === 'object'
          ? backupPayload.data
          : (backupPayload as any);

      if (!Array.isArray(source.incomes) || !Array.isArray(source.expenses)) {
        return {
          success: false,
          message: 'El contenido de la copia de seguridad no es válido.',
        };
      }

      if (mode === 'replace') {
        const cleanData: FinanceData = {
          bcvRate: typeof source.bcvRate === 'number' && source.bcvRate > 0 ? source.bcvRate : data.bcvRate,
          lastBcvUpdate: source.lastBcvUpdate || new Date().toISOString(),
          profile: {
            id: source.profile?.id || data.profile.id || activeProfileId,
            name: source.profile?.name || data.profile.name,
            title: source.profile?.title || data.profile.title,
            avatarUrl: source.profile?.avatarUrl || data.profile.avatarUrl,
            accountType: source.profile?.accountType || data.profile.accountType || 'personal',
            colorTag: source.profile?.colorTag || data.profile.colorTag || '#FFD700',
          },
          categories:
            Array.isArray(source.categories) && source.categories.length > 0
              ? source.categories
              : INITIAL_CATEGORIES,
          incomes: source.incomes || [],
          expenses: source.expenses || [],
          debts: source.debts || [],
          receivables: source.receivables || [],
        };

        setData(cleanData);
        const total =
          cleanData.incomes.length +
          cleanData.expenses.length +
          cleanData.debts.length +
          cleanData.receivables.length +
          cleanData.categories.length;

        return {
          success: true,
          message: `Copia de seguridad restaurada exitosamente. Se guardaron ${total} registros en almacenamiento local.`,
          recordsCount: total,
        };
      } else {
        // Merge mode: combine without duplicates
        let addedCount = 0;
        setData((prev) => {
          const existingIncIds = new Set(prev.incomes.map((i) => i.id));
          const newIncomes = (source.incomes || []).filter((i) => !existingIncIds.has(i.id));

          const existingExpIds = new Set(prev.expenses.map((e) => e.id));
          const newExpenses = (source.expenses || []).filter((e) => !existingExpIds.has(e.id));

          const existingDebtIds = new Set(prev.debts.map((d) => d.id));
          const newDebts = (source.debts || []).filter((d) => !existingDebtIds.has(d.id));

          const existingRecIds = new Set(prev.receivables.map((r) => r.id));
          const newReceivables = (source.receivables || []).filter((r) => !existingRecIds.has(r.id));

          const existingCatNames = new Set(prev.categories.map((c) => c.name.toLowerCase()));
          const newCategories = (source.categories || []).filter(
            (c) => !existingCatNames.has(c.name.toLowerCase())
          );

          addedCount =
            newIncomes.length +
            newExpenses.length +
            newDebts.length +
            newReceivables.length +
            newCategories.length;

          return {
            ...prev,
            categories: [...prev.categories, ...newCategories],
            incomes: [...prev.incomes, ...newIncomes],
            expenses: [...prev.expenses, ...newExpenses],
            debts: [...prev.debts, ...newDebts],
            receivables: [...prev.receivables, ...newReceivables],
          };
        });

        return {
          success: true,
          message: `Datos fusionados con éxito. Se agregaron nuevos registros a LocalStorage.`,
          recordsCount: addedCount,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: `Error al restaurar: ${err.message || 'Error desconocido'}`,
      };
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        data,
        activeModule,
        setActiveModule,
        bcvRate: data.bcvRate,
        setBcvRate,
        refreshBcvRate,
        isSyncingBcv,
        bcvStatusMessage,
        // Profile Management (Multi-Profile)
        profiles,
        activeProfileId,
        activeProfile,
        switchProfile,
        createProfile,
        deleteProfile,
        updateProfile,
        isProfileModalOpen,
        setIsProfileModalOpen,
        addIncome,
        updateIncome,
        deleteIncome,
        markIncomeAsDeposited,
        markIncomeAsPending,
        toggleIncomeDepositStatus,
        markAllIncomesAsDeposited,
        markSelectedIncomesAsDeposited,
        clearIncomes,
        addExpense,
        updateExpense,
        deleteExpense,
        markExpenseAsPending,
        markExpenseAsPaid,
        clearExpenses,
        clearPendingExpenses,
        addDebt,
        updateDebt,
        deleteDebt,
        abonarDebt,
        payDebtFull,
        clearDebts,
        addReceivable,
        updateReceivable,
        deleteReceivable,
        markReceivableAsPaid,
        clearReceivables,
        addCategory,
        deleteCategory,
        resetAllData,
        totalIncomeUSD,
        totalIncomeDepositedUSD,
        totalIncomePendingUSD,
        totalExpensesPaidUSD,
        totalExpensesPendingUSD,
        totalReceivablesPendingUSD,
        totalReceivablesPaidUSD,
        totalDebtsOriginalUSD,
        totalDebtsRemainingUSD,
        netAvailableBalanceUSD,
        getCategoryById,
        // Offline & Network Persistence
        isOnline,
        isSimulatingOffline,
        toggleSimulateOffline,
        effectiveIsOnline,
        checkConnectivity,
        storageStats,
        lastConnectionEvent,
        clearConnectionEvent,
        offlineBannerDismissed,
        setOfflineBannerDismissed,
        isOfflineStatusModalOpen,
        setIsOfflineStatusModalOpen,
        // Backup & Restore
        exportBackupJSON,
        downloadBackupFile,
        parseBackupFile,
        restoreFromBackup,
        isBackupModalOpen,
        setIsBackupModalOpen,
        // Local Storage
        cloudSyncState,
        loginWithGoogleAction,
        logoutAction,
        forceSyncToCloudAction,
        isCloudModalOpen,
        setIsCloudModalOpen,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
