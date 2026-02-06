import fs from 'fs';

const movements = JSON.parse(fs.readFileSync('movements_list.json', 'utf-8'));
const boxId = 'fd14f401-d8a0-4ec3-b36e-e1c74676ab9e';

const finalMovements = movements.map(m => ({
    name: m.name,
    category: m.category,
    box_id: boxId
}));

fs.writeFileSync('movements_to_insert.json', JSON.stringify(finalMovements, null, 2));
console.log(`Prepared ${finalMovements.length} movements for insertion.`);
