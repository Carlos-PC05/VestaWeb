import { useEffect, useRef, type ReactNode } from 'react'
import { IconClose } from '../lib/icons'

/**
 * Modal sobre `<dialog>` nativo: focus trap, tecla Escape y capa superior
 * gratis del navegador. Se monta solo mientras está abierto (el padre lo
 * renderiza condicionalmente), así cada apertura arranca con el formulario
 * limpio.
 *
 * @param title - Título de la cabecera del modal.
 * @param onClose - Invocado al cerrar (Escape, botón de cierre o clic en el backdrop).
 * @param children - Contenido del modal (normalmente un formulario).
 */
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      className="modal"
      onClose={onClose}
      onClick={(e) => {
        // El backdrop forma parte del propio <dialog>: un clic fuera del
        // contenido (target === dialog) significa "cerrar".
        if (e.target === ref.current) onClose()
      }}
    >
      <div className="modal-body">
        <header className="modal-head">
          <h3 className="card-title">{title}</h3>
          <button type="button" className="modal-close" aria-label="Cerrar" onClick={onClose}>
            <IconClose size={18} />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  )
}
