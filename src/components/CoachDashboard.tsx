import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

export const CoachDashboard: React.FC = () => {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState({
        classesToday: 0,
        pendingFeedback: 0,
        loading: true
    });

    useEffect(() => {
        if (user?.id) fetchCoachMetrics(user.id);
    }, [user]);

    const fetchCoachMetrics = async (userId: string) => {
        try {
            const today = new Date().toISOString().split('T')[0];

            // 1. Fetch Today's Classes for this coach
            const { count: classCount } = await supabase
                .from('sessions')
                .select('*', { count: 'exact', head: true })
                .eq('coach_id', userId)
                .eq('date', today);

            // 2. Fetch Pending Feedback for coach's sessions
            // First get coach's session IDs
            const { data: coachSessions } = await supabase
                .from('sessions')
                .select('id')
                .eq('coach_id', userId);

            const sessionIds = coachSessions?.map(s => s.id) || [];

            if (sessionIds.length > 0) {
                const { count: feedbackCount } = await supabase
                    .from('functional_feedback')
                    .select('*', { count: 'exact', head: true })
                    .in('session_id', sessionIds);

                setMetrics(prev => ({ ...prev, pendingFeedback: feedbackCount || 0 }));
            }

            setMetrics(prev => ({
                ...prev,
                classesToday: classCount || 0,
                loading: false
            }));
        } catch (error) {
            console.error('Error fetching coach metrics:', error);
            setMetrics(prev => ({ ...prev, loading: false }));
        }
    };

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-full border-indigo-500/20 bg-indigo-500/5">
                <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <Users className="h-5 w-5 text-indigo-500" /> Coaching Session Control
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm">Manage class attendance and review athlete feedback for your sessions.</p>
                </CardContent>
            </Card>

            <Card className="glass group hover:border-indigo-500/30 transition-all">
                <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-indigo-500" /> Active Classes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-black italic tracking-tight group-hover:text-indigo-400 transition-colors uppercase">
                        {metrics.classesToday} {metrics.classesToday === 1 ? 'Class' : 'Classes'}
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Assigned for today</p>
                </CardContent>
            </Card>

            <Card className="glass group hover:border-indigo-500/30 transition-all">
                <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-indigo-500" /> New Feedback
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-black italic tracking-tight group-hover:text-indigo-400 transition-colors uppercase">
                        {metrics.pendingFeedback} {metrics.pendingFeedback === 1 ? 'Review' : 'Reviews'}
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Pending your response</p>
                </CardContent>
            </Card>
        </div>
    );
};
