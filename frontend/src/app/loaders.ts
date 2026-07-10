/**
 * Loaders de react-router de cada pantalla. Viven separados de los
 * componentes para que el fast refresh de Vite funcione (un fichero de
 * componente solo debe exportar componentes). Cada loader trae en paralelo
 * lo mínimo que necesita su pantalla.
 */
import type { LoaderFunctionArgs } from 'react-router-dom'
import {
  fetchAsset,
  fetchAssets,
  fetchAssetTxs,
  fetchCategories,
  fetchMovements,
  groupTxsByAsset,
} from '../lib/api'

/** Dashboard: movimientos, categorías y cartera completa. */
export async function dashboardLoader() {
  const [categories, movements, assets, txs] = await Promise.all([
    fetchCategories(),
    fetchMovements(),
    fetchAssets(),
    fetchAssetTxs(),
  ])
  return { categories, movements, assets, txsByAsset: groupTxsByAsset(txs) }
}
export type DashboardData = Awaited<ReturnType<typeof dashboardLoader>>

/** Movimientos: listado completo y categorías; el filtro por mes es de cliente. */
export async function movimientosLoader() {
  const [categories, movements] = await Promise.all([fetchCategories(), fetchMovements()])
  return { categories, movements }
}
export type MovimientosData = Awaited<ReturnType<typeof movimientosLoader>>

/** Cartera: activos y todas sus operaciones, agrupadas por activo. */
export async function carteraLoader() {
  const [assets, txs] = await Promise.all([fetchAssets(), fetchAssetTxs()])
  return { assets, txsByAsset: groupTxsByAsset(txs) }
}
export type CarteraData = Awaited<ReturnType<typeof carteraLoader>>

/** Detalle de activo: el activo de la ruta y su historial. Un id inexistente lanza 404. */
export async function assetDetailLoader({ params }: LoaderFunctionArgs) {
  const id = Number(params.id)
  const [asset, txs] = await Promise.all([fetchAsset(id), fetchAssetTxs(id)])
  return { asset, txs }
}
export type AssetDetailData = Awaited<ReturnType<typeof assetDetailLoader>>
