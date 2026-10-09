import React, { useState, useMemo } from 'react';
import {
  TrendingDown,
  Plus,
  Trash2,
  Edit2,
  Filter,
  CheckCircle2,
  Clock,
  DollarSign,
  Calendar,
  AlertCircle,
  Tag,
  ArrowRight,
  Search,
  Check,
  Sparkles,
  ChevronDown,
  X,
  Receipt,
  Layers,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { formatUSD, formatBs, calcBs } from '../../services/bcvService.ts';
import { ExpenseItem } from '../../types/finance.ts';
import { ConfirmModal } from '../common/ConfirmModal.tsx';

interface ExpenseModuleProps {
  onOpenCategories: () => void;
}

const PRESET_EXPENSE_AMOUNTS = [10, 25, 50, 100, 200, 500];

export const ExpenseModule: React.FC<ExpenseModuleProps> = ({ onOpenCategories }) => {
  const {
    data,
    bcvRate,
    addExpense,
    updateExpense,
    deleteExpense,
    markExpenseAsPending,
    markExpenseAsPaid,
    clearExpenses,
    getCategoryById,
  } = useFinance();

  // Modern Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [amountUSD, setAmountUSD] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [initialStatus, setInitialStatus] = useState<'pagado' | 'pendiente'>('pagado');
  const [showSuccessBadge, setShowSuccessBadge] = useState(false);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pagado' | 'pendiente'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  // Additional Date Filter
  const [dateFilterPreset, setDateFilterPreset] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const expenseCategories = data.categories.filter((c) => c.type === 'expense');
  const activeCategoryId = categoryId || expenseCategories[0]?.id || 'cat-exp-1';

  // Indicadores de suma global de egresos ingresados
  const totalAllExpensesUSD = useMemo(() => {
    return data.expenses.reduce((acc, item) => acc + item.amountUSD, 0);
  }, [data.expenses]);

  // Categoría seleccionada en los filtros
  const selectedCategory = useMemo(() => {
    if (categoryFilter === 'all') return null;
    return getCategoryById(categoryFilter);
  }, [categoryFilter, getCategoryById]);

  // Egresos correspondientes a la categoría seleccionada en filtros
  const categoryExpenses = useMemo(() => {
    if (categoryFilter === 'all') return data.expenses;
    return data.expenses.filter((e) => e.categoryId === categoryFilter);
  }, [data.expenses, categoryFilter]);

  const categoryTotalUSD = useMemo(() => {
    return categoryExpenses.reduce((acc, item) => acc + item.amountUSD, 0);
  }, [categoryExpenses]);

  // Real-time conversion preview
  const parsedFormAmount = parseFloat(amountUSD) || 0;
  const convertedBs = calcBs(parsedFormAmount, bcvRate);

  const handlePresetClick = (val: number) => {
    setAmountUSD(val.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || parsedFormAmount <= 0) return;

    addExpense({
      description: description.trim(),
      amountUSD: parsedFormAmount,
      date,
      dueDate: initialStatus === 'pendiente' ? (dueDate || date) : undefined,
      categoryId: activeCategoryId,
      status: initialStatus,
    });

    setDescription('');
    setAmountUSD('');
    setDueDate('');
    setShowSuccessBadge(true);
    setTimeout(() => setShowSuccessBadge(false), 2500);
  };

  const startEdit = (item: ExpenseItem) => {
    setEditingId(item.id);
    setEditDesc(item.description);
    setEditAmount(item.amountUSD.toString());
    setEditDate(item.date);
    setEditDueDate(item.dueDate || item.date);
    setEditCategoryId(item.categoryId);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    const num = parseFloat(editAmount);
    if (isNaN(num) || num <= 0 || !editDesc.trim()) return;

    updateExpense(editingId, {
      description: editDesc.trim(),
      amountUSD: num,
      date: editDate,
      dueDate: editDueDate || editDate,
      categoryId: editCategoryId,
    });
    setEditingId(null);
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

  // Filtered and sorted
  const filteredExpenses = data.expenses
    .filter((item) => {
      const matchCat = categoryFilter === 'all' || item.categoryId === categoryFilter;
      const matchStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchSearch = item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDate = isDateInFilter(item.date);
      return matchCat && matchStatus && matchSearch && matchDate;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Total de egresos en la vista filtrada actual
  const filteredTotalUSD = useMemo(() => {
    return filteredExpenses.reduce((acc, item) => acc + item.amountUSD, 0);
  }, [filteredExpenses]);

  // Sumatoria considerando otros filtros activos (fechas, estado, búsqueda)
  const categoryFilteredExpenses = useMemo(() => {
    if (categoryFilter === 'all') return filteredExpenses;
    return filteredExpenses.filter((e) => e.categoryId === categoryFilter);
  }, [filteredExpenses, categoryFilter]);

  const categoryFilteredTotalUSD = useMemo(() => {
    return categoryFilteredExpenses.reduce((acc, item) => acc + item.amountUSD, 0);
  }, [categoryFilteredExpenses]);

  const hasActiveFilters =
    categoryFilter !== 'all' ||
    statusFilter !== 'all' ||
    searchQuery.trim() !== '' ||
    dateFilterPreset !== 'all';

  return (
    <div className="space-y-6">
      {/* 1. Al principio de la página: Barra de Acción con botón "Añadir Egreso" */}
      <div className="bg-[#1A1A1A] border border-neutral-800/90 rounded-3xl p-4 sm:p-5 shadow-[0_8px_30px_rgba(0,0,0,0.45)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-red-500/15 text-[#E74C3C] border border-red-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/10">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Egresos del Perfil</span>
              <span className="text-[11px] font-mono font-bold bg-red-500/20 text-[#E74C3C] px-2.5 py-0.5 rounded-full border border-red-500/30">
                {data.expenses.length} registrados
              </span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Haz clic en &quot;Añadir Egreso&quot; para desplegar el formulario y registrar un nuevo gasto o pago.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsFormOpen((prev) => !prev)}
          className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-extrabold transition-all duration-200 cursor-pointer shadow-lg active:scale-95 shrink-0 ${
            isFormOpen
              ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'
              : 'bg-gradient-to-r from-[#E74C3C] to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-red-500/20 hover:shadow-red-500/30'
          }`}
        >
          {isFormOpen ? (
            <>
              <X className="w-4 h-4 stroke-[2.5]" />
              <span>Ocultar Formulario</span>
            </>
          ) : (
            <>
              <Plus className="w-5 h-5 stroke-[3]" />
              <span>Añadir Egreso</span>
            </>
          )}
        </button>
      </div>

      {/* 
        =========================================================
        INDICADORES DE EGRESOS: Suma Total de Egresos Ingresados
        y Total Egresos Pagados
        =========================================================
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Indicador Principal - Suma de TODOS los egresos ingresados */}
        <div className="bg-gradient-to-br from-[#261414] via-[#1F1414] to-[#181818] border-2 border-red-500/40 rounded-3xl p-5 sm:p-6 shadow-[0_12px_40px_rgba(231,76,60,0.18)] relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-36 h-36 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-[#E74C3C] bg-red-500/20 border border-red-500/30 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 shadow-sm">
                <Receipt className="w-3.5 h-3.5" /> Suma Total de Egresos Ingresados
              </span>
              <span className="text-xs font-mono font-bold text-neutral-300 bg-neutral-900/90 px-2.5 py-0.5 rounded-lg border border-neutral-700">
                {data.expenses.length} reg.
              </span>
            </div>

            <div className="mt-3">
              <span className="text-xs font-bold text-neutral-300 block">
                Total Acumulado de Egresos
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#E74C3C] font-mono tabular-nums tracking-tight">
                  -{formatUSD(totalAllExpensesUSD)}
                </span>
                <span className="text-xs text-neutral-400 font-semibold font-mono">USD</span>
              </div>
              <div className="text-xs sm:text-sm font-mono text-[#FFD700] mt-1 tabular-nums flex items-center gap-1.5 flex-wrap">
                <span>Equivalente:</span>
                <strong className="font-extrabold">{formatBs(calcBs(totalAllExpensesUSD, bcvRate))}</strong>
                <span className="text-neutral-500 text-[10px]">(@ Bs. {bcvRate.toFixed(2)})</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
            <span>{data.expenses.length} operaciones registradas</span>
            <button
              onClick={() => setConfirmClearOpen(true)}
              disabled={data.expenses.length === 0}
              className="text-neutral-500 hover:text-[#E74C3C] transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-30"
              title="Limpiar todos los egresos registrados"
            >
              <Trash2 className="w-3 h-3" /> Limpiar Todo
            </button>
          </div>
        </div>

        {/* Card 2: Sumatoria de la Categoría Seleccionada en los Filtros */}
        <div className={`bg-[#1A1A1A] border ${categoryFilter !== 'all' ? 'border-[#FFD700]/50 shadow-[0_12px_40px_rgba(255,215,0,0.14)]' : 'border-neutral-800/90 shadow-[0_12px_40px_rgba(0,0,0,0.45)]'} rounded-3xl p-5 sm:p-6 hover:border-neutral-700/80 transition-all flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className={`text-[10px] font-mono uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 ${
                categoryFilter !== 'all'
                  ? 'bg-amber-500/20 text-[#FFD700] border border-amber-500/30'
                  : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
              }`}>
                <Tag className="w-3.5 h-3.5" />
                <span>
                  {categoryFilter !== 'all'
                    ? `Categoría: ${selectedCategory?.name || 'Seleccionada'}`
                    : 'Todas las Categorías'}
                </span>
              </span>

              {/* Selector de categoría integrado para cambiar directamente desde el indicador */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#121212] border border-neutral-700 hover:border-[#FFD700]/60 text-xs text-neutral-200 rounded-xl px-2.5 py-1 focus:outline-none cursor-pointer max-w-[170px] truncate shadow-inner"
                title="Cambiar categoría seleccionada"
              >
                <option value="all">Todas ({expenseCategories.length})</option>
                {expenseCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3">
              <span className="text-xs font-bold text-neutral-400 block">
                {categoryFilter !== 'all'
                  ? `Sumatoria Categoría: ${selectedCategory?.name}`
                  : 'Sumatoria de Categorías (Todas)'}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-2xl sm:text-3xl font-extrabold font-mono tabular-nums ${
                  categoryFilter !== 'all' ? 'text-[#FFD700]' : 'text-white'
                }`}>
                  -{formatUSD(hasActiveFilters && (statusFilter !== 'all' || dateFilterPreset !== 'all' || searchQuery.trim() !== '') ? categoryFilteredTotalUSD : categoryTotalUSD)}
                </span>
                <span className="text-xs text-neutral-400 font-semibold font-mono">USD</span>
              </div>
              <p className="text-xs font-mono text-[#FFD700] mt-1 tabular-nums">
                Equivalente: <strong>{formatBs(calcBs(hasActiveFilters && (statusFilter !== 'all' || dateFilterPreset !== 'all' || searchQuery.trim() !== '') ? categoryFilteredTotalUSD : categoryTotalUSD, bcvRate))}</strong>
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800/80 text-[11px] text-neutral-400 flex items-center justify-between">
            {categoryFilter !== 'all' ? (
              <>
                <span>
                  {categoryExpenses.length} egresos · {totalAllExpensesUSD > 0 ? ((categoryTotalUSD / totalAllExpensesUSD) * 100).toFixed(1) : 0}% del total general
                </span>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('all')}
                  className="text-xs text-[#FFD700] hover:underline cursor-pointer font-medium"
                >
                  Ver todas
                </button>
              </>
            ) : (
              <>
                <span>Suma global de las {expenseCategories.length} categorías</span>
                <span className="text-neutral-500 font-mono">100%</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Barra de Egresos Filtrados (si hay filtro activo) */}
      {hasActiveFilters && (
        <div className="bg-[#181818] border border-neutral-800 rounded-2xl p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center gap-2 text-xs text-neutral-300">
            <Filter className="w-3.5 h-3.5 text-[#E74C3C]" />
            <span>Filtro activo aplicado:</span>
            <strong className="text-white font-mono">{filteredExpenses.length}</strong> de {data.expenses.length} egresos
          </div>
          <div className="text-xs text-right font-mono">
            <span className="text-neutral-400 mr-1.5">Suma filtrada:</span>
            <strong className="text-[#E74C3C] font-bold font-mono">-{formatUSD(filteredTotalUSD)} USD</strong>
            <span className="text-[#FFD700] text-[11px] ml-1.5">({formatBs(calcBs(filteredTotalUSD, bcvRate))})</span>
          </div>
        </div>
      )}

      {/* Grid: Formulario (si está abierto) & Listado */}
      <div className={`grid grid-cols-1 ${isFormOpen ? 'lg:grid-cols-12' : 'grid-cols-1'} gap-6`}>
        {/* Modern Formulario de Egreso condicional */}
        {isFormOpen && (
          <div className="lg:col-span-5 bg-gradient-to-b from-[#1E1E1E] to-[#171717] border border-red-500/30 rounded-3xl p-6 shadow-[0_12px_40px_rgba(0,0,0,0.6)] h-fit relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Subtle red ambient light */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between pb-4 border-b border-neutral-800 relative z-10">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#E74C3C] font-bold block">
                  Nuevo Registro
                </span>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
                  <Plus className="w-4 h-4 text-[#E74C3C]" />
                  Registrar Egreso
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
                  className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4 relative z-10">
              {/* Monto USD with presets */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Monto del Gasto (USD $) *
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
                    className="w-full bg-[#121212] border-2 border-neutral-700/80 focus:border-[#E74C3C] rounded-2xl pl-8 pr-4 py-2.5 text-sm sm:text-base font-mono font-bold text-white placeholder-neutral-500 focus:outline-none shadow-inner transition-colors"
                  />
                </div>

                {/* Quick preset chips */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] text-neutral-500 font-mono">Montos rápidos:</span>
                  {PRESET_EXPENSE_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handlePresetClick(amt)}
                      className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded-lg bg-neutral-800/90 text-neutral-300 hover:text-white hover:bg-neutral-700 border border-neutral-700/60 transition-colors cursor-pointer"
                    >
                      ${amt}
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
                    Categoría del Egreso *
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
                    className="w-full bg-[#121212] border-2 border-neutral-700/80 focus:border-[#E74C3C] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none shadow-inner cursor-pointer transition-colors appearance-none pr-10"
                  >
                    {expenseCategories.map((c) => (
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
                  placeholder="Ej. Compra de supermercado, pago de fibra óptica..."
                  className="w-full bg-[#121212] border border-neutral-700 focus:border-[#E74C3C] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none shadow-inner"
                />
              </div>

              {/* Selector de Fecha */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Fecha del Egreso *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#121212] border border-neutral-700 focus:border-[#E74C3C] rounded-xl px-3 py-2 text-xs text-white focus:outline-none shadow-inner"
                />
              </div>

              {/* Estado Inicial Toggle */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Estado del Pago
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInitialStatus('pagado')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      initialStatus === 'pagado'
                        ? 'bg-[#E74C3C] text-white shadow-[0_4px_15px_rgba(231,76,60,0.35)]'
                        : 'bg-[#121212] text-neutral-400 border border-neutral-800'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Pagado</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInitialStatus('pendiente')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      initialStatus === 'pendiente'
                        ? 'bg-amber-500 text-black shadow-[0_4px_15px_rgba(245,158,11,0.35)]'
                        : 'bg-[#121212] text-neutral-400 border border-neutral-800'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pendiente</span>
                  </button>
                </div>
                <p className="text-[10px] text-neutral-400 mt-1">
                  {initialStatus === 'pagado'
                    ? 'Se restará de inmediato del Saldo Neto Disponible.'
                    : 'Se enviará a "Pendientes" para liquidarse posteriormente.'}
                </p>

                {/* Fecha de Vencimiento para Pagos Pendientes */}
                {initialStatus === 'pendiente' && (
                  <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1 animate-in fade-in duration-200">
                    <label className="block text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Fecha Límite / Vencimiento *</span>
                    </label>
                    <input
                      type="date"
                      value={dueDate || date}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-[#121212] border border-neutral-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none shadow-inner"
                    />
                    <p className="text-[10px] text-amber-300/80">
                      🔔 El sistema activará un mensaje emergente de alerta cuando se acerque esta fecha.
                    </p>
                  </div>
                )}
              </div>

              {/* Submit & Close Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs rounded-2xl transition-all cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-[#E74C3C] to-red-600 hover:from-red-600 hover:to-red-700 text-white font-extrabold text-xs rounded-2xl shadow-[0_6px_25px_rgba(231,76,60,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Guardar Egreso</span>
                </button>
              </div>

              {/* Success message badge */}
              {showSuccessBadge && (
                <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs text-center font-semibold flex items-center justify-center gap-1.5 animate-in fade-in">
                  <Check className="w-4 h-4" />
                  <span>¡Egreso registrado exitosamente!</span>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Listado con Filtro de Categoría, Estado Y Filtro Adicional por Fecha */}
        <div className={`${isFormOpen ? 'lg:col-span-7' : 'lg:col-span-12'} bg-[#1A1A1A] border border-neutral-800/90 rounded-3xl p-5 sm:p-7 shadow-[0_12px_40px_rgba(0,0,0,0.55)] transition-all duration-300`}>
          {/* Header & Filter Controls */}
          <div className="pb-4 border-b border-neutral-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Listado de Egresos
                </h3>
                <p className="text-xs text-neutral-400">
                  {filteredExpenses.length} operaciones encontradas
                </p>
              </div>

              {/* Search and Action */}
              <div className="flex items-center gap-2">
                {!isFormOpen && (
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E74C3C] hover:bg-red-600 text-white text-xs font-extrabold rounded-xl shadow transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Agregar Egreso</span>
                  </button>
                )}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar egreso..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-[#121212] border border-neutral-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none w-full sm:w-44 shadow-inner"
                  />
                </div>
              </div>
            </div>

            {/* FILTRO ADICIONAL POR FECHA (Requested by user) */}
            <div className="pt-2 border-t border-neutral-800/80 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#FFD700]" />
                  Filtro por Fecha:
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

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-[#121212] border border-neutral-700 rounded-xl px-2 py-1 text-xs text-neutral-300 focus:outline-none ml-auto"
                >
                  <option value="all">Todos los Estados</option>
                  <option value="pagado">Pagados</option>
                  <option value="pendiente">Pendientes</option>
                </select>

                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-[#121212] border border-neutral-700 rounded-xl px-2 py-1 text-xs text-neutral-300 focus:outline-none"
                >
                  <option value="all">Todas las Categorías</option>
                  {expenseCategories.map((c) => (
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

          {/* List items */}
          {filteredExpenses.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-neutral-500 mx-auto" />
              <p className="text-sm font-semibold text-neutral-300">No hay egresos con los filtros seleccionados</p>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                {data.expenses.length === 0
                  ? 'Aún no has registrado ningún egreso. Comienza agregando tu primer gasto.'
                  : 'Ajusta las fechas o criterios de búsqueda para visualizar los egresos.'}
              </p>
              {!isFormOpen && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#E74C3C] hover:bg-red-600 text-white text-xs font-extrabold rounded-xl shadow cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Agregar Egreso</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-neutral-800/70 mt-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredExpenses.map((item) => {
                const category = getCategoryById(item.categoryId);
                const isEditing = editingId === item.id;
                const isPaid = item.status === 'pagado';

                if (isEditing) {
                  return (
                    <form
                      key={item.id}
                      onSubmit={handleSaveEdit}
                      className="py-3 px-3 bg-neutral-900/90 rounded-2xl my-1 border border-neutral-700 space-y-2 shadow-lg"
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <select
                          value={editCategoryId}
                          onChange={(e) => setEditCategoryId(e.target.value)}
                          className="bg-[#121212] border border-neutral-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                        >
                          {expenseCategories.map((c) => (
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
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 text-xs text-neutral-400 hover:text-white cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-[#E74C3C] text-white text-xs font-bold rounded-xl shadow cursor-pointer"
                        >
                          Guardar Cambios
                        </button>
                      </div>
                    </form>
                  );
                }

                return (
                  <div
                    key={item.id}
                    className="py-3 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-800/40 rounded-2xl transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: category?.color || '#E74C3C' }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#E74C3C] transition-colors">
                            {item.description}
                          </p>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              isPaid
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {isPaid ? 'Pagado' : 'Pendiente'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                          <span className="font-mono">{item.date}</span>
                          <span>·</span>
                          <span className="truncate">{category?.name || 'General'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800/60">
                      <div className="text-left sm:text-right">
                        <p
                          className={`text-xs sm:text-sm font-extrabold font-mono tabular-nums ${
                            isPaid ? 'text-[#E74C3C]' : 'text-amber-400'
                          }`}
                        >
                          -{formatUSD(item.amountUSD)}
                        </p>
                        <p className="text-[10px] font-mono text-neutral-400 tabular-nums">
                          {formatBs(calcBs(item.amountUSD, bcvRate))}
                        </p>
                      </div>

                      {/* State toggle actions & Edit/Delete */}
                      <div className="flex items-center gap-1.5">
                        {isPaid ? (
                          <button
                            onClick={() => markExpenseAsPending(item.id)}
                            title="Enviar a Pendientes"
                            className="px-2.5 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-amber-300 rounded-lg flex items-center gap-1 transition-colors cursor-pointer font-medium"
                          >
                            <Clock className="w-3 h-3" />
                            <span className="hidden md:inline">A Pendientes</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => markExpenseAsPaid(item.id)}
                            title="Marcar como Pagado (resta del saldo)"
                            className="px-2.5 py-1 text-[11px] bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded-lg flex items-center gap-1 transition-colors font-bold cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span className="hidden md:inline">Marcar Pagado</span>
                          </button>
                        )}

                        <button
                          onClick={() => startEdit(item)}
                          title="Editar"
                          className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setItemToDelete(item.id)}
                          title="Eliminar"
                          className="p-1.5 text-neutral-400 hover:text-[#E74C3C] hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={confirmClearOpen}
        title="¿Limpiar todos los egresos?"
        message="Esta acción eliminará todos los egresos (tanto pagados como pendientes) y actualizará el Saldo Neto Disponible."
        confirmText="Sí, limpiar egresos"
        isDestructive={true}
        onConfirm={clearExpenses}
        onClose={() => setConfirmClearOpen(false)}
      />

      <ConfirmModal
        isOpen={itemToDelete !== null}
        title="¿Eliminar este egreso?"
        message="El registro será eliminado permanentemente."
        confirmText="Eliminar"
        isDestructive={true}
        onConfirm={() => {
          if (itemToDelete) deleteExpense(itemToDelete);
          setItemToDelete(null);
        }}
        onClose={() => setItemToDelete(null)}
      />
    </div>
  );
};
