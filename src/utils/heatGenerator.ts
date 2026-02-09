
export interface Participant {
    id: string;
    [key: string]: any;
}

export interface LaneAssignment {
    lane: number;
    participantId: string;
}

export interface GeneratedHeat {
    name: string;
    assignments: LaneAssignment[];
}

/**
 * Distributes participants into heats based on the max number of lanes.
 * Currently implements a simple linear distribution (filling heats one by one).
 * 
 * @param participants List of participants to assign
 * @param lanesPerHeat Maximum number of athletes per heat
 * @param startHeatNumber Optional starting number for heat naming (default 1)
 * @returns Array of GeneratedHeat objects
 */
export const generateLinearHeats = (
    participants: Participant[],
    lanesPerHeat: number,
    startHeatNumber: number = 1
): GeneratedHeat[] => {
    const heats: GeneratedHeat[] = [];
    let currentHeatParticipants: LaneAssignment[] = [];
    let currentHeatIndex = 0;

    // Shuffle validation or sorting could happen here if needed, 
    // but we assume participants are passed in the desired order (e.g. by rank or random)

    for (let i = 0; i < participants.length; i++) {
        // defined lane number (1-indexed)
        const lane = (i % lanesPerHeat) + 1;

        currentHeatParticipants.push({
            lane,
            participantId: participants[i].id
        });

        // If heat is full or it's the last participant
        if (currentHeatParticipants.length === lanesPerHeat || i === participants.length - 1) {
            heats.push({
                name: `Heat ${startHeatNumber + currentHeatIndex}`,
                assignments: currentHeatParticipants
            });
            currentHeatParticipants = [];
            currentHeatIndex++;
        }
    }

    return heats;
};
