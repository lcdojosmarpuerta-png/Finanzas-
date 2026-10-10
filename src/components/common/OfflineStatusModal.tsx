import React, { useState } from 'react';
import {
  Wifi,
  WifiOff,
  HardDrive,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  X,
  Database,
  TrendingUp,
  TrendingDown,
  Landmark,
  HandCoins,
  Tag,
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  FileJson,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { formatUSD } from '../../services/bcvService.ts';

export const OfflineStatusModal: React.FC = () => {
  const {
    isOfflineStatusModalOpen,
    setIsOfflineStatusModalOpen,
    effectiveIsOnline,
    isOnline,
    isSimulatingOffline,
    toggleSimulateOffline,
    checkConnectivity,
    storageStats,
    data,
    bcvRate,
    netAvailableBalanceUSD,
    setIsBackupModalOpen,
  } = useFinance();

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOfflineStatusModalOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const ok = await checkConnectivity();
    setIsTesting(false);
    if (ok) {
      setTestResult('¡Conexión verificada con éxito! El sistema tiene acceso a internet.');
    } else {
      setTestResult(
        isSimulatingOffline
          ? 'Modo simulación offline activo: el sistema opera 100% con LocalStorage.'
          : 'Sin acceso a internet detectado. Todos los datos locales permanecen disponibles para consulta.'
      );
    }
  };

  const formattedSavedDate = new Date(storageStats.lastSavedAt).toLocaleString('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOfflineStatusModalOpen(false)}
      />

      {/* Modal Card */}
      <div className="relative bg-[#181818] border border-neutral-700/80 rounded-2xl sm:rounded-3xl w-full max-w-xl p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.85)] z-10 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                effectiveIsOnline
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}
            >
              {effectiveIsOnline ? (
                <Wifi className="w-5 h-5 stroke-[2.2]" />
              ) : (
                <WifiOff className="w-5 h-5 stroke-[2.2] animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Estado de Red & Almacenamiento Local
              </h3>
              <p className="text-xs text-neutral-400">
                Disponibilidad de datos y persistencia offline garantizada
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsOfflineStatusModalOpen(false)}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Network & LocalStorage Status Hero */}
        <div className="mt-4 space-y-4">
          <div
            className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
              effectiveIsOnline
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                : 'bg-amber-950/25 border-amber-500/40 text-amber-200'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    effectiveIsOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'
                  }`}
                />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {effectiveIsOnline ? 'Conexión a Internet Activa' : 'Modo Sin Conexión (Offline)'}
                </span>
              </div>
              <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                {effectiveIsOnline
                  ? 'El sistema está conectado a internet para consultar en tiempo real las tasas oficiales del BCV.'
                  : 'No hay conexión a internet disponible. Todos los datos están seguros y puedes consultar saldos, movimientos y emitir reportes normalmente.'}
              </p>
            </div>

            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold shrink-0 border border-neutral-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-[#FFD700]' : ''}`} />
              <span>{isTesting ? 'Probando...' : 'Probar'}</span>
            </button>
          </div>

          {testResult && (
            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-neutral-200 font-mono animate-in fade-in duration-200">
              {testResult}
            </div>
          )}

          {/* LocalStorage Health & Stats Box */}
          <div className="bg-[#1F1F1F] border border-neutral-800 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-[#FFD700]" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Persistencia LocalStorage (Navegador)
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" />
                {storageStats.isLocalStorageSupported ? '100% Operativo' : 'No disponible'}
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="bg-[#161616] p-2.5 rounded-xl border border-neutral-800 text-center">
                <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
                  Registros
                </span>
                <span className="text-base font-extrabold text-white font-mono">
                  {storageStats.totalRecords}
                </span>
              </div>

              <div className="bg-[#161616] p-2.5 rounded-xl border border-neutral-800 text-center">
                <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
                  Memoria Usada
                </span>
                <span className="text-base font-extrabold text-[#FFD700] font-mono">
                  ~{storageStats.storageSizeKB} KB
                </span>
              </div>

              <div className="bg-[#161616] p-2.5 rounded-xl border border-neutral-800 text-center">
                <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
                  Tasa en Caché
                </span>
                <span className="text-base font-extrabold text-emerald-400 font-mono">
                  Bs. {bcvRate.toFixed(2)}
                </span>
              </div>

              <div className="bg-[#161616] p-2.5 rounded-xl border border-neutral-800 text-center">
                <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
                  Saldo Neto
                </span>
                <span className="text-base font-extrabold text-white font-mono">
                  {formatUSD(netAvailableBalanceUSD)}
                </span>
              </div>
            </div>

            {/* Inventory breakdown */}
            <div className="mt-2 pt-2 border-t border-neutral-800/80 space-y-1.5 text-xs text-neutral-300">
              <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-neutral-900/50">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#2ECC71]" />
                  Ingresos registrados
                </span>
                <span className="font-mono font-bold text-white">{storageStats.incomesCount}</span>
              </div>

              <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-neutral-900/50">
                <span className="flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5 text-[#E74C3C]" />
                  Egresos registrados (pagados y pendientes)
                </span>
                <span className="font-mono font-bold text-white">{storageStats.expensesCount}</span>
              </div>

              <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-neutral-900/50">
                <span className="flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-amber-400" />
                  Deudas & Compromisos
                </span>
                <span className="font-mono font-bold text-white">{storageStats.debtsCount}</span>
              </div>

              <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-neutral-900/50">
                <span className="flex items-center gap-1.5">
                  <HandCoins className="w-3.5 h-3.5 text-[#2ECC71]" />
                  Cuentas por Cobrar
                </span>
                <span className="font-mono font-bold text-white">{storageStats.receivablesCount}</span>
              </div>

              <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-neutral-900/50">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#FFD700]" />
                  Categorías configuradas
                </span>
                <span className="font-mono font-bold text-white">{storageStats.categoriesCount}</span>
              </div>
            </div>

            <div className="text-[11px] text-neutral-400 pt-1 flex items-center justify-between">
              <span>Último autoguardado en dispositivo:</span>
              <span className="font-mono text-neutral-300">{formattedSavedDate}</span>
            </div>

            <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between">
              <span className="text-[11px] text-neutral-400">¿Deseas exportar o importar un archivo?</span>
              <button
                onClick={() => {
                  setIsOfflineStatusModalOpen(false);
                  setIsBackupModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 text-[#FFD700] border border-yellow-500/30 text-xs font-bold transition-colors cursor-pointer"
              >
                <FileJson className="w-3.5 h-3.5" />
                <span>Copia de Seguridad (JSON)</span>
              </button>
            </div>
          </div>

          {/* Guarantee Box */}
          <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-neutral-300 text-xs leading-relaxed space-y-1.5">
            <div className="flex items-center gap-1.5 text-white font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-[#FFD700]" />
              <span>Garantía de Persistencia Local</span>
            </div>
            <p>
              Tus finanzas no dependen de un servidor remoto para ser consultadas. La información permanece intacta en el almacenamiento de este dispositivo (`LocalStorage`) ante caídas eléctricas o fallas de internet.
            </p>
          </div>

          {/* Offline Simulation Control for user testing */}
          <div className="p-3.5 rounded-2xl bg-[#1C1C1C] border border-neutral-800 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-white block">
                Simular Modo Sin Conexión para Pruebas
              </span>
              <span className="text-[11px] text-neutral-400">
                Permite verificar el aspecto visual del indicador y confirmar que la consulta local funciona sin red.
              </span>
            </div>

            <button
              onClick={toggleSimulateOffline}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer border ${
                isSimulatingOffline
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
              }`}
            >
              {isSimulatingOffline ? (
                <>
                  <ToggleRight className="w-5 h-5 text-amber-400" />
                  <span>Desactivar Simulación</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-5 h-5 text-neutral-400" />
                  <span>Activar Simulación</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-neutral-800 flex items-center justify-end">
          <button
            onClick={() => setIsOfflineStatusModalOpen(false)}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#E6B800] hover:from-yellow-400 hover:to-yellow-500 text-black text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
