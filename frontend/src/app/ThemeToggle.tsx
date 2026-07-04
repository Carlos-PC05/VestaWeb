import { useTheme, type ThemePreference } from '../lib/useTheme'
import { IconMonitor, IconMoon, IconSun } from '../lib/icons'

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof IconSun }[] = [
  { value: 'light', label: 'Tema claro', Icon: IconSun },
  { value: 'dark', label: 'Tema oscuro', Icon: IconMoon },
  { value: 'system', label: 'Según el sistema', Icon: IconMonitor },
]

/**
 * Conmutador de tema (claro / oscuro / sistema) para la barra superior.
 * Un grupo segmentado de tres botones; el activo refleja la preferencia
 * guardada, no el tema resuelto, para que "sistema" sea distinguible.
 */
export function ThemeToggle() {
  const { preference, setPreference } = useTheme()

  return (
    <div className="theme-toggle" role="group" aria-label="Tema de la interfaz">
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          className="theme-toggle__option"
          aria-pressed={preference === value}
          title={label}
          aria-label={label}
          onClick={() => setPreference(value)}
        >
          <Icon width={16} height={16} aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}
