-- ISS-052/ISS-057: Soft-delete support for children
ALTER TABLE children ADD COLUMN active INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_children_active ON children(parent_id, active);
