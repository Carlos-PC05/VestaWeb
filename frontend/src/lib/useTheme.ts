import { useSyncExternalStore } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'vesta-theme'

function readPreference(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
}

const prefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches

/**
 * Resuelve una preferencia de tema a un tema concreto, consultando la
 * preferencia del sistema operativo cuando la preferencia es `'system'`.
 *
 * @param pref - Preferencia de tema guardada por el usuario.
 * @returns Tema resuelto (`'light'` o `'dark'`) a aplicar en la UI.
 */
export function resolveTheme(pref: ThemePreference): ResolvedTheme {
  if (pref === 'system') return prefersDark() ? 'dark' : 'light'
  return pref
}

/**
 * Aplica el tema resuelto al documento escribiendo `data-theme` en `<html>`,
 * que es lo que los tokens semánticos de `index.css` leen para cambiar de paleta.
 *
 * @param pref - Preferencia de tema a resolver y aplicar.
 */
export function applyTheme(pref: ThemePreference): void {
  document.documentElement.dataset.theme = resolveTheme(pref)
}

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
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
 * Hook de preferencia de tema con persistencia en `localStorage` y
 * suscripción a cambios del tema del sistema operativo (vía
 * `useSyncExternalStore`), para que la UI se actualice sola si el usuario
 * tiene la preferencia en `'system'` y cambia el tema del SO.
 *
 * @returns La preferencia guardada, el tema resuelto actual, y un setter
 *   que persiste la nueva preferencia y la aplica de inmediato.
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
