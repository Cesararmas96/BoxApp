import fs from 'fs';

const wodsContent = fs.readFileSync('wods.md', 'utf-8');
const lines = wodsContent.split('\n');

const skipWords = [
    'min', 'set', 'round', 'ronda', 'cada', 'every', 'aprox', 'minutos', 'descansar',
    'arranco', 'intentos', 'tabata', 't.c', 'cap', 'core', 'skill', 'tecnica',
    'warm-up', 'activación', 'entrada en calor', 'pliometría', 'lo mas pesado',
    'por pierna', 'mts', 'mtrs', 'mts run', 'warm up', 'warm-up', 'warmups',
    'pliometria', 'conditioning', 'chipper', 'for time', 'fort time', 'amrap',
    'skill', 'tecnica', 'luego', 'finalizando', 'opcional', 'test', 'buscando',
    'max ', 'maximal', 'progresivo', 'movilidad', 'activación core', 'hombros con bandas',
    '_____', '-----', '////////', 'aprox', 'exactos', 'tiros', 'cargar la barra',
    'emom', 'amrap', 'chipper', 'accesorios', 'tabata', 'skill', 'luego', 'combinado con',
    'si me siento bien', 'ronda'
];

const weightliftingKeywords = ['clean', 'snatch', 'squat', 'deadlift', 'press', 'jerk', 'thruster', 'swing', 'curl', 'dumbbell', 'kb', 'kettlebell', 'sand bag', 'plate', 'rack', 'lunges', 'weighted', 'ball', 'deadlift'];
const gymnasticsKeywords = ['pull-up', 'push-up', 't2b', 'hspu', 'muscle up', 'mu', 'hsp', 'dip', 'sit-up', 'burpee', 'plank', 'hollow', 'bridge', 'handstand', 'ring', 'box jump', 'pistol', 't2r', 'c2b', 'ghd', 'pike'];
const monostructuralKeywords = ['run', 'row', 'bike', 'swim', 'ski', 'shuttle', 'double under', 'jump rope', 'skipping', 'sprint', 'rowing', 'running'];

function categorize(name) {
    const lower = name.toLowerCase();
    if (weightliftingKeywords.some(k => lower.includes(k))) return 'Weightlifting';
    if (gymnasticsKeywords.some(k => lower.includes(k))) return 'Gymnastics';
    if (monostructuralKeywords.some(k => lower.includes(k))) return 'Monostructural';
    return 'Accessory';
}

const movements = new Set();

lines.forEach(line => {
    let trimmed = line.trim();
    if (!trimmed) return;

    // Skip separators
    if (trimmed.includes('---') || trimmed.includes('___')) return;

    let name = trimmed;

    // Cleanup noise
    name = name.replace(/\d+([xX×]|\sx\s)\d+/g, '').trim();
    name = name.replace(/\d+%/g, '').trim();
    name = name.replace(/\(\d+-\d+%\)/g, '').trim();
    name = name.replace(/\d+\s*rep[s]?/gi, '').trim();
    name = name.replace(/\d+\s*round[s]?/gi, '').trim();
    name = name.replace(/@.*/g, '').trim();
    name = name.replace(/^\d+[\s']*/, '').trim();
    name = name.replace(/[’”“\(\)\[\]]/g, '').trim();
    name = name.replace(/^[\w]\)\s*/, '').trim(); // Remove "A) ", "B) "
    name = name.replace(/^[\w]\s/, '').trim(); // Remove "A ", "B "
    name = name.replace(/^\//, '').trim(); // Remove leading /

    // Skip if name is too short or matches skip words
    if (name.length < 3) return;
    const lowerName = name.toLowerCase();
    if (skipWords.some(word => lowerName.includes(word))) return;

    // Check if it's a movement list like "10 Scap Pull-Ups, 12 Ring Rows"
    const parts = name.split(/[,\+]/);
    parts.forEach(p => {
        let cleaned = p.trim();
        // Remove leading numbers again for parts
        cleaned = cleaned.replace(/^\d+[\s']*/, '').trim();
        cleaned = cleaned.replace(/^[\w]\)\s*/, '').trim();
        cleaned = cleaned.replace(/^[\w]\s/, '').trim();
        cleaned = cleaned.replace(/^\//, '').trim();

        if (cleaned.length < 3) return;
        if (skipWords.some(word => cleaned.toLowerCase().includes(word))) return;

        // Capitalize first letter of each word
        const formatted = cleaned.split(' ')
            .map(word => {
                if (word.toLowerCase() === 't2b' || word.toLowerCase() === 'hspu' || word.toLowerCase() === 'mu' || word.toLowerCase() === 'kb') {
                    return word.toUpperCase();
                }
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .join(' ');

        movements.add(formatted);
    });
});

const result = Array.from(movements).map(name => ({
    name: name,
    category: categorize(name)
}));

console.log(JSON.stringify(result, null, 2));
