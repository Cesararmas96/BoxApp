-- Create competition_scores table
CREATE TYPE score_status AS ENUM ('pending', 'submitted', 'verified', 'invalid', 'dns', 'dnf');

CREATE TABLE IF NOT EXISTS public.competition_scores (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    competition_id uuid REFERENCES public.competitions(id) NOT NULL,
    event_id uuid REFERENCES public.competition_events(id) NOT NULL,
    participant_id uuid REFERENCES public.competition_participants(id),
    team_id uuid REFERENCES public.competition_teams(id), -- For team events
    judge_id uuid REFERENCES public.profiles(id),
    lane_id uuid REFERENCES public.lane_assignments(id),
    
    score_data jsonb NOT NULL DEFAULT '{}'::jsonb, -- e.g. { "value": 150, "time": "12:00", "reps": 12, "rounds": 5 }
    tie_break_data jsonb DEFAULT '{}'::jsonb, -- e.g. { "time": "05:00" }
    
    status score_status DEFAULT 'pending',
    judge_signature text, -- Data URL for signature image
    athlete_signature text, -- Data URL
    notes text,
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.competition_scores ENABLE ROW LEVEL SECURITY;

-- Public can view validated scores (for leaderboard)
CREATE POLICY "Public can view validated scores" ON public.competition_scores
    FOR SELECT TO authenticated
    USING (status = 'verified' OR status = 'submitted');

-- Judges can create and view scores for their competition
CREATE POLICY "Judges can create scores" ON public.competition_scores
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.competition_judges 
            WHERE user_id = auth.uid() 
            AND competition_id = competition_scores.competition_id
        ) OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND (role_id = 'admin' OR role_id = 'coach')
        )
    );

-- Judges can update their own pending scores
CREATE POLICY "Judges can update own scores" ON public.competition_scores
    FOR UPDATE TO authenticated
    USING (
        (judge_id = auth.uid() AND status IN ('pending', 'submitted')) OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND (role_id = 'admin' OR role_id = 'coach')
        )
    );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scores_competition_event ON public.competition_scores(competition_id, event_id);
CREATE INDEX IF NOT EXISTS idx_scores_participant ON public.competition_scores(participant_id);
