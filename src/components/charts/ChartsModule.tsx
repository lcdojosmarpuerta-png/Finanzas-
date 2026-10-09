import React, { useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  Activity,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { formatUSD, formatBs, calcBs } from '../../services/bcvService.ts';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement
);

export const ChartsModule: React.FC = () => {
  const {
    data,
    bcvRate,
    totalIncomeUSD,
    totalExpensesPaidUSD,
    totalExpensesPendingUSD,
    totalDebtsRemainingUSD,
    totalReceivablesPendingUSD,
    totalReceivablesPaidUSD,
    netAvailableBalanceUSD,
    getCategoryById,
  } = useFinance();

  const [activeCategoryView, setActiveCategoryView] = useState<'expenses' | 'incomes'>('expenses');

  // Chart 1: Donut Ingresos vs Egresos Pagados vs Saldo
  const incomeVsExpenseData = {
    labels: ['Ingresos Acumulados', 'Egresos Pagados'],
    datasets: [
      {
        data: [Math.max(0, totalIncomeUSD), Math.max(0, totalExpensesPaidUSD)],
        backgroundColor: ['#2ECC71', '#E74C3C'],
        borderColor: ['#1E1E1E', '#1E1E1E'],
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#e5e5e5',
          font: { family: 'Plus Jakarta Sans', size: 12 },
          padding: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const val = context.raw || 0;
            return ` ${context.label}: ${formatUSD(val)} (${formatBs(calcBs(val, bcvRate))})`;
          },
        },
      },
    },
    cutout: '70%',
  };

  // Chart 2: Comparativo de Compromisos (Deudas, Pendientes y CxC)
  const barData = {
    labels: [
      'Deudas Activas',
      'Egresos Pendientes',
      'CxC Pendientes',
      'CxC Cobradas',
    ],
    datasets: [
      {
        label: 'Monto en USD ($)',
        data: [
          totalDebtsRemainingUSD,
          totalExpensesPendingUSD,
          totalReceivablesPendingUSD,
          totalReceivablesPaidUSD,
        ],
        backgroundColor: [
          '#E74C3C', // Red for debt
          '#F39C12', // Orange for pending
          '#3498DB', // Blue for pending receivables
          '#2ECC71', // Green for paid receivables
        ],
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const val = context.raw || 0;
            return ` Monto: ${formatUSD(val)} · ${formatBs(calcBs(val, bcvRate))}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#a3a3a3', font: { size: 11 } },
      },
      y: {
        grid: { color: '#262626' },
        ticks: {
          color: '#a3a3a3',
          callback: (value: any) => `$${value}`,
          font: { size: 11 },
        },
      },
    },
  };

  // Chart 3: Category breakdown
  const categoryMap = new Map<string, number>();
  if (activeCategoryView === 'expenses') {
    data.expenses.forEach((e) => {
      const cat = getCategoryById(e.categoryId);
      const name = cat ? cat.name : 'Otros';
      categoryMap.set(name, (categoryMap.get(name) || 0) + e.amountUSD);
    });
  } else {
    data.incomes.forEach((i) => {
      const cat = getCategoryById(i.categoryId);
      const name = cat ? cat.name : 'Otros';
      categoryMap.set(name, (categoryMap.get(name) || 0) + i.amountUSD);
    });
  }

  const categoryLabels = Array.from(categoryMap.keys());
  const categoryValues = Array.from(categoryMap.values());
  const categoryColors = [
    '#FFD700',
    '#2ECC71',
    '#E74C3C',
    '#3498DB',
    '#9B59B6',
    '#E67E22',
    '#1ABC9C',
    '#F1C40F',
    '#E84393',
    '#00CEC9',
  ];

  const categoryChartData = {
    labels: categoryLabels.length > 0 ? categoryLabels : ['Sin registros'],
    datasets: [
      {
        data: categoryValues.length > 0 ? categoryValues : [1],
        backgroundColor: categoryColors.slice(0, Math.max(1, categoryLabels.length)),
        borderColor: '#1E1E1E',
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Top Banner KPI */}
      <div className="bg-[#1E1E1E] border border-neutral-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-yellow-500/15 text-[#FFD700] border border-yellow-500/30 flex items-center justify-center shrink-0">
            <PieIcon className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
              Métricas & Análisis Financiero
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Rendimiento, Proporciones y Compromisos
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Tasa oficial activa: <strong className="text-[#FFD700] font-mono">Bs. {bcvRate.toFixed(2)} ($)</strong>
            </p>
          </div>
        </div>

        {/* Quick summary pill */}
        <div className="bg-[#141414] border border-neutral-800 rounded-xl p-3 flex items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-neutral-400 text-[10px] block">Margen Neto</span>
            <span
              className={`font-bold text-sm ${
                netAvailableBalanceUSD >= 0 ? 'text-[#2ECC71]' : 'text-[#E74C3C]'
              }`}
            >
              {totalIncomeUSD > 0
                ? `${Math.round((netAvailableBalanceUSD / totalIncomeUSD) * 100)}%`
                : '0%'}
            </span>
          </div>
          <div className="h-6 w-[1px] bg-neutral-800" />
          <div>
            <span className="text-neutral-400 text-[10px] block">Saldo Neto</span>
            <span className="font-bold text-white text-sm">
              {formatUSD(netAvailableBalanceUSD)}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Donut + Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Pastel / Dona Ingresos vs Egresos */}
        <div className="bg-[#1E1E1E] border border-neutral-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="pb-3 border-b border-neutral-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-[#FFD700]" />
                Distribución: Ingresos vs Egresos Pagados
              </h3>
              <p className="text-xs text-neutral-400">
                Relación porcentual de flujo de dinero
              </p>
            </div>
          </div>

          <div className="h-64 relative my-4 flex items-center justify-center">
            {totalIncomeUSD === 0 && totalExpensesPaidUSD === 0 ? (
              <p className="text-xs text-neutral-500 text-center">
                No hay transacciones suficientes para generar la gráfica
              </p>
            ) : (
              <Doughnut data={incomeVsExpenseData} options={donutOptions} />
            )}
          </div>

          <div className="pt-3 border-t border-neutral-800/80 grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-2 bg-[#121212] rounded-xl border border-neutral-800">
              <span className="text-neutral-400 text-[11px] block">Ingresos</span>
              <span className="font-mono text-[#2ECC71] font-bold">
                {formatUSD(totalIncomeUSD)}
              </span>
            </div>
            <div className="p-2 bg-[#121212] rounded-xl border border-neutral-800">
              <span className="text-neutral-400 text-[11px] block">Egresos Pagados</span>
              <span className="font-mono text-[#E74C3C] font-bold">
                {formatUSD(totalExpensesPaidUSD)}
              </span>
            </div>
          </div>
        </div>

        {/* Gráfico 2: Barras Comparativas */}
        <div className="bg-[#1E1E1E] border border-neutral-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="pb-3 border-b border-neutral-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#3498DB]" />
                Comparativo: Deudas, Pendientes y CxC
              </h3>
              <p className="text-xs text-neutral-400">
                Obligaciones vs Cuentas a favor
              </p>
            </div>
          </div>

          <div className="h-64 my-4">
            <Bar data={barData} options={barOptions} />
          </div>

          <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
            <span>Total Pasivos: {formatUSD(totalDebtsRemainingUSD + totalExpensesPendingUSD)}</span>
            <span>Total CxC: {formatUSD(totalReceivablesPendingUSD + totalReceivablesPaidUSD)}</span>
          </div>
        </div>
      </div>

      {/* Gráfico 3: Distribución por Categorías */}
      <div className="bg-[#1E1E1E] border border-neutral-800 rounded-2xl p-5 shadow-xl">
        <div className="pb-3 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#2ECC71]" />
              Desglose y Tendencias por Categoría
            </h3>
            <p className="text-xs text-neutral-400">
              Visualiza en qué rubros se concentran tus movimientos
            </p>
          </div>

          <div className="flex rounded-xl bg-[#121212] p-1 border border-neutral-800">
            <button
              onClick={() => setActiveCategoryView('expenses')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                activeCategoryView === 'expenses'
                  ? 'bg-[#E74C3C]/20 text-[#E74C3C] border border-[#E74C3C]/40'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Categorías de Egresos
            </button>
            <button
              onClick={() => setActiveCategoryView('incomes')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                activeCategoryView === 'incomes'
                  ? 'bg-[#2ECC71]/20 text-[#2ECC71] border border-[#2ECC71]/40'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Categorías de Ingresos
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 items-center">
          <div className="h-64 md:col-span-1 flex items-center justify-center">
            {categoryLabels.length === 0 ? (
              <p className="text-xs text-neutral-500">Sin datos de categorías</p>
            ) : (
              <Doughnut
                data={categoryChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  cutout: '60%',
                }}
              />
            )}
          </div>

          <div className="md:col-span-2 space-y-2 max-h-64 overflow-y-auto pr-2">
            {categoryLabels.length === 0 ? (
              <p className="text-xs text-neutral-500 text-center py-8">
                No hay movimientos para mostrar en esta sección
              </p>
            ) : (
              categoryLabels.map((name, i) => {
                const val = categoryValues[i] || 0;
                const total = categoryValues.reduce((a, b) => a + b, 0) || 1;
                const pct = Math.round((val / total) * 100);
                const color = categoryColors[i % categoryColors.length];

                return (
                  <div
                    key={name}
                    className="p-2.5 rounded-xl bg-[#141414] border border-neutral-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-medium text-white truncate">{name}</span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 font-mono">
                      <span className="text-neutral-400 text-[11px]">{pct}%</span>
                      <div className="text-right">
                        <span className="font-bold text-white block">{formatUSD(val)}</span>
                        <span className="text-[10px] text-[#FFD700]">
                          {formatBs(calcBs(val, bcvRate))}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
