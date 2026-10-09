import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Landmark,
  HandCoins,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Trash2,
  PieChart,
  User,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Sparkles,
  Menu,
  ShieldCheck,
  ChevronRight,
  Search,
  Filter,
  Clock,
  FileSpreadsheet,
  Wifi,
  WifiOff,
  HardDrive,
  Scale,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { formatUSD, formatBs, calcBs } from '../../services/bcvService.ts';
import { ActiveModule } from '../../types/finance.ts';

interface DashboardModuleProps {
  onOpenProfile: () => void;
  onOpenResetModal: () => void;
  onOpenMenuCompleto?: () => void;
  onOpenReport?: () => void;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  onOpenProfile,
  onOpenResetModal,
  onOpenMenuCompleto,
  onOpenReport,
}) => {
  const {
    data,
    bcvRate,
    refreshBcvRate,
    isSyncingBcv,
    setActiveModule,
    totalIncomeUSD,
    totalExpensesPaidUSD,
    totalReceivablesPaidUSD,
    totalReceivablesPendingUSD,
    totalExpensesPendingUSD,
    totalDebtsRemainingUSD,
    netAvailableBalanceUSD,
    getCategoryById,
    effectiveIsOnline,
    setIsOfflineStatusModalOpen,
    storageStats,
    profiles,
    activeProfileId,
    switchProfile,
  } = useFinance();

  // Dynamic Clock inside Perfil del Usuario card
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const formattedDate = currentTime.toLocaleDateString('es-VE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Search & filter for recent movements
  const [movementSearch, setMovementSearch] = useState('');
  const [movementFilter, setMovementFilter] = useState<'all' | 'ingreso' | 'egreso' | 'cobro'>('all');

  // Actualizar movimientos históricos state
  const [isRefreshingMovements, setIsRefreshingMovements] = useState(false);
  const [lastMovementsUpdate, setLastMovementsUpdate] = useState<Date>(new Date());
  const [showRefreshBadge, setShowRefreshBadge] = useState(false);

  const handleRefreshMovements = async () => {
    setIsRefreshingMovements(true);
    try {
      await refreshBcvRate();
    } catch {
      // ignore
    }
    setLastMovementsUpdate(new Date());
    setTimeout(() => {
      setIsRefreshingMovements(false);
      setShowRefreshBadge(true);
      setTimeout(() => setShowRefreshBadge(false), 2500);
    }, 600);
  };

  // Unified recent movements (Incomes, Expenses, Paid Receivables, Debt Payments) sorted descending
  const recentMovements = [
    ...data.incomes.map((inc) => ({
      id: inc.id,
      title: inc.description,
      type: 'ingreso' as const,
      amountUSD: inc.amountUSD,
      date: inc.date,
      createdAt: inc.createdAt,
      categoryId: inc.categoryId,
      statusText: inc.status === 'pendiente' ? 'Ingreso Por Depositar' : 'Ingreso Depositado',
      isPending: inc.status === 'pendiente',
    })),
    ...data.expenses.map((exp) => ({
      id: exp.id,
      title: exp.description,
      type: 'egreso' as const,
      amountUSD: exp.amountUSD,
      date: exp.date,
      createdAt: exp.createdAt,
      categoryId: exp.categoryId,
      statusText: exp.status === 'pagado' ? 'Egreso Pagado' : 'Egreso Pendiente',
      isPending: exp.status === 'pendiente',
    })),
    ...data.receivables
      .filter((r) => r.status === 'pagado')
      .map((r) => ({
        id: r.id,
        title: `Cobro: ${r.clientName} - ${r.description}`,
        type: 'cobro' as const,
        amountUSD: r.amountUSD,
        date: r.paidAt ? r.paidAt.split('T')[0] : r.date,
        createdAt: r.paidAt || r.createdAt,
        categoryId: 'cobro',
        statusText: 'Cuenta Cobrada',
        isPending: false,
      })),
    ...data.debts.flatMap((d) =>
      d.payments.map((p) => ({
        id: p.id,
        title: `Abono Deuda: ${d.creditor} (${p.note || d.description})`,
        type: 'egreso' as const,
        amountUSD: p.amountUSD,
        date: p.date,
        createdAt: p.date,
        categoryId: 'deuda',
        statusText: 'Pago a Deuda',
        isPending: false,
      }))
    ),
  ]
    .filter((m) => {
      const matchType = movementFilter === 'all' || m.type === movementFilter;
      const matchSearch = m.title.toLowerCase().includes(movementSearch.toLowerCase());
      return matchType && matchSearch;
    })
    .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());

  const isNetPositive = netAvailableBalanceUSD >= 0;
  // Diferencial = Saldo Disponible - Gastos Pendientes
  const diferencialUSD = netAvailableBalanceUSD - totalExpensesPendingUSD;
  const isDiferencialPositive = diferencialUSD >= 0;

  return (
    <div className="space-y-6">
      {/* 
        =========================================================
        1. PERFIL DEL USUARIO (With Clock Indicator & Report Button)
        =========================================================
      */}
      <div className="relative bg-gradient-to-br from-[#1E1E1E] via-[#1A1A1A] to-[#181818] border border-neutral-800/90 rounded-3xl p-5 sm:p-7 shadow-[0_12px_40px_rgba(0,0,0,0.55)] hover:shadow-[0_16px_50px_rgba(0,0,0,0.7)] hover:border-neutral-700/80 transition-all duration-300 overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#FFD700]/5 via-transparent to-transparent pointer-events-none rounded-full blur-3xl" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          {/* User info & avatar */}
          <div className="flex items-center gap-4 sm:gap-5">
            <button
              onClick={onOpenProfile}
              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-neutral-900 border-2 border-[#FFD700] flex items-center justify-center shrink-0 group transition-all duration-300 hover:scale-105 shadow-[0_6px_20px_rgba(255,215,0,0.2)] cursor-pointer"
              title="Haz clic para modificar tu avatar o logotipo"
            >
              {data.profile.avatarUrl ? (
                <img
                  src={data.profile.avatarUrl}
                  alt={data.profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-neutral-400 group-hover:text-[#FFD700] transition-colors" />
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[11px] text-[#FFD700] font-bold transition-opacity">
                Editar
              </div>
            </button>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#FFD700] bg-yellow-500/10 border border-yellow-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                  Perfil de Usuario Activo
                </span>
                <span className="text-[11px] text-neutral-500">·</span>
                {effectiveIsOnline ? (
                  <button
                    onClick={() => setIsOfflineStatusModalOpen(true)}
                    className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium hover:text-emerald-300 transition-colors cursor-pointer"
                    title="Conectado a internet. Clic para ver estado de red y almacenamiento."
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                    <span>En Línea (Sincronizado)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsOfflineStatusModalOpen(true)}
                    className="text-[11px] text-amber-300 flex items-center gap-1 font-bold bg-amber-500/15 hover:bg-amber-500/25 px-2 py-0.5 rounded-full border border-amber-500/40 transition-colors cursor-pointer shadow-sm animate-pulse"
                    title="Modo sin conexión activo. Tus datos en LocalStorage están listos para consulta. Clic para ver almacenamiento."
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-ping" />
                    <WifiOff className="w-3 h-3 text-amber-400" />
                    <span>Modo Offline (LocalStorage Activo)</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {data.profile.name || 'Josmar Puerta'}
                </h2>
                {data.profile.accountType && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700/80 capitalize">
                    {data.profile.accountType}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-neutral-400 mt-0.5 font-medium">
                {data.profile.title || 'Administrador Financiero'}
              </p>

              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <button
                  onClick={onOpenProfile}
                  className="text-xs font-semibold text-[#FFD700] hover:text-yellow-300 underline underline-offset-2 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  Gestionar Perfiles ({profiles.length})
                </button>

                {profiles.length > 1 && (
                  <div className="flex items-center gap-1.5 pl-2.5 border-l border-neutral-700/80 flex-wrap">
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold">
                      Cambiar a:
                    </span>
                    {profiles.map((p) => {
                      const isCurrent = p.id === activeProfileId;
                      return (
                        <button
                          key={p.id}
                          onClick={() => switchProfile(p.id)}
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-gradient-to-r from-[#FFD700] to-[#E6B800] text-black shadow-sm'
                              : 'bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700'
                          }`}
                          title={`Activar perfil "${p.name}" y sus registros`}
                        >
                          {p.name.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right action group: Indicador de Hora + Tasa BCV + Botón Reporte */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Indicador de Hora dinámico dentro del cuadro de perfil */}
            <div className="bg-[#121212] border border-neutral-800/90 rounded-2xl px-4 py-2.5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)] flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#FFD700] animate-pulse shrink-0" />
              <div>
                <span className="text-neutral-400 text-[10px] uppercase font-semibold block tracking-wider">
                  Hora & Fecha en Vivo
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-white font-mono font-extrabold text-sm sm:text-base tabular-nums">
                    {formattedTime}
                  </span>
                  <span className="text-[11px] text-neutral-400 font-medium capitalize hidden sm:inline">
                    · {formattedDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Tasa BCV Display */}
            <div className="bg-[#121212] border border-neutral-800/90 rounded-2xl px-3.5 py-2.5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)] flex items-center gap-2.5">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-neutral-400 text-[10px] uppercase font-semibold block tracking-wider">
                    Tasa Oficial BCV
                  </span>
                  {!effectiveIsOnline && (
                    <span className="text-[9px] font-mono text-amber-300 font-bold bg-amber-500/20 border border-amber-500/30 px-1 rounded">
                      Caché Local
                    </span>
                  )}
                </div>
                <span className="text-[#FFD700] font-mono font-extrabold text-sm sm:text-base tabular-nums">
                  Bs. {bcvRate.toFixed(2)}
                </span>
              </div>
              <button
                onClick={refreshBcvRate}
                disabled={isSyncingBcv}
                title={effectiveIsOnline ? 'Actualizar tasa oficial tomada de la red' : 'Sin conexión: se mantiene la tasa en caché local'}
                className="p-1.5 rounded-xl bg-neutral-800 text-neutral-300 hover:text-[#FFD700] hover:bg-neutral-700 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingBcv ? 'animate-spin text-[#FFD700]' : ''}`} />
              </button>
            </div>

            {/* Botón Reporte (Excel & WhatsApp) */}
            {onOpenReport && (
              <button
                onClick={onOpenReport}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#2ECC71] to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-black font-extrabold text-xs rounded-2xl shadow-[0_4px_20px_rgba(46,204,113,0.3)] hover:shadow-[0_6px_25px_rgba(46,204,113,0.4)] transition-all duration-200 cursor-pointer"
                title="Generar reporte Excel y compartir por WhatsApp"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Reporte</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 
        =========================================================
        2. SALDO NETO DISPONIBLE
        =========================================================
      */}
      <div className="relative bg-[#1A1A1A] border border-neutral-800/90 rounded-3xl p-6 sm:p-8 shadow-[0_14px_45px_rgba(0,0,0,0.6)] hover:shadow-[0_18px_55px_rgba(0,0,0,0.75)] hover:border-neutral-700/80 transition-all duration-300 overflow-hidden">
        {/* Glow accent depending on balance sign */}
        <div
          className={`absolute -top-10 -right-10 w-96 h-96 pointer-events-none rounded-full blur-3xl opacity-20 ${
            isNetPositive ? 'bg-[#2ECC71]' : 'bg-[#E74C3C]'
          }`}
        />

        <div className="relative z-10 flex flex-col justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-800/80">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-lg ${
                  isNetPositive
                    ? 'bg-[#2ECC71]/15 text-[#2ECC71] border border-[#2ECC71]/40 shadow-emerald-500/10'
                    : 'bg-[#E74C3C]/15 text-[#E74C3C] border border-[#E74C3C]/40 shadow-red-500/10'
                }`}
              >
                <Wallet className="w-6 h-6 stroke-[2.3]" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider block">
                  Saldo Neto Disponible
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Ingresos Depositados + Cuentas por Cobrar Pagadas − Egresos Pagados
                </p>
              </div>
            </div>

            <span
              className={`text-xs px-3.5 py-1.5 rounded-full font-bold self-start sm:self-auto border shadow-sm ${
                isNetPositive
                  ? 'bg-[#2ECC71]/15 text-[#2ECC71] border-[#2ECC71]/40'
                  : 'bg-[#E74C3C]/15 text-[#E74C3C] border-[#E74C3C]/40'
              }`}
            >
              {isNetPositive ? '✓ Superávit Financiero' : '⚠ Saldo Negativo'}
            </span>
          </div>

          {/* Big Balance Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block mb-1">
                Monto Disponible en USD
              </span>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight tabular-nums font-mono ${
                    isNetPositive ? 'text-white' : 'text-[#E74C3C]'
                  }`}
                >
                  {formatUSD(netAvailableBalanceUSD)}
                </span>
                <span className="text-sm font-bold text-neutral-400 font-mono">USD</span>
              </div>
            </div>

            {/* Reconversion to Bolívares */}
            <div className="bg-[#121212]/90 border border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-inner">
              <span className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider block">
                Reconversión Automática en Bolívares (Bs)
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#FFD700] font-mono tabular-nums mt-1">
                {formatBs(calcBs(netAvailableBalanceUSD, bcvRate))}
              </p>
              <p className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]" />
                Calculado a la Tasa Oficial BCV de Bs. {bcvRate.toFixed(2)} por dólar
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 
        =========================================================
        3. MOVIMIENTOS HISTÓRICOS (Third in Order)
        =========================================================
      */}
      <div className="bg-[#1A1A1A] border border-neutral-800/90 rounded-3xl p-5 sm:p-7 shadow-[0_12px_40px_rgba(0,0,0,0.55)] hover:shadow-[0_16px_50px_rgba(0,0,0,0.7)] hover:border-neutral-700/80 transition-all duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#FFD700]" />
                Movimientos Históricos
              </h3>
              {showRefreshBadge && (
                <span className="text-[10px] font-bold bg-emerald-500/20 text-[#2ECC71] border border-emerald-500/30 px-2.5 py-0.5 rounded-full animate-in fade-in flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> ¡Movimientos Actualizados!
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>Transacciones ordenadas descendentemente por fecha</span>
              <span className="text-neutral-600">·</span>
              <span className="text-[11px] text-neutral-500 font-mono">
                Actualizado: {lastMovementsUpdate.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </span>
            </p>
          </div>

          {/* Action button & filter controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Botón de actualizar los movimientos históricos */}
            <button
              type="button"
              onClick={handleRefreshMovements}
              disabled={isRefreshingMovements}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500/15 via-[#FFD700]/20 to-yellow-500/15 hover:from-amber-500/25 hover:to-yellow-500/25 text-[#FFD700] border border-[#FFD700]/30 hover:border-[#FFD700]/60 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
              title="Actualizar y recalcular todos los movimientos históricos con la tasa oficial BCV"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingMovements ? 'animate-spin' : ''}`} />
              <span>{isRefreshingMovements ? 'Actualizando...' : 'Actualizar Movimientos'}</span>
            </button>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={movementSearch}
                onChange={(e) => setMovementSearch(e.target.value)}
                placeholder="Buscar operación..."
                className="bg-[#121212] border border-neutral-700 focus:border-[#FFD700] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none w-28 sm:w-36 shadow-inner"
              />
            </div>

            <select
              value={movementFilter}
              onChange={(e) => setMovementFilter(e.target.value as any)}
              className="bg-[#121212] border border-neutral-700 rounded-xl px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none shadow-inner cursor-pointer"
            >
              <option value="all">Todos los Tipos</option>
              <option value="ingreso">Solo Ingresos</option>
              <option value="egreso">Solo Egresos</option>
              <option value="cobro">Solo Cobros CxC</option>
            </select>

            <span className="text-xs text-neutral-400 font-mono px-2 py-1 bg-neutral-900 rounded-lg border border-neutral-800">
              {recentMovements.length} registradas
            </span>
          </div>
        </div>

        {recentMovements.length === 0 ? (
          <div className="py-14 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-neutral-500 mx-auto flex items-center justify-center border border-neutral-800">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm text-neutral-200 font-semibold">No se encontraron movimientos</p>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Utiliza el menú para registrar nuevos ingresos o egresos en la plataforma.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/70 mt-2">
            {recentMovements.slice(0, 10).map((m) => {
              const category = getCategoryById(m.categoryId);
              const isIncome = m.type === 'ingreso' || m.type === 'cobro';

              return (
                <div
                  key={`${m.type}-${m.id}`}
                  className="py-3 px-3 flex items-center justify-between gap-3 hover:bg-neutral-800/40 rounded-2xl transition-all duration-150 group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                        m.isPending
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : isIncome
                          ? 'bg-[#2ECC71]/15 text-[#2ECC71] border border-[#2ECC71]/30'
                          : 'bg-[#E74C3C]/15 text-[#E74C3C] border border-[#E74C3C]/30'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#FFD700] transition-colors">
                        {m.title}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                        <span className="font-mono">{m.date}</span>
                        <span>·</span>
                        <span className="truncate">
                          {category ? category.name : m.statusText}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm sm:text-base font-extrabold font-mono tabular-nums ${
                        isIncome
                          ? 'text-[#2ECC71]'
                          : m.isPending
                          ? 'text-amber-400'
                          : 'text-[#E74C3C]'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatUSD(m.amountUSD)}
                    </p>
                    <p className="text-[10px] font-mono text-neutral-400 tabular-nums">
                      {formatBs(calcBs(m.amountUSD, bcvRate))}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 
        =========================================================
        4. COMPROMISOS & CUENTAS (Fourth in Order)
        =========================================================
      */}
      <div className="bg-[#1A1A1A] border border-neutral-800/90 rounded-3xl p-5 sm:p-7 shadow-[0_12px_40px_rgba(0,0,0,0.55)] hover:shadow-[0_16px_50px_rgba(0,0,0,0.7)] hover:border-neutral-700/80 transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Landmark className="w-5 h-5 text-[#E74C3C]" />
              Compromisos & Cuentas Pendientes
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Resumen de obligaciones financieras por liquidar y cuentas por cobrar
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveModule('pendientes')}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Ver Pendientes
            </button>
            <button
              onClick={() => setActiveModule('deudas')}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Gestionar Deudas
            </button>
            <button
              onClick={() => setActiveModule('cobrar')}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Gestionar Cobros
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {/* Card 1: Egresos Pendientes */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-neutral-800/90 shadow-[0_4px_15px_rgba(0,0,0,0.4)] hover:border-amber-500/40 transition-all flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full inline-block">
                  Egresos Diferidos
                </span>
                <h4 className="text-sm font-bold text-white mt-2">Gastos Pendientes</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Listos para pagarse y descontar de saldo
                </p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-end justify-between">
              <div>
                <p className="text-xl font-extrabold font-mono text-amber-400 tabular-nums">
                  {formatUSD(totalExpensesPendingUSD)}
                </p>
                <p className="text-[11px] font-mono text-neutral-400 tabular-nums">
                  {formatBs(calcBs(totalExpensesPendingUSD, bcvRate))}
                </p>
              </div>

              <button
                onClick={() => setActiveModule('pendientes')}
                className="text-xs text-amber-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                Pagar <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: Deudas por Pagar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-neutral-800/90 shadow-[0_4px_15px_rgba(0,0,0,0.4)] hover:border-red-500/40 transition-all flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full inline-block">
                  Pasivo / Obligaciones
                </span>
                <h4 className="text-sm font-bold text-white mt-2">Deudas a Acreedores</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Préstamos y compras a crédito
                </p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-red-500/15 text-[#E74C3C] flex items-center justify-center">
                <Landmark className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-end justify-between">
              <div>
                <p className="text-xl font-extrabold font-mono text-[#E74C3C] tabular-nums">
                  {formatUSD(totalDebtsRemainingUSD)}
                </p>
                <p className="text-[11px] font-mono text-neutral-400 tabular-nums">
                  {formatBs(calcBs(totalDebtsRemainingUSD, bcvRate))}
                </p>
              </div>

              <button
                onClick={() => setActiveModule('deudas')}
                className="text-xs text-[#E74C3C] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                Abonar <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3: CxC Pendientes */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-neutral-800/90 shadow-[0_4px_15px_rgba(0,0,0,0.4)] hover:border-emerald-500/40 transition-all flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full inline-block">
                  Activo / Cuentas a Favor
                </span>
                <h4 className="text-sm font-bold text-white mt-2">Por Cobrar a Clientes</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Cuentas por cobrar con WhatsApp
                </p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-[#2ECC71] flex items-center justify-center">
                <HandCoins className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-end justify-between">
              <div>
                <p className="text-xl font-extrabold font-mono text-[#2ECC71] tabular-nums">
                  {formatUSD(totalReceivablesPendingUSD)}
                </p>
                <p className="text-[11px] font-mono text-neutral-400 tabular-nums">
                  {formatBs(calcBs(totalReceivablesPendingUSD, bcvRate))}
                </p>
              </div>

              <button
                onClick={() => setActiveModule('cobrar')}
                className="text-xs text-[#2ECC71] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                Cobrar <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 4: Diferencial (Saldo Disponible - Pendientes) */}
          <div className={`p-4 sm:p-5 rounded-2xl bg-[#141414] border transition-all flex flex-col justify-between shadow-[0_4px_15px_rgba(0,0,0,0.4)] ${
            isDiferencialPositive
              ? 'border-cyan-500/40 hover:border-cyan-500/70 shadow-cyan-500/5'
              : 'border-red-500/40 hover:border-red-500/70 shadow-red-500/5'
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full inline-block border ${
                  isDiferencialPositive
                    ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
                    : 'text-red-400 bg-red-500/10 border-red-500/30'
                }`}>
                  {isDiferencialPositive ? 'Margen Favorable' : 'Déficit Proyectado'}
                </span>
                <h4 className="text-sm font-bold text-white mt-2 flex items-center gap-1.5">
                  <span>Diferencial</span>
                </h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Saldo Disponible − Pendientes
                </p>
              </div>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isDiferencialPositive
                  ? 'bg-cyan-500/15 text-cyan-400'
                  : 'bg-red-500/15 text-[#E74C3C]'
              }`}>
                <Scale className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-end justify-between">
              <div>
                <p className={`text-xl font-extrabold font-mono tabular-nums ${
                  isDiferencialPositive ? 'text-cyan-400' : 'text-[#E74C3C]'
                }`}>
                  {formatUSD(diferencialUSD)}
                </p>
                <p className="text-[11px] font-mono text-neutral-400 tabular-nums">
                  {formatBs(calcBs(diferencialUSD, bcvRate))}
                </p>
              </div>

              <button
                onClick={() => setActiveModule('pendientes')}
                className={`text-xs hover:underline font-semibold flex items-center gap-1 cursor-pointer ${
                  isDiferencialPositive ? 'text-cyan-400' : 'text-red-400'
                }`}
                title="Ver y pagar gastos pendientes"
              >
                Pagar <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
