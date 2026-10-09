import React, { useState } from 'react';
import {
  Landmark,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  Calendar,
  CheckCircle2,
  Coins,
  History,
  AlertCircle,
  X,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { formatUSD, formatBs, calcBs } from '../../services/bcvService.ts';
import { DebtItem } from '../../types/finance.ts';
import { ConfirmModal } from '../common/ConfirmModal.tsx';

export const DebtsModule: React.FC = () => {
  const {
    data,
    bcvRate,
    addDebt,
    updateDebt,
    deleteDebt,
    abonarDebt,
    payDebtFull,
    clearDebts,
    totalDebtsRemainingUSD,
  } = useFinance();

  // Toggle form state
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [description, setDescription] = useState('');
  const [creditor, setCreditor] = useState('');
  const [totalAmountUSD, setTotalAmountUSD] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');

  // Abono Modal states
  const [abonoDebtId, setAbonoDebtId] = useState<string | null>(null);
  const [abonoAmount, setAbonoAmount] = useState('');
  const [abonoDate, setAbonoDate] = useState(new Date().toISOString().split('T')[0]);
  const [abonoNote, setAbonoNote] = useState('');
  const [registerExpense, setRegisterExpense] = useState(true);

  // Full Pay Modal
  const [payFullDebtId, setPayFullDebtId] = useState<string | null>(null);

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editCreditor, setEditCreditor] = useState('');
  const [editAmount, setEditAmount] = useState('');

  // Modals
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const parsedFormAmount = parseFloat(totalAmountUSD) || 0;
  const convertedBs = calcBs(parsedFormAmount, bcvRate);

  const handleAddDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || parsedFormAmount <= 0) return;

    addDebt({
      description: description.trim(),
      creditor: creditor.trim() || 'Acreedor General',
      totalAmountUSD: parsedFormAmount,
      date,
      dueDate: dueDate || undefined,
    });

    setDescription('');
    setCreditor('');
    setTotalAmountUSD('');
    setDueDate('');
  };

  const handleAbonoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!abonoDebtId) return;
    const num = parseFloat(abonoAmount);
    if (isNaN(num) || num <= 0) return;

    abonarDebt(abonoDebtId, num, abonoDate, abonoNote.trim() || undefined, registerExpense);
    setAbonoDebtId(null);
    setAbonoAmount('');
    setAbonoNote('');
  };

  const handlePayFullConfirm = () => {
    if (!payFullDebtId) return;
    payDebtFull(payFullDebtId, new Date().toISOString().split('T')[0], true);
    setPayFullDebtId(null);
  };

  const selectedDebtForAbono = data.debts.find((d) => d.id === abonoDebtId);
  const abonoDebtRemaining = selectedDebtForAbono
    ? selectedDebtForAbono.totalAmountUSD -
      selectedDebtForAbono.payments.reduce((acc, p) => acc + p.amountUSD, 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top KPI Card */}
      <div className="bg-[#1E1E1E] border border-neutral-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-red-500/15 text-[#E74C3C] border border-red-500/30 flex items-center justify-center shrink-0">
            <Landmark className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
              Total Deudas Acumuladas por Pagar
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#E74C3C] font-mono tabular-nums">
                {formatUSD(totalDebtsRemainingUSD)}
              </span>
              <span className="text-xs text-neutral-400 font-medium">USD</span>
            </div>
            <div className="text-xs font-mono text-[#FFD700] mt-0.5 tabular-nums">
              Equivalente: {formatBs(calcBs(totalDebtsRemainingUSD, bcvRate))}
            </div>
          </div>
        </div>

        {/* Actions group: Registrar Nueva Deuda + Limpiar todo */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#E74C3C] to-red-600 hover:from-red-600 hover:to-red-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-red-500/15 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{showForm ? 'Ocultar Formulario' : 'Registrar Nueva Deuda'}</span>
          </button>

          <button
            onClick={() => setConfirmClearOpen(true)}
            disabled={data.debts.length === 0}
            className="flex items-center gap-1.5 px-3 py-2.5 text-xs text-neutral-400 hover:text-[#E74C3C] bg-neutral-900 hover:bg-red-500/10 border border-neutral-800 hover:border-red-500/30 rounded-xl transition-all disabled:opacity-40 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpiar Todo</span>
          </button>
        </div>
      </div>

      {/* Conditional Formulario Agregar Deuda */}
      {showForm && (
        <div className="bg-[#1E1E1E] border border-red-500/30 rounded-3xl p-6 shadow-[0_12px_40px_rgba(0,0,0,0.6)] animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#E74C3C]" />
              Formulario: Registrar Nueva Deuda
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-xs text-neutral-400 hover:text-white px-2 py-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Cerrar Formulario ✕
            </button>
          </div>

          <form onSubmit={(e) => {
            handleAddDebt(e);
            setShowForm(false);
          }} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Acreedor / Entidad / Prestamista *
                </label>
                <input
                  type="text"
                  required
                  value={creditor}
                  onChange={(e) => setCreditor(e.target.value)}
                  placeholder="Ej. Banco, Proveedor X, Juan Pérez..."
                  className="w-full bg-[#121212] border border-neutral-700 focus:border-[#E74C3C] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Descripción / Concepto *
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej. Compra de inventario a crédito, préstamo personal..."
                  className="w-full bg-[#121212] border border-neutral-700 focus:border-[#E74C3C] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none shadow-inner"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Monto Total en USD ($) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-neutral-400 text-xs font-mono">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={totalAmountUSD}
                    onChange={(e) => setTotalAmountUSD(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#121212] border border-neutral-700 focus:border-[#E74C3C] rounded-xl pl-7 pr-3 py-2 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none shadow-inner"
                  />
                </div>
                <div className="mt-1 text-[11px] font-mono text-[#FFD700]">
                  Reconversión: {formatBs(convertedBs)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Fecha Adquisición *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#121212] border border-neutral-700 focus:border-[#E74C3C] rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Vencimiento (Opcional)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-[#121212] border border-neutral-700 focus:border-[#E74C3C] rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none shadow-inner"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white bg-neutral-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="py-2.5 px-6 bg-[#E74C3C] hover:bg-red-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Guardar Deuda
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Listado de Deudas */}
      <div className="w-full space-y-4">
          <div className="bg-[#1E1E1E] border border-neutral-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Listado de Deudas Registradas
                </h3>
                <p className="text-xs text-neutral-400">
                  Control de pagos parciales (abonos) y liquidación total
                </p>
              </div>
              <span className="text-xs font-mono text-neutral-400">
                {data.debts.length} registradas
              </span>
            </div>

            {data.debts.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-neutral-500 mx-auto" />
                <p className="text-sm font-medium text-neutral-300">No hay deudas registradas</p>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Agrega una deuda para controlar tus obligaciones financieras, abonos y liquidaciones.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#E74C3C] to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Registrar Nueva Deuda</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                {data.debts.map((debt) => {
                  const paidSoFar = debt.payments.reduce((acc, p) => acc + p.amountUSD, 0);
                  const remainingUSD = Math.max(0, debt.totalAmountUSD - paidSoFar);
                  const percentPaid = Math.min(
                    100,
                    Math.round((paidSoFar / debt.totalAmountUSD) * 100)
                  );
                  const isPaid = debt.status === 'pagada' || remainingUSD <= 0;

                  return (
                    <div
                      key={debt.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isPaid
                          ? 'bg-[#151515] border-neutral-800 opacity-80'
                          : 'bg-[#181818] border-neutral-700/80 shadow-md'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white uppercase tracking-wider">
                              {debt.creditor}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                isPaid
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
                              }`}
                            >
                              {isPaid ? 'Liquidada / Pagada' : 'Deuda Activa'}
                            </span>
                          </div>

                          <p className="text-xs text-neutral-300 mt-1 font-medium">
                            {debt.description}
                          </p>

                          <div className="flex items-center gap-3 text-[11px] text-neutral-400 mt-1.5 font-mono">
                            <span>Adquirida: {debt.date}</span>
                            {debt.dueDate && (
                              <>
                                <span>·</span>
                                <span className="text-amber-400">Vence: {debt.dueDate}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Financial Figures */}
                        <div className="text-left sm:text-right shrink-0">
                          <span className="text-[10px] text-neutral-400 block uppercase">
                            Resta por pagar:
                          </span>
                          <p
                            className={`text-base font-extrabold font-mono tabular-nums ${
                              isPaid ? 'text-emerald-400 line-through' : 'text-[#E74C3C]'
                            }`}
                          >
                            {formatUSD(remainingUSD)}
                          </p>
                          <p className="text-[10px] font-mono text-neutral-400 tabular-nums">
                            {formatBs(calcBs(remainingUSD, bcvRate))}
                          </p>
                          <span className="text-[10px] text-neutral-400 font-mono block mt-0.5">
                            Original: {formatUSD(debt.totalAmountUSD)}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1 font-mono">
                          <span>Abonado: {formatUSD(paidSoFar)} ({percentPaid}%)</span>
                          <span>Total: {formatUSD(debt.totalAmountUSD)}</span>
                        </div>
                        <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isPaid ? 'bg-[#2ECC71]' : 'bg-[#FFD700]'
                            }`}
                            style={{ width: `${percentPaid}%` }}
                          />
                        </div>
                      </div>

                      {/* Abonos History if any */}
                      {debt.payments.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-neutral-800/80">
                          <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">
                            Historial de Abonos ({debt.payments.length})
                          </span>
                          <div className="space-y-1">
                            {debt.payments.map((p) => (
                              <div
                                key={p.id}
                                className="flex items-center justify-between text-[11px] bg-[#121212] px-2.5 py-1 rounded-lg text-neutral-300 font-mono"
                              >
                                <span>{p.date} · {p.note || 'Abono'}</span>
                                <span className="text-emerald-400 font-semibold">
                                  +{formatUSD(p.amountUSD)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                        <button
                          onClick={() => deleteDebt(debt.id)}
                          className="p-1.5 text-neutral-500 hover:text-[#E74C3C] hover:bg-neutral-800 rounded-lg text-xs transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Eliminar</span>
                        </button>

                        {!isPaid && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setAbonoDebtId(debt.id);
                                setAbonoAmount('');
                              }}
                              className="px-3 py-1.5 bg-[#FFD700] hover:bg-yellow-400 text-black font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5"
                            >
                              <Coins className="w-3.5 h-3.5" />
                              <span>Abonar</span>
                            </button>

                            <button
                              onClick={() => setPayFullDebtId(debt.id)}
                              className="px-3 py-1.5 bg-[#2ECC71] hover:bg-emerald-600 text-black font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Pagar Todo</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      {/* Modal Abonar */}
      {abonoDebtId && selectedDebtForAbono && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={() => setAbonoDebtId(null)}
          />
          <div className="relative bg-[#1E1E1E] border border-neutral-700 rounded-2xl w-full max-w-md p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setAbonoDebtId(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#FFD700]" />
              Abonar a Deuda
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Acreedor: <strong className="text-white">{selectedDebtForAbono.creditor}</strong>. Resta:{' '}
              <strong className="text-[#E74C3C] font-mono">{formatUSD(abonoDebtRemaining)}</strong>
            </p>

            <form onSubmit={handleAbonoSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Monto a Abonar en USD ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={abonoDebtRemaining}
                  required
                  value={abonoAmount}
                  onChange={(e) => setAbonoAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#121212] border border-neutral-700 focus:border-[#FFD700] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
                />
                <div className="mt-1 text-[11px] font-mono text-[#FFD700]">
                  Equivalente: {formatBs(calcBs(parseFloat(abonoAmount) || 0, bcvRate))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Fecha del Abono *
                </label>
                <input
                  type="date"
                  required
                  value={abonoDate}
                  onChange={(e) => setAbonoDate(e.target.value)}
                  className="w-full bg-[#121212] border border-neutral-700 focus:border-[#FFD700] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Nota / Referencia
                </label>
                <input
                  type="text"
                  value={abonoNote}
                  onChange={(e) => setAbonoNote(e.target.value)}
                  placeholder="Ej. Transferencia cuota 2"
                  className="w-full bg-[#121212] border border-neutral-700 focus:border-[#FFD700] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={registerExpense}
                  onChange={(e) => setRegisterExpense(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-900 text-[#FFD700] focus:ring-0"
                />
                <span>Registrar este abono como egreso (descontar de Saldo Neto)</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAbonoDebtId(null)}
                  className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#FFD700] text-black font-bold text-xs rounded-xl shadow"
                >
                  Confirmar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation to Pay Full */}
      <ConfirmModal
        isOpen={payFullDebtId !== null}
        title="¿Liquidar deuda en su totalidad?"
        message="Esta acción pagará el saldo restante de la deuda, la marcará como liquidada y registrará el egreso correspondiente."
        confirmText="Sí, liquidar deuda"
        onConfirm={handlePayFullConfirm}
        onClose={() => setPayFullDebtId(null)}
      />

      {/* Confirmation to clear all debts */}
      <ConfirmModal
        isOpen={confirmClearOpen}
        title="¿Limpiar todas las deudas?"
        message="Esta acción eliminará todos los registros de deudas y su historial de abonos."
        confirmText="Sí, limpiar deudas"
        isDestructive={true}
        onConfirm={clearDebts}
        onClose={() => setConfirmClearOpen(false)}
      />
    </div>
  );
};
