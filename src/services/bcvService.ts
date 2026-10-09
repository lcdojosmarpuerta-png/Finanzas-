export interface BCVFetchResult {
  rate: number;
  date: string;
  source: string;
  success: boolean;
  error?: string;
}

const DEFAULT_BCV_RATE = 71.45; // Reasonable current official BCV exchange rate

export async function fetchLiveBCVRate(): Promise<BCVFetchResult> {
  // If the browser is definitely offline, return immediately without waiting for timeouts
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      rate: DEFAULT_BCV_RATE,
      date: new Date().toISOString(),
      source: 'Almacenamiento Local (Modo Sin Conexión)',
      success: false,
      error: 'Dispositivo sin conexión a internet. Manteniendo la tasa guardada en el dispositivo.',
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  // Attempt 1: DolarApi Venezuela
  try {
    const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
      signal: controller.signal,
    });
    if (res.ok) {
      const data = await res.json();
      clearTimeout(timeoutId);
      if (data && typeof data.promedio === 'number' && data.promedio > 0) {
        return {
          rate: Number(data.promedio.toFixed(4)),
          date: data.fechaActualizacion || new Date().toISOString(),
          source: 'DolarApi Oficial (BCV)',
          success: true,
        };
      }
    }
  } catch (err) {
    console.warn('First BCV API attempt failed, trying fallback source...', err);
  }

  // Attempt 2: PyDolarVe API
  try {
    const controller2 = new AbortController();
    const timeoutId2 = setTimeout(() => controller2.abort(), 5000);
    const res = await fetch('https://pydolarve.org/api/v1/dollar?page=bcv', {
      signal: controller2.signal,
    });
    clearTimeout(timeoutId2);
    if (res.ok) {
      const data = await res.json();
      const bcv = data?.monitors?.usd?.price;
      if (typeof bcv === 'number' && bcv > 0) {
        return {
          rate: Number(bcv.toFixed(4)),
          date: new Date().toISOString(),
          source: 'PyDolarVe (BCV)',
          success: true,
        };
      }
    }
  } catch (err) {
    console.warn('Second BCV API attempt failed:', err);
  }

  clearTimeout(timeoutId);
  return {
    rate: DEFAULT_BCV_RATE,
    date: new Date().toISOString(),
    source: 'Tasa Referencial Predeterminada',
    success: false,
    error: 'No se pudo conectar a la red de tasas en tiempo real. Puede ajustar la tasa manualmente.',
  };
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export function formatBs(amountBs: number): string {
  const formatted = new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountBs || 0);
  return `Bs. ${formatted}`;
}

export function calcBs(amountUSD: number, rate: number): number {
  return (amountUSD || 0) * (rate || 0);
}
