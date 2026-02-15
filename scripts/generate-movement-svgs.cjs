/**
 * Generate SVG movement icons for the CrossFit movement library.
 * Each SVG is a clean, minimalist athletic silhouette icon.
 * Style: monochrome, 200x200 viewBox, stroke-based with fills.
 */
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'movements');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const svgHeader = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">`;
const svgFooter = `</svg>`;

// Common style constants
const S = {
  main: '#64748b',      // slate-500
  accent: '#94a3b8',    // slate-400
  light: '#cbd5e1',     // slate-300
  stroke: 'stroke-linecap="round" stroke-linejoin="round"',
};

function wrap(inner) {
  return `${svgHeader}\n${inner}\n${svgFooter}`;
}

// Helper: circle
function circle(cx, cy, r, fill = S.main) {
  return `  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
}

// Helper: line with stroke
function line(x1, y1, x2, y2, sw = 5, color = S.main) {
  return `  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${sw}" ${S.stroke}/>`;
}

// Helper: rect
function rect(x, y, w, h, rx = 0, fill = S.main) {
  return `  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`;
}

// Helper: barbell (horizontal)
function barbell(y, x1 = 35, x2 = 165, sw = 4) {
  return [
    line(x1, y, x2, y, sw, S.accent),
    rect(x1 - 8, y - 12, 16, 24, 3, S.main),
    rect(x2 - 8, y - 12, 16, 24, 3, S.main),
  ].join('\n');
}

// Helper: person standing (basic structure)
// Returns {head, neck, shoulder, hip, kneeL, kneeR, footL, footR}
function personStanding(cx = 100) {
  return {
    headCx: cx, headCy: 45, headR: 12,
    neckY: 57,
    shoulderY: 65,
    hipY: 115,
    kneeY: 145,
    footY: 175,
  };
}

// ──────────────────────────────────────────────
//  MOVEMENT SVG DEFINITIONS
// ──────────────────────────────────────────────

const movements = {

  // ─── WEIGHTLIFTING ───────────────────────────

  'back-squat': () => {
    // Person in squat with barbell on back
    return wrap([
      barbell(52),
      circle(100, 42, 12, S.main),
      line(100, 54, 100, 72, 5),      // neck to upper body
      line(100, 72, 100, 105, 5),     // torso
      line(100, 72, 70, 62, 4),       // left arm up to bar
      line(100, 72, 130, 62, 4),      // right arm up to bar
      line(100, 105, 70, 130, 5),     // left thigh
      line(100, 105, 130, 130, 5),    // right thigh
      line(70, 130, 65, 165, 5),      // left shin
      line(130, 130, 135, 165, 5),    // right shin
      rect(55, 163, 22, 6, 3, S.main),  // left foot
      rect(125, 163, 22, 6, 3, S.main), // right foot
    ].join('\n'));
  },

  'front-squat': () => {
    return wrap([
      barbell(68),
      circle(100, 42, 12, S.main),
      line(100, 54, 100, 72, 5),
      line(100, 72, 100, 108, 5),
      line(100, 72, 75, 72, 4),       // left arm to bar (front rack)
      line(100, 72, 125, 72, 4),      // right arm
      line(75, 72, 70, 68, 3),
      line(125, 72, 130, 68, 3),
      line(100, 108, 68, 135, 5),
      line(100, 108, 132, 135, 5),
      line(68, 135, 62, 168, 5),
      line(132, 135, 138, 168, 5),
      rect(52, 166, 22, 6, 3, S.main),
      rect(128, 166, 22, 6, 3, S.main),
    ].join('\n'));
  },

  'overhead-squat': () => {
    return wrap([
      barbell(28),
      circle(100, 42, 12, S.main),
      line(100, 54, 100, 72, 5),
      line(100, 72, 100, 110, 5),
      line(100, 72, 65, 35, 4),       // left arm overhead
      line(100, 72, 135, 35, 4),      // right arm overhead
      line(100, 110, 68, 140, 5),
      line(100, 110, 132, 140, 5),
      line(68, 140, 62, 170, 5),
      line(132, 140, 138, 170, 5),
      rect(52, 168, 22, 6, 3, S.main),
      rect(128, 168, 22, 6, 3, S.main),
    ].join('\n'));
  },

  'deadlift': () => {
    // Person pulling barbell from floor, hinged forward
    return wrap([
      circle(85, 55, 12, S.main),
      line(85, 67, 100, 105, 5),      // torso (angled forward)
      line(85, 75, 65, 110, 4),       // left arm down
      line(85, 75, 105, 110, 4),      // right arm (behind torso)
      barbell(118, 45, 155),
      line(100, 105, 80, 140, 5),     // left thigh
      line(100, 105, 120, 140, 5),    // right thigh
      line(80, 140, 75, 172, 5),
      line(120, 140, 125, 172, 5),
      rect(65, 170, 22, 6, 3, S.main),
      rect(115, 170, 22, 6, 3, S.main),
    ].join('\n'));
  },

  'clean': () => {
    // Person in front rack catch position
    return wrap([
      barbell(62),
      circle(100, 40, 12, S.main),
      line(100, 52, 100, 68, 5),
      line(100, 68, 100, 108, 5),
      line(100, 68, 80, 68, 4),
      line(100, 68, 120, 68, 4),
      line(80, 68, 72, 62, 3),
      line(120, 68, 128, 62, 3),
      line(100, 108, 72, 132, 5),
      line(100, 108, 128, 132, 5),
      line(72, 132, 68, 168, 5),
      line(128, 132, 132, 168, 5),
      rect(58, 166, 22, 6, 3, S.main),
      rect(122, 166, 22, 6, 3, S.main),
    ].join('\n'));
  },

  'clean-and-jerk': () => {
    // Person with barbell overhead, split stance
    return wrap([
      barbell(25),
      circle(100, 38, 12, S.main),
      line(100, 50, 100, 68, 5),
      line(100, 68, 100, 108, 5),
      line(100, 68, 65, 32, 4),       // left arm overhead
      line(100, 68, 135, 32, 4),      // right arm overhead
      line(100, 108, 65, 145, 5),     // front leg
      line(100, 108, 135, 142, 5),    // back leg
      line(65, 145, 55, 172, 5),      // front shin
      line(135, 142, 145, 172, 5),    // back shin
      rect(45, 170, 22, 6, 3, S.main),
      rect(138, 170, 22, 6, 3, S.main),
    ].join('\n'));
  },

  'snatch': () => {
    // Person overhead squat position with wide grip
    return wrap([
      barbell(22, 25, 175),
      circle(100, 38, 12, S.main),
      line(100, 50, 100, 68, 5),
      line(100, 68, 100, 110, 5),
      line(100, 68, 55, 30, 4),
      line(100, 68, 145, 30, 4),
      line(100, 110, 68, 140, 5),
      line(100, 110, 132, 140, 5),
      line(68, 140, 62, 170, 5),
      line(132, 140, 138, 170, 5),
      rect(52, 168, 22, 6, 3, S.main),
      rect(128, 168, 22, 6, 3, S.main),
    ].join('\n'));
  },

  'power-clean': () => {
    // Person catching clean in partial squat
    return wrap([
      barbell(65),
      circle(100, 42, 12, S.main),
      line(100, 54, 100, 70, 5),
      line(100, 70, 100, 105, 5),
      line(100, 70, 78, 70, 4),
      line(100, 70, 122, 70, 4),
      line(78, 70, 72, 65, 3),
      line(122, 70, 128, 65, 3),
      line(100, 105, 75, 135, 5),
      line(100, 105, 125, 135, 5),
      line(75, 135, 72, 170, 5),
      line(125, 135, 128, 170, 5),
      rect(62, 168, 22, 6, 3, S.main),
      rect(118, 168, 22, 6, 3, S.main),
    ].join('\n'));
  },

  'power-snatch': () => {
    return wrap([
      barbell(25, 25, 175),
      circle(100, 40, 12, S.main),
      line(100, 52, 100, 70, 5),
      line(100, 70, 100, 105, 5),
      line(100, 70, 55, 32, 4),
      line(100, 70, 145, 32, 4),
      line(100, 105, 75, 135, 5),
      line(100, 105, 125, 135, 5),
      line(75, 135, 72, 170, 5),
      line(125, 135, 128, 170, 5),
      rect(62, 168, 22, 6, 3, S.main),
      rect(118, 168, 22, 6, 3, S.main),
    ].join('\n'));
  },

  'strict-press': () => {
    // Person pressing barbell overhead, standing straight
    return wrap([
      barbell(25),
      circle(100, 38, 12, S.main),
      line(100, 50, 100, 68, 5),
      line(100, 68, 100, 115, 5),
      line(100, 68, 68, 30, 4),
      line(100, 68, 132, 30, 4),
      line(100, 115, 85, 145, 5),
      line(100, 115, 115, 145, 5),
      line(85, 145, 82, 172, 5),
      line(115, 145, 118, 172, 5),
      rect(72, 170, 22, 6, 3, S.main),
      rect(108, 170, 22, 6, 3, S.main),
    ].join('\n'));
  },

  'push-press': () => {
    // Person pressing with slight knee dip
    return wrap([
      barbell(28),
      circle(100, 40, 12, S.main),
      line(100, 52, 100, 70, 5),
      line(100, 70, 100, 110, 5),
      line(100, 70, 68, 35, 4),
      line(100, 70, 132, 35, 4),
      line(100, 110, 78, 138, 5),
      line(100, 110, 122, 138, 5),
      line(78, 138, 75, 170, 5),
      line(122, 138, 125, 170, 5),
      rect(65, 168, 22, 6, 3, S.main),
      rect(115, 168, 22, 6, 3, S.main),
    ].join('\n'));
  },

  'thruster': () => {
    // Person transitioning from squat to overhead
    return wrap([
      barbell(30),
      circle(100, 42, 12, S.main),
      line(100, 54, 100, 72, 5),
      line(100, 72, 100, 108, 5),
      line(100, 72, 65, 38, 4),
      line(100, 72, 135, 38, 4),
      line(100, 108, 68, 138, 5),
      line(100, 108, 132, 138, 5),
      line(68, 138, 62, 170, 5),
      line(132, 138, 138, 170, 5),
      rect(52, 168, 22, 6, 3, S.main),
      rect(128, 168, 22, 6, 3, S.main),
    ].join('\n'));
  },

  'push-jerk': () => {
    // Person in split position with barbell overhead
    return wrap([
      barbell(25),
      circle(100, 38, 12, S.main),
      line(100, 50, 100, 68, 5),
      line(100, 68, 100, 108, 5),
      line(100, 68, 65, 32, 4),
      line(100, 68, 135, 32, 4),
      line(100, 108, 75, 140, 5),
      line(100, 108, 125, 140, 5),
      line(75, 140, 72, 172, 5),
      line(125, 140, 128, 172, 5),
      rect(62, 170, 22, 6, 3, S.main),
      rect(118, 170, 22, 6, 3, S.main),
    ].join('\n'));
  },

  // ─── GYMNASTICS ──────────────────────────────

  'pull-up': () => {
    // Person hanging from bar, chin above
    return wrap([
      line(30, 30, 170, 30, 6, S.accent),  // bar
      circle(100, 48, 12, S.main),
      line(100, 60, 100, 78, 5),
      line(100, 78, 100, 115, 5),
      line(100, 60, 75, 35, 4),
      line(100, 60, 125, 35, 4),
      line(100, 115, 85, 148, 5),
      line(100, 115, 115, 148, 5),
      line(85, 148, 82, 175, 5),
      line(115, 148, 118, 175, 5),
    ].join('\n'));
  },

  'muscle-up': () => {
    // Person on top of rings
    return wrap([
      // Ring straps
      line(70, 15, 70, 55, 3, S.accent),
      line(130, 15, 130, 55, 3, S.accent),
      `  <circle cx="70" cy="60" r="8" stroke="${S.accent}" stroke-width="3" fill="none"/>`,
      `  <circle cx="130" cy="60" r="8" stroke="${S.accent}" stroke-width="3" fill="none"/>`,
      circle(100, 55, 12, S.main),
      line(100, 67, 100, 85, 5),
      line(100, 85, 100, 125, 5),
      line(100, 75, 72, 62, 4),      // arms to rings
      line(100, 75, 128, 62, 4),
      line(100, 125, 85, 158, 5),
      line(100, 125, 115, 158, 5),
      line(85, 158, 82, 180, 5),
      line(115, 158, 118, 180, 5),
    ].join('\n'));
  },

  'handstand-push-up': () => {
    // Inverted person against wall
    return wrap([
      rect(155, 15, 12, 170, 3, S.light),  // wall
      circle(100, 155, 12, S.main),          // head (at bottom)
      line(100, 143, 100, 125, 5),
      line(100, 125, 100, 80, 5),
      line(100, 143, 80, 165, 4),            // arms on ground
      line(100, 143, 120, 165, 4),
      line(100, 80, 115, 50, 5),             // legs going up
      line(100, 80, 85, 50, 5),
      line(115, 50, 148, 25, 5),             // feet to wall
      line(85, 50, 148, 25, 5),
    ].join('\n'));
  },

  'toes-to-bar': () => {
    // Person hanging, legs up touching bar
    return wrap([
      line(30, 30, 170, 30, 6, S.accent),
      circle(100, 80, 12, S.main),
      line(100, 68, 100, 60, 5),
      line(100, 60, 100, 30, 5),           // torso curves back
      line(100, 55, 85, 35, 4),            // arms to bar
      line(100, 55, 115, 35, 4),
      line(100, 80, 100, 95, 5),           // torso
      line(100, 95, 85, 45, 4),            // legs going up
      line(100, 95, 115, 45, 4),
    ].join('\n'));
  },

  'box-jump': () => {
    // Person jumping onto box
    return wrap([
      rect(60, 120, 80, 55, 4, S.light),   // box
      circle(100, 58, 12, S.main),
      line(100, 70, 100, 88, 5),
      line(100, 88, 100, 115, 5),
      line(100, 88, 72, 78, 4),
      line(100, 88, 128, 78, 4),
      line(100, 115, 80, 120, 5),
      line(100, 115, 120, 120, 5),
      // Motion lines
      line(45, 140, 45, 165, 2, S.accent),
      line(38, 145, 38, 160, 2, S.accent),
    ].join('\n'));
  },

  'box-jump-over': () => {
    return wrap([
      rect(65, 125, 70, 50, 4, S.light),
      circle(90, 50, 12, S.main),
      line(90, 62, 95, 80, 5),
      line(95, 80, 100, 110, 5),
      line(95, 80, 70, 65, 4),
      line(95, 80, 120, 65, 4),
      line(100, 110, 80, 125, 5),
      line(100, 110, 120, 125, 5),
      // Arrow showing jump direction
      `  <path d="M 45 90 Q 75 30 155 90" stroke="${S.accent}" stroke-width="2" fill="none" stroke-dasharray="5,5"/>`,
    ].join('\n'));
  },

  'burpee': () => {
    // Person in push-up position
    return wrap([
      circle(55, 100, 12, S.main),
      line(67, 100, 85, 105, 5),
      line(85, 105, 145, 110, 5),
      line(72, 105, 58, 130, 4),         // arms supporting
      line(72, 105, 78, 130, 4),
      line(145, 110, 165, 140, 5),       // legs
      line(145, 110, 155, 142, 5),
      // Motion arrows up
      `  <path d="M 100 85 L 100 60" stroke="${S.accent}" stroke-width="2" ${S.stroke}/>`,
      `  <path d="M 95 65 L 100 55 L 105 65" stroke="${S.accent}" stroke-width="2" fill="none" ${S.stroke}/>`,
    ].join('\n'));
  },

  'air-squat': () => {
    return wrap([
      circle(100, 48, 12, S.main),
      line(100, 60, 100, 78, 5),
      line(100, 78, 100, 110, 5),
      line(100, 78, 65, 88, 4),          // arms forward
      line(100, 78, 135, 88, 4),
      line(100, 110, 68, 138, 5),
      line(100, 110, 132, 138, 5),
      line(68, 138, 62, 170, 5),
      line(132, 138, 138, 170, 5),
      rect(52, 168, 22, 6, 3, S.main),
      rect(128, 168, 22, 6, 3, S.main),
    ].join('\n'));
  },

  'pistol-squat': () => {
    // One-legged squat
    return wrap([
      circle(95, 48, 12, S.main),
      line(95, 60, 95, 78, 5),
      line(95, 78, 95, 110, 5),
      line(95, 78, 60, 88, 4),
      line(95, 78, 130, 88, 4),
      line(95, 110, 75, 142, 5),         // squatting leg
      line(75, 142, 72, 170, 5),
      line(95, 110, 135, 105, 5),        // extended leg forward
      line(135, 105, 160, 100, 4),
      rect(62, 168, 22, 6, 3, S.main),
    ].join('\n'));
  },

  'rope-climb': () => {
    return wrap([
      line(100, 10, 100, 190, 4, S.accent),   // rope
      circle(100, 70, 12, S.main),
      line(100, 82, 100, 100, 5),
      line(100, 100, 100, 130, 5),
      line(100, 88, 90, 55, 4),               // arm up on rope
      line(100, 100, 108, 75, 4),             // other arm lower
      line(100, 130, 85, 155, 5),
      line(100, 130, 115, 148, 5),
      line(85, 155, 88, 170, 5),
      line(115, 148, 105, 165, 5),
    ].join('\n'));
  },

  'ring-dip': () => {
    return wrap([
      line(65, 15, 65, 55, 3, S.accent),
      line(135, 15, 135, 55, 3, S.accent),
      `  <circle cx="65" cy="60" r="8" stroke="${S.accent}" stroke-width="3" fill="none"/>`,
      `  <circle cx="135" cy="60" r="8" stroke="${S.accent}" stroke-width="3" fill="none"/>`,
      circle(100, 72, 12, S.main),
      line(100, 84, 100, 102, 5),
      line(100, 102, 100, 135, 5),
      line(100, 90, 67, 64, 4),
      line(100, 90, 133, 64, 4),
      line(100, 135, 85, 162, 5),
      line(100, 135, 115, 162, 5),
      line(85, 162, 82, 180, 5),
      line(115, 162, 118, 180, 5),
    ].join('\n'));
  },

  'ring-row': () => {
    return wrap([
      line(115, 15, 115, 50, 3, S.accent),
      line(135, 15, 135, 50, 3, S.accent),
      `  <circle cx="115" cy="55" r="6" stroke="${S.accent}" stroke-width="3" fill="none"/>`,
      `  <circle cx="135" cy="55" r="6" stroke="${S.accent}" stroke-width="3" fill="none"/>`,
      circle(65, 110, 12, S.main),
      line(65, 98, 100, 85, 5),      // torso angled
      line(100, 85, 140, 72, 5),
      line(95, 88, 112, 58, 4),      // arms to rings
      line(110, 82, 132, 58, 4),
      line(65, 122, 55, 158, 5),
      line(65, 122, 75, 158, 5),
      rect(45, 156, 22, 6, 3, S.main),
      rect(65, 156, 22, 6, 3, S.main),
    ].join('\n'));
  },

  'wall-walk': () => {
    return wrap([
      rect(155, 15, 12, 170, 3, S.light),  // wall
      circle(80, 120, 12, S.main),
      line(80, 108, 100, 85, 5),
      line(100, 85, 130, 55, 5),
      line(80, 115, 60, 140, 4),
      line(80, 115, 95, 135, 4),
      line(130, 55, 148, 35, 5),
      line(130, 55, 148, 50, 5),
    ].join('\n'));
  },

  'push-up': () => {
    return wrap([
      circle(55, 95, 12, S.main),
      line(67, 98, 90, 102, 5),
      line(90, 102, 148, 108, 5),
      line(75, 100, 55, 128, 4),
      line(75, 100, 80, 128, 4),
      line(148, 108, 160, 138, 5),
      line(148, 108, 152, 140, 5),
      rect(48, 126, 10, 6, 2, S.main),
      rect(74, 126, 10, 6, 2, S.main),
    ].join('\n'));
  },

  'hollow-hold': () => {
    return wrap([
      circle(55, 108, 12, S.main),
      `  <path d="M 60 118 Q 100 140 155 108" stroke="${S.main}" stroke-width="5" fill="none" ${S.stroke}/>`,
      line(55, 98, 35, 82, 4),       // arms back
      line(55, 98, 38, 78, 4),
      line(155, 108, 172, 95, 4),    // legs extended
      line(155, 108, 170, 100, 4),
    ].join('\n'));
  },

  'l-sit': () => {
    return wrap([
      // Parallettes
      rect(60, 128, 8, 35, 2, S.accent),
      rect(132, 128, 8, 35, 2, S.accent),
      line(50, 128, 80, 128, 4, S.accent),
      line(122, 128, 152, 128, 4, S.accent),
      circle(100, 90, 12, S.main),
      line(100, 102, 100, 120, 5),
      line(100, 110, 68, 128, 4),     // arms to parallettes
      line(100, 110, 132, 128, 4),
      line(100, 120, 145, 108, 5),    // legs forward (L)
      line(100, 120, 148, 112, 5),
    ].join('\n'));
  },

  'handstand-walk': () => {
    return wrap([
      circle(100, 150, 12, S.main),
      line(100, 138, 100, 118, 5),
      line(100, 118, 100, 78, 5),
      line(100, 138, 80, 165, 4),
      line(100, 138, 120, 165, 4),
      line(100, 78, 85, 50, 5),
      line(100, 78, 115, 50, 5),
      // Motion arrows
      `  <path d="M 60 170 L 45 170" stroke="${S.accent}" stroke-width="2" ${S.stroke}/>`,
      `  <path d="M 140 170 L 155 170" stroke="${S.accent}" stroke-width="2" ${S.stroke}/>`,
    ].join('\n'));
  },

  'chest-to-bar': () => {
    return wrap([
      line(30, 30, 170, 30, 6, S.accent),
      circle(100, 48, 12, S.main),
      line(100, 55, 100, 75, 5),
      line(100, 55, 80, 35, 4),
      line(100, 55, 120, 35, 4),
      line(100, 75, 100, 112, 5),
      line(100, 112, 85, 148, 5),
      line(100, 112, 115, 148, 5),
      line(85, 148, 82, 175, 5),
      line(115, 148, 118, 175, 5),
    ].join('\n'));
  },

  'bar-facing-burpee': () => {
    return wrap([
      // Barbell on ground
      barbell(155, 50, 150),
      circle(60, 95, 12, S.main),
      line(72, 98, 95, 102, 5),
      line(95, 102, 140, 108, 5),
      line(78, 100, 60, 125, 4),
      line(78, 100, 82, 125, 4),
      line(140, 108, 155, 135, 5),
      line(140, 108, 148, 138, 5),
      // Jump arrow
      `  <path d="M 100 82 L 100 65" stroke="${S.accent}" stroke-width="2" ${S.stroke}/>`,
      `  <path d="M 95 70 L 100 60 L 105 70" stroke="${S.accent}" stroke-width="2" fill="none" ${S.stroke}/>`,
    ].join('\n'));
  },

  'strict-pull-up': () => {
    return wrap([
      line(30, 30, 170, 30, 6, S.accent),
      circle(100, 50, 12, S.main),
      line(100, 62, 100, 80, 5),
      line(100, 80, 100, 118, 5),
      line(100, 62, 82, 35, 4),
      line(100, 62, 118, 35, 4),
      line(100, 118, 88, 148, 5),
      line(100, 118, 112, 148, 5),
      line(88, 148, 86, 175, 5),
      line(112, 148, 114, 175, 5),
    ].join('\n'));
  },

  // ─── MONOSTRUCTURAL ──────────────────────────

  'running': () => {
    return wrap([
      circle(95, 42, 12, S.main),
      line(95, 54, 100, 72, 5),
      line(100, 72, 105, 108, 5),
      line(95, 72, 120, 58, 4),         // arm forward
      line(95, 72, 70, 88, 4),          // arm back
      line(105, 108, 135, 138, 5),      // front leg
      line(135, 138, 140, 170, 5),
      line(105, 108, 75, 132, 5),       // back leg
      line(75, 132, 60, 155, 5),
      // Motion lines
      line(52, 80, 40, 80, 2, S.accent),
      line(55, 90, 42, 90, 2, S.accent),
      line(52, 100, 40, 100, 2, S.accent),
    ].join('\n'));
  },

  'rowing': () => {
    return wrap([
      // Rower seat/rail
      line(35, 130, 165, 130, 3, S.accent),
      rect(80, 122, 30, 8, 3, S.accent),     // seat
      // Handle
      line(50, 90, 80, 95, 3, S.accent),
      circle(95, 78, 12, S.main),
      line(95, 90, 95, 105, 5),
      line(95, 105, 95, 122, 5),
      line(95, 95, 70, 95, 4),           // arms pulling handle
      line(95, 95, 55, 90, 4),
      line(95, 122, 60, 130, 5),         // legs on foot plate
      line(95, 122, 50, 130, 5),
      rect(42, 125, 15, 10, 2, S.accent),  // foot plate
    ].join('\n'));
  },

  'assault-bike': () => {
    return wrap([
      // Bike frame
      `  <circle cx="65" cy="140" r="25" stroke="${S.accent}" stroke-width="3" fill="none"/>`,
      `  <circle cx="140" cy="140" r="25" stroke="${S.accent}" stroke-width="3" fill="none"/>`,
      line(65, 140, 100, 100, 3, S.accent),
      line(140, 140, 100, 100, 3, S.accent),
      line(100, 100, 110, 60, 3, S.accent),  // handlebars
      // Person
      circle(105, 50, 12, S.main),
      line(105, 62, 102, 80, 5),
      line(102, 80, 100, 100, 5),
      line(102, 80, 110, 62, 4),
      line(102, 80, 115, 65, 4),
      line(100, 100, 70, 130, 4),
      line(100, 100, 130, 130, 4),
    ].join('\n'));
  },

  'double-under': () => {
    return wrap([
      circle(100, 48, 12, S.main),
      line(100, 60, 100, 78, 5),
      line(100, 78, 100, 108, 5),
      line(100, 78, 75, 90, 4),          // arms slightly out
      line(100, 78, 125, 90, 4),
      line(100, 108, 90, 140, 5),
      line(100, 108, 110, 140, 5),
      line(90, 140, 88, 160, 5),
      line(110, 140, 112, 160, 5),
      // Jump rope arc
      `  <path d="M 75 90 Q 40 30 100 22 Q 160 30 125 90" stroke="${S.accent}" stroke-width="2.5" fill="none" ${S.stroke}/>`,
      `  <path d="M 75 90 Q 50 170 100 178 Q 150 170 125 90" stroke="${S.accent}" stroke-width="2.5" fill="none" ${S.stroke}/>`,
    ].join('\n'));
  },

  'single-under': () => {
    return wrap([
      circle(100, 48, 12, S.main),
      line(100, 60, 100, 78, 5),
      line(100, 78, 100, 108, 5),
      line(100, 78, 75, 90, 4),
      line(100, 78, 125, 90, 4),
      line(100, 108, 90, 140, 5),
      line(100, 108, 110, 140, 5),
      line(90, 140, 88, 160, 5),
      line(110, 140, 112, 160, 5),
      `  <path d="M 75 90 Q 50 170 100 178 Q 150 170 125 90" stroke="${S.accent}" stroke-width="2.5" fill="none" ${S.stroke}/>`,
    ].join('\n'));
  },

  'ski-erg': () => {
    return wrap([
      // Machine
      rect(90, 20, 20, 80, 3, S.accent),
      line(100, 100, 100, 150, 3, S.accent),  // pole
      // Person
      circle(85, 55, 12, S.main),
      line(85, 67, 90, 85, 5),
      line(90, 85, 95, 120, 5),
      line(88, 75, 95, 55, 4),       // arms pulling handles
      line(88, 75, 100, 58, 4),
      line(95, 120, 78, 152, 5),
      line(95, 120, 108, 152, 5),
      line(78, 152, 75, 175, 5),
      line(108, 152, 112, 175, 5),
    ].join('\n'));
  },

  'shuttle-run': () => {
    return wrap([
      // Cones
      `  <polygon points="35,170 45,150 55,170" fill="${S.accent}"/>`,
      `  <polygon points="145,170 155,150 165,170" fill="${S.accent}"/>`,
      circle(95, 48, 12, S.main),
      line(95, 60, 100, 78, 5),
      line(100, 78, 105, 108, 5),
      line(95, 78, 118, 62, 4),
      line(95, 78, 72, 92, 4),
      line(105, 108, 130, 138, 5),
      line(130, 138, 135, 165, 5),
      line(105, 108, 80, 132, 5),
      line(80, 132, 68, 155, 5),
      // Direction arrow
      `  <path d="M 60 180 L 140 180" stroke="${S.accent}" stroke-width="2" ${S.stroke}/>`,
      `  <path d="M 135 175 L 145 180 L 135 185" stroke="${S.accent}" stroke-width="2" fill="none" ${S.stroke}/>`,
    ].join('\n'));
  },

  // ─── ACCESSORY ───────────────────────────────

  'wall-ball': () => {
    return wrap([
      // Target on wall
      rect(150, 25, 12, 25, 3, S.light),
      `  <circle cx="156" cy="37" r="8" stroke="${S.accent}" stroke-width="2" fill="none"/>`,
      // Ball in air
      circle(130, 48, 10, S.accent),
      circle(100, 55, 12, S.main),
      line(100, 67, 100, 85, 5),
      line(100, 85, 100, 115, 5),
      line(100, 85, 120, 60, 4),       // arms throwing ball
      line(100, 85, 115, 55, 4),
      line(100, 115, 72, 142, 5),
      line(100, 115, 128, 142, 5),
      line(72, 142, 68, 170, 5),
      line(128, 142, 132, 170, 5),
    ].join('\n'));
  },

  'kettlebell-swing': () => {
    return wrap([
      // Kettlebell at top
      `  <circle cx="100" cy="38" r="10" stroke="${S.accent}" stroke-width="3" fill="none"/>`,
      rect(94, 46, 12, 8, 2, S.accent),
      circle(100, 68, 12, S.main),
      line(100, 80, 100, 98, 5),
      line(100, 98, 100, 128, 5),
      line(100, 88, 95, 48, 4),
      line(100, 88, 105, 48, 4),
      line(100, 128, 78, 155, 5),
      line(100, 128, 122, 155, 5),
      line(78, 155, 75, 178, 5),
      line(122, 155, 125, 178, 5),
    ].join('\n'));
  },

  'devil-press': () => {
    return wrap([
      // Dumbbells on ground
      rect(55, 148, 30, 8, 4, S.accent),
      rect(115, 148, 30, 8, 4, S.accent),
      circle(70, 108, 12, S.main),
      line(70, 96, 90, 80, 5),
      line(90, 80, 105, 130, 5),
      line(75, 88, 60, 108, 4),
      line(80, 85, 72, 105, 4),
      line(105, 130, 125, 150, 5),
      line(105, 130, 135, 148, 5),
      // Arrow up
      `  <path d="M 100 68 L 100 45" stroke="${S.accent}" stroke-width="2" ${S.stroke}/>`,
      `  <path d="M 95 50 L 100 40 L 105 50" stroke="${S.accent}" stroke-width="2" fill="none" ${S.stroke}/>`,
    ].join('\n'));
  },

  'goblet-squat': () => {
    return wrap([
      // Kettlebell at chest
      rect(92, 68, 16, 12, 3, S.accent),
      circle(100, 48, 12, S.main),
      line(100, 60, 100, 75, 5),
      line(100, 75, 100, 110, 5),
      line(100, 75, 92, 72, 4),
      line(100, 75, 108, 72, 4),
      line(100, 110, 68, 138, 5),
      line(100, 110, 132, 138, 5),
      line(68, 138, 62, 170, 5),
      line(132, 138, 138, 170, 5),
      rect(52, 168, 22, 6, 3, S.main),
      rect(128, 168, 22, 6, 3, S.main),
    ].join('\n'));
  },

  'dumbbell-snatch': () => {
    return wrap([
      // Dumbbell overhead (one arm)
      rect(88, 25, 30, 8, 4, S.accent),
      circle(100, 48, 12, S.main),
      line(100, 60, 100, 78, 5),
      line(100, 78, 100, 112, 5),
      line(100, 78, 103, 35, 4),       // arm holding DB overhead
      line(100, 78, 75, 95, 4),        // other arm out for balance
      line(100, 112, 72, 140, 5),
      line(100, 112, 128, 140, 5),
      line(72, 140, 68, 170, 5),
      line(128, 140, 132, 170, 5),
    ].join('\n'));
  },

  'farmers-carry': () => {
    return wrap([
      // Dumbbells/KBs at sides
      rect(55, 115, 10, 20, 3, S.accent),
      rect(135, 115, 10, 20, 3, S.accent),
      circle(100, 42, 12, S.main),
      line(100, 54, 100, 72, 5),
      line(100, 72, 100, 112, 5),
      line(100, 72, 60, 115, 4),
      line(100, 72, 140, 115, 4),
      line(100, 112, 80, 145, 5),
      line(100, 112, 120, 145, 5),
      line(80, 145, 78, 175, 5),
      line(120, 145, 122, 175, 5),
      // Motion lines
      line(50, 170, 42, 170, 2, S.accent),
      line(150, 170, 158, 170, 2, S.accent),
    ].join('\n'));
  },

  'ghd-sit-up': () => {
    return wrap([
      // GHD machine simplified
      rect(55, 100, 90, 10, 5, S.accent),
      rect(130, 100, 15, 40, 3, S.accent),  // foot pad
      circle(55, 130, 12, S.main),
      `  <path d="M 55 118 Q 80 85 130 100" stroke="${S.main}" stroke-width="5" fill="none" ${S.stroke}/>`,
      line(55, 125, 40, 150, 4),
      line(55, 125, 50, 152, 4),
    ].join('\n'));
  },

  'sit-up': () => {
    return wrap([
      // Ground line
      line(30, 165, 170, 165, 2, S.light),
      circle(120, 95, 12, S.main),
      line(120, 107, 105, 128, 5),
      line(105, 128, 80, 158, 5),       // torso going down
      line(80, 158, 55, 162, 5),        // legs
      line(80, 158, 62, 165, 5),
      line(120, 98, 135, 82, 4),        // arms forward
      line(120, 98, 130, 78, 4),
    ].join('\n'));
  },

  'plank': () => {
    return wrap([
      line(30, 165, 170, 165, 2, S.light),
      circle(52, 118, 12, S.main),
      line(62, 122, 80, 128, 5),
      line(80, 128, 150, 135, 5),
      line(65, 125, 50, 152, 4),        // forearms on ground
      line(65, 125, 72, 150, 4),
      line(150, 135, 160, 160, 5),
      line(150, 135, 155, 162, 5),
    ].join('\n'));
  },

  'broad-jump': () => {
    return wrap([
      circle(80, 55, 12, S.main),
      line(80, 67, 85, 85, 5),
      line(85, 85, 95, 110, 5),
      line(85, 85, 115, 68, 4),          // arms forward
      line(85, 85, 112, 72, 4),
      line(95, 110, 120, 135, 5),
      line(95, 110, 70, 140, 5),
      line(120, 135, 130, 165, 5),
      line(70, 140, 60, 165, 5),
      // Arrow
      `  <path d="M 95 170 L 155 170" stroke="${S.accent}" stroke-width="2" ${S.stroke}/>`,
      `  <path d="M 148 165 L 158 170 L 148 175" stroke="${S.accent}" stroke-width="2" fill="none" ${S.stroke}/>`,
    ].join('\n'));
  },

  'med-ball-slam': () => {
    return wrap([
      circle(100, 35, 14, S.accent),     // med ball overhead
      circle(100, 58, 12, S.main),
      line(100, 70, 100, 88, 5),
      line(100, 88, 100, 118, 5),
      line(100, 75, 92, 42, 4),
      line(100, 75, 108, 42, 4),
      line(100, 118, 78, 148, 5),
      line(100, 118, 122, 148, 5),
      line(78, 148, 75, 175, 5),
      line(122, 148, 125, 175, 5),
      // Slam motion
      `  <path d="M 90 28 L 85 18" stroke="${S.accent}" stroke-width="2" ${S.stroke}/>`,
      `  <path d="M 110 28 L 115 18" stroke="${S.accent}" stroke-width="2" ${S.stroke}/>`,
    ].join('\n'));
  },

  // ─── CATEGORY DEFAULTS ──────────────────────

  'default-weightlifting': () => {
    return wrap([
      // Clean barbell icon
      line(30, 100, 170, 100, 6, S.accent),
      rect(22, 82, 20, 36, 4, S.main),
      rect(158, 82, 20, 36, 4, S.main),
      rect(42, 88, 12, 24, 3, S.accent),
      rect(146, 88, 12, 24, 3, S.accent),
    ].join('\n'));
  },

  'default-gymnastics': () => {
    return wrap([
      // Rings icon
      line(75, 25, 75, 65, 3, S.accent),
      line(125, 25, 125, 65, 3, S.accent),
      `  <circle cx="75" cy="78" r="15" stroke="${S.main}" stroke-width="4" fill="none"/>`,
      `  <circle cx="125" cy="78" r="15" stroke="${S.main}" stroke-width="4" fill="none"/>`,
      // Person silhouette below
      circle(100, 110, 10, S.main),
      line(100, 120, 100, 148, 4),
      line(100, 128, 80, 140, 3),
      line(100, 128, 120, 140, 3),
      line(100, 148, 85, 172, 4),
      line(100, 148, 115, 172, 4),
    ].join('\n'));
  },

  'default-monostructural': () => {
    return wrap([
      // Running figure with speed lines
      circle(90, 55, 14, S.main),
      line(90, 69, 95, 88, 5),
      line(95, 88, 100, 115, 5),
      line(95, 85, 120, 72, 4),
      line(95, 85, 70, 98, 4),
      line(100, 115, 128, 142, 5),
      line(128, 142, 135, 170, 5),
      line(100, 115, 72, 138, 5),
      line(72, 138, 60, 158, 5),
      line(48, 88, 35, 88, 2, S.accent),
      line(52, 98, 38, 98, 2, S.accent),
      line(48, 108, 35, 108, 2, S.accent),
    ].join('\n'));
  },

  'default-accessory': () => {
    return wrap([
      // Kettlebell icon
      `  <path d="M 75 72 Q 75 45 100 42 Q 125 45 125 72" stroke="${S.main}" stroke-width="4" fill="none" ${S.stroke}/>`,
      `  <rect x="72" y="72" width="56" height="55" rx="10" fill="${S.main}"/>`,
      `  <circle cx="100" cy="95" r="12" fill="${S.accent}"/>`,
    ].join('\n'));
  },
};

// ──────────────────────────────────────────────
//  GENERATE ALL SVG FILES
// ──────────────────────────────────────────────
let count = 0;
for (const [name, generator] of Object.entries(movements)) {
  const svg = generator();
  const filePath = path.join(OUTPUT_DIR, `${name}.svg`);
  fs.writeFileSync(filePath, svg);
  count++;
}

console.log(`Generated ${count} SVG movement icons in ${OUTPUT_DIR}`);
