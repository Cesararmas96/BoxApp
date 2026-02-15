/**
 * Movement Image Mapping Utility
 *
 * Maps movement names to their corresponding SVG icon paths.
 * Provides fallback to category-specific default icons when
 * no specific movement icon is available.
 *
 * Usage:
 *   getMovementImagePath('Back Squat')               → '/movements/back-squat.svg'
 *   getMovementImagePath('Some Unknown Movement')     → null
 *   getDefaultCategoryImage('Weightlifting')          → '/movements/default-weightlifting.svg'
 *   resolveMovementImage('Back Squat', null, 'Weightlifting')
 *     → '/movements/back-squat.svg'  (uses mapped icon)
 *   resolveMovementImage('Back Squat', 'https://uploaded.jpg', 'Weightlifting')
 *     → 'https://uploaded.jpg'       (uses uploaded image)
 */

type Category = 'Weightlifting' | 'Gymnastics' | 'Monostructural' | 'Accessory' | 'Other' | string;

/**
 * Slugifies a movement name to match SVG file names.
 * e.g., "Clean & Jerk" → "clean-and-jerk"
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Map of movement names → SVG slugs for movements that have
 * dedicated icon files in /public/movements/.
 *
 * This covers all movements for which we generated SVGs.
 * Additional aliases map common name variations to the same icon.
 */
const MOVEMENT_ICON_MAP: Record<string, string> = {
  // ─── WEIGHTLIFTING ─────────────────────────────
  'back squat': 'back-squat',
  'front squat': 'front-squat',
  'overhead squat': 'overhead-squat',
  'deadlift': 'deadlift',
  'sumo deadlift': 'deadlift',
  'romanian deadlift': 'deadlift',
  'clean': 'clean',
  'power clean': 'power-clean',
  'hang power clean': 'power-clean',
  'squat clean': 'clean',
  'hang clean': 'clean',
  'clean & jerk': 'clean-and-jerk',
  'clean and jerk': 'clean-and-jerk',
  'hang clean & jerk': 'clean-and-jerk',
  'hang clean and jerk': 'clean-and-jerk',
  'push jerk': 'push-jerk',
  'split jerk': 'clean-and-jerk',
  'snatch': 'snatch',
  'power snatch': 'power-snatch',
  'hang power snatch': 'power-snatch',
  'squat snatch': 'snatch',
  'muscle snatch': 'snatch',
  'snatch balance': 'snatch',
  'clean pull': 'deadlift',
  'snatch pull': 'deadlift',
  'strict press': 'strict-press',
  'push press': 'push-press',
  'thruster': 'thruster',
  'cluster': 'thruster',
  'bench press': 'strict-press',
  'sumo deadlift high pull': 'deadlift',
  'walking lunges': 'back-squat',
  'front rack lunges': 'front-squat',

  // ─── GYMNASTICS ────────────────────────────────
  'pull-up': 'pull-up',
  'pull up': 'pull-up',
  'kipping pull-up': 'pull-up',
  'kipping pull up': 'pull-up',
  'chest-to-bar pull-up': 'chest-to-bar',
  'chest-to-bar': 'chest-to-bar',
  'chest to bar': 'chest-to-bar',
  'strict pull-up': 'strict-pull-up',
  'strict pull up': 'strict-pull-up',
  'bar muscle-up': 'muscle-up',
  'bar muscle up': 'muscle-up',
  'ring muscle-up': 'muscle-up',
  'ring muscle up': 'muscle-up',
  'muscle-up': 'muscle-up',
  'muscle up': 'muscle-up',
  'ring dip': 'ring-dip',
  'ring row': 'ring-row',
  'handstand push-up': 'handstand-push-up',
  'handstand push up': 'handstand-push-up',
  'strict handstand push-up': 'handstand-push-up',
  'deficit handstand push-up': 'handstand-push-up',
  'handstand walk': 'handstand-walk',
  'toes-to-bar': 'toes-to-bar',
  'toes to bar': 'toes-to-bar',
  'knees-to-elbow': 'toes-to-bar',
  'knees to elbow': 'toes-to-bar',
  'box jump': 'box-jump',
  'box jump over': 'box-jump-over',
  'burpee': 'burpee',
  'bar facing burpee': 'bar-facing-burpee',
  'burpee box jump over': 'box-jump-over',
  'air squat': 'air-squat',
  'pistol squat': 'pistol-squat',
  'wall walk': 'wall-walk',
  'rope climb': 'rope-climb',
  'legless rope climb': 'rope-climb',
  'push-up': 'push-up',
  'push up': 'push-up',
  'hollow hold': 'hollow-hold',
  'hollow rock': 'hollow-hold',
  'l-sit': 'l-sit',
  'l sit': 'l-sit',

  // ─── MONOSTRUCTURAL ────────────────────────────
  'running': 'running',
  'run': 'running',
  'rowing': 'rowing',
  'row': 'rowing',
  'assault bike': 'assault-bike',
  'echo bike': 'assault-bike',
  'ski erg': 'ski-erg',
  'double under': 'double-under',
  'double unders': 'double-under',
  'single under': 'single-under',
  'single unders': 'single-under',
  'shuttle run': 'shuttle-run',

  // ─── ACCESSORY ─────────────────────────────────
  'wall ball': 'wall-ball',
  'wall balls': 'wall-ball',
  'kettlebell swing': 'kettlebell-swing',
  'kettlebell clean': 'kettlebell-swing',
  'kettlebell snatch': 'kettlebell-swing',
  'goblet squat': 'goblet-squat',
  'turkish get-up': 'kettlebell-swing',
  'dumbbell snatch': 'dumbbell-snatch',
  'dumbbell clean & jerk': 'dumbbell-snatch',
  'dumbbell clean and jerk': 'dumbbell-snatch',
  'dumbbell thruster': 'dumbbell-snatch',
  'dumbbell front squat': 'goblet-squat',
  'dumbbell overhead squat': 'dumbbell-snatch',
  'devil press': 'devil-press',
  "farmer's carry": 'farmers-carry',
  'farmers carry': 'farmers-carry',
  'sled push': 'running',
  'sled pull': 'running',
  'hip thrust': 'sit-up',
  'glute bridge': 'sit-up',
  'good morning': 'deadlift',
  'ghd sit-up': 'ghd-sit-up',
  'ghd sit up': 'ghd-sit-up',
  'ghd hip extension': 'ghd-sit-up',
  'sit-up': 'sit-up',
  'sit up': 'sit-up',
  'dead bug': 'plank',
  'plank': 'plank',
  'side plank': 'plank',
  'broad jump': 'broad-jump',
  'sandbag clean': 'clean',
  'med ball clean': 'wall-ball',
  'med ball slam': 'med-ball-slam',
  'cossack squat': 'air-squat',
  'face pull': 'ring-row',
  'banded pull-apart': 'ring-row',
};

/**
 * Category → default icon mapping
 */
const CATEGORY_DEFAULT_ICONS: Record<string, string> = {
  'weightlifting': 'default-weightlifting',
  'gymnastics': 'default-gymnastics',
  'monostructural': 'default-monostructural',
  'accessory': 'default-accessory',
  'other': 'default-accessory',
};

/**
 * Get the SVG path for a specific movement name.
 * Returns null if no dedicated icon exists.
 */
export function getMovementImagePath(movementName: string): string | null {
  const key = movementName.toLowerCase().trim();
  const slug = MOVEMENT_ICON_MAP[key];
  if (slug) return `/movements/${slug}.svg`;

  // Try slugified name as fallback
  const fallbackSlug = slugify(movementName);
  // Check if we have a direct match in the icon map values
  const allSlugs = new Set(Object.values(MOVEMENT_ICON_MAP));
  if (allSlugs.has(fallbackSlug)) return `/movements/${fallbackSlug}.svg`;

  return null;
}

/**
 * Get the default category icon path.
 */
export function getDefaultCategoryImage(category: Category): string {
  const key = (category || 'other').toLowerCase().trim();
  const slug = CATEGORY_DEFAULT_ICONS[key] || 'default-accessory';
  return `/movements/${slug}.svg`;
}

/**
 * Resolve the best available image for a movement.
 * Priority: custom uploaded image > mapped SVG icon > category default
 */
export function resolveMovementImage(
  movementName: string,
  customImageUrl: string | null | undefined,
  category: Category
): string {
  // 1. Custom uploaded image takes priority
  if (customImageUrl && customImageUrl.trim() !== '') {
    return customImageUrl;
  }

  // 2. Try to find a dedicated movement icon
  const movementPath = getMovementImagePath(movementName);
  if (movementPath) return movementPath;

  // 3. Fallback to category default
  return getDefaultCategoryImage(category);
}

/**
 * Check if a movement has a dedicated (non-default) icon.
 */
export function hasMovementIcon(movementName: string): boolean {
  return getMovementImagePath(movementName) !== null;
}
