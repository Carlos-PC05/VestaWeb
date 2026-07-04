import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { fetchCategories, fetchTransactions } from '../lib/api'
import {
  RANGE_OPTIONS,
  buildBalanceSeries,
  categoryBreakdown,
  periodTotals,
  totalBalance,
  type DashboardRange,
} from '../lib/aggregate'
import { investedCapital, totalPnl, MOCK_ASSETS, costBasis } from '../lib/mockPortfolio'
import { formatCurrency, formatPercent } from '../lib/format'
import { IconInbox } from '../lib/icons'
import { LineChart } from '../charts/LineChart'
import { DonutChart } from '../charts/DonutChart'
import { RangeSelector } from '../charts/RangeSelector'
import { NewMovementButton } from '../app/NewMovementButton'
import { StatCard } from './StatCard'
import { RecentMovements } from './RecentMovements'
import './dashboard.css'

/**
 * Pantalla principal (EP-W04). Patrimonio = liquidez (movimientos reales) +
 * inversiones (mock, hasta que exista EP-W03). Stat-cards, gráfico de evolución
 * con selector de rango, donut de gastos por categoría y últimos movimientos.
 */
export function Dashboard() {
  const [range, setRange] = useState<DashboardRange>('6M')

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: fetchCategories })
  const transactionsQuery = useQuery({ queryKey: ['transactions'], queryFn: fetchTransactions })

  const loading = categoriesQuery.isLoading || transactionsQuery.isLoading
  const error = categoriesQuery.error ?? transactionsQuery.error
  const transactions = transactionsQuery.data ?? []
  const categories = categoriesQuery.data ?? []
  const isEmpty = !loading && !error && transactions.length === 0

  // Inversiones (mock) se suman como un colchón constante sobre la liquidez real.
  const invested = investedCapital()
  const investedCost = MOCK_ASSETS.reduce((sum, a) => sum + costBasis(a), 0)
  const liquid = totalBalance(transactions)
  const patrimonio = liquid + invested

  const totals = periodTotals(transactions, range)
  const series = buildBalanceSeries(transactions, range).map((p) => ({
    label: p.label,
    value: p.balance + invested,
  }))
  const patrimonioDelta =
    series.length > 1 && series[0].value !== 0
      ? (series[series.length - 1].value - series[0].value) / Math.abs(series[0].value)
      : 0

  const slices = categoryBreakdown(transactions, categories, range).map((s) => ({
    label: s.category?.name ?? 'Sin categoría',
    value: s.amount,
    color: s.category?.color ?? 'var(--muted)',
  }))

  if (error) {
    return (
      <div className="card state-block">
        <p>No se ha podido conectar con el backend. Comprueba que esté arrancado.</p>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            categoriesQuery.refetch()
            transactionsQuery.refetch()
          }}
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="card state-block">
        <IconInbox width={28} height={28} aria-hidden="true" />
        <h2>Todavía no hay movimientos</h2>
        <p>Registra tu primer ingreso o gasto para empezar a ver tu patrimonio aquí.</p>
        <NewMovementButton label="Registrar el primero" />
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="stat-row">
        <StatCard
          label="Total inversiones"
          value={invested}
          delta={investedCost > 0 ? totalPnl() / investedCost : undefined}
          caption="rentabilidad"
          loading={loading}
        />
        <StatCard label="Gastos del periodo" value={totals.expense} loading={loading} />
        <StatCard label="Ingresos del periodo" value={totals.income} loading={loading} />
      </div>

      <section className="card chart-card">
        <header className="chart-card__header">
          <div>
            <p className="chart-card__label">Patrimonio total</p>
            <p className="chart-card__value num">{formatCurrency(patrimonio)}</p>
            <p className="chart-card__delta num" data-tone={patrimonioDelta >= 0 ? 'positive' : 'negative'}>
              {patrimonioDelta >= 0 ? '+' : '−'}
              {formatPercent(Math.abs(patrimonioDelta))} en el periodo
            </p>
          </div>
          <RangeSelector
            options={RANGE_OPTIONS}
            value={range}
            onChange={setRange}
            ariaLabel="Rango temporal"
          />
        </header>

        {loading ? (
          <div className="skeleton skeleton-chart" />
        ) : (
          <LineChart points={series} formatValue={formatCurrency} ariaLabel="Evolución del patrimonio" />
        )}

        <footer className="chart-card__footer">
          <div>
            <span className="chart-card__foot-label">Liquidez</span>
            <span className="num">{formatCurrency(liquid)}</span>
          </div>
          <div>
            <span className="chart-card__foot-label">Inversiones</span>
            <span className="num">{formatCurrency(invested)}</span>
          </div>
        </footer>
      </section>

      <div className="dashboard__grid">
        <section className="card">
          <header className="card__header">
            <h2>Gastos por categoría</h2>
          </header>
          {loading ? (
            <div className="skeleton skeleton-chart" />
          ) : slices.length === 0 ? (
            <p className="card__empty">Sin gastos en este rango todavía.</p>
          ) : (
            <DonutChart slices={slices} formatValue={formatCurrency} centerLabel="Total" />
          )}
        </section>

        <RecentMovements transactions={transactions} categories={categories} loading={loading} />
      </div>
    </div>
  )
}
