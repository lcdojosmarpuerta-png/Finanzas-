import React, { useState, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  Share2,
  Copy,
  Check,
  Download,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Landmark,
  HandCoins,
  Send,
  Table,
  Filter,
  Calendar,
  CheckCircle2,
  FileText,
  ArrowUpDown,
  Layers,
  Receipt,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { formatUSD, formatBs, calcBs } from '../../services/bcvService.ts';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UnifiedTransaction {
  id: string;
  date: string;
  type: 'INGRESO' | 'EGRESO' | 'COBRO' | 'PAGO_DEUDA';
  typeLabel: string;
  nature: 'CRÉDITO (HABER)' | 'DÉBITO (DEBE)' | 'ACTIVO CIRCULANTE';
  category: string;
  description: string;
  contact: string;
  status: 'PAGADO' | 'PENDIENTE' | 'COBRADO';
  amountUSD: number;
  signedUSD: number;
  bcvRate: number;
  amountBs: number;
  signedBs: number;
  paymentOrDueDate: string;
  profileName: string;
  timestamp: number;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose }) => {
  const {
    data,
    bcvRate,
    totalIncomeUSD,
    totalIncomeDepositedUSD,
    totalIncomePendingUSD,
    totalExpensesPaidUSD,
    totalExpensesPendingUSD,
    totalReceivablesPaidUSD,
    totalReceivablesPendingUSD,
    totalDebtsRemainingUSD,
    netAvailableBalanceUSD,
    getCategoryById,
  } = useFinance();

  // Active view tab
  const [activeTab, setActiveTab] = useState<'csv_history' | 'executive_excel' | 'whatsapp'>('csv_history');

  // WhatsApp states
  const [copied, setCopied] = useState(false);
  const [targetPhone, setTargetPhone] = useState('');

  // CSV Configuration states
  const [csvDelimiter, setCsvDelimiter] = useState<';' | ','>(';');
  const [csvTypeFilter, setCsvTypeFilter] = useState<'all' | 'cashflow' | 'income_expense' | 'pending'>('all');
  const [csvDateRange, setCsvDateRange] = useState<'all' | 'current_month' | 'last_30_days' | 'current_year'>('all');
  const [csvSortOrder, setCsvSortOrder] = useState<'desc' | 'asc'>('desc');
  const [csvExportSuccess, setCsvExportSuccess] = useState(false);

  // Compile Unified Transaction History for external accounting
  const allTransactions = useMemo<UnifiedTransaction[]>(() => {
    const list: UnifiedTransaction[] = [];
    const profileName = data.profile?.name || 'Josmar Puerta';

    // 1. Incomes
    (data.incomes || []).forEach((inc) => {
      const cat = getCategoryById(inc.categoryId)?.name || 'Ingreso General';
      const bs = calcBs(inc.amountUSD, bcvRate);
      list.push({
        id: inc.id,
        date: inc.date,
        type: 'INGRESO',
        typeLabel: 'Ingreso',
        nature: 'CRÉDITO (HABER)',
        category: cat,
        description: inc.description,
        contact: profileName,
        status: 'PAGADO',
        amountUSD: inc.amountUSD,
        signedUSD: inc.amountUSD,
        bcvRate,
        amountBs: bs,
        signedBs: bs,
        paymentOrDueDate: inc.date,
        profileName,
        timestamp: new Date(inc.date).getTime() || 0,
      });
    });

    // 2. Expenses
    (data.expenses || []).forEach((exp) => {
      const cat = getCategoryById(exp.categoryId)?.name || 'Gasto General';
      const bs = calcBs(exp.amountUSD, bcvRate);
      list.push({
        id: exp.id,
        date: exp.date,
        type: 'EGRESO',
        typeLabel: exp.status === 'pagado' ? 'Egreso Pagado' : 'Egreso Pendiente',
        nature: 'DÉBITO (DEBE)',
        category: cat,
        description: exp.description,
        contact: 'N/A',
        status: exp.status === 'pagado' ? 'PAGADO' : 'PENDIENTE',
        amountUSD: exp.amountUSD,
        signedUSD: -exp.amountUSD,
        bcvRate,
        amountBs: bs,
        signedBs: -bs,
        paymentOrDueDate: exp.paidAt ? exp.paidAt.split('T')[0] : 'Pendiente',
        profileName,
        timestamp: new Date(exp.date).getTime() || 0,
      });
    });

    // 3. Receivables
    (data.receivables || []).forEach((rec) => {
      const bs = calcBs(rec.amountUSD, bcvRate);
      list.push({
        id: rec.id,
        date: rec.date,
        type: 'COBRO',
        typeLabel: rec.status === 'pagado' ? 'Cobro Recibido' : 'Cuenta por Cobrar',
        nature: rec.status === 'pagado' ? 'CRÉDITO (HABER)' : 'ACTIVO CIRCULANTE',
        category: 'Cuentas por Cobrar',
        description: rec.description,
        contact: rec.clientName + (rec.clientPhone ? ` (${rec.clientPhone})` : ''),
        status: rec.status === 'pagado' ? 'COBRADO' : 'PENDIENTE',
        amountUSD: rec.amountUSD,
        signedUSD: rec.status === 'pagado' ? rec.amountUSD : 0,
        bcvRate,
        amountBs: bs,
        signedBs: rec.status === 'pagado' ? bs : 0,
        paymentOrDueDate: rec.status === 'pagado' ? (rec.paidAt?.split('T')[0] || rec.date) : (rec.dueDate || 'N/A'),
        profileName,
        timestamp: new Date(rec.date).getTime() || 0,
      });
    });

    // 4. Debt payments
    (data.debts || []).forEach((debt) => {
      (debt.payments || []).forEach((pay) => {
        const bs = calcBs(pay.amountUSD, bcvRate);
        list.push({
          id: pay.id,
          date: pay.date,
          type: 'PAGO_DEUDA',
          typeLabel: 'Abono Deuda',
          nature: 'DÉBITO (DEBE)',
          category: 'Servicio de Deuda',
          description: `Abono a: ${debt.description} (${pay.note || 'Pago'})`,
          contact: debt.creditor,
          status: 'PAGADO',
          amountUSD: pay.amountUSD,
          signedUSD: -pay.amountUSD,
          bcvRate,
          amountBs: bs,
          signedBs: -bs,
          paymentOrDueDate: pay.date,
          profileName,
          timestamp: new Date(pay.date).getTime() || 0,
        });
      });
    });

    return list;
  }, [data, bcvRate, getCategoryById]);

  // Filter and sort transactions
  const filteredTransactions = useMemo<UnifiedTransaction[]>(() => {
    let result = [...allTransactions];

    // Filter by type
    if (csvTypeFilter === 'cashflow') {
      result = result.filter((t) => t.status === 'PAGADO' || t.status === 'COBRADO');
    } else if (csvTypeFilter === 'income_expense') {
      result = result.filter((t) => t.type === 'INGRESO' || t.type === 'EGRESO');
    } else if (csvTypeFilter === 'pending') {
      result = result.filter((t) => t.status === 'PENDIENTE');
    }

    // Filter by date range
    const now = new Date();
    if (csvDateRange === 'current_month') {
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      result = result.filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      });
    } else if (csvDateRange === 'last_30_days') {
      const thirtyDaysAgo = now.getTime() - 30 * 86400000;
      result = result.filter((t) => t.timestamp >= thirtyDaysAgo);
    } else if (csvDateRange === 'current_year') {
      const currentYear = now.getFullYear();
      result = result.filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === currentYear;
      });
    }

    // Sort order
    result.sort((a, b) => {
      return csvSortOrder === 'desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
    });

    return result;
  }, [allTransactions, csvTypeFilter, csvDateRange, csvSortOrder]);

  // Aggregated summary of filtered transactions
  const filteredMetrics = useMemo(() => {
    let totalCreditsUSD = 0;
    let totalDebitsUSD = 0;

    filteredTransactions.forEach((t) => {
      if (t.signedUSD > 0) {
        totalCreditsUSD += t.signedUSD;
      } else if (t.signedUSD < 0) {
        totalDebitsUSD += Math.abs(t.signedUSD);
      }
    });

    const netPeriodUSD = totalCreditsUSD - totalDebitsUSD;

    return {
      count: filteredTransactions.length,
      creditsUSD: totalCreditsUSD,
      debitsUSD: totalDebitsUSD,
      netUSD: netPeriodUSD,
    };
  }, [filteredTransactions]);

  if (!isOpen) return null;

  const currentDate = new Date().toLocaleDateString('es-VE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // Export Unified Accounting CSV
  const handleExportTransactionHistoryCSV = () => {
    const sep = csvDelimiter;
    const dateStamp = new Date().toISOString().split('T')[0];
    const profileSlug = (data.profile?.name || 'Usuario').replace(/[^a-zA-Z0-9]/g, '_');

    // UTF-8 BOM for perfect Microsoft Excel, Numbers, and Google Sheets compatibility
    let csv = '\uFEFF';

    // Standardized accounting column headers (Libro Diario / Historial Contable)
    const headers = [
      'ID_TRANSACCION',
      'FECHA',
      'TIPO_MOVIMIENTO',
      'NATURALEZA_CONTABLE',
      'CATEGORIA',
      'CONCEPTO_DESCRIPCION',
      'CONTACTO_O_TERCERO',
      'ESTADO',
      'MONEDA',
      'MONTO_USD',
      'SIGNO_CONTABLE_USD',
      'TASA_OFICIAL_BCV',
      'MONTO_BS',
      'SIGNO_CONTABLE_BS',
      'FECHA_PAGO_O_VENCIMIENTO',
      'PERFIL_CONTABLE',
    ];

    csv += headers.map((h) => `"${h}"`).join(sep) + '\n';

    filteredTransactions.forEach((t) => {
      const cleanDesc = t.description.replace(/"/g, '""');
      const cleanContact = t.contact.replace(/"/g, '""');
      const cleanCategory = t.category.replace(/"/g, '""');
      const cleanProfile = t.profileName.replace(/"/g, '""');

      const row = [
        `"${t.id}"`,
        `"${t.date}"`,
        `"${t.type}"`,
        `"${t.nature}"`,
        `"${cleanCategory}"`,
        `"${cleanDesc}"`,
        `"${cleanContact}"`,
        `"${t.status}"`,
        `"USD"`,
        t.amountUSD.toFixed(2),
        t.signedUSD.toFixed(2),
        t.bcvRate.toFixed(2),
        t.amountBs.toFixed(2),
        t.signedBs.toFixed(2),
        `"${t.paymentOrDueDate}"`,
        `"${cleanProfile}"`,
      ];

      csv += row.join(sep) + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Historial_Transacciones_Contable_${profileSlug}_${dateStamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setCsvExportSuccess(true);
    setTimeout(() => setCsvExportSuccess(false), 3500);
  };

  // Prepare text message for WhatsApp
  const generateWhatsAppText = () => {
    return (
      `📊 *REPORTE FINANCIERO GENERAL*\n` +
      `🏢 *Sistema Financiero & Control BCV*\n` +
      `👤 *Usuario:* ${data.profile.name || 'Josmar Puerta'}\n` +
      `📅 *Fecha:* ${currentDate} (${currentTime})\n` +
      `💵 *Tasa Oficial BCV:* Bs. ${bcvRate.toFixed(2)} por USD\n` +
      `──────────────────────────\n` +
      `💰 *SALDO NETO DISPONIBLE:*\n` +
      `• *${formatUSD(netAvailableBalanceUSD)} USD*\n` +
      `• *${formatBs(calcBs(netAvailableBalanceUSD, bcvRate))} Bs.*\n` +
      `──────────────────────────\n` +
      `📈 *RESUMEN DE FLUJOS:*\n` +
      `• Ingresos Depositados (En Saldo): +${formatUSD(totalIncomeDepositedUSD)} USD (${formatBs(calcBs(totalIncomeDepositedUSD, bcvRate))} Bs.)\n` +
      (totalIncomePendingUSD > 0 ? `• Ingresos Por Depositar (Pendientes): +${formatUSD(totalIncomePendingUSD)} USD\n` : '') +
      `• Total Egresos Pagados: -${formatUSD(totalExpensesPaidUSD)} USD (${formatBs(calcBs(totalExpensesPaidUSD, bcvRate))} Bs.)\n` +
      `• Cuentas Cobradas (+) : +${formatUSD(totalReceivablesPaidUSD)} USD\n` +
      `──────────────────────────\n` +
      `⏳ *COMPROMISOS & PENDIENTES:*\n` +
      `• Egresos Diferidos (Pendientes): ${formatUSD(totalExpensesPendingUSD)} USD\n` +
      `• Cuentas por Cobrar a Clientes: ${formatUSD(totalReceivablesPendingUSD)} USD\n` +
      `• Deudas por Liquidar: ${formatUSD(totalDebtsRemainingUSD)} USD\n` +
      `──────────────────────────\n` +
      `📌 _Generado por Sistema Financiero BCV - Josmar Puerta_`
    );
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(generateWhatsAppText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(generateWhatsAppText());
    let cleanPhone = targetPhone.replace(/[^\d]/g, '');
    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`
      : `https://api.whatsapp.com/send?text=${text}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Generate and download executive summary Excel CSV
  const handleExportExcel = () => {
    const dateStamp = new Date().toISOString().split('T')[0];
    let csv = '\uFEFF';

    // 1. Resumen Ejecutivo
    csv += 'REPORTE FINANCIERO EJECUTIVO - SISTEMA BCV\n';
    csv += `Generado el:;${currentDate} ${currentTime}\n`;
    csv += `Usuario:;${data.profile.name || 'Josmar Puerta'}\n`;
    csv += `Tasa Oficial BCV:;Bs. ${bcvRate.toFixed(2)} por USD\n\n`;

    csv += 'INDICADOR;MONTO (USD);EQUIVALENTE (Bs.)\n';
    csv += `Saldo Neto Disponible;${netAvailableBalanceUSD.toFixed(2)};${calcBs(netAvailableBalanceUSD, bcvRate).toFixed(2)}\n`;
    csv += `Ingresos Depositados (En Saldo);${totalIncomeDepositedUSD.toFixed(2)};${calcBs(totalIncomeDepositedUSD, bcvRate).toFixed(2)}\n`;
    csv += `Ingresos Pendientes por Depositar;${totalIncomePendingUSD.toFixed(2)};${calcBs(totalIncomePendingUSD, bcvRate).toFixed(2)}\n`;
    csv += `Total Ingresos Registrados;${totalIncomeUSD.toFixed(2)};${calcBs(totalIncomeUSD, bcvRate).toFixed(2)}\n`;
    csv += `Total Egresos Pagados;${totalExpensesPaidUSD.toFixed(2)};${calcBs(totalExpensesPaidUSD, bcvRate).toFixed(2)}\n`;
    csv += `Egresos Pendientes;${totalExpensesPendingUSD.toFixed(2)};${calcBs(totalExpensesPendingUSD, bcvRate).toFixed(2)}\n`;
    csv += `Cuentas por Cobrar Pendientes;${totalReceivablesPendingUSD.toFixed(2)};${calcBs(totalReceivablesPendingUSD, bcvRate).toFixed(2)}\n`;
    csv += `Deudas por Pagar Pendientes;${totalDebtsRemainingUSD.toFixed(2)};${calcBs(totalDebtsRemainingUSD, bcvRate).toFixed(2)}\n\n`;

    // 2. Detalle de Ingresos
    csv += '--- DETALLE DE INGRESOS ---\n';
    csv += 'FECHA;CATEGORÍA;DESCRIPCIÓN;ESTADO;MONTO USD;MONTO BS\n';
    data.incomes.forEach((inc) => {
      const cat = getCategoryById(inc.categoryId);
      const statusLabel = inc.status === 'pendiente' ? 'PENDIENTE' : 'DEPOSITADO';
      csv += `"${inc.date}";"${cat?.name || 'General'}";"${inc.description.replace(/"/g, '""')}";"${statusLabel}";${inc.amountUSD.toFixed(2)};${calcBs(inc.amountUSD, bcvRate).toFixed(2)}\n`;
    });
    csv += '\n';

    // 3. Detalle de Egresos
    csv += '--- DETALLE DE EGRESOS ---\n';
    csv += 'FECHA;CATEGORÍA;DESCRIPCIÓN;ESTADO;MONTO USD;MONTO BS\n';
    data.expenses.forEach((exp) => {
      const cat = getCategoryById(exp.categoryId);
      csv += `"${exp.date}";"${cat?.name || 'General'}";"${exp.description.replace(/"/g, '""')}";"${exp.status.toUpperCase()}";${exp.amountUSD.toFixed(2)};${calcBs(exp.amountUSD, bcvRate).toFixed(2)}\n`;
    });
    csv += '\n';

    // 4. Detalle de Cuentas por Cobrar
    csv += '--- DETALLE DE CUENTAS POR COBRAR ---\n';
    csv += 'FECHA;CLIENTE;TELÉFONO;CONCEPTO;ESTADO;MONTO USD;MONTO BS\n';
    data.receivables.forEach((r) => {
      csv += `"${r.date}";"${r.clientName.replace(/"/g, '""')}";"${r.clientPhone || 'N/A'}";"${r.description.replace(/"/g, '""')}";"${r.status.toUpperCase()}";${r.amountUSD.toFixed(2)};${calcBs(r.amountUSD, bcvRate).toFixed(2)}\n`;
    });
    csv += '\n';

    // 5. Detalle de Deudas
    csv += '--- DETALLE DE DEUDAS Y OBLIGACIONES ---\n';
    csv += 'FECHA;ACREEDOR;CONCEPTO;MONTO TOTAL USD;RESTANTE USD;ESTADO\n';
    data.debts.forEach((d) => {
      const paid = d.payments.reduce((acc, p) => acc + p.amountUSD, 0);
      const remaining = Math.max(0, d.totalAmountUSD - paid);
      csv += `"${d.date}";"${d.creditor.replace(/"/g, '""')}";"${d.description.replace(/"/g, '""')}";${d.totalAmountUSD.toFixed(2)};${remaining.toFixed(2)};"${d.status.toUpperCase()}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Reporte_Financiero_BCV_${dateStamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-[#181818] border border-neutral-700 rounded-3xl w-full max-w-3xl p-4 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.85)] z-10 max-h-[94vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2ECC71] to-emerald-600 text-black font-bold flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Centro de Reportes y Exportación Contable
              </h3>
              <p className="text-xs text-neutral-400">
                Historial de transacciones para contabilidad externa, balances ejecutivos y reportes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Snapshot Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3">
          <div className="bg-[#121212] border border-neutral-800 rounded-2xl p-2.5 sm:p-3 shadow-inner">
            <span className="text-[10px] uppercase font-semibold text-neutral-400 block">Saldo Neto</span>
            <p className={`text-sm sm:text-base font-extrabold font-mono tabular-nums ${netAvailableBalanceUSD >= 0 ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
              {formatUSD(netAvailableBalanceUSD)}
            </p>
            <p className="text-[10px] font-mono text-[#FFD700] truncate">
              {formatBs(calcBs(netAvailableBalanceUSD, bcvRate))}
            </p>
          </div>

          <div className="bg-[#121212] border border-neutral-800 rounded-2xl p-2.5 sm:p-3 shadow-inner">
            <span className="text-[10px] uppercase font-semibold text-neutral-400 block">Total Ingresos</span>
            <p className="text-sm sm:text-base font-extrabold font-mono text-[#2ECC71] tabular-nums">
              +{formatUSD(totalIncomeUSD)}
            </p>
            <p className="text-[10px] font-mono text-neutral-400 truncate">
              {data.incomes.length} registrados
            </p>
          </div>

          <div className="bg-[#121212] border border-neutral-800 rounded-2xl p-2.5 sm:p-3 shadow-inner">
            <span className="text-[10px] uppercase font-semibold text-neutral-400 block">Egresos Pagados</span>
            <p className="text-sm sm:text-base font-extrabold font-mono text-[#E74C3C] tabular-nums">
              -{formatUSD(totalExpensesPaidUSD)}
            </p>
            <p className="text-[10px] font-mono text-neutral-400 truncate">
              {data.expenses.filter((e) => e.status === 'pagado').length} pagados
            </p>
          </div>

          <div className="bg-[#121212] border border-neutral-800 rounded-2xl p-2.5 sm:p-3 shadow-inner">
            <span className="text-[10px] uppercase font-semibold text-neutral-400 block">Tasa BCV Oficial</span>
            <p className="text-sm sm:text-base font-extrabold font-mono text-[#FFD700] tabular-nums">
              Bs. {bcvRate.toFixed(2)}
            </p>
            <p className="text-[10px] font-mono text-neutral-400 truncate">Vigente en sistema</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-[#121212] border border-neutral-800 rounded-2xl mt-3">
          <button
            onClick={() => setActiveTab('csv_history')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'csv_history'
                ? 'bg-gradient-to-r from-[#2ECC71] to-emerald-600 text-black shadow-md shadow-emerald-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <Table className="w-4 h-4" />
            <span className="truncate">Historial CSV Contable</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
              activeTab === 'csv_history' ? 'bg-black/20 text-neutral-900 font-extrabold' : 'bg-neutral-800 text-neutral-300'
            }`}>
              {allTransactions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('executive_excel')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'executive_excel'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="truncate">Resumen Ejecutivo</span>
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span className="truncate">WhatsApp</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-3 flex-1 overflow-y-auto space-y-3 pr-1">
          {/* TAB 1: Historial CSV Contable */}
          {activeTab === 'csv_history' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              {/* Feature Introduction Card */}
              <div className="bg-[#1E1E1E] border border-neutral-800 rounded-2xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-[#2ECC71] border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <Table className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-white">Exportación de Historial Contable (.CSV)</h4>
                        <span className="text-[10px] bg-emerald-500/15 text-[#2ECC71] border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                          Libro Diario Normalizado
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                        Exporta cada movimiento cronológico en formato tabular plano con identificación única, naturaleza contable (Débito/Crédito), categorías, estados, montos en USD y cálculo oficial en Bs. BCV.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:self-center shrink-0">
                    <button
                      onClick={handleExportTransactionHistoryCSV}
                      disabled={filteredTransactions.length === 0}
                      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all shadow-lg cursor-pointer ${
                        csvExportSuccess
                          ? 'bg-emerald-500 text-black shadow-emerald-500/30'
                          : 'bg-gradient-to-r from-[#2ECC71] to-emerald-500 hover:from-emerald-400 hover:to-emerald-500 text-black shadow-emerald-500/20'
                      }`}
                    >
                      {csvExportSuccess ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-black animate-bounce" />
                          <span>¡CSV Exportado con Éxito!</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Descargar CSV Contable</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Compatibility Badges */}
                <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-center justify-between flex-wrap gap-2 text-[11px] text-neutral-400">
                  <span className="font-semibold text-neutral-300">Software compatible:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="bg-[#121212] px-2 py-0.5 rounded-lg border border-neutral-800 text-neutral-300">Microsoft Excel</span>
                    <span className="bg-[#121212] px-2 py-0.5 rounded-lg border border-neutral-800 text-neutral-300">QuickBooks</span>
                    <span className="bg-[#121212] px-2 py-0.5 rounded-lg border border-neutral-800 text-neutral-300">Contpaqi</span>
                    <span className="bg-[#121212] px-2 py-0.5 rounded-lg border border-neutral-800 text-neutral-300">Odoo</span>
                    <span className="bg-[#121212] px-2 py-0.5 rounded-lg border border-neutral-800 text-neutral-300">Google Sheets</span>
                  </div>
                </div>
              </div>

              {/* Filters & Options Grid */}
              <div className="bg-[#1E1E1E] border border-neutral-800 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-[#2ECC71]" />
                    Parámetros de Exportación y Filtros
                  </span>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    <strong className="text-white">{filteredMetrics.count}</strong> transacciones seleccionadas
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {/* Filter 1: Type */}
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-neutral-400 mb-1">
                      Tipo de Transacciones
                    </label>
                    <select
                      value={csvTypeFilter}
                      onChange={(e) => setCsvTypeFilter(e.target.value as any)}
                      className="w-full bg-[#121212] border border-neutral-700 text-xs text-white rounded-xl px-2.5 py-1.5 focus:border-[#2ECC71] focus:outline-none cursor-pointer"
                    >
                      <option value="all">Todas ({allTransactions.length} registros)</option>
                      <option value="cashflow">Solo Flujo Real (Pagados/Cobrados)</option>
                      <option value="income_expense">Solo Ingresos y Egresos</option>
                      <option value="pending">Solo Pendientes por Liquidar</option>
                    </select>
                  </div>

                  {/* Filter 2: Date Range */}
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-neutral-400 mb-1">
                      Período Contable
                    </label>
                    <select
                      value={csvDateRange}
                      onChange={(e) => setCsvDateRange(e.target.value as any)}
                      className="w-full bg-[#121212] border border-neutral-700 text-xs text-white rounded-xl px-2.5 py-1.5 focus:border-[#2ECC71] focus:outline-none cursor-pointer"
                    >
                      <option value="all">Todo el Historial</option>
                      <option value="current_month">Mes Actual</option>
                      <option value="last_30_days">Últimos 30 Días</option>
                      <option value="current_year">Año en Curso</option>
                    </select>
                  </div>

                  {/* Filter 3: CSV Delimiter */}
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-neutral-400 mb-1">
                      Separador CSV
                    </label>
                    <select
                      value={csvDelimiter}
                      onChange={(e) => setCsvDelimiter(e.target.value as ';' | ',')}
                      className="w-full bg-[#121212] border border-neutral-700 text-xs text-white rounded-xl px-2.5 py-1.5 focus:border-[#2ECC71] focus:outline-none cursor-pointer font-mono"
                    >
                      <option value=";">Punto y coma (;) - Excel Español/VE</option>
                      <option value=",">Coma (,) - Int'l / QuickBooks / Odoo</option>
                    </select>
                  </div>

                  {/* Filter 4: Order */}
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-neutral-400 mb-1">
                      Orden Cronológico
                    </label>
                    <select
                      value={csvSortOrder}
                      onChange={(e) => setCsvSortOrder(e.target.value as 'desc' | 'asc')}
                      className="w-full bg-[#121212] border border-neutral-700 text-xs text-white rounded-xl px-2.5 py-1.5 focus:border-[#2ECC71] focus:outline-none cursor-pointer"
                    >
                      <option value="desc">Más recientes primero (Desc)</option>
                      <option value="asc">Libro Diario (Ascendente)</option>
                    </select>
                  </div>
                </div>

                {/* Filter Summary Metrics */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-800/80">
                  <div className="bg-[#121212] p-2 rounded-xl border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 block">Créditos / Entradas</span>
                    <span className="text-xs font-bold text-[#2ECC71] font-mono">
                      +{formatUSD(filteredMetrics.creditsUSD)}
                    </span>
                  </div>
                  <div className="bg-[#121212] p-2 rounded-xl border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 block">Débitos / Salidas</span>
                    <span className="text-xs font-bold text-[#E74C3C] font-mono">
                      -{formatUSD(filteredMetrics.debitsUSD)}
                    </span>
                  </div>
                  <div className="bg-[#121212] p-2 rounded-xl border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 block">Neto del Período</span>
                    <span className={`text-xs font-bold font-mono ${filteredMetrics.netUSD >= 0 ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
                      {formatUSD(filteredMetrics.netUSD)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transactions Preview Table */}
              <div className="bg-[#1E1E1E] border border-neutral-800 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-neutral-400" />
                    Vista Previa de Transacciones a Exportar
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    Mostrando hasta 5 de {filteredTransactions.length} filas
                  </span>
                </div>

                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-6 bg-[#121212] rounded-xl border border-neutral-800 text-neutral-500 text-xs">
                    No hay transacciones que coincidan con los filtros seleccionados.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-neutral-800">
                    <table className="w-full text-left text-[11px] text-neutral-300">
                      <thead className="bg-[#141414] text-neutral-400 border-b border-neutral-800 uppercase text-[9px] tracking-wider font-semibold">
                        <tr>
                          <th className="py-2 px-2.5">Fecha</th>
                          <th className="py-2 px-2.5">Tipo</th>
                          <th className="py-2 px-2.5">Concepto / Categoría</th>
                          <th className="py-2 px-2.5 text-right">Monto (USD)</th>
                          <th className="py-2 px-2.5 text-right">Equiv. (Bs.)</th>
                          <th className="py-2 px-2.5 text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/60 bg-[#121212]">
                        {filteredTransactions.slice(0, 5).map((t) => (
                          <tr key={t.id} className="hover:bg-neutral-800/40 transition-colors">
                            <td className="py-2 px-2.5 font-mono text-neutral-400 whitespace-nowrap">
                              {t.date}
                            </td>
                            <td className="py-2 px-2.5 whitespace-nowrap">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  t.type === 'INGRESO'
                                    ? 'bg-emerald-500/15 text-[#2ECC71]'
                                    : t.type === 'EGRESO'
                                    ? 'bg-red-500/15 text-[#E74C3C]'
                                    : t.type === 'COBRO'
                                    ? 'bg-blue-500/15 text-[#3498DB]'
                                    : 'bg-amber-500/15 text-[#F39C12]'
                                }`}
                              >
                                {t.typeLabel}
                              </span>
                            </td>
                            <td className="py-2 px-2.5 max-w-[180px] truncate">
                              <p className="font-medium text-white truncate">{t.description}</p>
                              <p className="text-[10px] text-neutral-500 truncate">{t.category}</p>
                            </td>
                            <td
                              className={`py-2 px-2.5 text-right font-mono font-bold whitespace-nowrap ${
                                t.signedUSD > 0
                                  ? 'text-[#2ECC71]'
                                  : t.signedUSD < 0
                                  ? 'text-[#E74C3C]'
                                  : 'text-neutral-300'
                              }`}
                            >
                              {t.signedUSD > 0 ? '+' : ''}
                              {formatUSD(t.amountUSD)}
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono text-[#FFD700] text-[10px] whitespace-nowrap">
                              {formatBs(t.amountBs)}
                            </td>
                            <td className="py-2 px-2.5 text-center whitespace-nowrap">
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                                  t.status === 'PAGADO' || t.status === 'COBRADO'
                                    ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40'
                                    : 'text-amber-400 bg-amber-950/40 border border-amber-800/40'
                                }`}
                              >
                                {t.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {filteredTransactions.length > 5 && (
                  <p className="text-[10px] text-neutral-500 text-center pt-1 italic">
                    + {filteredTransactions.length - 5} transacciones adicionales serán incluidas en el archivo CSV generado.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Resumen Ejecutivo Excel */}
          {activeTab === 'executive_excel' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="bg-[#1E1E1E] border border-neutral-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-[#2ECC71] border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Reporte Financiero Ejecutivo</h4>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Descarga una planilla estructurada por secciones con el balance general, resumen de indicadores, y tablas desglosadas de ingresos, egresos, cuentas por cobrar y deudas activas.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleExportExcel}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#2ECC71] to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Balance Excel</span>
                </button>
              </div>

              {/* Sections Breakdown Card */}
              <div className="bg-[#1E1E1E] border border-neutral-800 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold text-neutral-200 block">Estructura del Archivo Ejecutivo:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-300">
                  <div className="bg-[#121212] p-2.5 rounded-xl border border-neutral-800 flex items-center justify-between">
                    <span className="text-neutral-400">1. Resumen de Saldos y Tasas BCV</span>
                    <span className="text-emerald-400 font-mono font-semibold">6 Métricas</span>
                  </div>
                  <div className="bg-[#121212] p-2.5 rounded-xl border border-neutral-800 flex items-center justify-between">
                    <span className="text-neutral-400">2. Tabla de Ingresos Totales</span>
                    <span className="text-white font-mono font-semibold">{data.incomes.length} filas</span>
                  </div>
                  <div className="bg-[#121212] p-2.5 rounded-xl border border-neutral-800 flex items-center justify-between">
                    <span className="text-neutral-400">3. Tabla de Egresos y Estado</span>
                    <span className="text-white font-mono font-semibold">{data.expenses.length} filas</span>
                  </div>
                  <div className="bg-[#121212] p-2.5 rounded-xl border border-neutral-800 flex items-center justify-between">
                    <span className="text-neutral-400">4. Cuentas por Cobrar & Deudas</span>
                    <span className="text-white font-mono font-semibold">{data.receivables.length + data.debts.length} filas</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WhatsApp Share */}
          {activeTab === 'whatsapp' && (
            <div className="bg-[#1E1E1E] border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2ECC71]/15 text-[#2ECC71] border border-[#2ECC71]/30 flex items-center justify-center shrink-0">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Compartir Balance por WhatsApp</h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Envía el resumen estructurado a tu propio chat, socios, contadores o clientes.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                    Número de WhatsApp (Opcional, con código de país ej: 584141234567):
                  </label>
                  <input
                    type="text"
                    value={targetPhone}
                    onChange={(e) => setTargetPhone(e.target.value)}
                    placeholder="Ej: +58 414 1234567 o dejar vacío"
                    className="w-full bg-[#121212] border border-neutral-700 focus:border-[#2ECC71] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none shadow-inner"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <button
                    onClick={handleShareWhatsApp}
                    className="flex-1 py-2 px-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#1ebd5a] hover:to-[#0f776a] text-white font-extrabold text-xs rounded-xl shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar por WhatsApp</span>
                  </button>

                  <button
                    onClick={handleCopyText}
                    className="py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl border border-neutral-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Copiar texto formateado"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#2ECC71]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* Preview Box */}
              <div className="mt-3">
                <span className="text-[10px] uppercase font-semibold text-neutral-500 block mb-1">
                  Vista previa del mensaje a enviar:
                </span>
                <pre className="p-3 bg-[#121212] border border-neutral-800/80 rounded-xl text-[11px] text-neutral-300 font-mono whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed shadow-inner">
                  {generateWhatsAppText()}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-neutral-400">
            <Receipt className="w-3.5 h-3.5 text-[#2ECC71]" />
            <span>Total registros en sistema: <strong className="text-white font-mono">{allTransactions.length}</strong></span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

