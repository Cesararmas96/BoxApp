#!/usr/bin/env node
/**
 * seed-movement-videos.mjs — FEAT-009: Movement Media Library (Videos)
 *
 * Populates the demo_url field in the movements table with YouTube video URLs
 * from official CrossFit.com tutorials.
 *
 * Usage:
 *   ( set -a; source .env; set +a; node scripts/seed-movement-videos.mjs --dry-run )
 *   ( set -a; source .env; set +a; node scripts/seed-movement-videos.mjs )
 *
 * Required env vars: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── CLI Args ──────────────────────────────────────────────────────────────

const args = {
  dryRun: process.argv.includes('--dry-run'),
  force: process.argv.includes('--force'),
};

// ─── Env ───────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── YouTube Video Mapping ─────────────────────────────────────────────────
// Source: CrossFit.com official movement pages (scraped 2026-04-08)
// Each entry: normalized movement name → YouTube video ID

const VIDEO_MAP = {
  // ═══ WEIGHTLIFTING ═══════════════════════════════════════════════════════
  'back squat':               'QmZAiBqPvZw',
  'front squat':              'uYumuL_G_V0',
  'overhead squat':           'pn8mqlG0nkE',
  'air squat':                'rMvwVtlqjTE',
  'air squats':               'rMvwVtlqjTE',
  'deadlift':                 '1ZXobu7JvvE',
  'sumo deadlift':            'ENEg9UF7z7M',
  'sumo deadlift high pull':  'gh55vVlwlQg',
  'clean':                    'PjY1rH4_MOA',
  'clean and jerk':           'PjY1rH4_MOA',
  'power clean':              'KwYJTpQ_x5A',
  'power clean touch and go': 'KwYJTpQ_x5A',
  'hang power clean':         '0aP3tgKZcHQ',
  'hang clean':               '0aP3tgKZcHQ',
  'hang squat clean':         '0aP3tgKZcHQ',
  'squat clean':              'PjY1rH4_MOA',
  'snatch':                   'GhxhiehJcQY',
  'power snatch':             'TL8SMp7RdXQ',
  'hang power snatch':        '-mLzQdVAwlw',
  'hang snatch':              'IucshEToDyM',
  'squat snatch':             'GhxhiehJcQY',
  'muscle snatch':            'bJYzOo1cNqY',
  'snatch balance':           'XuFaD1sAVGI',
  'snatch pull':              'GhxhiehJcQY',
  'clean pull':               'PjY1rH4_MOA',
  'split jerk':               'GUDkOtraHHY',
  'push jerk':                'VrHNJXoSyXw',
  'push press':               'iaBVSJm78ko',
  'strict press':             '5yWaNOvgFCM',
  'shoulder press':           '5yWaNOvgFCM',
  'thruster':                 'L219ltL15zk',
  'thrusters':                'L219ltL15zk',
  'bench press':              'SCVCLChPQFY',
  'good morning':             'KxYxHr1lkx4',
  'walking lunges':           'DlhojghkaQ0',

  // ═══ GYMNASTICS ══════════════════════════════════════════════════════════
  'pull up':                  'HRV5YKKaeVw',
  'pull ups':                 'HRV5YKKaeVw',
  'strict pull up':           'HRV5YKKaeVw',
  'strict pull ups':          'HRV5YKKaeVw',
  'kipping pull up':          'lzRo-4pq_AY',
  'kipping pull-up':          'lzRo-4pq_AY',
  'butterfly pull up':        'lzRo-4pq_AY',
  'chest to bar':             'HRV5YKKaeVw',
  'chest-to-bar pull-up':     'HRV5YKKaeVw',
  'c2b':                      'HRV5YKKaeVw',
  'c2b /pull ups':            'HRV5YKKaeVw',
  'bar mu/c2b':               'HRV5YKKaeVw',
  'bmu':                      'HRV5YKKaeVw',
  'bar muscle-up':            'HRV5YKKaeVw',
  'ring muscle-up':           'EznLCDBAPIU',
  'ring mu':                  'EznLCDBAPIU',
  'push up':                  '0pkjOk0EiAk',
  'push ups':                 '0pkjOk0EiAk',
  'push-up':                  '0pkjOk0EiAk',
  'handstand push up':        '0pkjOk0EiAk',  // fallback to push-up
  'handstand push-up':        '0pkjOk0EiAk',
  'hsp strict':               '0pkjOk0EiAk',
  'strict handstand push up': '0pkjOk0EiAk',
  'deficit hang stand push ups': '0pkjOk0EiAk',
  'hang stand push ups':      '0pkjOk0EiAk',
  'strict hang stand push ups': '0pkjOk0EiAk',
  'handstand walk':           'FdgJ9jZIT-Q',
  'hsw':                      'FdgJ9jZIT-Q',
  'ring dip':                 'EznLCDBAPIU',
  'ring dips':                'EznLCDBAPIU',
  'dip':                      'o2qX3Zb5mvg',
  'ring row':                 'sEAOZc77wk8',
  'toes-to-bar':              'lzRo-4pq_AY',  // kipping reference
  'toes to bar':              'lzRo-4pq_AY',
  't2r':                      'lzRo-4pq_AY',
  'l sit':                    '_HbccxgnCg0',
  'l-sit':                    '_HbccxgnCg0',
  'hollow':                   '_HbccxgnCg0',
  'box jump':                 'NBY9-kTuHEk',
  'box jump over':            'NBY9-kTuHEk',
  'burpee':                   'auBLPXO8Fww',
  'burpees':                  'auBLPXO8Fww',
  'bar facing burpees':       'auBLPXO8Fww',
  'burpees box jump':         'auBLPXO8Fww',
  'burpees over bar':         'auBLPXO8Fww',
  'burpees bastardos':        'auBLPXO8Fww',
  'burpees over the dumbell': 'auBLPXO8Fww',
  'sit up':                   'oFwt7WfnPcc',
  'sit ups':                  'oFwt7WfnPcc',
  'ab mat sit-up':            'oFwt7WfnPcc',
  'ghd sit-up':               'oFwt7WfnPcc',
  'ghd sit-ups':              'oFwt7WfnPcc',
  'wall walk':                'NK_OcHEm8yM',
  'walk wall':                'NK_OcHEm8yM',
  'wall climbs':              'NK_OcHEm8yM',
  'pistol squat':             'rMvwVtlqjTE',  // air squat reference
  'pistol squats':            'rMvwVtlqjTE',
  'walking lunge':            'DlhojghkaQ0',
  'lunges':                   'DlhojghkaQ0',

  // ═══ MONOSTRUCTURAL ══════════════════════════════════════════════════════
  'double under':             '82jNjDS19lg',
  'double unders':            '82jNjDS19lg',
  'doble unders':             '82jNjDS19lg',
  'single under':             'hCuXYrTOMxI',
  'single unders':            'hCuXYrTOMxI',
  'skipping':                 'hCuXYrTOMxI',

  // ═══ ACCESSORY ═══════════════════════════════════════════════════════════
  'wall ball':                'EqjGKsiIMCE',
  'wall balls':               'EqjGKsiIMCE',
  'kettlebell swing':         'mKDIuUbH94Q',
  'kb swing':                 'mKDIuUbH94Q',
  'kb swing 30/20':           'mKDIuUbH94Q',
  'goblet squat':             'rMvwVtlqjTE',  // squat reference
  'kb goblet squat':          'rMvwVtlqjTE',
  'dumbbell snatch':          'etK3OPjM3S4',
  'dumbbell thruster':        'u3wKkZjE8QM',
  'dumbell thrusters':        'u3wKkZjE8QM',
  'dumbbell clean':           'SYxObzJ3gn0',
  'dumbbell clean & jerk':    'SYxObzJ3gn0',
  'dumbell power clean and jerk': 'SYxObzJ3gn0',
  'slam ball':                'k9W6g9LvXDI',
  'med ball slam':            'k9W6g9LvXDI',
  'plank':                    '_HbccxgnCg0',  // l-sit/core reference
  'russian twist':            '_HbccxgnCg0',
  'glute bridge':             '1ZXobu7JvvE',  // deadlift reference
  'hip thrust':               '1ZXobu7JvvE',
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function normalize(name) {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/['']/g, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildYouTubeUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   Movement Video Seed — FEAT-009                     ║');
  console.log('║   Source: CrossFit.com Official Tutorials             ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');

  if (args.dryRun) console.log('🏃 Mode: DRY RUN');
  if (args.force) console.log('💪 Mode: FORCE (overwrite existing)');
  console.log(`🔗 Supabase: ${SUPABASE_URL}`);
  console.log(`📋 Video mappings: ${Object.keys(VIDEO_MAP).length} entries`);
  console.log('');

  // Load movements from DB
  const { data: movements, error } = await supabase
    .from('movements')
    .select('id, name, demo_url')
    .order('name');

  if (error) {
    console.error('❌ Failed to load movements:', error.message);
    process.exit(1);
  }

  console.log(`📦 Movements in DB: ${movements.length}`);
  console.log('');
  console.log('─'.repeat(60));
  console.log('');

  let updated = 0;
  let skipped = 0;
  let noMatch = 0;
  const unmatched = [];

  for (let i = 0; i < movements.length; i++) {
    const { id, name, demo_url } = movements[i];
    const prefix = `[${String(i + 1).padStart(3)}/${movements.length}]`;
    const norm = normalize(name);

    // Skip if already has a demo_url (unless --force)
    if (demo_url && demo_url.trim() !== '' && !args.force) {
      console.log(`${prefix} ⏭  ${name} — already has video`);
      skipped++;
      continue;
    }

    // Find video
    const videoId = VIDEO_MAP[norm];

    if (!videoId) {
      console.log(`${prefix} ❌ ${name} — no video`);
      noMatch++;
      unmatched.push(name);
      continue;
    }

    const youtubeUrl = buildYouTubeUrl(videoId);

    if (args.dryRun) {
      console.log(`${prefix} 🔍 ${name} → ${youtubeUrl}`);
      updated++;
      continue;
    }

    // Update DB
    const { error: updateErr } = await supabase
      .from('movements')
      .update({ demo_url: youtubeUrl })
      .eq('id', id);

    if (updateErr) {
      console.log(`${prefix} 💥 ${name} → ${updateErr.message}`);
    } else {
      console.log(`${prefix} ✅ ${name} → ${youtubeUrl}`);
      updated++;
    }
  }

  // Report
  console.log('');
  console.log('─'.repeat(60));
  console.log('');
  console.log('📊 VIDEO SEED REPORT');
  console.log(`   Total:      ${movements.length}`);
  console.log(`   ✅ Updated:  ${updated}`);
  console.log(`   ⏭  Skipped:  ${skipped}`);
  console.log(`   ❌ No match: ${noMatch}`);
  console.log(`   📈 Coverage: ${Math.round(((updated + skipped) / movements.length) * 100)}%`);
  console.log('');

  if (unmatched.length > 0) {
    console.log('❌ No video available:');
    unmatched.forEach(n => console.log(`   - ${n}`));
    console.log('');
  }

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    source: 'CrossFit.com Official Tutorials',
    mode: args.dryRun ? 'dry-run' : args.force ? 'force' : 'normal',
    summary: { total: movements.length, updated, skipped, noMatch },
    unmatched,
  };

  const reportPath = join(__dirname, 'seed-video-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`💾 Report saved: ${reportPath}`);
  console.log('');
}

main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
