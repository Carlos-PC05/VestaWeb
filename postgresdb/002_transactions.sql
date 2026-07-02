-- Tabla de movimientos (EP-W01, SRS §5.1 entidad `transactions`).
-- Registra cada ingreso o gasto individual introducido por el usuario.
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    -- El importe siempre es positivo; el signo lo determina la columna `type`.
    -- HU-W01.01: un importe vacío o a cero debe impedirse al guardar.
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    currency CHAR(3) NOT NULL DEFAULT 'EUR',
    type TEXT NOT NULL CHECK (type IN ('ingreso', 'gasto')),
    description TEXT,
    -- Fecha y hora del movimiento (no de creación del registro).
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- REQ-DAT-W03: al eliminar una categoría, los movimientos asociados no se
    -- borran, quedan como "sin categoría" (category_id a NULL).
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Acelera el listado agrupado por mes y filtrado por periodo (HU-W01.03, HU-W01.04).
CREATE INDEX idx_transactions_occurred_at ON transactions (occurred_at);

-- Acelera el desglose por categoría (HU-W02.03).
CREATE INDEX idx_transactions_category_id ON transactions (category_id);
