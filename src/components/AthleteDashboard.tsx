import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Activity, Calendar } from 'lucide-react';

export const AthleteDashboard: React.FC = () => {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-full bg-primary/10 border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-primary" /> Today's Mission
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm font-medium">Check the WOD section to log your today's performance!</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Activity className="h-4 w-4" /> Personal Progress
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">12 PRs</div>
                    <p className="text-xs text-muted-foreground">Logged in the last 30 days</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Attendance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">85%</div>
                    <p className="text-xs text-muted-foreground">Class consistency</p>
                </CardContent>
            </Card>
        </div>
    );
};
