import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  FileJson,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  X,
  FileText,
  HardDrive,
  RefreshCw,
  Info,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { formatUSD } from '../../services/bcvService.ts';
import { BackupFileStructure, RestoreResult } from '../../types/finance.ts';

export const BackupModal: React.FC = () => {
  const {
    isBackupModalOpen,
    setIsBackupModalOpen,
    exportBackupJSON,
    downloadBackupFile,
    parseBackupFile,
    restoreFromBackup,
    storageStats,
    data,
    bcvRate,
    netAvailableBalanceUSD,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [copied, setCopied] = useState(false);

  // Import State
  const [rawJsonInput, setRawJsonInput] = useState('');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [parsedBackup, setParsedBackup] = useState<BackupFileStructure | null>(null);
  const [parseResult, setParseResult] = useState<RestoreResult | null>(null);
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isBackupModalOpen) return null;

  const handleCopyJSON = async () => {
    try {
      const json = exportBackupJSON();
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Error copying to clipboard', e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setRestoreSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawJsonInput(text);
      validateAndSet(text);
    };
    reader.readAsText(file);
  };

  const handleTextInputChange = (text: string) => {
    setRawJsonInput(text);
    setRestoreSuccessMsg(null);
    if (text.trim().length > 10) {
      validateAndSet(text);
    } else {
      setParsedBackup(null);
      setParseResult(null);
    }
  };

  const validateAndSet = (text: string) => {
    const result = parseBackupFile(text);
    setParseResult(result);
    if (result.success) {
      try {
        const parsed = JSON.parse(text);
        setParsedBackup(parsed);
      } catch {
        setParsedBackup(null);
      }
    } else {
      setParsedBackup(null);
    }
  };

  const handleExecuteRestore = () => {
    if (!parsedBackup) return;
    setIsProcessing(true);

    setTimeout(() => {
      const res = restoreFromBackup(parsedBackup, restoreMode);
      setIsProcessing(false);
      if (res.success) {
        setRestoreSuccessMsg(res.message);
        setParsedBackup(null);
        setParseResult(null);
        setRawJsonInput('');
        setSelectedFileName(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setParseResult(res);
      }
    }, 400);
  };

  const handleResetImport = () => {
    setRawJsonInput('');
    setSelectedFileName(null);
    setParsedBackup(null);
    setParseResult(null);
    setRestoreSuccessMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => setIsBackupModalOpen(false)}
      />

      {/* Modal Dialog */}
      <div className="relative bg-[#181818] border border-neutral-700/80 rounded-2xl sm:rounded-3xl w-full max-w-2xl p-5 sm:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.85)] z-10 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FFD700] to-[#E6B800] text-black font-bold flex items-center justify-center shadow-lg shadow-yellow-500/15 shrink-0">
              <FileJson className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Copia de Seguridad & Restauración
              </h3>
              <p className="text-xs text-neutral-400">
                Exporta tus datos en formato JSON o restáuralos en cualquier dispositivo
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsBackupModalOpen(false)}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-4 p-1 bg-[#121212] rounded-xl border border-neutral-800">
          <button
            onClick={() => {
              setActiveTab('export');
              setRestoreSuccessMsg(null);
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'export'
                ? 'bg-gradient-to-r from-[#FFD700] to-[#E6B800] text-black shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Crear Copia de Seguridad</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('import');
              setRestoreSuccessMsg(null);
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'import'
                ? 'bg-gradient-to-r from-[#FFD700] to-[#E6B800] text-black shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Restaurar Copia (.json)</span>
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
          {/* ========================================================
              TAB 1: EXPORT BACKUP
             ======================================================== */}
          {activeTab === 'export' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Current Storage Summary Card */}
              <div className="bg-[#1F1F1F] border border-neutral-800 rounded-2xl p-4.5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-[#FFD700]" />
                    Resumen de Datos Actuales a Respaldar
                  </span>
                  <span className="text-[11px] font-mono text-[#FFD700] bg-yellow-500/10 border border-yellow-500/30 px-2 py-0.5 rounded font-semibold">
                    {storageStats.totalRecords} Registros
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-[#141414] p-2.5 rounded-xl border border-neutral-800/90 text-center">
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
                      Ingresos
                    </span>
                    <span className="text-base font-extrabold text-[#2ECC71] font-mono">
                      {storageStats.incomesCount}
                    </span>
                  </div>

                  <div className="bg-[#141414] p-2.5 rounded-xl border border-neutral-800/90 text-center">
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
                      Egresos
                    </span>
                    <span className="text-base font-extrabold text-[#E74C3C] font-mono">
                      {storageStats.expensesCount}
                    </span>
                  </div>

                  <div className="bg-[#141414] p-2.5 rounded-xl border border-neutral-800/90 text-center">
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
                      Deudas / Acreed.
                    </span>
                    <span className="text-base font-extrabold text-amber-400 font-mono">
                      {storageStats.debtsCount}
                    </span>
                  </div>

                  <div className="bg-[#141414] p-2.5 rounded-xl border border-neutral-800/90 text-center">
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
                      Por Cobrar
                    </span>
                    <span className="text-base font-extrabold text-emerald-400 font-mono">
                      {storageStats.receivablesCount}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-300 pt-1 font-mono">
                  <span>Usuario: <strong className="text-white">{data.profile.name || 'Josmar Puerta'}</strong></span>
                  <span>Tasa BCV: <strong className="text-[#FFD700]">Bs. {bcvRate.toFixed(2)}</strong></span>
                  <span>Saldo Neto: <strong className="text-white">{formatUSD(netAvailableBalanceUSD)}</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={downloadBackupFile}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#E6B800] hover:from-yellow-400 hover:to-yellow-500 text-black text-xs sm:text-sm font-extrabold shadow-[0_4px_20px_rgba(255,215,0,0.25)] hover:shadow-[0_6px_25px_rgba(255,215,0,0.35)] transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Archivo de Respaldo (.json)</span>
                </button>

                <button
                  onClick={handleCopyJSON}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-xs font-bold border border-neutral-700 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">¡JSON Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-neutral-300" />
                      <span>Copiar al Portapapeles</span>
                    </>
                  )}
                </button>
              </div>

              {/* Guidance Box */}
              <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-neutral-300 text-xs leading-relaxed space-y-2">
                <div className="flex items-center gap-1.5 text-white font-bold">
                  <ShieldCheck className="w-4 h-4 text-[#FFD700]" />
                  <span>¿Por qué descargar una copia de seguridad?</span>
                </div>
                <p>
                  El archivo `.json` generado contiene una copia íntegra de todos tus registros financieros y categorías personalizadas. Puedes guardarlo en tu Google Drive, enviártelo por correo o guardarlo en una memoria USB para restaurarlo en otro navegador, teléfono o computadora cuando lo desees.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: IMPORT / RESTORE BACKUP
             ======================================================== */}
          {activeTab === 'import' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Success Alert */}
              {restoreSuccessMsg && (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 flex items-start gap-3 shadow-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <strong className="block text-emerald-300 text-sm font-bold mb-0.5">
                      ¡Restauración Completada!
                    </strong>
                    {restoreSuccessMsg}
                  </div>
                </div>
              )}

              {/* Upload Drop Zone / Selector */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-700 hover:border-[#FFD700] bg-[#141414] hover:bg-neutral-900/60 rounded-2xl p-6 text-center transition-all cursor-pointer group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-[#FFD700] flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 stroke-[2]" />
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-white">
                  {selectedFileName ? selectedFileName : 'Haz clic para seleccionar tu archivo de respaldo (.json)'}
                </h4>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Formatos compatibles: respaldos generados por FinanzasBCV (.json)
                </p>
              </div>

              {/* Or paste directly */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                  <span>O pega el contenido JSON aquí:</span>
                  {rawJsonInput && (
                    <button
                      onClick={handleResetImport}
                      className="text-[11px] text-[#E74C3C] hover:underline"
                    >
                      Limpiar campo
                    </button>
                  )}
                </div>
                <textarea
                  value={rawJsonInput}
                  onChange={(e) => handleTextInputChange(e.target.value)}
                  placeholder='{"version": "1.0", "appName": "FinanzasBCV", "data": { ... }}'
                  rows={3}
                  className="w-full bg-[#121212] border border-neutral-800 rounded-xl p-3 text-xs font-mono text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-[#FFD700] resize-none"
                />
              </div>

              {/* Validation Result / Preview Card */}
              {parseResult && parseResult.success && parseResult.preview && (
                <div className="p-4 rounded-2xl bg-[#1C1C1C] border border-emerald-500/40 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Archivo Válido para Restaurar
                    </span>
                    <span className="text-[11px] font-mono text-neutral-400">
                      {parseResult.recordsCount} registros encontrados
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-[#121212] p-2 rounded-xl border border-neutral-800">
                      <span className="text-[10px] text-neutral-400 uppercase block">Ingresos</span>
                      <strong className="text-white font-mono">{parseResult.preview.incomesCount}</strong>
                    </div>
                    <div className="bg-[#121212] p-2 rounded-xl border border-neutral-800">
                      <span className="text-[10px] text-neutral-400 uppercase block">Egresos</span>
                      <strong className="text-white font-mono">{parseResult.preview.expensesCount}</strong>
                    </div>
                    <div className="bg-[#121212] p-2 rounded-xl border border-neutral-800">
                      <span className="text-[10px] text-neutral-400 uppercase block">Deudas</span>
                      <strong className="text-white font-mono">{parseResult.preview.debtsCount}</strong>
                    </div>
                    <div className="bg-[#121212] p-2 rounded-xl border border-neutral-800">
                      <span className="text-[10px] text-neutral-400 uppercase block">Por Cobrar</span>
                      <strong className="text-white font-mono">{parseResult.preview.receivablesCount}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-neutral-300 pt-1 font-mono">
                    <span>Usuario: <strong>{parseResult.preview.profileName}</strong></span>
                    <span>Tasa BCV: <strong>Bs. {parseResult.preview.bcvRate.toFixed(2)}</strong></span>
                    <span>Saldo: <strong>{formatUSD(parseResult.preview.netBalanceUSD)}</strong></span>
                  </div>

                  {/* Mode Selector */}
                  <div className="pt-2 border-t border-neutral-800/80 space-y-2">
                    <span className="text-xs font-semibold text-white block">
                      Selecciona el modo de restauración:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label
                        className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                          restoreMode === 'replace'
                            ? 'bg-yellow-500/10 border-[#FFD700] text-white'
                            : 'bg-[#141414] border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="restoreMode"
                          value="replace"
                          checked={restoreMode === 'replace'}
                          onChange={() => setRestoreMode('replace')}
                          className="mt-0.5 text-[#FFD700] focus:ring-0"
                        />
                        <div>
                          <strong className="text-xs block text-white">Reemplazar todo (Recomendado)</strong>
                          <span className="text-[11px] text-neutral-400">
                            Sustituye la base de datos actual con este respaldo.
                          </span>
                        </div>
                      </label>

                      <label
                        className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                          restoreMode === 'merge'
                            ? 'bg-yellow-500/10 border-[#FFD700] text-white'
                            : 'bg-[#141414] border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="restoreMode"
                          value="merge"
                          checked={restoreMode === 'merge'}
                          onChange={() => setRestoreMode('merge')}
                          className="mt-0.5 text-[#FFD700] focus:ring-0"
                        />
                        <div>
                          <strong className="text-xs block text-white">Fusionar con datos actuales</strong>
                          <span className="text-[11px] text-neutral-400">
                            Agrega los registros sin borrar lo que ya tienes.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={handleExecuteRestore}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-black text-xs sm:text-sm font-extrabold shadow-[0_4px_20px_rgba(46,204,113,0.3)] transition-all cursor-pointer disabled:opacity-50 mt-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                    <span>{isProcessing ? 'Restaurando...' : 'Confirmar & Restaurar Respaldo Ahora'}</span>
                  </button>
                </div>
              )}

              {/* Error Alert */}
              {parseResult && !parseResult.success && (
                <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/50 text-red-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-red-300 font-bold mb-0.5">Archivo No Válido</strong>
                    {parseResult.message}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <span className="flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FFD700]" />
            Compatibilidad con LocalStorage & Offline
          </span>
          <button
            onClick={() => setIsBackupModalOpen(false)}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
