export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "14.1"
    }
    public: {
        Tables: {
            audit_logs: {
                Row: {
                    action: string
                    box_id: string | null
                    changed_by: string | null
                    created_at: string | null
                    id: string
                    new_data: Json | null
                    old_data: Json | null
                    record_id: string
                    table_name: string
                    user_id: string | null
                }
                Insert: {
                    action: string
                    box_id?: string | null
                    changed_by?: string | null
                    created_at?: string | null
                    id?: string
                    new_data?: Json | null
                    old_data?: Json | null
                    record_id: string
                    table_name: string
                    user_id?: string | null
                }
                Update: {
                    action?: string
                    box_id?: string | null
                    changed_by?: string | null
                    created_at?: string | null
                    id?: string
                    new_data?: Json | null
                    old_data?: Json | null
                    record_id?: string
                    table_name?: string
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "audit_logs_changed_by_fkey"
                        columns: ["changed_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            automation_logs: {
                Row: {
                    action_type: string
                    box_id: string | null
                    created_at: string | null
                    id: string
                    metadata: Json | null
                    performed_by: string | null
                    status: string | null
                    target_user_id: string | null
                }
                Insert: {
                    action_type: string
                    box_id?: string | null
                    created_at?: string | null
                    id?: string
                    metadata?: Json | null
                    performed_by?: string | null
                    status?: string | null
                    target_user_id?: string | null
                }
                Update: {
                    action_type?: string
                    box_id?: string | null
                    created_at?: string | null
                    id?: string
                    metadata?: Json | null
                    performed_by?: string | null
                    status?: string | null
                    target_user_id?: string | null
                }
                Relationships: []
            }
            boxes: {
                Row: {
                    created_at: string | null
                    favicon_url: string | null
                    id: string
                    login_background_url: string | null
                    logo_url: string | null
                    name: string
                    slug: string
                    subscription_status: 'trial' | 'active' | 'suspended' | 'cancelled'
                    theme_config: Json | null
                    trial_ends_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    favicon_url?: string | null
                    id?: string
                    login_background_url?: string | null
                    logo_url?: string | null
                    name: string
                    slug: string
                    subscription_status?: 'trial' | 'active' | 'suspended' | 'cancelled' | null
                    theme_config?: Json | null
                    trial_ends_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    favicon_url?: string | null
                    id?: string
                    login_background_url?: string | null
                    logo_url?: string | null
                    name?: string
                    slug?: string
                    subscription_status?: 'trial' | 'active' | 'suspended' | 'cancelled' | null
                    theme_config?: Json | null
                    trial_ends_at?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            classes: {
                Row: {
                    box_id: string | null
                    capacity: number
                    coach_id: string | null
                    created_at: string | null
                    description: string | null
                    duration_minutes: number
                    end_time: string
                    id: string
                    is_canceled: boolean | null
                    name: string
                    program_id: string | null
                    recurrence_rule: string | null
                    start_time: string
                }
                Insert: {
                    box_id?: string | null
                    capacity: number
                    coach_id?: string | null
                    created_at?: string | null
                    description?: string | null
                    duration_minutes: number
                    end_time: string
                    id?: string
                    is_canceled?: boolean | null
                    name: string
                    program_id?: string | null
                    recurrence_rule?: string | null
                    start_time: string
                }
                Update: {
                    box_id?: string | null
                    capacity?: number
                    coach_id?: string | null
                    created_at?: string | null
                    description?: string | null
                    duration_minutes?: number
                    end_time?: string
                    id?: string
                    is_canceled?: boolean | null
                    name?: string
                    program_id?: string | null
                    recurrence_rule?: string | null
                    start_time?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "classes_coach_id_fkey"
                        columns: ["coach_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            competition_divisions: {
                Row: {
                    competition_id: string | null
                    created_at: string | null
                    description: string | null
                    gender: string | null
                    id: string
                    name: string
                    updated_at: string | null
                }
                Insert: {
                    competition_id?: string | null
                    created_at?: string | null
                    description?: string | null
                    gender?: string | null
                    id?: string
                    name: string
                    updated_at?: string | null
                }
                Update: {
                    competition_id?: string | null
                    created_at?: string | null
                    description?: string | null
                    gender?: string | null
                    id?: string
                    name?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "competition_divisions_competition_id_fkey"
                        columns: ["competition_id"]
                        isOneToOne: false
                        referencedRelation: "competitions"
                        referencedColumns: ["id"]
                    },
                ]
            }
            competition_events: {
                Row: {
                    box_id: string | null
                    competition_id: string | null
                    created_at: string | null
                    description: string | null
                    id: string
                    name: string
                    order_index: number | null
                    scoring_type: string | null
                    standards_text: string | null
                    standards_video_url: string | null
                    tie_break_strategy: string | null
                    time_cap_seconds: number | null
                    title: string
                    wod_id: string | null
                    wod_type: Database["public"]["Enums"]["wod_type"] | null
                }
                Insert: {
                    box_id?: string | null
                    competition_id?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    name?: string
                    order_index?: number | null
                    scoring_type?: string | null
                    standards_text?: string | null
                    standards_video_url?: string | null
                    tie_break_strategy?: string | null
                    time_cap_seconds?: number | null
                    title: string
                    wod_id?: string | null
                    wod_type?: Database["public"]["Enums"]["wod_type"] | null
                }
                Update: {
                    box_id?: string | null
                    competition_id?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    name?: string
                    order_index?: number | null
                    scoring_type?: string | null
                    standards_text?: string | null
                    standards_video_url?: string | null
                    tie_break_strategy?: string | null
                    time_cap_seconds?: number | null
                    title?: string
                    wod_id?: string | null
                    wod_type?: Database["public"]["Enums"]["wod_type"] | null
                }
                Relationships: [
                    {
                        foreignKeyName: "competition_events_competition_id_fkey"
                        columns: ["competition_id"]
                        isOneToOne: false
                        referencedRelation: "competitions"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "competition_events_wod_id_fkey"
                        columns: ["wod_id"]
                        isOneToOne: false
                        referencedRelation: "wods"
                        referencedColumns: ["id"]
                    },
                ]
            }
            competition_heats: {
                Row: {
                    competition_id: string | null
                    created_at: string | null
                    event_id: string | null
                    id: string
                    name: string
                    start_time: string | null
                    status: string | null
                }
                Insert: {
                    competition_id?: string | null
                    created_at?: string | null
                    event_id?: string | null
                    id?: string
                    name: string
                    start_time?: string | null
                    status?: string | null
                }
                Update: {
                    competition_id?: string | null
                    created_at?: string | null
                    event_id?: string | null
                    id?: string
                    name?: string
                    start_time?: string | null
                    status?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "competition_heats_competition_id_fkey"
                        columns: ["competition_id"]
                        isOneToOne: false
                        referencedRelation: "competitions"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "competition_heats_event_id_fkey"
                        columns: ["event_id"]
                        isOneToOne: false
                        referencedRelation: "competition_events"
                        referencedColumns: ["id"]
                    },
                ]
            }
            competition_judges: {
                Row: {
                    competition_id: string | null
                    created_at: string | null
                    id: string
                    user_id: string | null
                }
                Insert: {
                    competition_id?: string | null
                    created_at?: string | null
                    id?: string
                    user_id?: string | null
                }
                Update: {
                    competition_id?: string | null
                    created_at?: string | null
                    id?: string
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "competition_judges_competition_id_fkey"
                        columns: ["competition_id"]
                        isOneToOne: false
                        referencedRelation: "competitions"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "competition_judges_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            competition_participants: {
                Row: {
                    box_id: string | null
                    checked_in: boolean | null
                    competition_id: string | null
                    created_at: string | null
                    division: string | null
                    division_id: string | null
                    id: string
                    status: string | null
                    team_id: string | null
                    user_id: string | null
                    waiver_signed: boolean | null
                }
                Insert: {
                    box_id?: string | null
                    checked_in?: boolean | null
                    competition_id?: string | null
                    created_at?: string | null
                    division?: string | null
                    division_id?: string | null
                    id?: string
                    status?: string | null
                    team_id?: string | null
                    user_id?: string | null
                    waiver_signed?: boolean | null
                }
                Update: {
                    box_id?: string | null
                    checked_in?: boolean | null
                    competition_id?: string | null
                    created_at?: string | null
                    division?: string | null
                    division_id?: string | null
                    id?: string
                    status?: string | null
                    team_id?: string | null
                    user_id?: string | null
                    waiver_signed?: boolean | null
                }
                Relationships: [
                    {
                        foreignKeyName: "competition_participants_competition_id_fkey"
                        columns: ["competition_id"]
                        isOneToOne: false
                        referencedRelation: "competitions"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "competition_participants_division_id_fkey"
                        columns: ["division_id"]
                        isOneToOne: false
                        referencedRelation: "competition_divisions"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "competition_participants_team_id_fkey"
                        columns: ["team_id"]
                        isOneToOne: false
                        referencedRelation: "competition_teams"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "competition_participants_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            competition_scores: {
                Row: {
                    athlete_signature: boolean | null
                    box_id: string | null
                    created_at: string | null
                    event_id: string
                    id: string
                    is_validated: boolean | null
                    judge_signature: string | null
                    judge_user_id: string | null
                    notes: string | null
                    participant_id: string
                    score_display: string
                    score_value: number
                    status: Database["public"]["Enums"]["score_status"] | null
                    tie_break_value: number | null
                    validated_by: string | null
                }
                Insert: {
                    athlete_signature?: boolean | null
                    box_id?: string | null
                    created_at?: string | null
                    event_id: string
                    id?: string
                    is_validated?: boolean | null
                    judge_signature?: string | null
                    judge_user_id?: string | null
                    notes?: string | null
                    participant_id: string
                    score_display: string
                    score_value: number
                    status?: Database["public"]["Enums"]["score_status"] | null
                    tie_break_value?: number | null
                    validated_by?: string | null
                }
                Update: {
                    athlete_signature?: boolean | null
                    box_id?: string | null
                    created_at?: string | null
                    event_id?: string
                    id?: string
                    is_validated?: boolean | null
                    judge_signature?: string | null
                    judge_user_id?: string | null
                    notes?: string | null
                    participant_id?: string
                    score_display?: string
                    score_value?: number
                    status?: Database["public"]["Enums"]["score_status"] | null
                    tie_break_value?: number | null
                    validated_by?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "competition_scores_event_id_fkey"
                        columns: ["event_id"]
                        isOneToOne: false
                        referencedRelation: "competition_events"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "competition_scores_judge_user_id_fkey"
                        columns: ["judge_user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "competition_scores_participant_id_fkey"
                        columns: ["participant_id"]
                        isOneToOne: false
                        referencedRelation: "competition_participants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            competition_teams: {
                Row: {
                    captain_user_id: string | null
                    competition_id: string | null
                    created_at: string | null
                    division_id: string | null
                    id: string
                    join_code: string | null
                    name: string
                    updated_at: string | null
                }
                Insert: {
                    captain_user_id?: string | null
                    competition_id?: string | null
                    created_at?: string | null
                    division_id?: string | null
                    id?: string
                    join_code?: string | null
                    name: string
                    updated_at?: string | null
                }
                Update: {
                    captain_user_id?: string | null
                    competition_id?: string | null
                    created_at?: string | null
                    division_id?: string | null
                    id?: string
                    join_code?: string | null
                    name?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "competition_teams_captain_user_id_fkey"
                        columns: ["captain_user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "competition_teams_competition_id_fkey"
                        columns: ["competition_id"]
                        isOneToOne: false
                        referencedRelation: "competitions"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "competition_teams_division_id_fkey"
                        columns: ["division_id"]
                        isOneToOne: false
                        referencedRelation: "competition_divisions"
                        referencedColumns: ["id"]
                    },
                ]
            }
            competitions: {
                Row: {
                    box_id: string | null
                    created_at: string | null
                    cuts_config: Json | null
                    description: string | null
                    end_date: string | null
                    id: string
                    is_team_event: boolean | null
                    name: string
                    scoring_system: Database["public"]["Enums"]["competition_scoring_system"] | null
                    start_date: string | null
                    status: string | null
                    team_size: number | null
                    type: string | null
                }
                Insert: {
                    box_id?: string | null
                    created_at?: string | null
                    cuts_config?: Json | null
                    description?: string | null
                    end_date?: string | null
                    id?: string
                    is_team_event?: boolean | null
                    name: string
                    scoring_system?: Database["public"]["Enums"]["competition_scoring_system"] | null
                    start_date?: string | null
                    status?: string | null
                    team_size?: number | null
                    type?: string | null
                }
                Update: {
                    box_id?: string | null
                    created_at?: string | null
                    cuts_config?: Json | null
                    description?: string | null
                    end_date?: string | null
                    id?: string
                    is_team_event?: boolean | null
                    name?: string
                    scoring_system?: Database["public"]["Enums"]["competition_scoring_system"] | null
                    start_date?: string | null
                    status?: string | null
                    team_size?: number | null
                    type?: string | null
                }
                Relationships: []
            }
            item_history: {
                Row: {
                    action: string | null
                    changed_by: string | null
                    created_at: string | null
                    details: string | null
                    id: string
                    item_id: string | null
                }
                Insert: {
                    action?: string | null
                    changed_by?: string | null
                    created_at?: string | null
                    details?: string | null
                    id?: string
                    item_id?: string | null
                }
                Update: {
                    action?: string | null
                    changed_by?: string | null
                    created_at?: string | null
                    details?: string | null
                    id?: string
                    item_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "item_history_changed_by_fkey"
                        columns: ["changed_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "item_history_item_id_fkey"
                        columns: ["item_id"]
                        isOneToOne: false
                        referencedRelation: "items"
                        referencedColumns: ["id"]
                    },
                ]
            }
            items: {
                Row: {
                    box_id: string | null
                    category: string
                    created_at: string | null
                    description: string | null
                    id: string
                    location: string | null
                    min_quantity: number
                    name: string
                    quantity: number
                    status: string
                    sku: string | null
                    image_url: string | null
                }
                Insert: {
                    box_id?: string | null
                    category: string
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    location?: string | null
                    min_quantity?: number
                    name: string
                    quantity?: number
                    status?: string
                    sku?: string | null
                    image_url?: string | null
                }
                Update: {
                    box_id?: string | null
                    category?: string
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    location?: string | null
                    min_quantity?: number
                    name?: string
                    quantity?: number
                    status?: string
                    sku?: string | null
                    image_url?: string | null
                }
                Relationships: []
            }
            lane_assignments: {
                Row: {
                    created_at: string | null
                    heat_id: string | null
                    id: string
                    lane_number: number
                    participant_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    heat_id?: string | null
                    id?: string
                    lane_number: number
                    participant_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    heat_id?: string | null
                    id?: string
                    lane_number?: number
                    participant_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "lane_assignments_heat_id_fkey"
                        columns: ["heat_id"]
                        isOneToOne: false
                        referencedRelation: "competition_heats"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "lane_assignments_participant_id_fkey"
                        columns: ["participant_id"]
                        isOneToOne: false
                        referencedRelation: "competition_participants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    box_id: string | null
                    created_at: string | null
                    email: string | null
                    first_name: string | null
                    force_password_change: boolean | null
                    id: string
                    last_name: string | null
                    role_id: string
                    updated_at: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    box_id?: string | null
                    created_at?: string | null
                    email?: string | null
                    first_name?: string | null
                    force_password_change?: boolean | null
                    id: string
                    last_name?: string | null
                    role_id?: string
                    updated_at?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    box_id?: string | null
                    created_at?: string | null
                    email?: string | null
                    first_name?: string | null
                    force_password_change?: boolean | null
                    id?: string
                    last_name?: string | null
                    role_id?: string
                    updated_at?: string | null
                }
                Relationships: []
            }
            roles: {
                Row: {
                    description: string | null
                    id: string
                    name: string
                    permissions: Json | null
                }
                Insert: {
                    description?: string | null
                    id: string
                    name: string
                    permissions?: Json | null
                }
                Update: {
                    description?: string | null
                    id?: string
                    name?: string
                    permissions?: Json | null
                }
                Relationships: []
            }
            sessions: {
                Row: {
                    attendees_count: number | null
                    class_id: string | null
                    coach_id: string | null
                    created_at: string | null
                    date: string
                    end_time: string
                    id: string
                    start_time: string
                }
                Insert: {
                    attendees_count?: number | null
                    class_id?: string | null
                    coach_id?: string | null
                    created_at?: string | null
                    date: string
                    end_time: string
                    id?: string
                    start_time: string
                }
                Update: {
                    attendees_count?: number | null
                    class_id?: string | null
                    coach_id?: string | null
                    created_at?: string | null
                    date?: string
                    end_time?: string
                    id?: string
                    start_time?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "sessions_class_id_fkey"
                        columns: ["class_id"]
                        isOneToOne: false
                        referencedRelation: "classes"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "sessions_coach_id_fkey"
                        columns: ["coach_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            user_sessions: {
                Row: {
                    checked_in: boolean | null
                    created_at: string | null
                    id: string
                    session_id: string | null
                    status: string
                    user_id: string | null
                }
                Insert: {
                    checked_in?: boolean | null
                    created_at?: string | null
                    id?: string
                    session_id?: string | null
                    status?: string
                    user_id?: string | null
                }
                Update: {
                    checked_in?: boolean | null
                    created_at?: string | null
                    id?: string
                    session_id?: string | null
                    status?: string
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "user_sessions_session_id_fkey"
                        columns: ["session_id"]
                        isOneToOne: false
                        referencedRelation: "sessions"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "user_sessions_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            wods: {
                Row: {
                    blocks: Json | null
                    box_id: string | null
                    created_at: string | null
                    date: string
                    description: string | null
                    id: string
                    program_id: string | null
                    title: string
                }
                Insert: {
                    blocks?: Json | null
                    box_id?: string | null
                    created_at?: string | null
                    date: string
                    description?: string | null
                    id?: string
                    program_id?: string | null
                    title: string
                }
                Update: {
                    blocks?: Json | null
                    box_id?: string | null
                    created_at?: string | null
                    date?: string
                    description?: string | null
                    id?: string
                    program_id?: string | null
                    title?: string
                }
                Relationships: []
            }
            bookings: {
                Row: {
                    id: string
                    user_id: string | null
                    session_id: string | null
                    class_id: string | null
                    box_id: string | null
                    status: string | null
                    checked_in_at: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    session_id?: string | null
                    class_id?: string | null
                    box_id?: string | null
                    status?: string | null
                    checked_in_at?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    session_id?: string | null
                    class_id?: string | null
                    box_id?: string | null
                    status?: string | null
                    checked_in_at?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            expenses: {
                Row: {
                    id: string
                    box_id: string | null
                    category: string | null
                    description: string | null
                    amount: number
                    date: string | null
                    vendor: string | null
                    is_recurring: boolean | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    box_id?: string | null
                    category?: string | null
                    description?: string | null
                    amount: number
                    date?: string | null
                    vendor?: string | null
                    is_recurring?: boolean | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    box_id?: string | null
                    category?: string | null
                    description?: string | null
                    amount?: number
                    date?: string | null
                    vendor?: string | null
                    is_recurring?: boolean | null
                    created_at?: string | null
                }
                Relationships: []
            }
            functional_feedback: {
                Row: {
                    id: string
                    session_id: string | null
                    athlete_id: string | null
                    coach_id: string | null
                    movement_id: string | null
                    rating: number | null
                    notes: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    session_id?: string | null
                    athlete_id?: string | null
                    coach_id?: string | null
                    movement_id?: string | null
                    rating?: number | null
                    notes?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    session_id?: string | null
                    athlete_id?: string | null
                    coach_id?: string | null
                    movement_id?: string | null
                    rating?: number | null
                    notes?: string | null
                    created_at?: string | null
                }
                Relationships: []
            }
            invoices: {
                Row: {
                    id: string
                    user_id: string | null
                    box_id: string | null
                    membership_id: string | null
                    amount: number
                    status: string | null
                    due_date: string | null
                    paid_at: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    box_id?: string | null
                    membership_id?: string | null
                    amount: number
                    status?: string | null
                    due_date?: string | null
                    paid_at?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    box_id?: string | null
                    membership_id?: string | null
                    amount?: number
                    status?: string | null
                    due_date?: string | null
                    paid_at?: string | null
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "invoices_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            leads: {
                Row: {
                    id: string
                    box_id: string | null
                    first_name: string | null
                    last_name: string | null
                    email: string | null
                    phone: string | null
                    source: string | null
                    status: string | null
                    notes: string | null
                    assigned_to: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    box_id?: string | null
                    first_name?: string | null
                    last_name?: string | null
                    email?: string | null
                    phone?: string | null
                    source?: string | null
                    status?: string | null
                    notes?: string | null
                    assigned_to?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    box_id?: string | null
                    first_name?: string | null
                    last_name?: string | null
                    email?: string | null
                    phone?: string | null
                    source?: string | null
                    status?: string | null
                    notes?: string | null
                    assigned_to?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            memberships: {
                Row: {
                    id: string
                    user_id: string | null
                    plan_id: string | null
                    box_id: string | null
                    status: string | null
                    start_date: string | null
                    end_date: string | null
                    remaining_credits: number | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    plan_id?: string | null
                    box_id?: string | null
                    status?: string | null
                    start_date?: string | null
                    end_date?: string | null
                    remaining_credits?: number | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    plan_id?: string | null
                    box_id?: string | null
                    status?: string | null
                    start_date?: string | null
                    end_date?: string | null
                    remaining_credits?: number | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "memberships_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "memberships_plan_id_fkey"
                        columns: ["plan_id"]
                        isOneToOne: false
                        referencedRelation: "plans"
                        referencedColumns: ["id"]
                    },
                ]
            }
            movements: {
                Row: {
                    id: string
                    name: string
                    category: string | null
                    description: string | null
                    video_url: string | null
                    image_url: string | null
                    demo_url: string | null
                    box_id: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    name: string
                    category?: string | null
                    description?: string | null
                    video_url?: string | null
                    image_url?: string | null
                    demo_url?: string | null
                    box_id?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    name?: string
                    category?: string | null
                    description?: string | null
                    video_url?: string | null
                    image_url?: string | null
                    demo_url?: string | null
                    box_id?: string | null
                    created_at?: string | null
                }
                Relationships: []
            }
            personal_records: {
                Row: {
                    id: string
                    athlete_id: string | null
                    movement_id: string | null
                    value: number | null
                    unit: string | null
                    date: string | null
                    notes: string | null
                    box_id: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    athlete_id?: string | null
                    movement_id?: string | null
                    value?: number | null
                    unit?: string | null
                    date?: string | null
                    notes?: string | null
                    box_id?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    athlete_id?: string | null
                    movement_id?: string | null
                    value?: number | null
                    unit?: string | null
                    date?: string | null
                    notes?: string | null
                    box_id?: string | null
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "personal_records_athlete_id_fkey"
                        columns: ["athlete_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "personal_records_movement_id_fkey"
                        columns: ["movement_id"]
                        isOneToOne: false
                        referencedRelation: "movements"
                        referencedColumns: ["id"]
                    },
                ]
            }
            plans: {
                Row: {
                    id: string
                    name: string
                    price: number
                    interval: string
                    features: string[]
                    is_featured: boolean | null
                    popular_tag: string | null
                    button_text: string | null
                    created_at: string | null
                    updated_at: string | null
                    box_id: string | null
                    duration_days: number | null
                    total_credits: number | null
                }
                Insert: {
                    id?: string
                    name: string
                    price: number
                    interval?: string
                    features?: string[]
                    is_featured?: boolean | null
                    popular_tag?: string | null
                    button_text?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                    box_id?: string | null
                    duration_days?: number | null
                    total_credits?: number | null
                }
                Update: {
                    id?: string
                    name?: string
                    price?: number
                    interval?: string
                    features?: string[]
                    is_featured?: boolean | null
                    popular_tag?: string | null
                    button_text?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                    box_id?: string | null
                    duration_days?: number | null
                    total_credits?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "plans_box_id_fkey"
                        columns: ["box_id"]
                        isOneToOne: false
                        referencedRelation: "boxes"
                        referencedColumns: ["id"]
                    },
                ]
            }
            results: {
                Row: {
                    id: string
                    athlete_id: string | null
                    wod_id: string | null
                    score: string | null
                    rx: boolean | null
                    notes: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    athlete_id?: string | null
                    wod_id?: string | null
                    score?: string | null
                    rx?: boolean | null
                    notes?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    athlete_id?: string | null
                    wod_id?: string | null
                    score?: string | null
                    rx?: boolean | null
                    notes?: string | null
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "results_athlete_id_fkey"
                        columns: ["athlete_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "results_wod_id_fkey"
                        columns: ["wod_id"]
                        isOneToOne: false
                        referencedRelation: "wods"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            competition_scoring_system: "low_point" | "table_point"
            score_status: "pending" | "submitted" | "verified" | "invalid" | "dns" | "dnf"
            wod_type: "for_time" | "amrap" | "rm" | "complex"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
