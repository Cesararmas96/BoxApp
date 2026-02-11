import { supabase } from '@/lib/supabaseClient';
import { generateLinearHeats } from './heatGenerator';

const WOD_TITLES = ['The Burner', 'Heavy Metal', 'Lung Crusher', 'Final Stand', 'Morning Glory', 'Nightmare', 'Speed Demon', 'Iron Will'];

export interface SeedOptions {
    divisionsCount?: number;
    participantsPerDivision?: number;
    eventsCount?: number;
    clearExisting?: boolean;
}

export const seedCompetition = async (competitionId: string, options: SeedOptions = {}) => {
    const {
        divisionsCount = 3,
        participantsPerDivision = 15,
        eventsCount = 4,
        clearExisting = true
    } = options;

    console.log(`[Seeding] Starting for competition ${competitionId}...`);

    try {
        if (clearExisting) {
            console.log('[Seeding] Clearing existing data...');
            // Order is important because of foreign keys
            await supabase.from('competition_scores').delete().eq('competition_id', competitionId);
            await supabase.from('lane_assignments').delete().filter('heat_id', 'in',
                (await supabase.from('competition_heats').select('id').eq('competition_id', competitionId)).data?.map(h => h.id) || []
            );
            await supabase.from('competition_heats').delete().eq('competition_id', competitionId);
            await supabase.from('competition_participants').delete().eq('competition_id', competitionId);
            await supabase.from('competition_events').delete().eq('competition_id', competitionId);
            await supabase.from('competition_divisions').delete().eq('competition_id', competitionId);
        }

        // 1. Create Divisions
        console.log('[Seeding] Creating divisions...');
        const divisionNames = ['RX', 'Intermediate', 'Scaled', 'Master 40+', 'Teen'];
        const divisionsToCreate = divisionNames.slice(0, divisionsCount).map((name) => ({
            competition_id: competitionId,
            name,
            description: `Official ${name} Division`
        }));

        const { data: divisions, error: divError } = await supabase
            .from('competition_divisions')
            .insert(divisionsToCreate)
            .select();

        if (divError || !divisions) throw divError || new Error('Failed to create divisions');

        // 2. Fetch some user profiles to use as participants
        const { data: profiles } = await supabase.from('profiles').select('id').limit(divisionsCount * participantsPerDivision);

        // 3. Create Participants
        console.log('[Seeding] Creating participants...');
        const participantsToCreate = [];
        for (const division of divisions) {
            for (let i = 0; i < participantsPerDivision; i++) {
                const profileId = profiles?.[(divisions.indexOf(division) * participantsPerDivision + i) % (profiles?.length || 1)]?.id;
                participantsToCreate.push({
                    competition_id: competitionId,
                    division_id: division.id,
                    user_id: profileId || null,
                    status: 'active',
                    checked_in: Math.random() > 0.3,
                    waiver_signed: Math.random() > 0.2
                });
            }
        }

        const { data: participants, error: partError } = await supabase
            .from('competition_participants')
            .insert(participantsToCreate)
            .select();

        if (partError || !participants) throw partError || new Error('Failed to create participants');

        // 4. Create Events
        console.log('[Seeding] Creating events...');
        const eventsToCreate = [];
        for (let i = 0; i < eventsCount; i++) {
            const scoringType = i % 2 === 0 ? 'time' : 'reps';
            eventsToCreate.push({
                competition_id: competitionId,
                title: WOD_TITLES[i % WOD_TITLES.length],
                name: WOD_TITLES[i % WOD_TITLES.length].toLowerCase().replace(/\s+/g, '_'),
                scoring_type: scoringType,
                order_index: i
            });
        }

        const { data: events, error: eventError } = await supabase
            .from('competition_events')
            .insert(eventsToCreate)
            .select();

        if (eventError || !events) throw eventError || new Error('Failed to create events');

        // 5. Create Heats and Lane Assignments
        console.log('[Seeding] Generating heats and lane assignments...');
        for (const event of events) {
            for (const division of divisions) {
                const divisionParticipants = participants.filter(p => p.division_id === division.id);
                const generatedHeats = generateLinearHeats(divisionParticipants as any, 8);

                for (const heat of generatedHeats) {
                    const { data: heatData, error: heatError } = await supabase
                        .from('competition_heats')
                        .insert([{
                            competition_id: competitionId,
                            event_id: event.id,
                            name: `${division.name} - ${heat.name}`,
                            status: 'pending'
                        }])
                        .select()
                        .single();

                    if (heatError || !heatData) continue;

                    const assignments = heat.assignments.map(a => ({
                        heat_id: heatData.id,
                        participant_id: a.participantId,
                        lane_number: a.lane
                    }));

                    await supabase.from('lane_assignments').insert(assignments);
                }
            }
        }

        // 6. Create Scores
        console.log('[Seeding] Generating semi-realistic scores...');
        const scoresToCreate = [];
        for (const event of events) {
            for (const participant of participants) {
                // Not everyone has a score (some DNS/DNF or just not reached yet)
                if (Math.random() > 0.2) {
                    const isTime = event.scoring_type === 'time';
                    const scoreValue = isTime
                        ? (400 + Math.floor(Math.random() * 600)) // 6:40 to 16:40
                        : (50 + Math.floor(Math.random() * 200)); // 50 to 250 reps

                    const displayValue = isTime
                        ? `${Math.floor(scoreValue / 60)}:${(scoreValue % 60).toString().padStart(2, '0')}`
                        : `${scoreValue} reps`;

                    scoresToCreate.push({
                        event_id: event.id,
                        participant_id: participant.id,
                        score_value: scoreValue,
                        score_display: displayValue,
                        status: 'valid' as const,
                        notes: Math.random() > 0.8 ? 'Great performance!' : null
                    });
                }
            }
        }

        const { error: scoreError } = await supabase
            .from('competition_scores')
            .insert(scoresToCreate as any);

        if (scoreError) console.error('[Seeding] Error creating scores:', scoreError);

        console.log('[Seeding] Finished successfully!');
        return { success: true };

    } catch (error) {
        console.error('[Seeding] Error:', error);
        return { success: false, error };
    }
};
