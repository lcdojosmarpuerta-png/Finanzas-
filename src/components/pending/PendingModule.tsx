import React, { useState, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Calendar,
  ArrowUp,
  Search,
  AlertTriangle,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { formatUSD, formatBs, calcBs } from '../../services/bcvService.ts';
import { ConfirmModal } from '../common/ConfirmModal.tsx';
import { calculateDiffDays } from '../common/DuePaymentAlertModal.tsx';

export const PendingModule: React.FC = () => {
  const {
    data,
    bcvRate,
    markExpenseAsPaid,
    deleteExpense,
    clearPendingExpenses,
    totalExpensesPendingUSD,
    getCategoryById,
  } = useFinance();

  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [itemToPay, setItemToPay] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Orden ascendente estricto: desde la fecha más antigua hasta la más nueva
  const pendingExpenses = useMemo(() => {
    return [...data.expenses]
      .filter((e) => e.status === 'pendiente')
      .sort((a, b) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        if (dateA !== dateB) {
          return dateA.localeCompare(dateB); // Ascendente: más antiguo primero
        }
        const createdA = a.createdAt || '';
        const createdB = b.createdAt || '';
        return createdA.localeCompare(createdB);
      });
  }, [data.expenses]);

  // Lista filtrada respetando el orden ascendente
  const displayedExpenses = useMemo(() => {
    return pendingExpenses.filter((item) => {
      const matchSearch =
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.date.includes(searchQuery);
      const matchCategory =
        selectedCategory === 'all' || item.categoryId === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [pendingExpenses, searchQuery, selectedCategory]);

  const handlePay = (id: string) => {
    markExpenseAsPaid(id);
    setItemToPay(null);
  };

  return (
    <div className="space-y-6">
      {/* Top KPI Card */}
      <div className="bg-[#1E1E1E] border border-neutral-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
              Total Egresos Pendientes
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono tabular-nums">
                {formatUSD(totalExpensesPendingUSD)}
              </span>
              <span className="text-xs text-neutral-400 font-medium">USD</span>
            </div>
            <div className="text-xs font-mono text-[#FFD700] mt-0.5 tabular-nums">
              Equivalente: {formatBs(calcBs(totalExpensesPendingUSD, bcvRate))}
            </div>
          </div>
        </div>

        {/* Limpiar todo button */}
        <button
          onClick={() => setConfirmClearOpen(true)}
          disabled={pendingExpenses.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-xs text-neutral-400 hover:text-[#E74C3C] bg-neutral-900 hover:bg-red-500/10 border border-neutral-800 hover:border-red-500/30 rounded-xl transition-all self-start sm:self-center disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Limpiar Todo (Pendientes)</span>
        </button>
      </div>

      {/* List of Pending Expenses */}
      <div className="bg-[#1E1E1E] border border-neutral-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                Compromisos & Egresos por Pagar
              </h3>
              <span className="text-[11px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
                <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Fecha más antigua a la más nueva (Ascendente)</span>
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Organizados cronológicamente desde la obligación más antigua hasta la más reciente para priorizar pagos inmediatos.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar pendiente..."
                className="bg-[#121212] border border-neutral-700 focus:border-amber-400 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none w-32 sm:w-44 shadow-inner"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#121212] border border-neutral-700 rounded-xl px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none shadow-inner cursor-pointer"
            >
              <option value="all">Todas las categorías</option>
              {data.categories
                .filter((c) => c.type === 'expense')
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>

            <span className="text-xs font-mono text-neutral-400 px-2.5 py-1 bg-neutral-900 rounded-lg border border-neutral-800">
              {displayedExpenses.length} pendientes
            </span>
          </div>
        </div>

        {pendingExpenses.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-800/80 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm text-neutral-200 font-semibold">
              ¡No tienes gastos pendientes por liquidar!
            </p>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Todos tus egresos están al día. Cuando agregues un egreso con estado &quot;Pendiente&quot; aparecerá en esta lista.
            </p>
          </div>
        ) : displayedExpenses.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 text-neutral-500 mx-auto flex items-center justify-center border border-neutral-800">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-neutral-300">
              No se encontraron pendientes con los filtros aplicados.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="text-xs text-amber-400 hover:underline cursor-pointer"
            >
              Restablecer búsqueda y filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            {displayedExpenses.map((item, index) => {
              const category = getCategoryById(item.categoryId);
              const targetDueDate = item.dueDate || item.date;
              const diffDays = calculateDiffDays(targetDueDate);
              const isOverdue = diffDays < 0;
              const isDueToday = diffDays === 0;
              const isDueSoon = diffDays > 0 && diffDays <= 3;

              return (
                <div
                  key={item.id}
                  className={`p-4 bg-[#141414] border rounded-xl transition-all flex flex-col justify-between gap-3 shadow-md group ${
                    isOverdue
                      ? 'border-red-500/40 hover:border-red-500/60'
                      : isDueToday
                      ? 'border-yellow-500/40 hover:border-yellow-500/60'
                      : isDueSoon
                      ? 'border-amber-500/40 hover:border-amber-500/60'
                      : 'border-neutral-800 hover:border-amber-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-neutral-400 bg-neutral-900 border border-neutral-700/80 px-1.5 py-0.5 rounded">
                          #{index + 1}
                        </span>
                        <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full inline-block">
                          {category?.name || 'Gasto Pendiente'}
                        </span>
                        {/* Due status urgency badge */}
                        {isOverdue ? (
                          <span className="text-[10px] font-bold text-red-400 bg-red-500/15 border border-red-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> ¡Vencido ({Math.abs(diffDays)}d)!
                          </span>
                        ) : isDueToday ? (
                          <span className="text-[10px] font-bold text-yellow-300 bg-yellow-500/20 border border-yellow-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                            <Clock className="w-3 h-3" /> ¡Vence Hoy!
                          </span>
                        ) : isDueSoon ? (
                          <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Vence en {diffDays}d
                          </span>
                        ) : null}
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">
                        {item.description}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Vence: <strong className="text-neutral-200">{targetDueDate}</strong></span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-base font-extrabold font-mono text-amber-400 tabular-nums">
                        {formatUSD(item.amountUSD)}
                      </p>
                      <p className="text-[11px] font-mono text-neutral-400 tabular-nums">
                        {formatBs(calcBs(item.amountUSD, bcvRate))}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => deleteExpense(item.id)}
                      className="p-1.5 text-neutral-500 hover:text-[#E74C3C] hover:bg-neutral-800 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
                      title="Descartar egreso"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Eliminar</span>
                    </button>

                    <button
                      onClick={() => setItemToPay(item.id)}
                      className="px-3.5 py-1.5 bg-[#2ECC71] hover:bg-emerald-600 text-black font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Pagar Deuda</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation to pay modal */}
      <ConfirmModal
        isOpen={itemToPay !== null}
        title="¿Confirmar Pago de Pendiente?"
        message="Al confirmar, este egreso cambiará su estado a Pagado y se descontará automáticamente del Saldo Neto Disponible."
        confirmText="Confirmar Pago"
        onConfirm={() => {
          if (itemToPay) handlePay(itemToPay);
        }}
        onClose={() => setItemToPay(null)}
      />

      {/* Confirmation to clear all pending */}
      <ConfirmModal
        isOpen={confirmClearOpen}
        title="¿Limpiar todos los pendientes?"
        message="Esta acción eliminará todos los egresos marcados como pendientes."
        confirmText="Sí, limpiar pendientes"
        isDestructive={true}
        onConfirm={clearPendingExpenses}
        onClose={() => setConfirmClearOpen(false)}
      />
    </div>
  );
};
