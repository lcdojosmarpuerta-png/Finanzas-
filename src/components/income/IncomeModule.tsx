import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Plus,
  Trash2,
  Edit2,
  Filter,
  Search,
  DollarSign,
  Calendar,
  Tag,
  Check,
  X,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Layers,
  ChevronDown,
  Building2,
  CheckCircle2,
  Clock,
  Wallet,
  ArrowUpRight,
  Zap,
  CheckSquare,
  Square,
  CheckCheck,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { formatUSD, formatBs, calcBs } from '../../services/bcvService.ts';
import { IncomeItem } from '../../types/finance.ts';
import { ConfirmModal } from '../common/ConfirmModal.tsx';

interface IncomeModuleProps {
  onOpenCategories: () => void;
}

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500];

export const IncomeModule: React.FC<IncomeModuleProps> = ({ onOpenCategories }) => {
  const {
    data,
    bcvRate,
    addIncome,
    updateIncome,
    deleteIncome,
    clearIncomes,
    markIncomeAsDeposited,
    markIncomeAsPending,
    markAllIncomesAsDeposited,
    markSelectedIncomesAsDeposited,
    totalIncomeUSD,
    totalIncomePendingUSD,
    netAvailableBalanceUSD,
    getCategoryById,
  } = useFinance();

  // Modern Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [amountUSD, setAmountUSD] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [initialStatus, setInitialStatus] = useState<'depositado' | 'pendiente'>('pendiente');
  const [showSuccessBadge, setShowSuccessBadge] = useState(false);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editBankAccount, setEditBankAccount] = useState('');
  const [editStatus, setEditStatus] = useState<'depositado' | 'pendiente'>('pendiente');

  // Filters
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendiente' | 'depositado'>('all');
  // Additional Date Filter
  const [dateFilterPreset, setDateFilterPreset] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals & Feedback
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [confirmBulkAllOpen, setConfirmBulkAllOpen] = useState(false);
  const [confirmSelectedOpen, setConfirmSelectedOpen] = useState(false);
  const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([]);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [depositItemToConfirm, setDepositItemToConfirm] = useState<IncomeItem | null>(null);
  const [pendingItemToConfirm, setPendingItemToConfirm] = useState<IncomeItem | null>(null);
  const [depositSuccessMsg, setDepositSuccessMsg] = useState<string | null>(null);

  const incomeCategories = data.categories.filter((c) => c.type === 'income');
  const activeCategoryId = categoryId || incomeCategories[0]?.id || 'cat-inc-1';

  // Counts for status badges
  const totalIncomesPendingCount = useMemo(() => {
    return data.incomes.filter((i) => i.status === 'pendiente').length;
  }, [data.incomes]);

  const totalIncomesDepositedCount = useMemo(() => {
    return data.incomes.filter((i) => i.status === 'depositado' || (!i.status && i.status !== 'pendiente')).length;
  }, [data.incomes]);

  // Opción 1: Cálculos y selección múltiple de pendientes
  const selectedPendingItems = useMemo(() => {
    const idSet = new Set(selectedPendingIds);
    return data.incomes.filter((i) => idSet.has(i.id) && i.status === 'pendiente');
  }, [data.incomes, selectedPendingIds]);

  const selectedPendingTotalUSD = useMemo(() => {
    return selectedPendingItems.reduce((acc, i) => acc + (i.amountUSD || 0), 0);
  }, [selectedPendingItems]);

  const handleToggleSelectPending = (id: string) => {
    setSelectedPendingIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllPending = () => {
    const allPendingIds = data.incomes
      .filter((i) => i.status === 'pendiente')
      .map((i) => i.id);

    if (selectedPendingIds.length === allPendingIds.length && allPendingIds.length > 0) {
      setSelectedPendingIds([]);
    } else {
      setSelectedPendingIds(allPendingIds);
    }
  };

  const handleConfirmBulkAll = () => {
    const pendingTotal = totalIncomePendingUSD;
    const count = totalIncomesPendingCount;
    markAllIncomesAsDeposited();
    setSelectedPendingIds([]);
    setConfirmBulkAllOpen(false);
    const msg = `¡Depósito masivo exitoso! Se han confirmado ${count} ingresos pendientes (+${formatUSD(pendingTotal)} USD / ${formatBs(calcBs(pendingTotal, bcvRate))}) y sumado de inmediato al Saldo Neto Disponible.`;
    setDepositSuccessMsg(msg);
    setTimeout(() => setDepositSuccessMsg(null), 5000);
  };

  const handleConfirmSelected = () => {
    if (selectedPendingIds.length === 0) return;
    const count = selectedPendingIds.length;
    const amount = selectedPendingTotalUSD;
    markSelectedIncomesAsDeposited(selectedPendingIds);
    setSelectedPendingIds([]);
    setConfirmSelectedOpen(false);
    const msg = `¡${count} ingresos confirmados como depositados! (+${formatUSD(amount)} USD / ${formatBs(calcBs(amount, bcvRate))}) sumados al Saldo Neto Disponible.`;
    setDepositSuccessMsg(msg);
    setTimeout(() => setDepositSuccessMsg(null), 5000);
  };

  // Real-time conversion calculation for form
  const parsedFormAmount = parseFloat(amountUSD) || 0;
  const convertedBs = calcBs(parsedFormAmount, bcvRate);

  const handlePresetClick = (val: number) => {
    setAmountUSD(val.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || parsedFormAmount <= 0) return;

    addIncome({
      description: description.trim(),
      amountUSD: parsedFormAmount,
      date,
      categoryId: activeCategoryId,
      status: initialStatus,
      bankAccount: bankAccount.trim() || undefined,
    });

    setDescription('');
    setAmountUSD('');
    setBankAccount('');
    setShowSuccessBadge(true);
    setTimeout(() => setShowSuccessBadge(false), 2500);
  };

  const startEdit = (item: IncomeItem) => {
    setEditingId(item.id);
    setEditDesc(item.description);
    setEditAmount(item.amountUSD.toString());
    setEditDate(item.date);
    setEditCategoryId(item.categoryId);
    setEditBankAccount(item.bankAccount || '');
    setEditStatus(item.status || 'depositado');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    const num = parseFloat(editAmount);
    if (isNaN(num) || num <= 0 || !editDesc.trim()) return;

    const existing = data.incomes.find((i) => i.id === editingId);

    updateIncome(editingId, {
      description: editDesc.trim(),
      amountUSD: num,
      date: editDate,
      categoryId: editCategoryId,
      bankAccount: editBankAccount.trim() || undefined,
      status: editStatus,
      depositedAt: editStatus === 'depositado' ? (existing?.depositedAt || new Date().toISOString()) : undefined,
    });
    setEditingId(null);
  };

  const handleConfirmDeposit = () => {
    if (!depositItemToConfirm) return;
    markIncomeAsDeposited(depositItemToConfirm.id);
    const msg = `¡Depósito confirmado! Se han sumado +${formatUSD(depositItemToConfirm.amountUSD)} USD (${formatBs(calcBs(depositItemToConfirm.amountUSD, bcvRate))}) al Saldo Neto Disponible.`;
    setDepositSuccessMsg(msg);
    setTimeout(() => setDepositSuccessMsg(null), 4500);
    setDepositItemToConfirm(null);
  };

  const handleConfirmRevertPending = () => {
    if (!pendingItemToConfirm) return;
    markIncomeAsPending(pendingItemToConfirm.id);
    const msg = `Ingreso marcado como pendiente por depositar (se descontó del Saldo Neto Disponible).`;
    setDepositSuccessMsg(msg);
    setTimeout(() => setDepositSuccessMsg(null), 4500);
    setPendingItemToConfirm(null);
  };

  // Helper date checking
  const isDateInFilter = (itemDateStr: string) => {
    if (dateFilterPreset === 'all') return true;

    const itemDate = new Date(itemDateStr);
    const now = new Date();

    if (dateFilterPreset === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      return itemDateStr === todayStr;
    }

    if (dateFilterPreset === 'week') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return itemDate >= sevenDaysAgo && itemDate <= now;
    }

    if (dateFilterPreset === 'month') {
      return (
        itemDate.getFullYear() === now.getFullYear() &&
        itemDate.getMonth() === now.getMonth()
      );
    }

    if (dateFilterPreset === 'custom') {
      if (startDate && itemDateStr < startDate) return false;
      if (endDate && itemDateStr > endDate) return false;
      return true;
    }

    return true;
  };

  // Filtered and sorted list (descending by date)
  const filteredIncomes = data.incomes
    .filter((item) => {
      const itemStatus = item.status || 'depositado';
      const matchesStatus =
        statusFilter === 'all' || itemStatus === statusFilter;
      const matchesCategory =
        selectedCategoryFilter === 'all' || item.categoryId === selectedCategoryFilter;
      const matchesSearch =
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDate = isDateInFilter(item.date);
      return matchesStatus && matchesCategory && matchesSearch && matchesDate;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      {/* 1. Al principio del módulo: Formulario al desplegarse, o solo el botón de Nuevo Ingreso */}
      {isFormOpen ? (
        <div className="bg-gradient-to-b from-[#1E1E1E] to-[#171717] border border-emerald-500/30 rounded-3xl p-5 sm:p-7 shadow-[0_12px_40px_rgba(0,0,0,0.6)] relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Subtle green ambient light */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between pb-4 border-b border-neutral-800 relative z-10">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#2ECC71] font-bold block">
                Nuevo Registro
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
                <Plus className="w-5 h-5 text-[#2ECC71]" />
                Registrar Ingreso
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenCategories}
                className="text-xs text-[#FFD700] hover:text-yellow-300 font-semibold flex items-center gap-1 cursor-pointer bg-yellow-500/10 px-2.5 py-1 rounded-lg border border-yellow-500/20"
              >
                <Tag className="w-3 h-3" />
                <span>Categorías</span>
              </button>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                title="Cerrar formulario"
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4 relative z-10">
            {/* Monto USD with presets */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Monto en Dólares (USD $) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-neutral-400 text-sm font-mono font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amountUSD}
                  onChange={(e) => setAmountUSD(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#121212] border-2 border-neutral-700/80 focus:border-[#2ECC71] rounded-2xl pl-8 pr-4 py-2.5 text-sm sm:text-base font-mono font-bold text-white placeholder-neutral-500 focus:outline-none shadow-inner transition-colors"
                />
              </div>

              {/* Quick preset chips */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-[10px] text-neutral-500 font-mono">Montos rápidos:</span>
                {PRESET_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handlePresetClick(amt)}
                    className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded-lg bg-neutral-800/90 text-neutral-300 hover:text-white hover:bg-neutral-700 border border-neutral-700/60 transition-colors cursor-pointer"
                  >
                    +${amt}
                  </button>
                ))}
              </div>

              {/* Live Reactive Bolívares Reconversion Card */}
              <div className="mt-2.5 p-3 bg-[#121212] border border-neutral-800 rounded-xl flex items-center justify-between text-xs font-mono shadow-inner">
                <div>
                  <span className="text-[10px] text-neutral-400 block">Reconversión BCV:</span>
                  <span className="text-sm font-extrabold text-[#FFD700] tabular-nums">
                    {formatBs(convertedBs)}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500 font-sans">
                  @ Bs. {bcvRate.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Categoría Selector (Lista Desplegable) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-neutral-300">
                  Categoría del Ingreso *
                </label>
                {onOpenCategories && (
                  <button
                    type="button"
                    onClick={onOpenCategories}
                    className="text-[10px] text-[#FFD700] hover:underline cursor-pointer"
                  >
                    + Crear Categoría
                  </button>
                )}
              </div>
              <div className="relative">
                <select
                  value={activeCategoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-[#121212] border-2 border-neutral-700/80 focus:border-[#2ECC71] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none shadow-inner cursor-pointer transition-colors appearance-none pr-10"
                >
                  {incomeCategories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#181818] text-white py-1.5">
                      📁 {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Descripción / Concepto *
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Honorarios por servicio, venta de mercancía..."
                className="w-full bg-[#121212] border border-neutral-700 focus:border-[#2ECC71] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none shadow-inner"
              />
            </div>

            {/* Selector de Fecha */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Fecha de Recepción *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#121212] border border-neutral-700 focus:border-[#2ECC71] rounded-xl px-3 py-2 text-xs text-white focus:outline-none shadow-inner"
              />
            </div>

            {/* Estado del Depósito (Depositado vs Pendiente) */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center justify-between">
                <span>¿Está depositado en cuenta bancaria? *</span>
                <span className="text-[10px] text-neutral-400 font-normal">
                  {initialStatus === 'depositado' ? 'Sumará al saldo neto' : 'No se suma hasta confirmar'}
                </span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setInitialStatus('pendiente')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    initialStatus === 'pendiente'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                      : 'bg-[#121212] border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-600'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pendiente por Depositar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInitialStatus('depositado')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    initialStatus === 'depositado'
                      ? 'bg-emerald-500/20 border-emerald-500 text-[#2ECC71] shadow-sm'
                      : 'bg-[#121212] border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-600'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2ECC71]" />
                  <span>Depositado en Cuenta</span>
                </button>
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                {initialStatus === 'pendiente'
                  ? 'Podrás presionar el botón "Depositado" en cualquier momento cuando el dinero esté en cuenta para sumarlo al Saldo Neto Disponible.'
                  : 'Este ingreso se considerará efectivo y se sumará inmediatamente a tu Saldo Neto Disponible.'}
              </p>
            </div>

            {/* Cuenta o Banco Destino (Opcional) */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1 flex items-center justify-between">
                <span>Cuenta o Banco Destino (Opcional)</span>
                <span className="text-[10px] text-neutral-500">Ej: Banesco, Zelle, Pago Móvil</span>
              </label>
              <input
                type="text"
                list="income-bank-list"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="Selecciona o escribe el banco / método..."
                className="w-full bg-[#121212] border border-neutral-700 focus:border-[#2ECC71] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none shadow-inner"
              />
              <datalist id="income-bank-list">
                <option value="Banesco" />
                <option value="Banco Mercantil" />
                <option value="BBVA Provincial" />
                <option value="Banco de Venezuela" />
                <option value="Bancaribe" />
                <option value="BNC" />
                <option value="Pago Móvil" />
                <option value="Zelle" />
                <option value="Binance (USDT)" />
                <option value="Efectivo USD" />
                <option value="Efectivo Bs" />
              </datalist>
            </div>

            {/* Submit & Close Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="py-3 px-5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs rounded-2xl transition-all cursor-pointer"
              >
                Cerrar Formulario
              </button>
              <button
                type="submit"
                className="flex-1 py-3 px-5 bg-gradient-to-r from-[#2ECC71] to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-black font-extrabold text-xs rounded-2xl shadow-[0_6px_25px_rgba(46,204,113,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Guardar Ingreso</span>
              </button>
            </div>

            {/* Success message badge */}
            {showSuccessBadge && (
              <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs text-center font-semibold flex items-center justify-center gap-1.5 animate-in fade-in">
                <Check className="w-4 h-4" />
                <span>¡Ingreso registrado exitosamente!</span>
              </div>
            )}
          </form>
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#2ECC71] to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-black font-extrabold text-sm shadow-[0_4px_20px_rgba(46,204,113,0.3)] hover:shadow-[0_6px_25px_rgba(46,204,113,0.4)] transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-5 h-5 stroke-[2.8]" />
            <span>Nuevo Ingreso</span>
          </button>
        </div>
      )}

      {/* Alerta de Éxito al Confirmar Depósito */}
      {depositSuccessMsg && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-2xl text-emerald-300 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-[0_8px_30px_rgba(46,204,113,0.25)] animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/30 text-[#2ECC71] flex items-center justify-center shrink-0 border border-emerald-500/50">
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">{depositSuccessMsg}</p>
              <p className="text-[11px] text-emerald-400 mt-0.5">
                El Saldo Neto Disponible se ha recalculado y actualizado en tiempo real.
              </p>
            </div>
          </div>
          <button
            onClick={() => setDepositSuccessMsg(null)}
            className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Indicador de Ingresos Pendientes por Depositar (si existen) con botón de depósito masivo */}
      {totalIncomesPendingCount > 0 && (
        <div className="bg-[#1A1A1A] border border-amber-500/30 rounded-3xl p-4 sm:p-5 shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Ingresos Pendientes por Depositar
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                  {totalIncomesPendingCount}
                </span>
              </div>
              <p className="text-xs font-mono text-neutral-300 mt-0.5">
                Monto pendiente: <strong className="text-amber-400 font-extrabold">+{formatUSD(totalIncomePendingUSD)} USD</strong> ({formatBs(calcBs(totalIncomePendingUSD, bcvRate))})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setConfirmBulkAllOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black text-xs font-black rounded-xl shadow-[0_2px_12px_rgba(245,158,11,0.3)] hover:shadow-[0_4px_16px_rgba(245,158,11,0.5)] active:scale-95 transition-all cursor-pointer shrink-0 self-start sm:self-center"
            title="Depositar todos los ingresos pendientes a la vez"
          >
            <Zap className="w-3.5 h-3.5 fill-black stroke-black" />
            <span>Depositar Todos (+{formatUSD(totalIncomePendingUSD)} USD)</span>
          </button>
        </div>
      )}

      {/* Listado con Filtros de Estado, Categoría y Fecha (Ancho completo) */}
      <div className="w-full bg-[#1A1A1A] border border-neutral-800/90 rounded-3xl p-5 sm:p-7 shadow-[0_12px_40px_rgba(0,0,0,0.55)] transition-all duration-300">
          {/* Header & Filter Controls */}
          <div className="pb-4 border-b border-neutral-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Listado de Ingresos
                </h3>
                <p className="text-xs text-neutral-400">
                  {filteredIncomes.length} movimientos encontrados
                </p>
              </div>

              {/* Search and Action */}
              <div className="flex items-center gap-2">
                {data.incomes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setConfirmClearOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-neutral-400 hover:text-[#E74C3C] bg-neutral-900/80 hover:bg-red-500/10 border border-neutral-800 hover:border-red-500/30 rounded-xl transition-all cursor-pointer shrink-0"
                    title="Limpiar todos los ingresos"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Limpiar Todo</span>
                  </button>
                )}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar ingreso..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-[#121212] border border-neutral-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none w-full sm:w-44 shadow-inner"
                  />
                </div>
              </div>
            </div>

            {/* FILTROS: Estado de Depósito (Todos / Pendientes / Depositados) */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] font-semibold text-neutral-400 mr-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#FFD700]" />
                Estado:
              </span>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-[#FFD700] text-black shadow-sm'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                Todos ({data.incomes.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pendiente')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'pendiente'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'bg-neutral-800 text-amber-400 hover:bg-neutral-700'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>Pendientes</span>
                {totalIncomesPendingCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 text-amber-300">
                    {totalIncomesPendingCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('depositado')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'depositado'
                    ? 'bg-[#2ECC71] text-black shadow-sm'
                    : 'bg-neutral-800 text-[#2ECC71] hover:bg-neutral-700'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Depositados</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 text-emerald-300">
                  {totalIncomesDepositedCount}
                </span>
              </button>

              {/* Botón de selección masiva para pendientes */}
              {totalIncomesPendingCount > 0 && (
                <button
                  type="button"
                  onClick={handleToggleSelectAllPending}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 ml-auto"
                  title="Seleccionar o deseleccionar todos los ingresos pendientes para depósito masivo"
                >
                  {selectedPendingIds.length === totalIncomesPendingCount ? (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 text-[#2ECC71]" />
                      <span>Deseleccionar todos</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Seleccionar pendientes ({totalIncomesPendingCount})</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* FILTRO ADICIONAL POR FECHA Y CATEGORÍA */}
            <div className="pt-2 border-t border-neutral-800/80 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#FFD700]" />
                  Fecha:
                </span>

                <div className="flex items-center gap-1 flex-wrap">
                  {[
                    { id: 'all', label: 'Todas' },
                    { id: 'today', label: 'Hoy' },
                    { id: 'week', label: 'Esta Semana' },
                    { id: 'month', label: 'Este Mes' },
                    { id: 'custom', label: 'Personalizado' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setDateFilterPreset(tab.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        dateFilterPreset === tab.id
                          ? 'bg-[#FFD700] text-black font-bold shadow'
                          : 'bg-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Category Filter */}
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="bg-[#121212] border border-neutral-700 rounded-xl px-2.5 py-1 text-xs text-neutral-300 focus:outline-none ml-auto"
                >
                  <option value="all">Todas las Categorías</option>
                  {incomeCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Date Range if active */}
              {dateFilterPreset === 'custom' && (
                <div className="p-2.5 bg-[#121212] border border-neutral-800 rounded-xl flex items-center gap-3 text-xs flex-wrap animate-in fade-in">
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-400">Desde:</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-[#1A1A1A] border border-neutral-700 rounded-lg px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-400">Hasta:</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-[#1A1A1A] border border-neutral-700 rounded-lg px-2 py-1 text-xs text-white"
                    />
                  </div>
                  {(startDate || endDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        setStartDate('');
                        setEndDate('');
                      }}
                      className="text-[11px] text-neutral-400 hover:text-white underline cursor-pointer"
                    >
                      Restablecer fechas
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Opción 1: Barra de Acción de Lote Flotante/Destacada */}
          {selectedPendingIds.length > 0 && (
            <div className="my-3 p-3.5 bg-gradient-to-r from-amber-500/20 via-emerald-500/15 to-[#171717] border border-amber-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 shadow-lg shadow-black/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/30 text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/50">
                  <CheckCheck className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-2 flex-wrap">
                    <span>{selectedPendingIds.length} {selectedPendingIds.length === 1 ? 'ingreso seleccionado' : 'ingresos seleccionados'}</span>
                    <span className="text-amber-300 font-mono font-extrabold text-sm">
                      +{formatUSD(selectedPendingTotalUSD)} USD
                    </span>
                    <span className="text-neutral-400 text-[11px] font-mono">
                      ({formatBs(calcBs(selectedPendingTotalUSD, bcvRate))})
                    </span>
                  </p>
                  <p className="text-[11px] text-neutral-300 mt-0.5">
                    Se sumarán automáticamente al Saldo Neto Disponible al confirmar el depósito.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedPendingIds([])}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Deseleccionar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmSelectedOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-[#2ECC71] hover:from-emerald-400 hover:to-emerald-500 text-black text-xs font-black rounded-xl shadow-[0_2px_12px_rgba(46,204,113,0.3)] transition-all active:scale-95 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 fill-black stroke-black" />
                  <span>Confirmar Depósito ({selectedPendingIds.length})</span>
                </button>
              </div>
            </div>
          )}

          {/* List items */}
          {filteredIncomes.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-neutral-500 mx-auto" />
              <p className="text-sm font-semibold text-neutral-300">No hay ingresos con los filtros seleccionados</p>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                {data.incomes.length === 0
                  ? 'Aún no has registrado ningún ingreso. Comienza agregando tu primer movimiento.'
                  : 'Ajusta el estado, fechas o criterios de búsqueda para visualizar los ingresos.'}
              </p>
              {!isFormOpen && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#2ECC71] hover:bg-emerald-400 text-black text-xs font-extrabold rounded-xl shadow cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Agregar Ingreso</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-neutral-800/70 mt-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredIncomes.map((item) => {
                const category = getCategoryById(item.categoryId);
                const isEditing = editingId === item.id;
                const isDeposited = item.status === 'depositado' || (!item.status && item.status !== 'pendiente');

                if (isEditing) {
                  return (
                    <form
                      key={item.id}
                      onSubmit={handleSaveEdit}
                      className="py-3 px-3 bg-neutral-900/90 rounded-2xl my-1 border border-neutral-700 space-y-2.5 shadow-lg"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="bg-[#121212] border border-neutral-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                        />
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="bg-[#121212] border border-neutral-700 rounded-xl px-2.5 py-1.5 text-xs font-mono text-white"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <select
                          value={editCategoryId}
                          onChange={(e) => setEditCategoryId(e.target.value)}
                          className="bg-[#121212] border border-neutral-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                        >
                          {incomeCategories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="bg-[#121212] border border-neutral-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                        />
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value as any)}
                          className="bg-[#121212] border border-neutral-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white"
                        >
                          <option value="pendiente">⏳ Pendiente por Depositar</option>
                          <option value="depositado">✓ Depositado en Cuenta</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                        <input
                          type="text"
                          list="income-bank-list"
                          value={editBankAccount}
                          onChange={(e) => setEditBankAccount(e.target.value)}
                          placeholder="Banco/Método (opcional)"
                          className="bg-[#121212] border border-neutral-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1 text-xs text-neutral-400 hover:text-white cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 bg-[#2ECC71] text-black text-xs font-bold rounded-xl shadow cursor-pointer"
                          >
                            Guardar Cambios
                          </button>
                        </div>
                      </div>
                    </form>
                  );
                }

                return (
                  <div
                    key={item.id}
                    className={`py-3.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-800/40 rounded-2xl transition-all group ${
                      selectedPendingIds.includes(item.id) ? 'bg-amber-500/10 border border-amber-500/30' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Opción 1: Checkbox individual para ingresos pendientes */}
                      {!isDeposited && (
                        <button
                          type="button"
                          onClick={() => handleToggleSelectPending(item.id)}
                          className="p-1 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer shrink-0"
                          title={selectedPendingIds.includes(item.id) ? "Deseleccionar ingreso" : "Seleccionar para depósito masivo"}
                        >
                          {selectedPendingIds.includes(item.id) ? (
                            <CheckSquare className="w-4 h-4 text-[#2ECC71]" />
                          ) : (
                            <Square className="w-4 h-4 text-neutral-500 hover:text-neutral-300" />
                          )}
                        </button>
                      )}

                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: category?.color || '#2ECC71' }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#2ECC71] transition-colors">
                            {item.description}
                          </p>
                          {/* Badge de Estado */}
                          {isDeposited ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-[#2ECC71] border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Depositado</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              <Clock className="w-3 h-3" />
                              <span>Pendiente por depositar</span>
                            </span>
                          )}

                          {/* Badge de Banco / Método */}
                          {item.bankAccount && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700">
                              <Building2 className="w-2.5 h-2.5 text-[#FFD700]" />
                              <span>{item.bankAccount}</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-1 flex-wrap">
                          <span className="font-mono">{item.date}</span>
                          <span>·</span>
                          <span className="truncate">{category?.name || 'General'}</span>
                          {isDeposited && (
                            <>
                              <span>·</span>
                              <span className="text-[#2ECC71] font-medium hidden md:inline">
                                Sumado a Saldo Neto
                              </span>
                              {item.depositedAt && (
                                <span className="text-[10px] text-emerald-400/80 font-mono hidden lg:inline">
                                  ({new Date(item.depositedAt).toLocaleDateString('es-VE')})
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800/60">
                      <div className="text-left sm:text-right">
                        <p className={`text-xs sm:text-sm font-extrabold font-mono tabular-nums ${
                          isDeposited ? 'text-[#2ECC71]' : 'text-amber-400'
                        }`}>
                          +{formatUSD(item.amountUSD)}
                        </p>
                        <p className="text-[10px] font-mono text-neutral-400 tabular-nums">
                          {formatBs(calcBs(item.amountUSD, bcvRate))}
                        </p>
                      </div>

                      {/* Botón de Depositado: requerido explícitamente */}
                      <div className="flex items-center gap-2">
                        {isDeposited ? (
                          <button
                            type="button"
                            onClick={() => setPendingItemToConfirm(item)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 hover:bg-amber-500/15 text-[#2ECC71] hover:text-amber-400 border border-emerald-500/30 hover:border-amber-500/40 text-xs font-bold rounded-xl transition-all cursor-pointer group/dep"
                            title="Ingreso confirmado en cuenta. Clic para cambiar a pendiente por depositar."
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 group-hover/dep:hidden" />
                            <Clock className="w-3.5 h-3.5 hidden group-hover/dep:inline" />
                            <span className="group-hover/dep:hidden">Depositado ✓</span>
                            <span className="hidden group-hover/dep:inline">Deshacer</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDepositItemToConfirm(item)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-[#2ECC71] hover:from-emerald-400 hover:to-emerald-500 text-black text-xs font-black rounded-xl shadow-[0_2px_12px_rgba(46,204,113,0.3)] hover:shadow-[0_4px_16px_rgba(46,204,113,0.5)] active:scale-95 transition-all cursor-pointer shrink-0"
                            title="Confirmar depósito para sumar este monto al Saldo Neto Disponible"
                          >
                            <Building2 className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Depositado</span>
                          </button>
                        )}

                        {/* Action buttons (Edit & Delete) */}
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => startEdit(item)}
                            title="Editar ingreso"
                            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setItemToDelete(item.id)}
                            title="Eliminar ingreso"
                            className="p-1.5 text-neutral-400 hover:text-[#E74C3C] hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      {/* Confirmation Modals */}
      {/* Opción 1: Modal de Depósito Masivo de Todos los Pendientes */}
      <ConfirmModal
        isOpen={confirmBulkAllOpen}
        title="¿Confirmar Depósito Masivo de Todos los Pendientes?"
        message={
          totalIncomesPendingCount > 0
            ? `¿Deseas confirmar de una sola vez los ${totalIncomesPendingCount} ingresos pendientes por un monto total de +${formatUSD(totalIncomePendingUSD)} USD (${formatBs(calcBs(totalIncomePendingUSD, bcvRate))})?\n\nAl confirmarlo, todos quedarán marcados como depositados y se sumarán de inmediato al Saldo Neto Disponible.`
            : ''
        }
        confirmText="Sí, Depositar Todos los Pendientes"
        cancelText="Cancelar"
        isDestructive={false}
        onConfirm={handleConfirmBulkAll}
        onClose={() => setConfirmBulkAllOpen(false)}
      />

      {/* Opción 1: Modal de Depósito de Ingresos Seleccionados */}
      <ConfirmModal
        isOpen={confirmSelectedOpen}
        title="¿Confirmar Depósito de Ingresos Seleccionados?"
        message={
          selectedPendingIds.length > 0
            ? `¿Deseas confirmar los ${selectedPendingIds.length} ingresos seleccionados por un monto acumulado de +${formatUSD(selectedPendingTotalUSD)} USD (${formatBs(calcBs(selectedPendingTotalUSD, bcvRate))})?\n\nEste dinero se sumará de inmediato a tu Saldo Neto Disponible.`
            : ''
        }
        confirmText="Sí, Confirmar Depósito de Seleccionados"
        cancelText="Cancelar"
        isDestructive={false}
        onConfirm={handleConfirmSelected}
        onClose={() => setConfirmSelectedOpen(false)}
      />

      {/* Modal de Confirmación de Depósito (Suma al Saldo Neto Disponible) */}
      <ConfirmModal
        isOpen={depositItemToConfirm !== null}
        title="¿Confirmar Depósito en Cuenta Bancaria?"
        message={
          depositItemToConfirm
            ? `¿Confirmas que el ingreso "${depositItemToConfirm.description}" por monto de +${formatUSD(depositItemToConfirm.amountUSD)} USD (${formatBs(calcBs(depositItemToConfirm.amountUSD, bcvRate))}) ya fue efectivamente depositado?\n\nAl confirmarlo, este monto se sumará de inmediato al Saldo Neto Disponible.`
            : ''
        }
        confirmText="Sí, Confirmar Depósito"
        cancelText="Cancelar"
        isDestructive={false}
        onConfirm={handleConfirmDeposit}
        onClose={() => setDepositItemToConfirm(null)}
      />

      {/* Modal de Reversión a Pendiente */}
      <ConfirmModal
        isOpen={pendingItemToConfirm !== null}
        title="¿Marcar como Pendiente por Depositar?"
        message={
          pendingItemToConfirm
            ? `¿Deseas volver a marcar "${pendingItemToConfirm.description}" (+${formatUSD(pendingItemToConfirm.amountUSD)} USD) como pendiente por depositar?\n\nEste monto se descontará temporalmente del Saldo Neto Disponible hasta que vuelvas a confirmarlo.`
            : ''
        }
        confirmText="Sí, marcar como pendiente"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={handleConfirmRevertPending}
        onClose={() => setPendingItemToConfirm(null)}
      />

      {/* Modal de Limpieza Total de Ingresos */}
      <ConfirmModal
        isOpen={confirmClearOpen}
        title="¿Limpiar todos los ingresos?"
        message="Esta acción eliminará permanentemente todos los ingresos registrados y recalculará el Saldo Neto Disponible."
        confirmText="Sí, limpiar ingresos"
        isDestructive={true}
        onConfirm={clearIncomes}
        onClose={() => setConfirmClearOpen(false)}
      />

      {/* Modal de Eliminación de Ingreso Individual */}
      <ConfirmModal
        isOpen={itemToDelete !== null}
        title="¿Eliminar este ingreso?"
        message="El registro será eliminado y se descontará del acumulado de ingresos y de tu saldo neto si estaba depositado."
        confirmText="Eliminar"
        isDestructive={true}
        onConfirm={() => {
          if (itemToDelete) deleteIncome(itemToDelete);
          setItemToDelete(null);
        }}
        onClose={() => setItemToDelete(null)}
      />
    </div>
  );
};
