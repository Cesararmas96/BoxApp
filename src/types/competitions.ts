export interface Competition {
    id: string;
    name: string;
    description: string | null;
    start_date: string | null;
    end_date: string | null;
    status: string | null;
    type: string | null;
    box_id: string | null;
    created_at: string | null;
    cuts_config: any;
    is_team_event: boolean | null;
    scoring_system: string | null;
    team_size: number | null;
    rules: string | null;
    category: string | null;
    participants?: any[];
    events?: any[];
    judging_staff?: CompetitionJudge[];
    heats?: CompetitionHeat[];
    location?: string | null;
    divisions_count?: number;
}

export interface CompetitionParticipant {
    id: string;
    competition_id: string | null;
    user_id: string | null;
    status: string | null;
    division_id: string | null;
    division?: string | null; // Joined or legacy field
    team_id: string | null;
    checked_in?: boolean;
    waiver_signed?: boolean;
    athlete?: {
        id: string;
        first_name: string | null;
        last_name: string | null;
        email: string | null;
        avatar_url: string | null;
    };
}

export interface CompetitionEvent {
    id: string;
    competition_id: string;
    box_id?: string | null;
    title: string;
    name?: string; // Legacy support for name property
    description: string | null;
    wod_id: string | null;
    wod_type: string;
    scoring_type: string;
    time_cap_seconds: number | null;
    standards_text: string | null;
    standards_video_url: string | null;
    tie_break_strategy: string | null;
    order_index: number;
    status: string;
}

export interface CompetitionDivision {
    id: string;
    competition_id: string;
    name: string;
    gender: 'male' | 'female' | 'mixed' | 'any';
    description: string | null;
    category?: string | null;
    rules?: string | null;
    created_at?: string;
}

export interface CompetitionTeam {
    id: string;
    competition_id: string;
    division_id: string | null;
    name: string;
    captain_user_id: string | null;
    join_code: string | null;
    status: string | null;
    created_at?: string;
    members?: { count: number }[];
    captain?: {
        first_name: string | null;
        last_name: string | null;
        email: string | null;
    };
}

export interface CompetitionJudge {
    id: string;
    competition_id: string;
    user_id: string;
    role: string | null;
    status: string | null;
    profile?: {
        id: string;
        first_name: string | null;
        last_name: string | null;
        email: string | null;
        avatar_url: string | null;
    };
}

export interface CompetitionHeat {
    id: string;
    competition_id: string;
    event_id: string;
    name: string;
    start_time: string | null;
    status: string;
    lane_count?: number;
    notes?: string;
}

export interface LaneAssignment {
    id: string;
    heat_id: string;
    participant_id: string;
    lane_number: number;
    participant?: {
        id: string;
        first_name: string;
        last_name: string;
    };
}

export interface CompetitionScore {
    id: string;
    competition_id?: string;
    event_id: string;
    participant_id: string;
    lane_id?: string | null;
    score_data: any;
    tie_break_data?: any;
    judge_signature?: string | null;
    athlete_signature?: string | null;
    status: string;
    created_at?: string | null;
    updated_at?: string | null;
    is_validated?: boolean | null;
    validated_by?: string | null;
    box_id?: string | null;
}
