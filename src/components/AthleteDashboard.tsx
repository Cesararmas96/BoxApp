import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Activity, Calendar } from 'lucide-react';

export const AthleteDashboard: React.FC = () => {
    return (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-full bg-primary/20 border-primary/30 shadow-premium overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
                <CardHeader className="relative z-10 pt-8 px-8">
                    <CardTitle className="flex items-center gap-3 text-2xl font-black italic uppercase tracking-tighter text-glow translate-y-0 group-hover:-translate-y-1 transition-transform">
                        <div className="h-12 w-12 rounded-2xl glass flex items-center justify-center border-primary/30">
                            <Trophy className="h-6 w-6 text-primary group-hover:scale-125 transition-transform" />
                        </div>
                        Today's Mission
                    </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10 px-8 pb-8">
                    <p className="text-base font-bold uppercase tracking-wide opacity-80 leading-relaxed max-w-2xl italic">Master the day's challenge. Check the WOD section and dominate your performance logging!</p>
                </CardContent>
            </Card>

            <Card className="glass relative group overflow-hidden border-white/10">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <CardHeader className="pt-8 px-8">
                    <CardTitle className="text-[11px] font-black uppercase tracking-[0.4em] text-primary italic flex items-center gap-3">
                        <Activity className="h-4 w-4" /> Personal Progress
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                    <div className="text-5xl font-black italic tracking-tighter mb-2 group-hover:text-primary transition-colors duration-500">12 PRs</div>
                    <p className="text-[11px] font-bold text-muted-foreground/80 uppercase tracking-widest leading-relaxed">Logged in the last 30 days — Record Breaking Pace</p>
                </CardContent>
            </Card>

            <Card className="glass relative group overflow-hidden border-white/10">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <CardHeader className="pt-8 px-8">
                    <CardTitle className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-500 italic flex items-center gap-3">
                        <Calendar className="h-4 w-4" /> Attendance
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                    <div className="text-5xl font-black italic tracking-tighter mb-2 group-hover:text-emerald-500 transition-colors duration-500">85%</div>
                    <p className="text-[11px] font-bold text-muted-foreground/80 uppercase tracking-widest leading-relaxed">Class consistency — Elite Discipline Level</p>
                </CardContent>
            </Card>
        </div>
    );
};
