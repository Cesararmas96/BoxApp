-- RLS Policies for Competition Tables

-- competition_participants
ALTER TABLE public.competition_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view participants" ON public.competition_participants;
CREATE POLICY "Public can view participants" ON public.competition_participants FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins and coaches can manage participants" ON public.competition_participants;
CREATE POLICY "Admins and coaches can manage participants" ON public.competition_participants FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role_id = 'admin' OR role_id = 'coach'))) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role_id = 'admin' OR role_id = 'coach')));

-- competition_events
ALTER TABLE public.competition_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view competition events" ON public.competition_events;
CREATE POLICY "Public can view competition events" ON public.competition_events FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins and coaches can manage events" ON public.competition_events;
CREATE POLICY "Admins and coaches can manage events" ON public.competition_events FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role_id = 'admin' OR role_id = 'coach'))) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role_id = 'admin' OR role_id = 'coach')));

-- competition_judges
ALTER TABLE public.competition_judges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view competition judges" ON public.competition_judges;
CREATE POLICY "Public can view competition judges" ON public.competition_judges FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins and coaches can manage judges" ON public.competition_judges;
CREATE POLICY "Admins and coaches can manage judges" ON public.competition_judges FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role_id = 'admin' OR role_id = 'coach'))) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role_id = 'admin' OR role_id = 'coach')));

-- competition_scores
ALTER TABLE public.competition_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view competition scores" ON public.competition_scores;
CREATE POLICY "Public can view competition scores" ON public.competition_scores FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins and coaches can manage scores" ON public.competition_scores;
CREATE POLICY "Admins and coaches can manage scores" ON public.competition_scores FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role_id = 'admin' OR role_id = 'coach'))) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role_id = 'admin' OR role_id = 'coach')));
