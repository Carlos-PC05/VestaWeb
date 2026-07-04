import { useTheme, type ThemePreference } from '../lib/useTheme'
import './settings.css'

const THEME_OPTIONS: { value: ThemePreference; label: string; hint: string }[] = [
  { value: 'light', label: 'Claro', hint: 'Fondo claro siempre' },
  { value: 'dark', label: 'Oscuro', hint: 'Fondo oscuro siempre' },
  { value: 'system', label: 'Automático', hint: 'Según tu sistema' },
]

/**
 * Ajustes (EP-W05, versión mínima). De momento solo la preferencia de tema
 * (HU-W05.02); la moneda principal y el resto de preferencias llegan cuando se
 * construya la épica completa.
 */
export function Settings() {
  const { preference, setPreference } = useTheme()

  return (
    <div className="settings">
      <section className="card">
        <header className="card__header">
          <h2>Apariencia</h2>
        </header>
        <p className="settings__desc">Elige cómo se ve Vesta Web.</p>
        <div className="settings__theme">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className="settings__theme-option"
              aria-pressed={preference === option.value}
              onClick={() => setPreference(option.value)}
            >
              <span className="settings__theme-label">{option.label}</span>
              <span className="settings__theme-hint">{option.hint}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <header className="card__header">
          <h2>Moneda principal</h2>
        </header>
        <p className="settings__desc">
          Disponible cuando se complete la configuración de preferencias. Por ahora, todos los
          importes se muestran en euros (EUR).
        </p>
      </section>
    </div>
  )
}
