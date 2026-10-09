import React, { useState, useEffect, useMemo } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext.tsx';
import { Header } from './components/common/Header.tsx';
import { Footer } from './components/common/Footer.tsx';
import { ProfileModal } from './components/common/ProfileModal.tsx';
import { CategoryModal } from './components/common/CategoryModal.tsx';
import { ConfirmModal } from './components/common/ConfirmModal.tsx';
import { MenuCompletoModal } from './components/common/MenuCompletoModal.tsx';
import { ReportModal } from './components/common/ReportModal.tsx';
import { OfflineBanner } from './components/common/OfflineBanner.tsx';
import { ConnectionToasts } from './components/common/ConnectionToasts.tsx';
import { OfflineStatusModal } from './components/common/OfflineStatusModal.tsx';
import { BackupModal } from './components/common/BackupModal.tsx';
import {
  DuePaymentAlertModal,
  calculateDiffDays,
} from './components/common/DuePaymentAlertModal.tsx';
import { DuePaymentFloatingAlert } from './components/common/DuePaymentFloatingAlert.tsx';
import { ArrowLeft, Menu } from 'lucide-react';

// Modules
import { DashboardModule } from './components/dashboard/DashboardModule.tsx';
import { IncomeModule } from './components/income/IncomeModule.tsx';
import { ExpenseModule } from './components/expense/ExpenseModule.tsx';
import { PendingModule } from './components/pending/PendingModule.tsx';
import { DebtsModule } from './components/debts/DebtsModule.tsx';
import { ReceivablesModule } from './components/receivables/ReceivablesModule.tsx';
import { ChartsModule } from './components/charts/ChartsModule.tsx';

const AppContent: React.FC = () => {
  const { data, activeModule, setActiveModule, resetAllData } = useFinance();

  // Modals state
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [menuCompletoOpen, setMenuCompletoOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [dueAlertOpen, setDueAlertOpen] = useState(false);
  const [hasCheckedDueOnLoad, setHasCheckedDueOnLoad] = useState(false);

  // Monitor pending payments due soon or overdue (diffDays <= 3)
  const { dueCount, overdueCount, dueTodayCount } = useMemo(() => {
    let total = 0;
    let overdue = 0;
    let today = 0;

    // 1. Pending Expenses
    data.expenses.forEach((e) => {
      if (e.status === 'pendiente') {
        const dueDate = e.dueDate || e.date;
        const diff = calculateDiffDays(dueDate);
        if (diff <= 3) {
          total++;
          if (diff < 0) overdue++;
          if (diff === 0) today++;
        }
      }
    });

    // 2. Active Debts
    data.debts.forEach((d) => {
      if (d.status === 'activa') {
        const paidSoFar = d.payments.reduce((acc, p) => acc + p.amountUSD, 0);
        if (d.totalAmountUSD - paidSoFar > 0.01) {
          const dueDate = d.dueDate || d.date;
          const diff = calculateDiffDays(dueDate);
          if (diff <= 3) {
            total++;
            if (diff < 0) overdue++;
            if (diff === 0) today++;
          }
        }
      }
    });

    return { dueCount: total, overdueCount: overdue, dueTodayCount: today };
  }, [data.expenses, data.debts]);

  // Alerta emergente automática al detectar pagos por vencer o vencidos
  useEffect(() => {
    if (dueCount > 0 && !hasCheckedDueOnLoad) {
      setHasCheckedDueOnLoad(true);
      try {
        const dismissedTime = sessionStorage.getItem('dismissed_due_alert_time');
        if (dismissedTime && Date.now() < parseInt(dismissedTime, 10)) {
          return; // Still in snooze window
        }
      } catch {
        // ignore
      }
      // Mostrar mensaje emergente automáticamente tras breve retardo para suavidad visual
      const timer = setTimeout(() => {
        setDueAlertOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [dueCount, hasCheckedDueOnLoad]);

  const getModuleTitle = () => {
    switch (activeModule) {
      case 'ingresos':
        return 'Módulo de Ingresos';
      case 'egresos':
        return 'Módulo de Egresos';
      case 'pendientes':
        return 'Gastos Pendientes por Pagar';
      case 'deudas':
        return 'Control de Deudas & Acreedores';
      case 'cobrar':
        return 'Cuentas por Cobrar & Clientes';
      case 'graficos':
        return 'Gráficos & Análisis Financiero';
      default:
        return 'Inicio (Dashboard General)';
    }
  };

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'inicio':
        return (
          <DashboardModule
            onOpenProfile={() => setProfileModalOpen(true)}
            onOpenResetModal={() => setResetModalOpen(true)}
            onOpenMenuCompleto={() => setMenuCompletoOpen(true)}
            onOpenReport={() => setReportModalOpen(true)}
          />
        );
      case 'ingresos':
        return <IncomeModule onOpenCategories={() => setCategoryModalOpen(true)} />;
      case 'egresos':
        return <ExpenseModule onOpenCategories={() => setCategoryModalOpen(true)} />;
      case 'pendientes':
        return <PendingModule />;
      case 'deudas':
        return <DebtsModule />;
      case 'cobrar':
        return <ReceivablesModule />;
      case 'graficos':
        return <ChartsModule />;
      default:
        return (
          <DashboardModule
            onOpenProfile={() => setProfileModalOpen(true)}
            onOpenResetModal={() => setResetModalOpen(true)}
            onOpenMenuCompleto={() => setMenuCompletoOpen(true)}
            onOpenReport={() => setReportModalOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-neutral-100 flex flex-col selection:bg-[#FFD700] selection:text-black">
      {/* Header con botón de Menú Completo y campana de Alerta de Pagos */}
      <Header
        onOpenMenuCompleto={() => setMenuCompletoOpen(true)}
        onGoToInicio={() => setActiveModule('inicio')}
        onOpenDueAlert={() => setDueAlertOpen(true)}
        dueCount={dueCount}
      />

      {/* Indicador visual y de alerta cuando no hay conexión */}
      <OfflineBanner />

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col w-full">
        {/* Module Canvas with padding */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-16">
          {/* Submodule Header with Return to Inicio button if not on home */}
          {activeModule !== 'inicio' && (
            <div className="mb-6 flex items-center justify-between gap-3 bg-[#1A1A1A] border border-neutral-800 rounded-2xl p-3.5 sm:px-5 shadow-lg">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveModule('inicio')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors cursor-pointer border border-neutral-700/60"
                  title="Regresar a la pantalla de Inicio"
                >
                  <ArrowLeft className="w-4 h-4 text-[#FFD700]" />
                  <span>Volver a Inicio</span>
                </button>
                <div className="h-4 w-px bg-neutral-700 hidden sm:block" />
                <span className="text-xs sm:text-sm font-bold text-white">
                  {getModuleTitle()}
                </span>
              </div>

              <button
                onClick={() => setMenuCompletoOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 text-[#FFD700] text-xs font-bold border border-yellow-500/30 transition-colors cursor-pointer"
              >
                <Menu className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cambiar Módulo</span>
              </button>
            </div>
          )}

          {renderActiveModule()}
        </main>

        {/* Mandatory Footer visible on ALL modules and screens */}
        <Footer />
      </div>

      {/* Shared Modals */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />

      <CategoryModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
      />

      <MenuCompletoModal
        isOpen={menuCompletoOpen}
        onClose={() => setMenuCompletoOpen(false)}
        onOpenProfile={() => setProfileModalOpen(true)}
        onOpenCategories={() => setCategoryModalOpen(true)}
        onOpenResetModal={() => setResetModalOpen(true)}
        onOpenReport={() => setReportModalOpen(true)}
      />

      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />

      <ConfirmModal
        isOpen={resetModalOpen}
        title="¿Reiniciar y limpiar todo el sistema?"
        message="Esta acción restablecerá todos tus registros (ingresos, egresos, pendientes, deudas y cuentas por cobrar) a cero. Esta acción es irreversible."
        confirmText="Sí, reiniciar todo"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={resetAllData}
        onClose={() => setResetModalOpen(false)}
      />

      {/* Modal de Estado de Red & Almacenamiento Local (LocalStorage) */}
      <OfflineStatusModal />

      {/* Modal de Copia de Seguridad & Restauración (JSON) */}
      <BackupModal />

      {/* Notificaciones flotantes al cambiar estado de conexión */}
      <ConnectionToasts />

      {/* Mensaje Emergente: Alerta de Pagos Pendientes Próximos a Vencer */}
      <DuePaymentAlertModal
        isOpen={dueAlertOpen}
        onClose={() => setDueAlertOpen(false)}
      />

      {/* Notificación flotante emergente cuando no está abierto el modal */}
      {!dueAlertOpen && (
        <DuePaymentFloatingAlert
          dueCount={dueCount}
          overdueCount={overdueCount}
          dueTodayCount={dueTodayCount}
          onOpenModal={() => setDueAlertOpen(true)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}
