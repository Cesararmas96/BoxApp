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
                    changed_by: string | null
                    created_at: string | null
                    id: string
                    new_data: Json | null
                    old_data: Json | null
                    record_id: string
                    table_name: string
                }
                Insert: {
                    action: string
                    changed_by?: string | null
                    created_at?: string | null
                    id?: string
                    new_data?: Json | null
                    old_data?: Json | null
                    record_id: string
                    table_name: string
                }
                Update: {
                    action?: string
                    changed_by?: string | null
                    created_at?: string | null
                    id?: string
                    new_data?: Json | null
                    old_data?: Json | null
                    record_id?: string
                    table_name?: string
                }
                Relationships: []
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
                Relationships: [
                    {
                        foreignKeyName: "automation_logs_box_id_fkey"
                        columns: ["box_id"]
                        isOneToOne: false
                        referencedRelation: "boxes"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "automation_logs_performed_by_fkey"
                        columns: ["performed_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "automation_logs_target_user_id_fkey"
                        columns: ["target_user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            bookings: {
                Row: {
                    box_id: string | null
                    created_at: string | null
                    id: string
                    session_id: string | null
                    status: string | null
                    user_id: string | null
                }
                Insert: {
                    box_id?: string | null
                    created_at?: string | null
                    id?: string
                    session_id?: string | null
                    status?: string | null
                    user_id?: string | null
                }
                Update: {
                    box_id?: string | null
                    created_at?: string | null
                    id?: string
                    session_id?: string | null
                    status?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "bookings_box_id_fkey"
                        columns: ["box_id"]
                        isOneToOne: false
                        referencedRelation: "boxes"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "bookings_session_id_fkey"
                        columns: ["session_id"]
                        isOneToOne: false
                        referencedRelation: "sessions"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "bookings_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            box_settings: {
                Row: {
                    box_name: string | null
                    favicon_url: string | null
                    id: number
                    logo_url: string | null
                    updated_at: string | null
                }
                Insert: {
                    box_name?: string | null
                    favicon_url?: string | null
                    id: number
                    logo_url?: string | null
                    updated_at?: string | null
                }
                Update: {
                    box_name?: string | null
                    favicon_url?: string | null
                    id?: number
                    logo_url?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            boxes: {
                Row: {
                    created_at: string | null
                    favicon_url: string | null
                    id: string
                    logo_url: string | null
                    name: string
                    slug: string
                    theme_config: Json | null
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    favicon_url?: string | null
                    id?: string
                    logo_url?: string | null
                    name: string
                    slug: string
                    theme_config?: Json | null
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    favicon_url?: string | null
                    id?: string
                    logo_url?: string | null
                    name?: string
                    slug?: string
                    theme_config?: Json | null
                    updated_at?: string | null
                }
                Relationships: []
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
                }
                Insert: {
                    box_id?: string | null
                    competition_id?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    name: string
                    order_index?: number | null
                    scoring_type?: string | null
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
                }
                Relationships: [
                    {
                        foreignKeyName: "competition_events_box_id_fkey"
                        columns: ["box_id"]
                        isOneToOne: false
                        referencedRelation: "boxes"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "competition_events_competition_id_fkey"
                        columns: ["competition_id"]
                        isOneToOne: false
                        referencedRelation: "competitions"
                        referencedColumns: ["id"]
                    },
                ]
            }
            competition_judges: {
                Row: {
                    box_id: string | null
                    competition_id: string | null
                    created_at: string | null
                    id: string
                    user_id: string | null
                }
                Insert: {
                    box_id?: string | null
                    competition_id?: string | null
                    created_at?: string | null
                    id?: string
                    user_id?: string | null
                }
                Update: {
                    box_id?: string | null
                    competition_id?: string | null
                    created_at?: string | null
                    id?: string
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "competition_judges_box_id_fkey"
                        columns: ["box_id"]
                        isOneToOne: false
                        referencedRelation: "boxes"
                        referencedColumns: ["id"]
                    },
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
                    competition_id: string | null
                    created_at: string | null
                    division: string | null
                    id: string
                    status: string | null
                    user_id: string | null
                }
                Insert: {
                    box_id?: string | null
                    competition_id?: string | null
                    created_at?: string | null
                    division?: string | null
                    id?: string
                    status?: string | null
                    user_id?: string | null
                }
                Update: {
                    box_id?: string | null
                    competition_id?: string | null
                    created_at?: string | null
                    division?: string | null
                    id?: string
                    status?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "competition_participants_box_id_fkey"
                        columns: ["box_id"]
                        isOneToOne: false
                        referencedRelation: "boxes"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "competition_participants_competition_id_fkey"
                        columns: ["competition_id"]
                        isOneToOne: false
                        referencedRelation: "competitions"
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
            expenses: {
                Row: {
                    amount: number | null
                    box_id: string | null
                    category: string | null
                    created_at: string | null
                    date: string | null
                    description: string | null
                    id: string
                    updated_at: string | null
                }
                Insert: {
                    amount?: number | null
                    box_id?: string | null
                    category?: string | null
                    created_at?: string | null
                    date?: string | null
                    description?: string | null
                    id?: string
                    updated_at?: string | null
                }
                Update: {
                    amount?: number | null
                    box_id?: string | null
                    category?: string | null
                    created_at?: string | null
                    date?: string | null
                    description?: string | null
                    id?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "expenses_box_id_fkey"
                        columns: ["box_id"]
                        isOneToOne: false
                        referencedRelation: "boxes"
                        referencedColumns: ["id"]
                    },
                ]
            }
            competition_scores: {
                Row: {
                    box_id: string | null
                    created_at: string | null
                    event_id: string | null
                    id: string
                    is_validated: boolean | null
                    participant_id: string | null
                    score_value: number | null
                    validated_by: string | null
                }
                Insert: {
                    box_id?: string | null
                    created_at?: string | null
                    event_id?: string | null
                    id?: string
                    is_validated?: boolean | null
                    participant_id?: string | null
                    score_value?: number | null
                    validated_by?: string | null
                }
                Update: {
                    box_id?: string | null
                    created_at?: string | null
                    event_id?: string | null
                    id?: string
                    is_validated?: boolean | null
                    participant_id?: string | null
                    score_value?: number | null
                    validated_by?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "competition_scores_box_id_fkey"
                        columns: ["box_id"]
                        isOneToOne: false
                        referencedRelation: "boxes"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "competition_scores_event_id_fkey"
                        columns: ["event_id"]
                        isOneToOne: false
                        referencedRelation: "competition_events"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "competition_scores_participant_id_fkey"
                        columns: ["participant_id"]
                        isOneToOne: false
                        referencedRelation: "competition_participants"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "competition_scores_validated_by_fkey"
                        columns: ["validated_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            competitions: {
                Row: {
                    box_id: string | null
                    created_at: string | null
                    description: string | null
                    end_date: string | null
                    id: string
                    name: string
                    start_date: string | null
                    status: string | null
                    type: string | null
                }
                Insert: {
                    box_id?: string | null
                    created_at?: string | null
                    description?: string | null
                    end_date?: string | null
                    id?: string
                    name: string
                    start_date?: string | null
                    status?: string | null
                    type?: string | null
                }
                Update: {
                    box_id?: string | null
                    created_at?: string | null
                    description?: string | null
                    end_date?: string | null
                    id?: string
                    name?: string
                    start_date?: string | null
                    status?: string | null
                    type?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "competitions_box_id_fkey"
                        columns: ["box_id"]
                        isOneToOne: false
                        referencedRelation: "boxes"
                        referencedColumns: ["id"]
                    },
                ]
            }
            functional_feedback: {
                Row: {
                    athlete_id: string | null
                    coach_private_note: string | null
                    created_at: string | null
                    effort_score: number | null
                    fatigue_level: number | null
                    id: string
                    satisfaction: string | null
                    session_id: string | null
                }
                Insert: {
                    athlete_id?: string | null
                    coach_private_note?: string | null
                    created_at?: string | null
                    effort_score?: number | null
                    fatigue_level?: number | null
                    id?: string
                    satisfaction?: string | null
                    session_id?: string | null
                }
                Update: {
                    athlete_id?: string | null
                    coach_private_note?: string | null
                    created_at?: string | null
                    effort_score?: number | null
                    fatigue_level?: number | null
                    id?: string
                    satisfaction?: string | null
                    session_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "functional_feedback_athlete_id_fkey"
                        columns: ["athlete_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "functional_feedback_session_id_fkey"
                        columns: ["session_id"]
                        isOneToOne: false
                        referencedRelation: "sessions"
                        referencedColumns: ["id"]
                    }
                ]
            }
            invoices: {
                Row: {
                    amount: number | null
                    box_id: string | null
                    created_at: string | null
                    due_date: string | null
                    id: string
                    status: string | null
                    user_id: string | null
                }
                Insert: {
                    amount?: number | null
                    box_id?: string | null
                    created_at?: string | null
                    due_date?: string | null
                    id?: string
                    status?: string | null
                    user_id?: string | null
                }
                Update: {
                    amount?: number | null
                    box_id?: string | null
                    created_at?: string | null
                    due_date?: string | null
                    id?: string
                    status?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "invoices_box_id_fkey"
                        columns: ["box_id"]
                        isOneToOne: false
                        referencedRelation: "boxes"
                        referencedColumns: ["id"]
                    },
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
                    box_id: string | null
                    created_at: string | null
                    email: string | null
                    first_name: string | null
                    id: string
                    last_name: string | null
                    notes: string | null
                    phone: string | null
                    source: string | null
                    status: string | null
                }
                Insert: {
                    box_id?: string | null
                    created_at?: string | null
                    email?: string | null
                    first_name?: string | null
                    id?: string
                    last_name?: string | null
                    notes?: string | null
                    phone?: string | null
                    source?: string | null
                    status?: string | null
                }
                Update: {
                    box_id?: string | null
                    created_at?: string | null
                    email?: string | null
                    first_name?: string | null
                    id?: string
                    last_name?: string | null
                    notes?: string | null
                    phone?: string | null
                    source?: string | null
                    status?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "leads_box_id_fkey"
                        columns: ["box_id"]
                        isOneToOne: false
                        referencedRelation: "boxes"
                        referencedColumns: ["id"]
                    },
                ]
            }
            movements: {
                Row: {
                    box_id: string | null
                    category: string | null
                    created_at: string | null
                    demo_url: string | null
                    id: string
                    name: string
                }
                Insert: {
                    box_id?: string | null
                    category?: string | null
                    created_at?: string | null
                    demo_url?: string | null
                    id?: string
                    name: string
                }
                Update: {
                    box_id?: string | null
                    category?: string | null
                    created_at?: string | null
                    demo_url?: string | null
                    id?: string
                    name?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "movements_box_id_fkey"
                        columns: ["box_id"]
                        isOneToOne: false
                        referencedRelation: "boxes"
                        referencedColumns: ["id"]
                    },
                ]
            }
            memberships: {
                Row: {
                    box_id: string | null
                    created_at: string | null
                    end_date: string | null
                    id: string
                    plan_id: string | null
                    start_date: string | null
                    status: string | null
                    user_id: string | null
                }
                Insert: {
                    box_id?: string | null
                    created_at?: string | null
                    end_date?: string | null
                    id?: string
                    plan_id?: string | null
                    start_date?: string | null
                    status?: string | null
                    user_id?: string | null
                }
                Update: {
                    box_id?: string | null
                    created_at?: string | null
                    end_date?: string | null
                    id?: string
                    plan_id?: string | null
                    start_date?: string | null
                    status?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "memberships_box_id_fkey"
                        columns: ["box_id"]
                        isOneToOne: false
                        referencedRelation: "boxes"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "memberships_plan_id_fkey"
                        columns: ["plan_id"]
                        isOneToOne: false
                        referencedRelation: "plans"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "memberships_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            plans: {
                Row: {
                    duration_days: number | null
                    total_credits: number | null
                    box_id: string | null
                    button_text: string | null
                    created_at: string | null
                    features: string[] | null
                    id: string
                    interval: string | null
                    is_featured: boolean | null
                    name: string | null
                    popular_tag: string | null
                    price: number | null
                    updated_at: string | null
                }
                Insert: {
                    duration_days?: number | null
                    total_credits?: number | null
                    box_id?: string | null
                    button_text?: string | null
                    created_at?: string | null
                    features?: string[] | null
                    id?: string
                    interval?: string | null
                    is_featured?: boolean | null
                    name?: string | null
                    popular_tag?: string | null
                    price?: number | null
                    updated_at?: string | null
                }
                Update: {
                    duration_days?: number | null
                    total_credits?: number | null
                    box_id?: string | null
                    button_text?: string | null
                    created_at?: string | null
                    features?: string[] | null
                    id?: string
                    interval?: string | null
                    is_featured?: boolean | null
                    name?: string | null
                    popular_tag?: string | null
                    price?: number | null
                    updated_at?: string | null
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
            profiles: {
                Row: {
                    avatar_url: string | null
                    box_id: string | null
                    created_at: string | null
                    first_name: string | null
                    id: string
                    last_name: string | null
                    role_id: string | null
                    status: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    box_id?: string | null
                    created_at?: string | null
                    first_name?: string | null
                    id?: string
                    last_name?: string | null
                    role_id?: string | null
                    status?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    box_id?: string | null
                    created_at?: string | null
                    first_name?: string | null
                    id?: string
                    last_name?: string | null
                    role_id?: string | null
                    status?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_box_id_fkey"
                        columns: ["box_id"]
                        isOneToOne: false
                        referencedRelation: "boxes"
                        referencedColumns: ["id"]
                    },
                ]
            }
            sessions: {
                Row: {
                    box_id: string | null
                    capacity: number | null
                    coach_id: string | null
                    created_at: string | null
                    date: string | null
                    end_time: string | null
                    id: string
                    name: string | null
                    start_time: string | null
                    type: string | null
                }
                Insert: {
                    box_id?: string | null
                    capacity?: number | null
                    coach_id?: string | null
                    created_at?: string | null
                    date?: string | null
                    end_time?: string | null
                    id?: string
                    name?: string | null
                    start_time?: string | null
                    type?: string | null
                }
                Update: {
                    box_id?: string | null
                    capacity?: number | null
                    coach_id?: string | null
                    created_at?: string | null
                    date?: string | null
                    end_time?: string | null
                    id?: string
                    name?: string | null
                    start_time?: string | null
                    type?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "sessions_box_id_fkey"
                        columns: ["box_id"]
                        isOneToOne: false
                        referencedRelation: "boxes"
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
            results: {
                Row: {
                    athlete_id: string | null
                    box_id: string | null
                    created_at: string | null
                    id: string
                    result: string | null
                    rx: boolean | null
                    wod_id: string | null
                }
                Insert: {
                    athlete_id?: string | null
                    box_id?: string | null
                    created_at?: string | null
                    id?: string
                    result?: string | null
                    rx?: boolean | null
                    wod_id?: string | null
                }
                Update: {
                    athlete_id?: string | null
                    box_id?: string | null
                    created_at?: string | null
                    id?: string
                    result?: string | null
                    rx?: boolean | null
                    wod_id?: string | null
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
                        foreignKeyName: "results_box_id_fkey"
                        columns: ["box_id"]
                        isOneToOne: false
                        referencedRelation: "boxes"
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
            personal_records: {
                Row: {
                    box_id: string | null
                    id: string
                    movement_id: string | null
                    performed_at: string | null
                    user_id: string | null
                    value: string | null
                }
                Insert: {
                    box_id?: string | null
                    id?: string
                    movement_id?: string | null
                    performed_at?: string | null
                    user_id?: string | null
                    value?: string | null
                }
                Update: {
                    box_id?: string | null
                    id?: string
                    movement_id?: string | null
                    performed_at?: string | null
                    user_id?: string | null
                    value?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "personal_records_box_id_fkey"
                        columns: ["box_id"]
                        isOneToOne: false
                        referencedRelation: "boxes"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "personal_records_movement_id_fkey"
                        columns: ["movement_id"]
                        isOneToOne: false
                        referencedRelation: "movements"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "personal_records_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            session_types: {
                Row: {
                    box_id: string | null
                    color: string | null
                    created_at: string | null
                    id: string
                    name: string
                }
                Insert: {
                    box_id?: string | null
                    color?: string | null
                    created_at?: string | null
                    id?: string
                    name: string
                }
                Update: {
                    box_id?: string | null
                    color?: string | null
                    created_at?: string | null
                    id?: string
                    name?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "session_types_box_id_fkey"
                        columns: ["box_id"]
                        isOneToOne: false
                        referencedRelation: "boxes"
                        referencedColumns: ["id"]
                    },
                ]
            }
            wods: {
                Row: {
                    box_id: string | null
                    created_at: string | null
                    date: string | null
                    id: string
                    lesson_plan: Json[] | null
                    metcon: string | null
                    modalities: string[] | null
                    scaling_advanced: string | null
                    scaling_beginner: string | null
                    scaling_injured: string | null
                    scaling_intermediate: string | null
                    scaling_options: string | null
                    status: string | null
                    stimulus: string | null
                    structure: Json[] | null
                    title: string | null
                    track: string | null
                }
                Insert: {
                    box_id?: string | null
                    created_at?: string | null
                    date?: string | null
                    id?: string
                    lesson_plan?: Json[] | null
                    metcon?: string | null
                    modalities?: string[] | null
                    scaling_advanced?: string | null
                    scaling_beginner?: string | null
                    scaling_injured?: string | null
                    scaling_intermediate?: string | null
                    scaling_options?: string | null
                    status?: string | null
                    stimulus?: string | null
                    structure?: Json[] | null
                    title?: string | null
                    track?: string | null
                }
                Update: {
                    box_id?: string | null
                    created_at?: string | null
                    date?: string | null
                    id?: string
                    lesson_plan?: Json[] | null
                    metcon?: string | null
                    modalities?: string[] | null
                    scaling_advanced?: string | null
                    scaling_beginner?: string | null
                    scaling_injured?: string | null
                    scaling_intermediate?: string | null
                    scaling_options?: string | null
                    status?: string | null
                    stimulus?: string | null
                    structure?: Json[] | null
                    title?: string | null
                    track?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "wods_box_id_fkey"
                        columns: ["box_id"]
                        isOneToOne: false
                        referencedRelation: "boxes"
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
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type PublicSchema = Database["public"]

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]] extends {
        Tables: any
        Views: any
    }
        ? Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"]
        : never)
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]] extends {
        Tables: any
        Views: any
    }
        ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
            Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
                Row: infer R
            }
        ? R
        : never
        : never)
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]] extends { Tables: any }
        ? Database[PublicTableNameOrOptions["schema"]]["Tables"]
        : never)
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]] extends { Tables: any }
        ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
            Insert: infer I
        }
        ? I
        : never
        : never)
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]] extends { Tables: any }
        ? Database[PublicTableNameOrOptions["schema"]]["Tables"]
        : never)
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]] extends { Tables: any }
        ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
            Update: infer U
        }
        ? U
        : never
        : never)
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicEnumNameOrOptions["schema"]] extends { Enums: any }
        ? Database[PublicEnumNameOrOptions["schema"]]["Enums"]
        : never)
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicEnumNameOrOptions["schema"]] extends { Enums: any }
        ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
        : never)
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
