-- Add is_pinned column to tasks table
ALTER TABLE tasks ADD COLUMN is_pinned TINYINT(1) NOT NULL DEFAULT 0;

-- Create index for faster sorting by pinned status
CREATE INDEX idx_tasks_is_pinned ON tasks(is_pinned);
