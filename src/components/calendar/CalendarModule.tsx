import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  X,
  Filter,
  ExternalLink,
  CalendarDays,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { IncomeItem, ExpenseItem } from '../../types/finance.ts';
import { formatUSD, formatBs, calcBs } from '../../services/bcvService.ts';

const MONTH_NAMES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const WEEKDAY_NAMES_ES = [
  'Lun',
  'Mar',
  'Mié',
  'Jue',
  'Vie',
  'Sáb',
  'Dom',
];

interface DayTransactions {
  incomes: IncomeItem[];
  expenses: ExpenseItem[];
  totalIncomeUSD: number;
  totalExpenseUSD: number;
}

export const CalendarModule: React.FC = () => {
  const { data, bcvRate, setActiveModule, getCategoryById } = useFinance();

  // Selected Month/Year reference
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [today]);

  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  // Selected date on the calendar
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  // Filter type on calendar view
  const [filterType, setFilterType] = useState<'all' | 'incomes' | 'expenses'>('all');

  // Modal to view day transactions on click
  const [dayDetailsModalDate, setDayDetailsModalDate] = useState<string | null>(null);

  // Modal for deep transaction details
  const [selectedDetailItem, setSelectedDetailItem] = useState<{
    type: 'income' | 'expense';
    item: IncomeItem | ExpenseItem;
  } | null>(null);

  const currentYear = currentMonthDate.getFullYear();
  const currentMonth = currentMonthDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleGoToToday = () => {
    const now = new Date();
    setCurrentMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDateStr(todayStr);
  };

  // Group all incomes and expenses by date (YYYY-MM-DD)
  const transactionsByDate = useMemo(() => {
    const map = new Map<string, DayTransactions>();

    const getEntry = (dateKey: string): DayTransactions => {
      let entry = map.get(dateKey);
      if (!entry) {
        entry = {
          incomes: [],
          expenses: [],
          totalIncomeUSD: 0,
          totalExpenseUSD: 0,
        };
        map.set(dateKey, entry);
      }
      return entry;
    };

    // 1. Incomes
    data.incomes.forEach((inc) => {
      const dateKey = inc.date ? inc.date.split('T')[0] : '';
      if (dateKey) {
        const entry = getEntry(dateKey);
        entry.incomes.push(inc);
        entry.totalIncomeUSD += inc.amountUSD || 0;
      }
    });

    // 2. Expenses
    data.expenses.forEach((exp) => {
      const dateKey = exp.date ? exp.date.split('T')[0] : '';
      if (dateKey) {
        const entry = getEntry(dateKey);
        entry.expenses.push(exp);
        entry.totalExpenseUSD += exp.amountUSD || 0;
      }
    });

    return map;
  }, [data.incomes, data.expenses]);

  // Compute month totals
  const monthStats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;
    const activeDaysSet = new Set<string>();

    const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

    transactionsByDate.forEach((dayData, dateKey) => {
      if (dateKey.startsWith(currentMonthPrefix)) {
        totalIncome += dayData.totalIncomeUSD;
        totalExpense += dayData.totalExpenseUSD;
        incomeCount += dayData.incomes.length;
        expenseCount += dayData.expenses.length;
        if (dayData.incomes.length > 0 || dayData.expenses.length > 0) {
          activeDaysSet.add(dateKey);
        }
      }
    });

    const netUSD = totalIncome - totalExpense;

    return {
      totalIncome,
      totalExpense,
      incomeCount,
      expenseCount,
      netUSD,
      activeDaysCount: activeDaysSet.size,
    };
  }, [transactionsByDate, currentYear, currentMonth]);

  // Compute Calendar grid days
  const calendarGrid = useMemo(() => {
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    // Monday = 0, ..., Sunday = 6
    const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    const days: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      data?: DayTransactions;
    }[] = [];

    // 1. Previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevDate = new Date(currentYear, currentMonth - 1, dayNum);
      const y = prevDate.getFullYear();
      const m = String(prevDate.getMonth() + 1).padStart(2, '0');
      const d = String(dayNum).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        data: transactionsByDate.get(dateStr),
      });
    }

    // 2. Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const m = String(currentMonth + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateStr = `${currentYear}-${m}-${dayStr}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        data: transactionsByDate.get(dateStr),
      });
    }

    // 3. Next month leading days to complete full weeks
    const totalSlots = Math.ceil(days.length / 7) * 7;
    const remainingSlots = totalSlots - days.length;
    for (let d = 1; d <= remainingSlots; d++) {
      const nextDate = new Date(currentYear, currentMonth + 1, d);
      const y = nextDate.getFullYear();
      const m = String(nextDate.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayStr}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        data: transactionsByDate.get(dateStr),
      });
    }

    return days;
  }, [currentYear, currentMonth, todayStr, transactionsByDate]);

  // Click on a day
  const handleDayClick = (dateStr: string, dayData?: DayTransactions) => {
    setSelectedDateStr(dateStr);
    if (dayData && (dayData.incomes.length > 0 || dayData.expenses.length > 0)) {
      setDayDetailsModalDate(dateStr);
    }
  };

  // Transactions for modal viewing
  const modalDayTransactions = useMemo(() => {
    if (!dayDetailsModalDate) return null;
    return (
      transactionsByDate.get(dayDetailsModalDate) || {
        incomes: [],
        expenses: [],
        totalIncomeUSD: 0,
        totalExpenseUSD: 0,
      }
    );
  }, [transactionsByDate, dayDetailsModalDate]);

  const formattedModalDate = useMemo(() => {
    if (!dayDetailsModalDate) return '';
    const [y, m, d] = dayDetailsModalDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d, 12, 0, 0);
    return dateObj.toLocaleDateString('es-VE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [dayDetailsModalDate]);

  return (
    <div className="space-y-6">
      {/* 
        =========================================================
        1. CALENDARIO (DE PRIMERO EN EL MÓDULO)
        =========================================================
      */}
      <div className="bg-[#1A1A1A] border border-neutral-800/90 rounded-3xl p-4 sm:p-6 shadow-[0_12px_40px_rgba(0,0,0,0.55)] space-y-4">
        {/* Cabecera del Calendario: Solo Título + Selector de Mes + Filtros */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 via-[#FFD700]/20 to-yellow-500/10 text-[#FFD700] border border-[#FFD700]/40 flex items-center justify-center shrink-0 shadow-lg shadow-yellow-500/10">
              <CalendarDays className="w-6 h-6 stroke-[2.2]" />
            </div>
            {/* Solo Título sin detalles */}
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Calendario
            </h2>
          </div>

          {/* Selector de Mes & Botón "Hoy" */}
          <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
            <div className="flex items-center bg-[#121212] border border-neutral-800 rounded-2xl p-1 shadow-inner">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Mes anterior"
                aria-label="Mes anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="px-3 sm:px-4 py-1 text-center min-w-[140px] sm:min-w-[160px]">
                <span className="text-sm sm:text-base font-extrabold text-white capitalize block leading-tight">
                  {MONTH_NAMES_ES[currentMonth]} {currentYear}
                </span>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Mes siguiente"
                aria-label="Mes siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleGoToToday}
              className="px-3.5 py-2.5 rounded-xl bg-neutral-800/90 hover:bg-neutral-700 text-neutral-200 border border-neutral-700/80 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm"
              title="Ir al día de hoy"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-[#FFD700]" />
              <span>Hoy</span>
            </button>
          </div>
        </div>

        {/* Filtro de Visualización y Leyenda */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-neutral-400 font-semibold mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-neutral-400" />
              Filtrar:
            </span>
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-neutral-200 text-black shadow-sm'
                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFilterType('incomes')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filterType === 'incomes'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Solo Ingresos
            </button>
            <button
              type="button"
              onClick={() => setFilterType('expenses')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filterType === 'expenses'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              Solo Egresos
            </button>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-neutral-400 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-md bg-[#2ECC71] inline-block shadow-sm" />
              <span>Ingresos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-md bg-[#E74C3C] inline-block shadow-sm" />
              <span>Egresos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-md border-2 border-[#FFD700] inline-block" />
              <span>Hoy</span>
            </div>
          </div>
        </div>

        {/* Cabecera de Días de la Semana */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center pt-2">
          {WEEKDAY_NAMES_ES.map((dayName, idx) => {
            const isWeekend = idx >= 5;
            return (
              <div
                key={dayName}
                className={`py-2 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider rounded-xl ${
                  isWeekend ? 'text-amber-400/80 bg-neutral-900/40' : 'text-neutral-400 bg-neutral-900/60'
                }`}
              >
                {dayName}
              </div>
            );
          })}
        </div>

        {/* Cuadrícula de Días */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarGrid.map((dayObj) => {
            const { dateStr, dayNumber, isCurrentMonth, isToday, data: dayData } = dayObj;

            const isSelected = dateStr === selectedDateStr;
            const hasIncomes = !!(dayData && dayData.incomes.length > 0);
            const hasExpenses = !!(dayData && dayData.expenses.length > 0);

            const showIncomes =
              hasIncomes && (filterType === 'all' || filterType === 'incomes');
            const showExpenses =
              hasExpenses && (filterType === 'all' || filterType === 'expenses');

            const hasActiveMovements = showIncomes || showExpenses;

            return (
              <div
                key={dateStr}
                onClick={() => handleDayClick(dateStr, dayData)}
                className={`min-h-[84px] sm:min-h-[112px] p-1.5 sm:p-2 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between relative group select-none ${
                  isSelected
                    ? 'border-[#FFD700] bg-neutral-800/90 shadow-[0_0_20px_rgba(255,215,0,0.25)] ring-2 ring-[#FFD700]/50 z-10'
                    : isCurrentMonth
                    ? 'border-neutral-800/90 bg-[#141414] hover:bg-neutral-800/60 hover:border-neutral-700'
                    : 'border-neutral-900 bg-[#0E0E0E]/60 opacity-40 hover:opacity-80'
                } ${isToday && !isSelected ? 'ring-1 ring-amber-400/50' : ''}`}
              >
                {/* Cabecera del día */}
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`text-xs sm:text-sm font-extrabold font-mono rounded-lg px-1.5 py-0.5 leading-none ${
                      isToday
                        ? 'bg-[#FFD700] text-black shadow-sm font-black'
                        : isSelected
                        ? 'bg-neutral-700 text-white font-bold'
                        : isCurrentMonth
                        ? 'text-neutral-200'
                        : 'text-neutral-500'
                    }`}
                  >
                    {dayNumber}
                  </span>

                  {isToday && (
                    <span className="hidden sm:inline-block text-[9px] font-bold px-1 py-0.2 rounded bg-amber-500/20 text-[#FFD700] uppercase font-mono">
                      Hoy
                    </span>
                  )}
                </div>

                {/* Chips e Indicadores de Movimientos */}
                <div className="space-y-1 my-1">
                  {showIncomes && (
                    <div
                      className="flex items-center justify-between gap-1 px-1.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[#2ECC71] text-[10px] sm:text-[11px] font-bold font-mono tracking-tight shadow-sm truncate"
                      title={`${dayData?.incomes.length} ingreso(s): +${formatUSD(
                        dayData?.totalIncomeUSD || 0
                      )}`}
                    >
                      <div className="flex items-center gap-0.5 shrink-0">
                        <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                        <span className="hidden xs:inline text-[9px] opacity-75">
                          ({dayData?.incomes.length})
                        </span>
                      </div>
                      <span className="truncate">
                        +${(dayData?.totalIncomeUSD || 0).toFixed(0)}
                      </span>
                    </div>
                  )}

                  {showExpenses && (
                    <div
                      className="flex items-center justify-between gap-1 px-1.5 py-0.5 rounded-lg bg-red-500/15 border border-red-500/30 text-[#E74C3C] text-[10px] sm:text-[11px] font-bold font-mono tracking-tight shadow-sm truncate"
                      title={`${dayData?.expenses.length} egreso(s): -${formatUSD(
                        dayData?.totalExpenseUSD || 0
                      )}`}
                    >
                      <div className="flex items-center gap-0.5 shrink-0">
                        <TrendingDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                        <span className="hidden xs:inline text-[9px] opacity-75">
                          ({dayData?.expenses.length})
                        </span>
                      </div>
                      <span className="truncate">
                        -${(dayData?.totalExpenseUSD || 0).toFixed(0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Pie de Celda */}
                <div className="flex items-center justify-between text-[9px] text-neutral-500">
                  {hasActiveMovements ? (
                    <div className="flex items-center gap-1 w-full justify-between">
                      <span className="text-[9px] font-mono opacity-60 truncate">
                        {(dayData?.incomes.length || 0) + (dayData?.expenses.length || 0)} ops
                      </span>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] animate-pulse" />
                      )}
                    </div>
                  ) : (
                    <span className="text-neutral-700 text-[10px] leading-none">·</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 
        =========================================================
        2. VISOR MENSUAL INTERACTIVO (DEBAJO DEL CALENDARIO)
        =========================================================
      */}
      <div className="bg-[#1A1A1A] border border-neutral-800/90 rounded-3xl p-4 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.5)] space-y-4">
        {/* Solo Título sin detalles */}
        <div className="flex items-center gap-2.5 pb-3 border-b border-neutral-800">
          <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-[#FFD700] flex items-center justify-center font-bold">
            <Wallet className="w-5 h-5" />
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Visor Mensual Interactivo
          </h3>
        </div>

        {/* Tarjetas de Resumen Mensual */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. Ingresos del Mes */}
          <div className="bg-[#141414] border border-emerald-500/30 rounded-2xl p-3 sm:p-4 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
              <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#2ECC71]" />
                Ingresos del Mes
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 font-bold">
                {monthStats.incomeCount} ops
              </span>
            </div>
            <div className="text-lg sm:text-2xl font-black text-[#2ECC71] font-mono tabular-nums">
              +{formatUSD(monthStats.totalIncome)}
            </div>
            <div className="text-[10px] sm:text-xs text-neutral-400 font-mono mt-0.5">
              {formatBs(calcBs(monthStats.totalIncome, bcvRate))}
            </div>
          </div>

          {/* 2. Egresos del Mes */}
          <div className="bg-[#141414] border border-red-500/30 rounded-2xl p-3 sm:p-4 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
              <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-[#E74C3C]" />
                Egresos del Mes
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-red-500/15 text-red-300 font-bold">
                {monthStats.expenseCount} ops
              </span>
            </div>
            <div className="text-lg sm:text-2xl font-black text-[#E74C3C] font-mono tabular-nums">
              -{formatUSD(monthStats.totalExpense)}
            </div>
            <div className="text-[10px] sm:text-xs text-neutral-400 font-mono mt-0.5">
              {formatBs(calcBs(monthStats.totalExpense, bcvRate))}
            </div>
          </div>

          {/* 3. Balance Neto del Mes */}
          <div
            className={`bg-[#141414] border rounded-2xl p-3 sm:p-4 shadow-sm relative overflow-hidden ${
              monthStats.netUSD >= 0 ? 'border-cyan-500/30' : 'border-amber-500/30'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
              <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-[#FFD700]" />
                Balance Neto Mes
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  monthStats.netUSD >= 0
                    ? 'bg-cyan-500/15 text-cyan-300'
                    : 'bg-red-500/15 text-red-300'
                }`}
              >
                {monthStats.netUSD >= 0 ? 'Superávit' : 'Déficit'}
              </span>
            </div>
            <div
              className={`text-lg sm:text-2xl font-black font-mono tabular-nums ${
                monthStats.netUSD >= 0 ? 'text-white' : 'text-red-400'
              }`}
            >
              {formatUSD(monthStats.netUSD)}
            </div>
            <div className="text-[10px] sm:text-xs text-neutral-400 font-mono mt-0.5">
              {formatBs(calcBs(monthStats.netUSD, bcvRate))}
            </div>
          </div>

          {/* 4. Tasa BCV & Días Activos */}
          <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <span className="font-semibold uppercase tracking-wider">Tasa Oficial BCV</span>
              <span className="text-[10px] font-mono text-[#FFD700]">VET</span>
            </div>
            <div className="text-base sm:text-xl font-black text-[#FFD700] font-mono tabular-nums mt-1">
              Bs. {bcvRate.toFixed(2)}
            </div>
            <div className="text-[10px] sm:text-[11px] text-neutral-400 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span>{monthStats.activeDaysCount} días activos</span>
            </div>
          </div>
        </div>
      </div>

      {/* 
        =========================================================
        MODAL EMERGENTE AL HACER CLIC EN UN DÍA CON MOVIMIENTOS
        =========================================================
      */}
      {dayDetailsModalDate && modalDayTransactions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setDayDetailsModalDate(null)}
          />

          <div className="relative bg-[#181818] border border-neutral-700/80 rounded-2xl sm:rounded-3xl w-full max-w-xl p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-10 space-y-4 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header del Modal: Solo Título */}
            <div className="flex items-start justify-between pb-3 border-b border-neutral-800">
              <div>
                <h4 className="text-base sm:text-lg font-black text-white capitalize">
                  {formattedModalDate}
                </h4>
              </div>

              <button
                type="button"
                onClick={() => setDayDetailsModalDate(null)}
                className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Resumen del Día */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <span className="text-[10px] uppercase font-bold tracking-wider block">
                  Ingresos ({modalDayTransactions.incomes.length})
                </span>
                <span className="text-base sm:text-lg font-black font-mono">
                  +{formatUSD(modalDayTransactions.totalIncomeUSD)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
                <span className="text-[10px] uppercase font-bold tracking-wider block">
                  Egresos ({modalDayTransactions.expenses.length})
                </span>
                <span className="text-base sm:text-lg font-black font-mono">
                  -{formatUSD(modalDayTransactions.totalExpenseUSD)}
                </span>
              </div>
            </div>

            {/* Listado de Transacciones */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {/* Ingresos */}
              {modalDayTransactions.incomes.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block">
                    Ingresos
                  </span>
                  {modalDayTransactions.incomes.map((inc) => {
                    const cat = getCategoryById(inc.categoryId);
                    return (
                      <div
                        key={inc.id}
                        onClick={() =>
                          setSelectedDetailItem({ type: 'income', item: inc })
                        }
                        className="p-3 rounded-xl bg-[#141414] border border-neutral-800 hover:border-emerald-500/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-[#2ECC71] flex items-center justify-center shrink-0">
                            <TrendingUp className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-emerald-300">
                              {inc.description}
                            </p>
                            <span className="text-[10px] text-neutral-400">
                              {cat?.name || 'General'} · {inc.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-black text-[#2ECC71] font-mono">
                            +{formatUSD(inc.amountUSD)}
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono">
                            {formatBs(calcBs(inc.amountUSD, bcvRate))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Egresos */}
              {modalDayTransactions.expenses.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block">
                    Egresos
                  </span>
                  {modalDayTransactions.expenses.map((exp) => {
                    const cat = getCategoryById(exp.categoryId);
                    return (
                      <div
                        key={exp.id}
                        onClick={() =>
                          setSelectedDetailItem({ type: 'expense', item: exp })
                        }
                        className="p-3 rounded-xl bg-[#141414] border border-neutral-800 hover:border-red-500/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-red-500/15 text-[#E74C3C] flex items-center justify-center shrink-0">
                            <TrendingDown className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-red-300">
                              {exp.description}
                            </p>
                            <span className="text-[10px] text-neutral-400">
                              {cat?.name || 'General'} · {exp.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-black text-[#E74C3C] font-mono">
                            -{formatUSD(exp.amountUSD)}
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono">
                            {formatBs(calcBs(exp.amountUSD, bcvRate))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => setDayDetailsModalDate(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 
        =========================================================
        MODAL DE FICHA ESPECÍFICA DE TRANSACCIÓN
        =========================================================
      */}
      {selectedDetailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedDetailItem(null)}
          />

          <div className="relative bg-[#181818] border border-neutral-700/80 rounded-2xl sm:rounded-3xl w-full max-w-lg p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-10 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-black shadow-lg ${
                    selectedDetailItem.type === 'income'
                      ? 'bg-gradient-to-br from-[#2ECC71] to-emerald-600'
                      : 'bg-gradient-to-br from-[#E74C3C] to-red-600'
                  }`}
                >
                  {selectedDetailItem.type === 'income' ? (
                    <TrendingUp className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    <TrendingDown className="w-5 h-5 stroke-[2.5]" />
                  )}
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-black text-white leading-tight">
                    {selectedDetailItem.item.description}
                  </h4>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDetailItem(null)}
                className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Monto Principal */}
            <div className="bg-[#121212] border border-neutral-800 rounded-2xl p-4 text-center">
              <div
                className={`text-2xl sm:text-4xl font-black font-mono tracking-tight tabular-nums ${
                  selectedDetailItem.type === 'income' ? 'text-[#2ECC71]' : 'text-[#E74C3C]'
                }`}
              >
                {selectedDetailItem.type === 'income' ? '+' : '-'}
                {formatUSD(selectedDetailItem.item.amountUSD)}
              </div>
              <p className="text-xs sm:text-sm font-mono text-[#FFD700] font-semibold mt-1">
                {formatBs(calcBs(selectedDetailItem.item.amountUSD, bcvRate))}
              </p>
            </div>

            {/* Campos de Información */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                <span className="text-neutral-400 font-medium">Fecha:</span>
                <span className="text-white font-mono font-bold">
                  {selectedDetailItem.item.date}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                <span className="text-neutral-400 font-medium">Categoría:</span>
                <span className="text-white font-semibold">
                  {getCategoryById(selectedDetailItem.item.categoryId)?.name || 'General'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                <span className="text-neutral-400 font-medium">Estado:</span>
                <span
                  className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded-full ${
                    selectedDetailItem.item.status === 'depositado' ||
                    selectedDetailItem.item.status === 'pagado'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {selectedDetailItem.item.status}
                </span>
              </div>

              {'bankAccount' in selectedDetailItem.item && selectedDetailItem.item.bankAccount && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                  <span className="text-neutral-400 font-medium">Cuenta / Banco:</span>
                  <span className="text-white font-mono">
                    {selectedDetailItem.item.bankAccount}
                  </span>
                </div>
              )}

              {'dueDate' in selectedDetailItem.item && selectedDetailItem.item.dueDate && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                  <span className="text-neutral-400 font-medium">Vencimiento:</span>
                  <span className="text-amber-300 font-mono font-bold">
                    {selectedDetailItem.item.dueDate}
                  </span>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const target = selectedDetailItem.type === 'income' ? 'ingresos' : 'egresos';
                  setSelectedDetailItem(null);
                  setDayDetailsModalDate(null);
                  setActiveModule(target);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-[#FFD700]/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 text-[#FFD700] border border-[#FFD700]/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Administrar en {selectedDetailItem.type === 'income' ? 'Ingresos' : 'Egresos'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedDetailItem(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
