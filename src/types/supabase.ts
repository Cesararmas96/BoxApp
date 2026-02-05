export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
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
                    created_at: string | null
                    id: string
                    metadata: Json | null
                    performed_by: string | null
                    status: string | null
                    target_user_id: string | null
                }
                Insert: {
                    action_type: string
                    created_at?: string | null
                    id?: string
                    metadata?: Json | null
                    performed_by?: string | null
                    status?: string | null
                    target_user_id?: string | null
                }
                Update: {
                    action_type?: string
                    created_at?: string | null
                    id?: string
                    metadata?: Json | null
                    performed_by?: string | null
                    status?: string | null
                    target_user_id?: string | null
                }
                Relationships: [
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
                    }
                ]
            }
            bookings: {
                Row: {
                    athlete_id: string | null
                    class_id: string | null
                    created_at: string | null
                    id: string
                    status: string | null
                }
                Insert: {
                    athlete_id?: string | null
                    class_id?: string | null
                    created_at?: string | null
                    id?: string
                    status?: string | null
                }
                Update: {
                    athlete_id?: string | null
                    class_id?: string | null
                    created_at?: string | null
                    id?: string
                    status?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "bookings_athlete_id_fkey"
                        columns: ["athlete_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "bookings_class_id_fkey"
                        columns: ["class_id"]
                        isOneToOne: false
                        referencedRelation: "classes"
                        referencedColumns: ["id"]
                    }
                ]
            }
            classes: {
                Row: {
                    capacity: number | null
                    coach_id: string | null
                    created_at: string | null
                    description: string | null
                    end_time: string
                    id: string
                    name: string
                    start_time: string
                }
                Insert: {
                    capacity?: number | null
                    coach_id?: string | null
                    created_at?: string | null
                    description?: string | null
                    end_time: string
                    id?: string
                    name: string
                    start_time: string
                }
                Update: {
                    capacity?: number | null
                    coach_id?: string | null
                    created_at?: string | null
                    description?: string | null
                    end_time?: string
                    id?: string
                    name?: string
                    start_time?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "classes_coach_id_fkey"
                        columns: ["coach_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            competition_events: {
                Row: {
                    competition_id: string | null
                    created_at: string | null
                    description: string | null
                    id: string
                    name: string
                    order_index: number | null
                    scoring_type: string
                    wod_id: string | null
                }
                Insert: {
                    competition_id?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    name: string
                    order_index?: number | null
                    scoring_type?: string
                    wod_id?: string | null
                }
                Update: {
                    competition_id?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    name?: string
                    order_index?: number | null
                    scoring_type?: string
                    wod_id?: string | null
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
                    }
                ]
            }
            competition_judges: {
                Row: {
                    competition_id: string | null
                    id: string
                    user_id: string | null
                }
                Insert: {
                    competition_id?: string | null
                    id?: string
                    user_id?: string | null
                }
                Update: {
                    competition_id?: string | null
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
                    }
                ]
            }
            competition_participants: {
                Row: {
                    athlete_id: string | null
                    category: string
                    competition_id: string | null
                    created_at: string | null
                    id: string
                    status: string
                }
                Insert: {
                    athlete_id?: string | null
                    category?: string
                    competition_id?: string | null
                    created_at?: string | null
                    id?: string
                    status?: string
                }
                Update: {
                    athlete_id?: string | null
                    category?: string
                    competition_id?: string | null
                    created_at?: string | null
                    id?: string
                    status?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "competition_participants_athlete_id_fkey"
                        columns: ["athlete_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "competition_participants_competition_id_fkey"
                        columns: ["competition_id"]
                        isOneToOne: false
                        referencedRelation: "competitions"
                        referencedColumns: ["id"]
                    }
                ]
            }
            competition_scores: {
                Row: {
                    created_at: string | null
                    event_id: string | null
                    id: string
                    is_validated: boolean | null
                    notes: string | null
                    participant_id: string | null
                    result_value: string
                    score_numerical: number | null
                    validated_by: string | null
                }
                Insert: {
                    created_at?: string | null
                    event_id?: string | null
                    id?: string
                    is_validated?: boolean | null
                    notes?: string | null
                    participant_id?: string | null
                    result_value: string
                    score_numerical?: number | null
                    validated_by?: string | null
                }
                Update: {
                    created_at?: string | null
                    event_id?: string | null
                    id?: string
                    is_validated?: boolean | null
                    notes?: string | null
                    participant_id?: string | null
                    result_value?: string
                    score_numerical?: number | null
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
                    }
                ]
            }
            competitions: {
                Row: {
                    created_at: string | null
                    description: string | null
                    end_date: string
                    id: string
                    start_date: string
                    status: string | null
                    title: string
                }
                Insert: {
                    created_at?: string | null
                    description?: string | null
                    end_date: string
                    id?: string
                    start_date: string
                    status?: string | null
                    title: string
                }
                Update: {
                    created_at?: string | null
                    description?: string | null
                    end_date?: string
                    id?: string
                    start_date?: string
                    status?: string | null
                    title?: string
                }
                Relationships: []
            }
            invoices: {
                Row: {
                    amount: number
                    created_at: string | null
                    id: string
                    status: string | null
                    user_id: string | null
                }
                Insert: {
                    amount: number
                    created_at?: string | null
                    id?: string
                    status?: string | null
                    user_id?: string | null
                }
                Update: {
                    amount?: number
                    created_at?: string | null
                    id?: string
                    status?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "invoices_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            leads: {
                Row: {
                    created_at: string | null
                    email: string | null
                    first_name: string
                    id: string
                    last_name: string | null
                    notes: string | null
                    phone: string | null
                    status: string | null
                }
                Insert: {
                    created_at?: string | null
                    email?: string | null
                    first_name: string
                    id?: string
                    last_name?: string | null
                    notes?: string | null
                    phone?: string | null
                    status?: string | null
                }
                Update: {
                    first_name?: string
                    last_name?: string | null
                    email?: string | null
                    phone?: string | null
                    status?: string | null
                    notes?: string | null
                    created_at?: string | null
                    id?: string
                }
                Relationships: []
            }
            memberships: {
                Row: {
                    created_at: string | null
                    end_date: string | null
                    id: string
                    plan_id: string | null
                    start_date: string
                    status: string | null
                    user_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    end_date?: string | null
                    id?: string
                    plan_id?: string | null
                    start_date: string
                    status?: string | null
                    user_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    end_date?: string | null
                    id?: string
                    plan_id?: string | null
                    start_date?: string
                    status?: string | null
                    user_id?: string | null
                }
                Relationships: [
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
                    }
                ]
            }
            movements: {
                Row: {
                    category: string | null
                    created_at: string | null
                    demo_url: string | null
                    id: string
                    name: string
                }
                Insert: {
                    category?: string | null
                    created_at?: string | null
                    demo_url?: string | null
                    id?: string
                    name: string
                }
                Update: {
                    category?: string | null
                    created_at?: string | null
                    demo_url?: string | null
                    id?: string
                    name?: string
                }
                Relationships: []
            }
            personal_records: {
                Row: {
                    created_at: string | null
                    date: string | null
                    id: string
                    movement_id: string | null
                    notes: string | null
                    reps: number | null
                    user_id: string | null
                    weight_kg: number | null
                }
                Insert: {
                    created_at?: string | null
                    date?: string | null
                    id?: string
                    movement_id?: string | null
                    notes?: string | null
                    reps?: number | null
                    user_id?: string | null
                    weight_kg?: number | null
                }
                Update: {
                    created_at?: string | null
                    date?: string | null
                    id?: string
                    movement_id?: string | null
                    notes?: string | null
                    reps?: number | null
                    user_id?: string | null
                    weight_kg?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "personal_records_movement_id_fkey"
                        columns: ["movement_id"]
                        isOneToOne: false
                        referencedRelation: "movements"
                        referencedColumns: ["id"]
                    }
                ]
            }
            plans: {
                Row: {
                    button_text: string | null
                    created_at: string | null
                    features: string[] | null
                    id: string
                    interval: string | null
                    is_featured: boolean | null
                    name: string
                    popular_tag: string | null
                    price: number
                    updated_at: string | null
                }
                Insert: {
                    button_text?: string | null
                    created_at?: string | null
                    features?: string[] | null
                    id?: string
                    interval?: string | null
                    is_featured?: boolean | null
                    name: string
                    popular_tag?: string | null
                    price: number
                    updated_at?: string | null
                }
                Update: {
                    button_text?: string | null
                    created_at?: string | null
                    features?: string[] | null
                    id?: string
                    interval?: string | null
                    is_featured?: boolean | null
                    name?: string
                    popular_tag?: string | null
                    price?: number
                    updated_at?: string | null
                }
                Relationships: []
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    created_at: string | null
                    first_name: string | null
                    id: string
                    last_name: string | null
                    role_id: string | null
                    status: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    created_at?: string | null
                    first_name?: string | null
                    id: string
                    last_name?: string | null
                    role_id?: string | null
                    status?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    created_at?: string | null
                    first_name?: string | null
                    id?: string
                    last_name?: string | null
                    role_id?: string | null
                    status?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_role_id_fkey"
                        columns: ["role_id"]
                        isOneToOne: false
                        referencedRelation: "roles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            results: {
                Row: {
                    athlete_id: string | null
                    created_at: string | null
                    id: string
                    notes: string | null
                    rx_scaled: string | null
                    score: string
                    wod_id: string | null
                }
                Insert: {
                    athlete_id?: string | null
                    created_at?: string | null
                    id?: string
                    notes?: string | null
                    rx_scaled?: string | null
                    score: string
                    wod_id?: string | null
                }
                Update: {
                    athlete_id?: string | null
                    created_at?: string | null
                    id?: string
                    notes?: string | null
                    rx_scaled?: string | null
                    score?: string
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
                        foreignKeyName: "results_wod_id_fkey"
                        columns: ["wod_id"]
                        isOneToOne: false
                        referencedRelation: "wods"
                        referencedColumns: ["id"]
                    }
                ]
            }
            roles: {
                Row: {
                    created_at: string | null
                    description: string | null
                    id: string
                    name: string
                }
                Insert: {
                    created_at?: string | null
                    description?: string | null
                    id: string
                    name: string
                }
                Update: {
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    name?: string
                }
                Relationships: []
            }
            wods: {
                Row: {
                    coach_id: string | null
                    created_at: string | null
                    date: string
                    description: Json | null
                    id: string
                    title: string
                }
                Insert: {
                    coach_id?: string | null
                    created_at?: string | null
                    date: string
                    description?: Json | null
                    id?: string
                    title: string
                }
                Update: {
                    coach_id?: string | null
                    created_at?: string | null
                    date?: string
                    description?: Json | null
                    id?: string
                    title?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "wods_coach_id_fkey"
                        columns: ["coach_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
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
