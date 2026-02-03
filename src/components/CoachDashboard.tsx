import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, MessageSquare } from 'lucide-react';

export const CoachDashboard: React.FC = () => {
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

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-indigo-500" /> Active Classes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">4 Classes</div>
                    <p className="text-xs text-muted-foreground">Assigned for today</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-indigo-500" /> New Feedback
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">8 Reviews</div>
                    <p className="text-xs text-muted-foreground">Pending your response</p>
                </CardContent>
            </Card>
        </div>
    );
};
