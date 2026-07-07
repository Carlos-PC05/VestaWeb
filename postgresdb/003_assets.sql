-- Tabla de activos de cartera (EP-W03, SRS §5.1 entidad `assets`).
-- Cubre tanto activos cotizados (ETF, acciones, oro, cripto) como no
-- cotizados (inmuebles, vehículos, etc.), fieles al SRS.
CREATE TABLE assets (
    id SERIAL PRIMARY KEY,
    naturaleza TEXT NOT NULL CHECK (naturaleza IN ('cotizado', 'no cotizado')),
    class TEXT NOT NULL CHECK (class IN
        ('accion', 'etf', 'oro', 'cripto', 'inmueble', 'vehiculo', 'solar', 'otro')),
    name TEXT NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'EUR',
    -- Solo cotizados: ticker y último precio conocido (SRS §5.1).
    ticker TEXT,
    current_price NUMERIC(18, 8),
    -- Solo no cotizados: valoración manual y su fecha (HU-W03.02).
    manual_value NUMERIC(14, 2),
    valued_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Coherencia entre naturaleza y campos condicionales.
    CONSTRAINT assets_naturaleza_fields CHECK (
        (naturaleza = 'cotizado'     AND ticker IS NOT NULL) OR
        (naturaleza = 'no cotizado'  AND manual_value IS NOT NULL AND valued_at IS NOT NULL)
    )
);
