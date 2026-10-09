import React, { useState } from 'react';
import {
  HandCoins,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  Calendar,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  Phone,
  User,
  Share2,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { formatUSD, formatBs, calcBs } from '../../services/bcvService.ts';
import { ReceivableItem } from '../../types/finance.ts';
import { ConfirmModal } from '../common/ConfirmModal.tsx';

export const ReceivablesModule: React.FC = () => {
  const {
    data,
    bcvRate,
    addReceivable,
    updateReceivable,
    deleteReceivable,
    markReceivableAsPaid,
    clearReceivables,
    totalReceivablesPendingUSD,
  } = useFinance();

  // Toggle form state
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [amountUSD, setAmountUSD] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editClient, setEditClient] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAmount, setEditAmount] = useState('');

  // Modals
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [itemToPay, setItemToPay] = useState<ReceivableItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const parsedFormAmount = parseFloat(amountUSD) || 0;
  const convertedBs = calcBs(parsedFormAmount, bcvRate);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !clientName.trim() || parsedFormAmount <= 0) return;

    addReceivable({
      clientName: clientName.trim(),
      description: description.trim(),
      clientPhone: clientPhone.trim() || undefined,
      amountUSD: parsedFormAmount,
      date,
      dueDate: dueDate || undefined,
    });

    setClientName('');
    setDescription('');
    setClientPhone('');
    setAmountUSD('');
    setDueDate('');
  };

  const startEdit = (item: ReceivableItem) => {
    setEditingId(item.id);
    setEditClient(item.clientName);
    setEditDesc(item.description);
    setEditPhone(item.clientPhone || '');
    setEditAmount(item.amountUSD.toString());
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    const num = parseFloat(editAmount);
    if (isNaN(num) || num <= 0 || !editDesc.trim() || !editClient.trim()) return;

    updateReceivable(editingId, {
      clientName: editClient.trim(),
      description: editDesc.trim(),
      clientPhone: editPhone.trim() || undefined,
      amountUSD: num,
    });
    setEditingId(null);
  };

  const sendWhatsAppReminder = (item: ReceivableItem) => {
    const amountBs = calcBs(item.amountUSD, bcvRate);
    const formattedUsd = formatUSD(item.amountUSD);
    const formattedBsStr = formatBs(amountBs);

    const message = `Estimado(a) *${item.clientName}*, un cordial saludo.\n\nLe escribo para recordarle amablemente el pago pendiente por concepto de:\n📌 *${item.description}*\n\n💰 *Monto a cancelar:*\n• ${formattedUsd} USD\n• Equivalente: ${formattedBsStr} (Tasa oficial BCV: Bs. ${bcvRate.toFixed(2)})\n\n${item.dueDate ? `📅 Fecha límite/vencimiento: *${item.dueDate}*\n\n` : ''}Por favor indíquenos una vez efectuado el pago para registrar su comprobante. ¡Muchas gracias por su atención!`;

    // Clean phone number: remove non-digits except +
    let phoneDigits = (item.clientPhone || '').replace(/[^\d]/g, '');
    if (!phoneDigits) {
      phoneDigits = '';
    }

    const encoded = encodeURIComponent(message);
    const waUrl = phoneDigits
      ? `https://api.whatsapp.com/send?phone=${phoneDigits}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const sortedReceivables = [...data.receivables].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Top KPI Card */}
      <div className="bg-[#1E1E1E] border border-neutral-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-[#2ECC71] border border-emerald-500/30 flex items-center justify-center shrink-0">
            <HandCoins className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
              Total Cuentas Pendientes por Cobrar
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#2ECC71] font-mono tabular-nums">
                {formatUSD(totalReceivablesPendingUSD)}
              </span>
              <span className="text-xs text-neutral-400 font-medium">USD</span>
            </div>
            <div className="text-xs font-mono text-[#FFD700] mt-0.5 tabular-nums">
              Equivalente: {formatBs(calcBs(totalReceivablesPendingUSD, bcvRate))}
            </div>
          </div>
        </div>

        {/* Actions: Cuenta por Cobrar + Limpiar todo */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#2ECC71] to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/15 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{showForm ? 'Ocultar Formulario' : 'Cuenta por Cobrar'}</span>
          </button>

          <button
            onClick={() => setConfirmClearOpen(true)}
            disabled={data.receivables.length === 0}
            className="flex items-center gap-1.5 px-3 py-2.5 text-xs text-neutral-400 hover:text-[#E74C3C] bg-neutral-900 hover:bg-red-500/10 border border-neutral-800 hover:border-red-500/30 rounded-xl transition-all disabled:opacity-40 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpiar Todo</span>
          </button>
        </div>
      </div>

      {/* Conditional Formulario Agregar Cuenta por Cobrar */}
      {showForm && (
        <div className="bg-[#1E1E1E] border border-emerald-500/30 rounded-3xl p-6 shadow-[0_12px_40px_rgba(0,0,0,0.6)] animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#2ECC71]" />
              Formulario: Registrar Cuenta por Cobrar
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-xs text-neutral-400 hover:text-white px-2 py-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Cerrar Formulario ✕
            </button>
          </div>

          <form onSubmit={(e) => {
            handleAdd(e);
            setShowForm(false);
          }} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Nombre del Cliente / Deudor *
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej. Empresa ABC, Carlos Méndez..."
                  className="w-full bg-[#121212] border border-neutral-700 focus:border-[#2ECC71] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Descripción / Concepto del Cobro *
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej. Diseño de catálogo, venta de mercancía..."
                  className="w-full bg-[#121212] border border-neutral-700 focus:border-[#2ECC71] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none shadow-inner"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Teléfono WhatsApp (Ej. +584141234567)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-neutral-400 text-xs">
                    <Phone className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+58 414 1234567"
                    className="w-full bg-[#121212] border border-neutral-700 focus:border-[#2ECC71] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Monto en USD ($) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-neutral-400 text-xs font-mono">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amountUSD}
                    onChange={(e) => setAmountUSD(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#121212] border border-neutral-700 focus:border-[#2ECC71] rounded-xl pl-7 pr-3 py-2 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none shadow-inner"
                  />
                </div>
                <div className="mt-1 text-[11px] font-mono text-[#FFD700]">
                  Reconversión: {formatBs(convertedBs)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Fecha Registro *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#121212] border border-neutral-700 focus:border-[#2ECC71] rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none shadow-inner"
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
                className="py-2.5 px-6 bg-[#2ECC71] hover:bg-emerald-600 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Guardar Cuenta
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Listado de Cuentas por Cobrar */}
      <div className="w-full bg-[#1E1E1E] border border-neutral-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Listado de Cuentas por Cobrar
              </h3>
              <p className="text-xs text-neutral-400">
                Notifica al cliente por WhatsApp y liquida el pago para sumar al Saldo Neto Disponible
              </p>
            </div>
            <span className="text-xs font-mono text-neutral-400">
              {data.receivables.length} registradas
            </span>
          </div>

          {data.receivables.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-neutral-500 mx-auto" />
              <p className="text-sm font-medium text-neutral-300">No hay cuentas por cobrar</p>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Registra a un cliente deudor para realizar seguimiento, enviar mensajes de cobro por WhatsApp y liquidar a favor.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2ECC71] to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-black font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Cuenta por Cobrar</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3 mt-4">
              {sortedReceivables.map((item) => {
                const isPaid = item.status === 'pagado';
                const isEditing = editingId === item.id;

                if (isEditing) {
                  return (
                    <form
                      key={item.id}
                      onSubmit={handleSaveEdit}
                      className="p-3 bg-neutral-900 border border-neutral-700 rounded-xl space-y-2"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          value={editClient}
                          onChange={(e) => setEditClient(e.target.value)}
                          placeholder="Cliente"
                          className="bg-[#121212] border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white"
                        />
                        <input
                          type="text"
                          required
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder="Descripción"
                          className="bg-[#121212] border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="tel"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="Teléfono WhatsApp"
                          className="bg-[#121212] border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white"
                        />
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          placeholder="Monto USD"
                          className="bg-[#121212] border border-neutral-700 rounded-lg px-2.5 py-1 text-xs font-mono text-white"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-[#2ECC71] text-black text-xs font-bold rounded-lg"
                        >
                          Guardar
                        </button>
                      </div>
                    </form>
                  );
                }

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isPaid
                        ? 'bg-[#151515] border-neutral-800/80 opacity-75'
                        : 'bg-[#181818] border-neutral-700/80 shadow-md hover:border-neutral-600'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            {item.clientName}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              isPaid
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {isPaid ? 'Cobrado / Cancelado' : 'Pendiente de Cobro'}
                          </span>
                        </div>

                        <p className="text-xs text-neutral-300 mt-1 font-medium">
                          {item.description}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-neutral-400 mt-1.5 font-mono">
                          <span>Fecha: {item.date}</span>
                          {item.dueDate && (
                            <>
                              <span>·</span>
                              <span className="text-amber-400">Vence: {item.dueDate}</span>
                            </>
                          )}
                          {item.clientPhone && (
                            <>
                              <span>·</span>
                              <span>Tel: {item.clientPhone}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Financial Figure */}
                      <div className="text-left sm:text-right shrink-0">
                        <p
                          className={`text-base font-extrabold font-mono tabular-nums ${
                            isPaid ? 'text-emerald-400' : 'text-[#2ECC71]'
                          }`}
                        >
                          {formatUSD(item.amountUSD)}
                        </p>
                        <p className="text-[10px] font-mono text-neutral-400 tabular-nums">
                          {formatBs(calcBs(item.amountUSD, bcvRate))}
                        </p>
                      </div>
                    </div>

                    {/* Actions bar */}
                    <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(item)}
                          className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg text-xs"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setItemToDelete(item.id)}
                          className="p-1.5 text-neutral-400 hover:text-[#E74C3C] hover:bg-red-500/10 rounded-lg text-xs"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* WhatsApp Button */}
                        <button
                          onClick={() => sendWhatsAppReminder(item)}
                          className="px-3 py-1.5 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                          title="Enviar cobro por WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-[#25D366]/20" />
                          <span>Notificar WhatsApp</span>
                        </button>

                        {/* Botón Cancelado/Pagado */}
                        {!isPaid && (
                          <button
                            onClick={() => setItemToPay(item)}
                            className="px-3.5 py-1.5 bg-[#2ECC71] hover:bg-emerald-600 text-black font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Cancelado / Pagado</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      {/* Confirmation to Mark Receivable as Paid */}
      <ConfirmModal
        isOpen={itemToPay !== null}
        title="¿Confirmar Cobro Recibido?"
        message={`¿El cliente canceló ${itemToPay ? formatUSD(itemToPay.amountUSD) : ''}? Al confirmar, este monto se SUMARÁ automáticamente a tu Saldo Neto Disponible.`}
        confirmText="Sí, Cobro Recibido"
        onConfirm={() => {
          if (itemToPay) markReceivableAsPaid(itemToPay.id);
          setItemToPay(null);
        }}
        onClose={() => setItemToPay(null)}
      />

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={itemToDelete !== null}
        title="¿Eliminar cuenta por cobrar?"
        message="Esta cuenta será eliminada permanentemente del sistema."
        confirmText="Eliminar"
        isDestructive={true}
        onConfirm={() => {
          if (itemToDelete) deleteReceivable(itemToDelete);
          setItemToDelete(null);
        }}
        onClose={() => setItemToDelete(null)}
      />

      {/* Confirmation to clear all receivables */}
      <ConfirmModal
        isOpen={confirmClearOpen}
        title="¿Limpiar todas las cuentas por cobrar?"
        message="Esta acción eliminará todas las cuentas por cobrar (pendientes y cobradas) y recalculará el Saldo Neto Disponible."
        confirmText="Sí, limpiar cuentas"
        isDestructive={true}
        onConfirm={clearReceivables}
        onClose={() => setConfirmClearOpen(false)}
      />
    </div>
  );
};
