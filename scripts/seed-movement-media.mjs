#!/usr/bin/env node
/**
 * seed-movement-media.mjs — FEAT-009: Movement Media Library
 *
 * Downloads exercise images from free-exercise-db (GitHub, public domain)
 * and uploads them to Supabase Storage, then updates the movements table.
 *
 * Source: https://github.com/yuhonas/free-exercise-db (873 exercises, 2 images each)
 *
 * Usage:
 *   ( set -a; source .env; set +a; node scripts/seed-movement-media.mjs --dry-run )
 *   ( set -a; source .env; set +a; node scripts/seed-movement-media.mjs )
 *   ( set -a; source .env; set +a; node scripts/seed-movement-media.mjs --force )
 *
 * Required env vars: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config ────────────────────────────────────────────────────────────────

const GITHUB_RAW = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main';
const EXERCISES_JSON_URL = `${GITHUB_RAW}/dist/exercises.json`;
const STORAGE_BUCKET = 'movement-media';

// ─── CLI Args ──────────────────────────────────────────────────────────────

function parseArgs(argv) {
  return {
    dryRun: argv.includes('--dry-run'),
    force: argv.includes('--force'),
    limit: (() => {
      const idx = argv.indexOf('--limit');
      return idx !== -1 ? parseInt(argv[idx + 1], 10) : 0;
    })(),
  };
}

const args = parseArgs(process.argv);

// ─── Env Validation ────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── Helpers ───────────────────────────────────────────────────────────────

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalize(name) {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/['']/g, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isStorageUrl(url) {
  return url && url.includes('/storage/v1/object/public/movement-media/');
}

function isDefaultSvg(url) {
  return url && url.startsWith('/movements/');
}

// ─── Load Free Exercise DB ─────────────────────────────────────────────────

async function loadExerciseDB() {
  console.log('📥 Downloading free-exercise-db catalog...');
  const res = await fetch(EXERCISES_JSON_URL);
  if (!res.ok) throw new Error(`Failed to download exercise DB: ${res.status}`);
  const exercises = await res.json();
  console.log(`   Loaded ${exercises.length} exercises`);

  // Build lookup index: normalized name → exercise
  const index = new Map();
  for (const ex of exercises) {
    const key = normalize(ex.name);
    index.set(key, ex);
    // Also index without common prefixes for fuzzy matching
    const words = key.split(' ');
    if (words.length > 1) {
      // Index by last two words for compound names
      index.set(words.slice(-2).join(' '), ex);
    }
  }

  return { exercises, index };
}

// ─── Name Matching ─────────────────────────────────────────────────────────

/**
 * Map our movement names to free-exercise-db names.
 * Uses: 1) manual mapping, 2) exact normalized match, 3) fuzzy substring match
 */
const MANUAL_MATCH = {
  // Weightlifting
  'back squat': 'barbell full squat',
  'front squat': 'barbell front squat',
  'overhead squat': 'barbell overhead squat',
  'deadlift': 'barbell deadlift',
  'sumo deadlift': 'sumo deadlift',
  'romanian deadlift': 'romanian deadlift with dumbbells',
  'stiff leg deadlift': 'stiff leg barbell deadlift',
  'clean': 'clean and jerk',
  'power clean': 'power clean',
  'clean and jerk': 'clean and jerk',
  'snatch': 'barbell snatch',
  'push press': 'push press',
  'strict press': 'standing barbell press behind neck',
  'thruster': 'thrusters',
  'bench press': 'barbell bench press - medium grip',
  'incline press': 'barbell incline bench press - medium grip',
  'good morning': 'good morning',
  'walking lunges': 'barbell walking lunge',
  'reverse lunges': 'barbell rear lunge',
  'front rack lunges': 'barbell lunge',
  'sumo deadlift high pull': 'sumo deadlift',
  'hip thrust': 'barbell hip thrust',
  // Gymnastics
  'pull up': 'pullups',
  'pull ups': 'pullups',
  'kipping pull up': 'pullups',
  'strict pull up': 'pullups',
  'strict pull ups': 'pullups',
  'butterfly pull up': 'pullups',
  'chest to bar': 'pullups',
  'chest to bar pull up': 'pullups',
  'c2b': 'pullups',
  'push up': 'pushups',
  'push ups': 'pushups',
  'handstand push up': 'handstand push-ups',
  'hspu': 'handstand push-ups',
  'hsp strict': 'handstand push-ups',
  'strict handstand push up': 'handstand push-ups',
  'deficit handstand push up': 'handstand push-ups',
  'ring dip': 'ring dips',
  'ring dips': 'ring dips',
  'bar dip': 'dips - chest version',
  'ring row': 'inverted row',
  'inverted row': 'inverted row',
  'toes to bar': 'hanging leg raise',
  'knees to elbow': 'hanging leg raise',
  't2r': 'hanging leg raise',
  'hollow hold': 'flat bench lying leg raise',
  'hollow rock': 'flat bench lying leg raise',
  'hollow': 'flat bench lying leg raise',
  'l sit': 'flat bench lying leg raise',
  'air squat': 'bodyweight squat',
  'air squats': 'bodyweight squat',
  'pistol squat': 'pistol squat',
  'pistol squats': 'pistol squat',
  'box jump': 'box jump (multiple response)',
  'box jump over': 'box jump (multiple response)',
  'box step up': 'dumbbell step ups',
  'burpee': 'burpees',
  'burpees': 'burpees',
  'bar facing burpee': 'burpees',
  'bar facing burpees': 'burpees',
  'burpees over bar': 'burpees',
  'burpees box jump': 'burpees',
  'burpee box jump over': 'burpees',
  'sit up': 'sit-up',
  'sit ups': 'sit-up',
  'ab mat sit up': 'sit-up',
  'ghd sit up': 'glute ham raise',
  'ghd sit ups': 'glute ham raise',
  'ghd hip extension': 'glute ham raise',
  'rope climb': 'rope climbing',
  'rope climbs': 'rope climbing',
  'wall walk': 'bodyweight walking lunge',
  'v up': 'v-bar pullup',
  'plank': 'plank',
  'side plank': 'side bridge',
  'broad jump': 'frog jump',
  // Monostructural
  'running': 'jogging-treadmill',
  'run': 'jogging-treadmill',
  'rowing': 'rowing, stationary',
  'row': 'rowing, stationary',
  'assault bike': 'bicycling, stationary',
  'echo bike': 'bicycling, stationary',
  'double under': 'rope jumping',
  'double unders': 'rope jumping',
  'doble unders': 'rope jumping',
  'single under': 'rope jumping',
  'single unders': 'rope jumping',
  'ski erg': 'rowing, stationary',
  'shuttle run': 'jogging-treadmill',
  'sprint': 'jogging-treadmill',
  // Accessory
  'wall ball': 'wall ball squat',
  'wall balls': 'wall ball squat',
  'kettlebell swing': 'kettlebell one-arm row',
  'kb swing': 'kettlebell one-arm row',
  'goblet squat': 'goblet squat',
  'kb goblet squat': 'goblet squat',
  'turkish get up': 'kettlebell turkish get-up (squat style)',
  'dumbbell snatch': 'dumbbell one-arm snatch',
  'dumbbell thruster': 'dumbbell squat',
  'dumbbell thrusters': 'dumbbell squat',
  'dumbell thrusters': 'dumbbell squat',
  'dumbbell front squat': 'dumbbell front squat',
  'dumbbell overhead squat': 'overhead squat',
  'dumbell overhead squats': 'overhead squat',
  'dumbbell clean and jerk': 'clean and jerk',
  'dumbell power clean and jerk': 'clean and jerk',
  'devil press': 'dumbbell one-arm snatch',
  'farmers carry': 'farmer\'s walk',
  'farmer carry': 'farmer\'s walk',
  'sled push': 'prowler sprint',
  'med ball slam': 'medicine ball chest pass',
  'med ball clean': 'medicine ball chest pass',
  'med ball chest pass': 'medicine ball chest pass',
  'sandbag clean': 'clean and jerk',
  'sand bag clean': 'clean and jerk',
  'dead bug': 'dead bug',
  'cossack squat': 'side lunge',
  'glute bridge': 'barbell glute bridge',
  'hammer curl': 'hammer curls',
  'biceps curl barra': 'barbell curl',
  'face pull': 'face pull',
  'banded pull apart': 'face pull',
  'banded face pull': 'face pull',
  'lunges': 'barbell lunge',
  'extension de triceps': 'dumbbell one-arm triceps extension',
  'russian twist': 'russian twist',
  'reverse curl': 'barbell reverse curl',
  'hang clean': 'hang clean',
  'hang power snatch': 'power snatch',
  'power snatch': 'power snatch',
  'push jerk': 'push press',
  'muscle snatch': 'barbell snatch',
  'snatch balance': 'barbell snatch',
  'snatch pull': 'barbell snatch',
  'clean pull': 'clean and jerk',
  'bmu': 'pullups',
  'bar mu/c2b': 'pullups',
  'ring mu': 'ring dips',
  'bar muscle up': 'pullups',
  'ring muscle up': 'ring dips',
  'shoulder taps': 'pushups',
  'monster walks': 'side lunge',
  'skipping': 'rope jumping',
  'depth jump': 'frog jump',
  // Extra matches for user-entered variants
  'bar facing burpees': 'burpees',
  'burpees': 'burpees',
  'burpees bastardos': 'burpees',
  'burpees over bar': 'burpees',
  'burpees over the dumbell': 'burpees',
  'db facing burpees': 'burpees',
  'dumbell facing burpees': 'burpees',
  'thrusters': 'thrusters',
  'wall balls': 'wall ball squat',
  'wall climbs': 'bodyweight walking lunge',
  'broad jump': 'frog jump',
  'cossack squat': 'side lunge',
  'devil press': 'dumbbell one-arm snatch',
  'devils press alt': 'dumbbell one-arm snatch',
  'dead hang': 'pullups',
  'kb swing': 'kettlebell one-arm row',
  'kb swing 30/20': 'kettlebell one-arm row',
  'kb carry': 'farmer\'s walk',
  'suitcase carry': 'farmer\'s walk',
  'sang bag carry': 'farmer\'s walk',
  'hsw': 'handstand push-ups',
  'shuttle run': 'jogging-treadmill',
  'box front squat': 'barbell full squat',
  'dumbell front lunges': 'dumbbell lunges',
  'dumbell oh lunges': 'dumbbell lunges',
  'overhead mb throw': 'medicine ball chest pass',
  'jump shrug': 'barbell shrug',
  'banded strict press': 'standing barbell press behind neck',
  'walk wall': 'bodyweight walking lunge',
  'pike hold': 'handstand push-ups',
};

function findMatch(movementName, dbIndex) {
  const norm = normalize(movementName);

  // 1. Manual mapping
  if (MANUAL_MATCH[norm]) {
    const ex = dbIndex.get(normalize(MANUAL_MATCH[norm]));
    if (ex) return { exercise: ex, matchType: 'manual' };
  }

  // 2. Exact normalized match
  const exact = dbIndex.get(norm);
  if (exact) return { exercise: exact, matchType: 'exact' };

  // 3. Substring match: check if any exercise name contains our name or vice versa
  for (const [key, ex] of dbIndex.entries()) {
    if (key.includes(norm) || norm.includes(key)) {
      return { exercise: ex, matchType: 'fuzzy' };
    }
  }

  return null;
}

// ─── Download & Upload ─────────────────────────────────────────────────────

async function downloadImage(imagePath) {
  const url = `${GITHUB_RAW}/exercises/${imagePath}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status} for ${imagePath}`);
  return Buffer.from(await res.arrayBuffer());
}

async function uploadToStorage(slug, imageBuffer, ext = 'jpg') {
  const filePath = `${slug}.${ext}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, imageBuffer, {
      contentType: ext === 'jpg' ? 'image/jpeg' : 'image/png',
      upsert: true,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

async function updateMovementImageUrl(movementId, imageUrl) {
  const { error } = await supabase
    .from('movements')
    .update({ image_url: imageUrl })
    .eq('id', movementId);

  if (error) throw new Error(`DB update failed: ${error.message}`);
}

// ─── Main Pipeline ─────────────────────────────────────────────────────────

async function loadDBMovements() {
  const { data, error } = await supabase
    .from('movements')
    .select('id, name, category, image_url, demo_url, box_id')
    .order('name');

  if (error) {
    console.error('❌ Failed to load movements:', error.message);
    process.exit(1);
  }
  return data || [];
}

async function processMovement(movement, dbIndex, idx, total) {
  const { id, name, image_url } = movement;
  const prefix = `[${String(idx + 1).padStart(3)}/${total}]`;

  const result = {
    movementId: id,
    movementName: name,
    matchedName: null,
    matchType: 'unmatched',
    storageUrl: null,
    skipped: false,
    skipReason: null,
    error: null,
  };

  // Skip if already has a storage image (unless --force)
  if (isStorageUrl(image_url) && !args.force) {
    result.skipped = true;
    result.skipReason = 'already-seeded';
    console.log(`${prefix} ⏭  ${name} — already seeded`);
    return result;
  }

  // Skip if has a custom non-SVG image (user uploaded)
  if (image_url && !isDefaultSvg(image_url) && !isStorageUrl(image_url) && !args.force) {
    result.skipped = true;
    result.skipReason = 'custom-image';
    console.log(`${prefix} ⏭  ${name} — custom image`);
    return result;
  }

  // Find match in free-exercise-db
  const match = findMatch(name, dbIndex);

  if (!match) {
    result.matchType = 'unmatched';
    console.log(`${prefix} ❌ ${name} — no match`);
    return result;
  }

  result.matchedName = match.exercise.name;
  result.matchType = match.matchType;

  const images = match.exercise.images || [];
  if (images.length === 0) {
    console.log(`${prefix} ⚠️  ${name} → "${match.exercise.name}" but no images`);
    return result;
  }

  if (args.dryRun) {
    console.log(`${prefix} 🔍 ${name} → "${match.exercise.name}" (${match.matchType}) [${images.length} imgs]`);
    return result;
  }

  // Download first image (position 0 = start/main pose)
  try {
    const imgPath = images[0]; // e.g. "Barbell_Deadlift/0.jpg"
    const imgBuffer = await downloadImage(imgPath);
    const slug = slugify(name);
    const storageUrl = await uploadToStorage(slug, imgBuffer, 'jpg');
    result.storageUrl = storageUrl;

    // Update DB
    await updateMovementImageUrl(id, storageUrl);

    const sizeKB = Math.round(imgBuffer.length / 1024);
    console.log(`${prefix} ✅ ${name} → "${match.exercise.name}" (${match.matchType}) [${sizeKB}KB]`);
  } catch (err) {
    result.error = err.message;
    console.log(`${prefix} 💥 ${name} → ${err.message}`);
  }

  return result;
}

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   Movement Media Seed — FEAT-009                     ║');
  console.log('║   Source: free-exercise-db (GitHub, public domain)    ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');

  if (args.dryRun) console.log('🏃 Mode: DRY RUN (match only, no downloads)');
  if (args.force) console.log('💪 Mode: FORCE (overwrite existing)');
  if (args.limit) console.log(`🔢 Limit: ${args.limit} movements`);
  console.log(`🔗 Supabase: ${SUPABASE_URL}`);
  console.log('');

  // Load free-exercise-db from GitHub
  const { exercises, index: dbIndex } = await loadExerciseDB();
  console.log(`📋 Manual mappings: ${Object.keys(MANUAL_MATCH).length} entries`);
  console.log('');

  // Load our movements
  let movements = await loadDBMovements();
  console.log(`📦 Movements in DB: ${movements.length}`);

  if (args.limit) {
    movements = movements.slice(0, args.limit);
    console.log(`📦 Processing: ${movements.length} (limited)`);
  }

  console.log('');
  console.log('─'.repeat(60));
  console.log('');

  // Process each movement
  const results = [];
  for (let i = 0; i < movements.length; i++) {
    const result = await processMovement(movements[i], dbIndex, i, movements.length);
    results.push(result);
  }

  // ─── Report ──────────────────────────────────────────────────────────────
  console.log('');
  console.log('─'.repeat(60));
  console.log('');

  const matched = results.filter(r => r.storageUrl || (r.matchedName && args.dryRun));
  const uploaded = results.filter(r => r.storageUrl);
  const unmatched = results.filter(r => r.matchType === 'unmatched' && !r.skipped);
  const skipped = results.filter(r => r.skipped);
  const errors = results.filter(r => r.error);
  const alreadySeeded = skipped.filter(s => s.skipReason === 'already-seeded');

  const report = {
    timestamp: new Date().toISOString(),
    source: 'free-exercise-db (GitHub)',
    mode: args.dryRun ? 'dry-run' : args.force ? 'force' : 'normal',
    summary: {
      total: results.length,
      matched: matched.length,
      uploaded: uploaded.length,
      unmatched: unmatched.length,
      skipped: skipped.length,
      alreadySeeded: alreadySeeded.length,
      errors: errors.length,
      coveragePercent: results.length > 0
        ? Math.round(((uploaded.length + alreadySeeded.length) / results.length) * 100)
        : 0,
    },
    matched: matched.map(r => ({ name: r.movementName, matchedTo: r.matchedName, type: r.matchType })),
    unmatched: unmatched.map(r => ({ name: r.movementName })),
    errors: errors.map(r => ({ name: r.movementName, error: r.error })),
  };

  console.log('📊 SEED REPORT');
  console.log(`   Total:        ${report.summary.total}`);
  console.log(`   ✅ Matched:    ${report.summary.matched}`);
  console.log(`   📤 Uploaded:   ${report.summary.uploaded}`);
  console.log(`   ⏭  Skipped:    ${report.summary.skipped} (${report.summary.alreadySeeded} already seeded)`);
  console.log(`   ❌ Unmatched:  ${report.summary.unmatched}`);
  console.log(`   💥 Errors:     ${report.summary.errors}`);
  console.log(`   📈 Coverage:   ${report.summary.coveragePercent}%`);
  console.log('');

  if (unmatched.length > 0) {
    console.log('❌ Unmatched movements:');
    unmatched.forEach(r => console.log(`   - ${r.movementName}`));
    console.log('');
  }

  if (errors.length > 0) {
    console.log('💥 Errors:');
    errors.forEach(r => console.log(`   - ${r.movementName}: ${r.error}`));
    console.log('');
  }

  // Write report
  const reportPath = join(__dirname, 'seed-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`💾 Report saved: ${reportPath}`);
  console.log('');
}

main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
