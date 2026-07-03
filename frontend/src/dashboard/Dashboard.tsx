import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { fetchCategories, fetchTransactions } from '../lib/api'
import { buildBalanceSeries, categoryBreakdown, periodTotals, totalBalance } from '../lib/aggregate'
import type { DashboardRange } from '../lib/aggregate'
import { IconInbox } from '../lib/icons'
import { BalanceCard } from './BalanceCard'
import { EvolutionChart } from './EvolutionChart'
import { CategoryBreakdown } from './CategoryBreakdown'
import { PortfolioPanel } from './PortfolioPanel'
import { QuickAddTransaction } from './QuickAddTransaction'
import './dashboard.css'

/**
 * Pantalla principal de Vesta Web (EP-W04): patrimonio total, evolución
 * temporal, gastos por categoría y el hueco reservado para la cartera.
 * Toda la agregación se hace en el cliente sobre `/api/transactions`: el
 * volumen de un uso personal no justifica todavía endpoints de agregación
 * en el backend.
 */
export function Dashboard() {
  const [range, setRange] = useState<DashboardRange>('1M')

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: fetchCategories })
  const transactionsQuery = useQuery({ queryKey: ['transactions'], queryFn: fetchTransactions })

  const loading = categoriesQuery.isLoading || transactionsQuery.isLoading
  const error = categoriesQuery.error ?? transactionsQuery.error

  const transactions = transactionsQuery.data ?? []
  const categories = categoriesQuery.data ?? []
  const isEmpty = !loading && !error && transactions.length === 0

  const balance = totalBalance(transactions)
  const totals = periodTotals(transactions, range)
  const series = buildBalanceSeries(transactions, range)
  const slices = categoryBreakdown(transactions, categories, range)

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <span className="dashboard__brand">Vesta Web</span>
          <h1>Patrimonio</h1>
        </div>
        {!error && !isEmpty && <QuickAddTransaction categories={categories} />}
      </header>

      {error ? (
        <div className="dashboard__error">
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
      ) : isEmpty ? (
        <div className="dashboard__empty">
          <IconInbox width={28} height={28} aria-hidden="true" />
          <h2>Todavía no hay movimientos</h2>
          <p>Registra tu primer ingreso o gasto para empezar a ver tu patrimonio aquí.</p>
          <QuickAddTransaction categories={categories} defaultOpen />
        </div>
      ) : (
        <>
          <BalanceCard balance={balance} periodNet={totals.net} loading={loading} />
          <EvolutionChart
            series={series}
            range={range}
            onRangeChange={setRange}
            loading={loading}
          />
          <div className="dashboard__grid">
            <CategoryBreakdown slices={slices} loading={loading} />
            <PortfolioPanel />
          </div>
        </>
      )}
    </div>
  )
}
