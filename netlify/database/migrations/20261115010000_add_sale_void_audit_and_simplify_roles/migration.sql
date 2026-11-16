ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS void_reason text,
  ADD COLUMN IF NOT EXISTS void_notes text,
  ADD COLUMN IF NOT EXISTS voided_at timestamp,
  ADD COLUMN IF NOT EXISTS voided_by_user_id integer REFERENCES users(id);

UPDATE users
SET role = 'operador'
WHERE role IN ('encargado', 'control_ingreso', 'consulta');
