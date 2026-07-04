import { useSyncExternalStore } from 'react'

/**
 * Gestión del tema claro/oscuro (HU-W05.02). El usuario elige entre seguir el
 * sistema o forzar claro/oscuro; la preferencia se persiste en `localStorage`.
 * El tema resuelto se aplica como `data-theme` en `<html>`; el CSS
 * (`index.css`) hace el resto vía tokens semánticos.
 */
export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'vesta-theme'

/** Lee la preferencia guardada; 'system' si no hay nada válido. */
function readPreference(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
}

const prefersDark = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches

/** Resuelve la preferencia a un tema concreto teniendo en cuenta el sistema. */
export function resolveTheme(pref: ThemePreference): ResolvedTheme {
  if (pref === 'system') return prefersDark() ? 'dark' : 'light'
  return pref
}

/** Aplica el tema resuelto al elemento raíz. Idempotente. */
export function applyTheme(pref: ThemePreference): void {
  document.documentElement.dataset.theme = resolveTheme(pref)
}

// --- Store mínimo para `useSyncExternalStore` (sin dependencia de estado global) ---

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  // Si la preferencia es 'system', reaccionar a los cambios del SO.
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const onSystemChange = () => {
    if (readPreference() === 'system') {
      applyTheme('system')
      emit()
    }
  }
  media.addEventListener('change', onSystemChange)
  return () => {
    listeners.delete(listener)
    media.removeEventListener('change', onSystemChange)
  }
}

/**
 * Hook de tema. Devuelve la preferencia actual, el tema resuelto y un setter
 * que persiste, aplica al DOM y notifica a los suscriptores.
 */
export function useTheme() {
  const preference = useSyncExternalStore(subscribe, readPreference, () => 'system' as ThemePreference)

  const setPreference = (pref: ThemePreference) => {
    localStorage.setItem(STORAGE_KEY, pref)
    applyTheme(pref)
    emit()
  }

  return { preference, resolved: resolveTheme(preference), setPreference }
}
