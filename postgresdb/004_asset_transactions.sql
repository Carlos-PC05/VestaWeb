-- Tabla de operaciones de cartera (EP-W03, SRS §5.1 entidad `asset_transactions`).
-- Registra cada compra/venta ligada a un activo; las métricas derivadas
-- (precio medio, plusvalía, etc.) se calculan a partir de estas filas.
CREATE TABLE asset_transactions (
    id SERIAL PRIMARY KEY,
    -- Una operación sin activo no tiene sentido: CASCADE (a diferencia de
    -- transactions.category_id, donde el huérfano "sin categoría" sí es útil).
    asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('compra', 'venta')),
    shares NUMERIC(28, 8) NOT NULL CHECK (shares > 0),
    unit_price NUMERIC(18, 8) NOT NULL CHECK (unit_price >= 0),
    fee NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (fee >= 0),
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_asset_transactions_asset_id ON asset_transactions (asset_id);
CREATE INDEX idx_asset_transactions_occurred_at ON asset_transactions (occurred_at);
