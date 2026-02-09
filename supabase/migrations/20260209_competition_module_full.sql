-- Comprehensive Migration for Competition Module
-- Based on accepted Implementation Plan

-- 1. ENUMS and Types
CREATE TYPE public.competition_scoring_system AS ENUM ('low_point', 'table_point');
CREATE TYPE public.wod_type AS ENUM ('for_time', 'amrap', 'rm', 'complex');
CREATE TYPE public.score_status AS ENUM ('valid', 'dns', 'dnf', 'calibrated');

-- 2. Competitions Table Updates
ALTER TABLE public.competitions 
ADD COLUMN IF NOT EXISTS scoring_system competition_scoring_system DEFAULT 'table_point',
ADD COLUMN IF NOT EXISTS is_team_event boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS team_size integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS  cuts_config jsonb DEFAULT NULL; -- To store cut rules e.g., [{"round": 1, "top": 10}]

-- 3. Divisions Table (New)
CREATE TABLE IF NOT EXISTS public.competition_divisions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    competition_id uuid REFERENCES public.competitions(id) ON DELETE CASCADE,
    name text NOT NULL, -- e.g., "RX Male", "Scaled Female"
    gender text, -- 'male', 'female', 'mixed'
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. Teams Table (New)
CREATE TABLE IF NOT EXISTS public.competition_teams (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    competition_id uuid REFERENCES public.competitions(id) ON DELETE CASCADE,
    division_id uuid REFERENCES public.competition_divisions(id) ON DELETE SET NULL,
    name text NOT NULL,
    captain_user_id uuid REFERENCES public.profiles(id),
    join_code text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 5. Participants Table Updates
ALTER TABLE public.competition_participants
ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.competition_teams(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS division_id uuid REFERENCES public.competition_divisions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS checked_in boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS waiver_signed boolean DEFAULT false;

-- 6. Events (WODs) Table Updates
ALTER TABLE public.competition_events
ADD COLUMN IF NOT EXISTS wod_type wod_type DEFAULT 'for_time',
ADD COLUMN IF NOT EXISTS time_cap_seconds integer,
ADD COLUMN IF NOT EXISTS standards_text text,
ADD COLUMN IF NOT EXISTS standards_video_url text,
ADD COLUMN IF NOT EXISTS tie_break_strategy text; -- Description of tie break rule

-- 7. Heats Table (New)
CREATE TABLE IF NOT EXISTS public.competition_heats (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    competition_id uuid REFERENCES public.competitions(id) ON DELETE CASCADE,
    event_id uuid REFERENCES public.competition_events(id) ON DELETE SET NULL, -- Can be null if heat is generic for multiple events, but usually per event
    name text NOT NULL, -- "Heat 1", "Heat 2"
    start_time timestamptz,
    status text DEFAULT 'pending', -- pending, active, finished
    created_at timestamptz DEFAULT now()
);

-- 8. Lane Assignments (New)
CREATE TABLE IF NOT EXISTS public.lane_assignments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    heat_id uuid REFERENCES public.competition_heats(id) ON DELETE CASCADE,
    participant_id uuid REFERENCES public.competition_participants(id) ON DELETE CASCADE,
    lane_number integer NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(heat_id, lane_number)
);

-- 9. Scores Table Updates
ALTER TABLE public.competition_scores
ADD COLUMN IF NOT EXISTS tie_break_value numeric,
ADD COLUMN IF NOT EXISTS judge_user_id uuid REFERENCES public.profiles(id), -- Specific judge who signed off
ADD COLUMN IF NOT EXISTS judge_signature text, -- Digital signature/hash
ADD COLUMN IF NOT EXISTS athlete_signature boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS status score_status DEFAULT 'valid',
ADD COLUMN IF NOT EXISTS notes text;

-- 10. Enable RLS on new tables
ALTER TABLE public.competition_divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_heats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lane_assignments ENABLE ROW LEVEL SECURITY;

-- 11. RLS Policies

-- Divisions
CREATE POLICY "Public can view divisions" ON public.competition_divisions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage divisions" ON public.competition_divisions FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role_id = 'admin' OR role_id = 'coach')));

-- Teams
CREATE POLICY "Public can view teams" ON public.competition_teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage teams" ON public.competition_teams FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role_id = 'admin' OR role_id = 'coach')));
CREATE POLICY "Captains manage own team" ON public.competition_teams FOR UPDATE TO authenticated USING (captain_user_id = auth.uid());

-- Heats
CREATE POLICY "Public can view heats" ON public.competition_heats FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage heats" ON public.competition_heats FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role_id = 'admin' OR role_id = 'coach')));

-- Lane Assignments
CREATE POLICY "Public can view lanes" ON public.lane_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage lanes" ON public.lane_assignments FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role_id = 'admin' OR role_id = 'coach')));
