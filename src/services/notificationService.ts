/**
 * Servicio de Notificaciones del Sistema y Navegador (Web Notifications API)
 * Permite alertar al usuario sobre pagos pendientes incluso cuando la aplicación
 * no está en primer plano (minimizada, en otra pestaña o en segundo plano).
 */

import { ExpenseItem, DebtItem } from '../types/finance';
import { calculateDiffDays } from '../components/common/DuePaymentAlertModal';

const NOTIFICATIONS_ENABLED_KEY = 'tu_dinero_sys_notifications_enabled';
const LAST_NOTIFIED_TIMESTAMP_KEY = 'tu_dinero_last_notified_timestamp';
// Tiempo mínimo entre notificaciones automáticas para no saturar al usuario (2 horas)
const COOLDOWN_MS = 2 * 60 * 60 * 1000;

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export interface PendingPaymentsSummary {
  dueCount: number;
  overdueCount: number;
  dueTodayCount: number;
  totalPendingUSD: number;
  urgentItems: Array<{
    title: string;
    amountUSD: number;
    daysLeft: number;
    isOverdue: boolean;
  }>;
}

/**
 * Verifica si las notificaciones están soportadas por el navegador
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Obtiene el estado actual del permiso de notificaciones
 */
export function getNotificationPermission(): NotificationPermissionStatus {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission as NotificationPermissionStatus;
}

/**
 * Verifica si el usuario ha habilitado voluntariamente las notificaciones en la app
 */
export function isUserNotificationsEnabled(): boolean {
  try {
    const val = localStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
    if (val === null) return true; // Habilitado por defecto si concede permiso
    return val === 'true';
  } catch {
    return true;
  }
}

/**
 * Guarda la preferencia del usuario sobre notificaciones
 */
export function setUserNotificationsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch {
    // ignore
  }
}

/**
 * Solicita permiso al usuario para enviar notificaciones del sistema
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (!isNotificationSupported()) return 'unsupported';

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setUserNotificationsEnabled(true);
    }
    return permission as NotificationPermissionStatus;
  } catch (error) {
    console.error('Error al solicitar permiso de notificaciones:', error);
    return 'denied';
  }
}

/**
 * Envía una notificación del sistema
 */
export async function sendSystemNotification(
  title: string,
  options: NotificationOptions & { onNotificationClick?: () => void }
): Promise<Notification | null> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  const { onNotificationClick, ...restOptions } = options;

  const defaultOptions: NotificationOptions = {
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'tu-dinero-payment-alert', // Agrupa para no duplicar múltiples alertas
    ...restOptions,
  };

  try {
    // Si hay un Service Worker registrado y activo, intentamos usar showNotification
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, defaultOptions);
        return null;
      }
    }

    // Instancia estándar de Notification
    const notification = new Notification(title, defaultOptions);

    notification.onclick = (event) => {
      event.preventDefault();
      try {
        window.focus();
      } catch {
        // ignore
      }
      if (onNotificationClick) {
        onNotificationClick();
      }
      // Disparar evento personalizado para que la app cambie al módulo de pendientes
      window.dispatchEvent(new CustomEvent('tu-dinero:open-pending-module'));
      notification.close();
    };

    return notification;
  } catch (error) {
    console.warn('Fallo al disparar notificación del sistema:', error);
    return null;
  }
}

/**
 * Analiza los egresos y deudas y genera el resumen de pagos urgentes
 */
export function analyzePendingPayments(
  expenses: ExpenseItem[],
  debts: DebtItem[]
): PendingPaymentsSummary {
  let dueCount = 0;
  let overdueCount = 0;
  let dueTodayCount = 0;
  let totalPendingUSD = 0;
  const urgentItems: PendingPaymentsSummary['urgentItems'] = [];

  // 1. Gastos pendientes
  expenses.forEach((e) => {
    if (e.status === 'pendiente') {
      const dueDate = e.dueDate || e.date;
      const diff = calculateDiffDays(dueDate);
      if (diff <= 3) {
        dueCount++;
        totalPendingUSD += e.amountUSD;
        if (diff < 0) overdueCount++;
        if (diff === 0) dueTodayCount++;
        urgentItems.push({
          title: e.description,
          amountUSD: e.amountUSD,
          daysLeft: diff,
          isOverdue: diff < 0,
        });
      }
    }
  });

  // 2. Deudas activas
  debts.forEach((d) => {
    if (d.status === 'activa') {
      const paidSoFar = d.payments?.reduce((acc, p) => acc + p.amountUSD, 0) || 0;
      const remaining = d.totalAmountUSD - paidSoFar;
      if (remaining > 0.01) {
        const dueDate = d.dueDate || d.date;
        const diff = calculateDiffDays(dueDate);
        if (diff <= 3) {
          dueCount++;
          totalPendingUSD += remaining;
          if (diff < 0) overdueCount++;
          if (diff === 0) dueTodayCount++;
          urgentItems.push({
            title: `Deuda: ${d.creditor}`,
            amountUSD: remaining,
            daysLeft: diff,
            isOverdue: diff < 0,
          });
        }
      }
    }
  });

  urgentItems.sort((a, b) => a.daysLeft - b.daysLeft);

  return {
    dueCount,
    overdueCount,
    dueTodayCount,
    totalPendingUSD,
    urgentItems,
  };
}

/**
 * Notifica al usuario en segundo plano cuando hay pagos urgentes,
 * respetando el tiempo de cooldown para no saturar.
 */
export function checkAndNotifyBackgroundPayments(
  expenses: ExpenseItem[],
  debts: DebtItem[],
  force: boolean = false
): boolean {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  if (!isUserNotificationsEnabled()) {
    return false;
  }

  const summary = analyzePendingPayments(expenses, debts);
  if (summary.dueCount === 0) {
    return false;
  }

  // Comprobar cooldown si no se fuerza
  if (!force) {
    try {
      const lastStr = localStorage.getItem(LAST_NOTIFIED_TIMESTAMP_KEY);
      if (lastStr) {
        const last = parseInt(lastStr, 10);
        if (Date.now() - last < COOLDOWN_MS) {
          return false; // Aún en periodo de espera
        }
      }
    } catch {
      // ignore
    }
  }

  // Redactar mensaje claro y prioritario
  let title = '⚠️ Alerta de Pagos Pendientes - Tu Dinero';
  if (summary.overdueCount > 0) {
    title = `🚨 ¡Atención! Tienes ${summary.overdueCount} pago${summary.overdueCount > 1 ? 's' : ''} vencido${summary.overdueCount > 1 ? 's' : ''}`;
  } else if (summary.dueTodayCount > 0) {
    title = `🔔 Tienes ${summary.dueTodayCount} pago${summary.dueTodayCount > 1 ? 's' : ''} que vence${summary.dueTodayCount > 1 ? 'n' : ''} hoy`;
  }

  const topItemsText = summary.urgentItems
    .slice(0, 2)
    .map((item) => `${item.title} ($${item.amountUSD.toFixed(2)})`)
    .join(', ');

  const body =
    `Tienes ${summary.dueCount} compromiso${summary.dueCount > 1 ? 's' : ''} por un total de $${summary.totalPendingUSD.toFixed(2)}. ` +
    (topItemsText ? `(${topItemsText}) ` : '') +
    `Haz clic aquí para revisar y pagar.`;

  sendSystemNotification(title, {
    body,
    requireInteraction: summary.overdueCount > 0, // Si está vencido, requiere interacción
  });

  try {
    localStorage.setItem(LAST_NOTIFIED_TIMESTAMP_KEY, Date.now().toString());
  } catch {
    // ignore
  }

  return true;
}

/**
 * Dispara una notificación de prueba instantánea para verificar que el sistema operativo
 * y el navegador permiten mostrar alertas.
 */
export async function sendTestNotification(): Promise<boolean> {
  let perm = getNotificationPermission();
  if (perm !== 'granted') {
    perm = await requestNotificationPermission();
    if (perm !== 'granted') return false;
  }

  sendSystemNotification('🔔 Notificaciones del Sistema Activadas', {
    body: '¡Perfecto! El sistema te alertará automáticamente sobre pagos pendientes y vencimientos aunque la aplicación esté en segundo plano.',
  });

  return true;
}
