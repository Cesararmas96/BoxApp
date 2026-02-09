-- Fix missing columns for competition_participants
ALTER TABLE competition_participants 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS division text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Fix missing columns for competition_events
ALTER TABLE competition_events 
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS wod_id uuid REFERENCES wods(id),
ADD COLUMN IF NOT EXISTS scoring_type text,
ADD COLUMN IF NOT EXISTS order_index integer;

-- Fix missing columns for competition_judges
ALTER TABLE competition_judges 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id);
