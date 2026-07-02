-- Tabla de categorías (EP-W02, SRS §5.1 entidad `categories`).
-- Clasifican los movimientos en ingresos o gastos y permiten el desglose
-- por categoría del panel de patrimonio (HU-W02.03).
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    -- Tipo de movimiento al que aplica la categoría.
    type TEXT NOT NULL CHECK (type IN ('ingreso', 'gasto')),
    -- Distingue las categorías por defecto (HU-W02.01) de las creadas por el usuario (HU-W02.02).
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categorías por defecto (HU-W02.01): el usuario dispone de un conjunto inicial
-- sin tener que configurar nada al usar la app por primera vez.
INSERT INTO categories (name, icon, color, type, is_default) VALUES
    ('Alimentación', 'utensils', '#F59E0B', 'gasto', true),
    ('Vivienda',      'home',     '#3B82F6', 'gasto', true),
    ('Ocio',          'film',     '#A855F7', 'gasto', true),
    ('Transporte',    'car',      '#10B981', 'gasto', true),
    ('Salud',         'heart',    '#EF4444', 'gasto', true),
    ('Educación',     'book',     '#6366F1', 'gasto', true),
    ('Otros gastos',  'ellipsis', '#6B7280', 'gasto', true),
    ('Ingresos',      'wallet',   '#22C55E', 'ingreso', true);
