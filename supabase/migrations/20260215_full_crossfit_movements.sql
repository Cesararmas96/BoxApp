-- ============================================================
-- Migration: Full CrossFit Movement Library (Expert Catalog)
-- Date: 2026-02-15
-- Description: Inserts complete catalog of CrossFit movements
--              as defined by CrossFit methodology and common programming.
-- Box ID: fd14f401-d8a0-4ec3-b36e-e1c74676ab9e (default demo box)
-- ============================================================
-- Uses ON CONFLICT (name, box_id) - requires movements_name_box_id_unique constraint
-- ============================================================

DO $$
DECLARE
  v_box_id UUID := 'fd14f401-d8a0-4ec3-b36e-e1c74676ab9e';
BEGIN
  -- ═══════════════════════════════════════════════════════════
  -- WEIGHTLIFTING (Barbell)
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.movements (id, name, category, box_id, image_url) VALUES
    (gen_random_uuid(), 'Back Squat', 'Weightlifting', v_box_id, '/movements/back-squat.svg'),
    (gen_random_uuid(), 'Front Squat', 'Weightlifting', v_box_id, '/movements/front-squat.svg'),
    (gen_random_uuid(), 'Overhead Squat', 'Weightlifting', v_box_id, '/movements/overhead-squat.svg'),
    (gen_random_uuid(), 'Pause Back Squat', 'Weightlifting', v_box_id, '/movements/back-squat.svg'),
    (gen_random_uuid(), 'Pause Front Squat', 'Weightlifting', v_box_id, '/movements/front-squat.svg'),
    (gen_random_uuid(), 'Box Squat', 'Weightlifting', v_box_id, '/movements/back-squat.svg'),
    (gen_random_uuid(), 'Deadlift', 'Weightlifting', v_box_id, '/movements/deadlift.svg'),
    (gen_random_uuid(), 'Sumo Deadlift', 'Weightlifting', v_box_id, '/movements/deadlift.svg'),
    (gen_random_uuid(), 'Romanian Deadlift', 'Weightlifting', v_box_id, '/movements/deadlift.svg'),
    (gen_random_uuid(), 'Deficit Deadlift', 'Weightlifting', v_box_id, '/movements/deadlift.svg'),
    (gen_random_uuid(), 'Stiff-Leg Deadlift', 'Weightlifting', v_box_id, '/movements/deadlift.svg'),
    (gen_random_uuid(), 'Clean', 'Weightlifting', v_box_id, '/movements/clean.svg'),
    (gen_random_uuid(), 'Power Clean', 'Weightlifting', v_box_id, '/movements/power-clean.svg'),
    (gen_random_uuid(), 'Squat Clean', 'Weightlifting', v_box_id, '/movements/clean.svg'),
    (gen_random_uuid(), 'Hang Clean', 'Weightlifting', v_box_id, '/movements/clean.svg'),
    (gen_random_uuid(), 'Hang Power Clean', 'Weightlifting', v_box_id, '/movements/power-clean.svg'),
    (gen_random_uuid(), 'Hang Squat Clean', 'Weightlifting', v_box_id, '/movements/clean.svg'),
    (gen_random_uuid(), 'Clean & Jerk', 'Weightlifting', v_box_id, '/movements/clean-and-jerk.svg'),
    (gen_random_uuid(), 'Hang Clean & Jerk', 'Weightlifting', v_box_id, '/movements/clean-and-jerk.svg'),
    (gen_random_uuid(), 'Snatch', 'Weightlifting', v_box_id, '/movements/snatch.svg'),
    (gen_random_uuid(), 'Power Snatch', 'Weightlifting', v_box_id, '/movements/power-snatch.svg'),
    (gen_random_uuid(), 'Squat Snatch', 'Weightlifting', v_box_id, '/movements/snatch.svg'),
    (gen_random_uuid(), 'Hang Snatch', 'Weightlifting', v_box_id, '/movements/snatch.svg'),
    (gen_random_uuid(), 'Hang Power Snatch', 'Weightlifting', v_box_id, '/movements/power-snatch.svg'),
    (gen_random_uuid(), 'Hang Squat Snatch', 'Weightlifting', v_box_id, '/movements/snatch.svg'),
    (gen_random_uuid(), 'Muscle Snatch', 'Weightlifting', v_box_id, '/movements/snatch.svg'),
    (gen_random_uuid(), 'Snatch Balance', 'Weightlifting', v_box_id, '/movements/snatch.svg'),
    (gen_random_uuid(), 'Drop Snatch', 'Weightlifting', v_box_id, '/movements/snatch.svg'),
    (gen_random_uuid(), 'Deficit Snatch', 'Weightlifting', v_box_id, '/movements/snatch.svg'),
    (gen_random_uuid(), 'Push Jerk', 'Weightlifting', v_box_id, '/movements/push-jerk.svg'),
    (gen_random_uuid(), 'Split Jerk', 'Weightlifting', v_box_id, '/movements/clean-and-jerk.svg'),
    (gen_random_uuid(), 'Push Press', 'Weightlifting', v_box_id, '/movements/push-press.svg'),
    (gen_random_uuid(), 'Strict Press', 'Weightlifting', v_box_id, '/movements/strict-press.svg'),
    (gen_random_uuid(), 'Thruster', 'Weightlifting', v_box_id, '/movements/thruster.svg'),
    (gen_random_uuid(), 'Cluster', 'Weightlifting', v_box_id, '/movements/thruster.svg'),
    (gen_random_uuid(), 'Clean Pull', 'Weightlifting', v_box_id, '/movements/deadlift.svg'),
    (gen_random_uuid(), 'Snatch Pull', 'Weightlifting', v_box_id, '/movements/deadlift.svg'),
    (gen_random_uuid(), 'Bench Press', 'Weightlifting', v_box_id, '/movements/strict-press.svg'),
    (gen_random_uuid(), 'Incline Press', 'Weightlifting', v_box_id, '/movements/strict-press.svg'),
    (gen_random_uuid(), 'Sumo Deadlift High Pull', 'Weightlifting', v_box_id, '/movements/deadlift.svg'),
    (gen_random_uuid(), 'Good Morning', 'Weightlifting', v_box_id, '/movements/deadlift.svg'),
    (gen_random_uuid(), 'Walking Lunges', 'Weightlifting', v_box_id, '/movements/back-squat.svg'),
    (gen_random_uuid(), 'Front Rack Lunges', 'Weightlifting', v_box_id, '/movements/front-squat.svg'),
    (gen_random_uuid(), 'Reverse Lunges', 'Weightlifting', v_box_id, '/movements/back-squat.svg')
  ON CONFLICT (name, box_id) DO UPDATE SET category = EXCLUDED.category, image_url = EXCLUDED.image_url;
END $$;

DO $$
DECLARE
  v_box_id UUID := 'fd14f401-d8a0-4ec3-b36e-e1c74676ab9e';
BEGIN
  -- ═══════════════════════════════════════════════════════════
  -- GYMNASTICS (Bodyweight / Skill)
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.movements (id, name, category, box_id, image_url) VALUES
    (gen_random_uuid(), 'Pull-Up', 'Gymnastics', v_box_id, '/movements/pull-up.svg'),
    (gen_random_uuid(), 'Kipping Pull-Up', 'Gymnastics', v_box_id, '/movements/pull-up.svg'),
    (gen_random_uuid(), 'Butterfly Pull-Up', 'Gymnastics', v_box_id, '/movements/pull-up.svg'),
    (gen_random_uuid(), 'Strict Pull-Up', 'Gymnastics', v_box_id, '/movements/strict-pull-up.svg'),
    (gen_random_uuid(), 'Chest-to-Bar Pull-Up', 'Gymnastics', v_box_id, '/movements/chest-to-bar.svg'),
    (gen_random_uuid(), 'Bar Muscle-Up', 'Gymnastics', v_box_id, '/movements/muscle-up.svg'),
    (gen_random_uuid(), 'Ring Muscle-Up', 'Gymnastics', v_box_id, '/movements/muscle-up.svg'),
    (gen_random_uuid(), 'Push-Up', 'Gymnastics', v_box_id, '/movements/push-up.svg'),
    (gen_random_uuid(), 'Plyo Push-Up', 'Gymnastics', v_box_id, '/movements/push-up.svg'),
    (gen_random_uuid(), 'Handstand Push-Up', 'Gymnastics', v_box_id, '/movements/handstand-push-up.svg'),
    (gen_random_uuid(), 'Strict Handstand Push-Up', 'Gymnastics', v_box_id, '/movements/handstand-push-up.svg'),
    (gen_random_uuid(), 'Deficit Handstand Push-Up', 'Gymnastics', v_box_id, '/movements/handstand-push-up.svg'),
    (gen_random_uuid(), 'Pike Push-Up', 'Gymnastics', v_box_id, '/movements/handstand-push-up.svg'),
    (gen_random_uuid(), 'Wall Pike Push-Up', 'Gymnastics', v_box_id, '/movements/handstand-push-up.svg'),
    (gen_random_uuid(), 'Ring Dip', 'Gymnastics', v_box_id, '/movements/ring-dip.svg'),
    (gen_random_uuid(), 'Bar Dip', 'Gymnastics', v_box_id, '/movements/ring-dip.svg'),
    (gen_random_uuid(), 'Ring Row', 'Gymnastics', v_box_id, '/movements/ring-row.svg'),
    (gen_random_uuid(), 'Inverted Row', 'Gymnastics', v_box_id, '/movements/ring-row.svg'),
    (gen_random_uuid(), 'Toes-to-Bar', 'Gymnastics', v_box_id, '/movements/toes-to-bar.svg'),
    (gen_random_uuid(), 'Knees-to-Elbow', 'Gymnastics', v_box_id, '/movements/toes-to-bar.svg'),
    (gen_random_uuid(), 'Hollow Hold', 'Gymnastics', v_box_id, '/movements/hollow-hold.svg'),
    (gen_random_uuid(), 'Hollow Rock', 'Gymnastics', v_box_id, '/movements/hollow-hold.svg'),
    (gen_random_uuid(), 'L-Sit', 'Gymnastics', v_box_id, '/movements/l-sit.svg'),
    (gen_random_uuid(), 'V-Up', 'Gymnastics', v_box_id, '/movements/hollow-hold.svg'),
    (gen_random_uuid(), 'Air Squat', 'Gymnastics', v_box_id, '/movements/air-squat.svg'),
    (gen_random_uuid(), 'Pistol Squat', 'Gymnastics', v_box_id, '/movements/pistol-squat.svg'),
    (gen_random_uuid(), 'Box Step-Up', 'Gymnastics', v_box_id, '/movements/box-jump.svg'),
    (gen_random_uuid(), 'Box Jump', 'Gymnastics', v_box_id, '/movements/box-jump.svg'),
    (gen_random_uuid(), 'Box Jump Over', 'Gymnastics', v_box_id, '/movements/box-jump-over.svg'),
    (gen_random_uuid(), 'Burpee', 'Gymnastics', v_box_id, '/movements/burpee.svg'),
    (gen_random_uuid(), 'Bar Facing Burpee', 'Gymnastics', v_box_id, '/movements/bar-facing-burpee.svg'),
    (gen_random_uuid(), 'Burpee Box Jump Over', 'Gymnastics', v_box_id, '/movements/box-jump-over.svg'),
    (gen_random_uuid(), 'Handstand Walk', 'Gymnastics', v_box_id, '/movements/handstand-walk.svg'),
    (gen_random_uuid(), 'Handstand Hold', 'Gymnastics', v_box_id, '/movements/handstand-push-up.svg'),
    (gen_random_uuid(), 'Wall Walk', 'Gymnastics', v_box_id, '/movements/wall-walk.svg'),
    (gen_random_uuid(), 'Rope Climb', 'Gymnastics', v_box_id, '/movements/rope-climb.svg'),
    (gen_random_uuid(), 'Legless Rope Climb', 'Gymnastics', v_box_id, '/movements/rope-climb.svg'),
    (gen_random_uuid(), 'Wall Climb', 'Gymnastics', v_box_id, '/movements/wall-walk.svg'),
    (gen_random_uuid(), 'Shoulder Tap', 'Gymnastics', v_box_id, '/movements/push-up.svg'),
    (gen_random_uuid(), 'Skin the Cat', 'Gymnastics', v_box_id, '/movements/ring-row.svg'),
    (gen_random_uuid(), 'GHD Sit-Up', 'Gymnastics', v_box_id, '/movements/ghd-sit-up.svg'),
    (gen_random_uuid(), 'Sit-Up', 'Gymnastics', v_box_id, '/movements/sit-up.svg')
  ON CONFLICT (name, box_id) DO UPDATE SET category = EXCLUDED.category, image_url = EXCLUDED.image_url;
END $$;

DO $$
DECLARE
  v_box_id UUID := 'fd14f401-d8a0-4ec3-b36e-e1c74676ab9e';
BEGIN
  -- ═══════════════════════════════════════════════════════════
  -- MONOSTRUCTURAL (Cardio / Aerobic)
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.movements (id, name, category, box_id, image_url) VALUES
    (gen_random_uuid(), 'Running', 'Monostructural', v_box_id, '/movements/running.svg'),
    (gen_random_uuid(), 'Row', 'Monostructural', v_box_id, '/movements/rowing.svg'),
    (gen_random_uuid(), 'Rowing', 'Monostructural', v_box_id, '/movements/rowing.svg'),
    (gen_random_uuid(), 'Assault Bike', 'Monostructural', v_box_id, '/movements/assault-bike.svg'),
    (gen_random_uuid(), 'Echo Bike', 'Monostructural', v_box_id, '/movements/assault-bike.svg'),
    (gen_random_uuid(), 'Ski Erg', 'Monostructural', v_box_id, '/movements/ski-erg.svg'),
    (gen_random_uuid(), 'Single Under', 'Monostructural', v_box_id, '/movements/single-under.svg'),
    (gen_random_uuid(), 'Double Under', 'Monostructural', v_box_id, '/movements/double-under.svg'),
    (gen_random_uuid(), 'Shuttle Run', 'Monostructural', v_box_id, '/movements/shuttle-run.svg'),
    (gen_random_uuid(), 'Swimming', 'Monostructural', v_box_id, '/movements/rowing.svg')
  ON CONFLICT (name, box_id) DO UPDATE SET category = EXCLUDED.category, image_url = EXCLUDED.image_url;
END $$;

DO $$
DECLARE
  v_box_id UUID := 'fd14f401-d8a0-4ec3-b36e-e1c74676ab9e';
BEGIN
  -- ═══════════════════════════════════════════════════════════
  -- ACCESSORY (Kettlebells, Dumbbells, Bands, etc.)
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO public.movements (id, name, category, box_id, image_url) VALUES
    (gen_random_uuid(), 'Wall Ball', 'Accessory', v_box_id, '/movements/wall-ball.svg'),
    (gen_random_uuid(), 'Wall Balls', 'Accessory', v_box_id, '/movements/wall-ball.svg'),
    (gen_random_uuid(), 'Kettlebell Swing', 'Accessory', v_box_id, '/movements/kettlebell-swing.svg'),
    (gen_random_uuid(), 'Kettlebell Clean', 'Accessory', v_box_id, '/movements/kettlebell-swing.svg'),
    (gen_random_uuid(), 'Kettlebell Snatch', 'Accessory', v_box_id, '/movements/kettlebell-swing.svg'),
    (gen_random_uuid(), 'Kettlebell Clean & Jerk', 'Accessory', v_box_id, '/movements/kettlebell-swing.svg'),
    (gen_random_uuid(), 'Goblet Squat', 'Accessory', v_box_id, '/movements/goblet-squat.svg'),
    (gen_random_uuid(), 'Turkish Get-Up', 'Accessory', v_box_id, '/movements/kettlebell-swing.svg'),
    (gen_random_uuid(), 'Dumbbell Snatch', 'Accessory', v_box_id, '/movements/dumbbell-snatch.svg'),
    (gen_random_uuid(), 'Dumbbell Clean & Jerk', 'Accessory', v_box_id, '/movements/dumbbell-snatch.svg'),
    (gen_random_uuid(), 'Dumbbell Thruster', 'Accessory', v_box_id, '/movements/dumbbell-snatch.svg'),
    (gen_random_uuid(), 'Dumbbell Front Squat', 'Accessory', v_box_id, '/movements/goblet-squat.svg'),
    (gen_random_uuid(), 'Dumbbell Overhead Squat', 'Accessory', v_box_id, '/movements/dumbbell-snatch.svg'),
    (gen_random_uuid(), 'Dumbbell Walking Lunges', 'Accessory', v_box_id, '/movements/back-squat.svg'),
    (gen_random_uuid(), 'Devil Press', 'Accessory', v_box_id, '/movements/devil-press.svg'),
    (gen_random_uuid(), "Farmer's Carry", 'Accessory', v_box_id, '/movements/farmers-carry.svg'),
    (gen_random_uuid(), 'Sled Push', 'Accessory', v_box_id, '/movements/running.svg'),
    (gen_random_uuid(), 'Sled Pull', 'Accessory', v_box_id, '/movements/running.svg'),
    (gen_random_uuid(), 'Hip Thrust', 'Accessory', v_box_id, '/movements/sit-up.svg'),
    (gen_random_uuid(), 'Glute Bridge', 'Accessory', v_box_id, '/movements/sit-up.svg'),
    (gen_random_uuid(), 'GHD Hip Extension', 'Accessory', v_box_id, '/movements/ghd-sit-up.svg'),
    (gen_random_uuid(), 'Med Ball Clean', 'Accessory', v_box_id, '/movements/wall-ball.svg'),
    (gen_random_uuid(), 'Med Ball Slam', 'Accessory', v_box_id, '/movements/med-ball-slam.svg'),
    (gen_random_uuid(), 'Overhead Med Ball Throw', 'Accessory', v_box_id, '/movements/wall-ball.svg'),
    (gen_random_uuid(), 'Sandbag Clean', 'Accessory', v_box_id, '/movements/clean.svg'),
    (gen_random_uuid(), 'Sandbag Carry', 'Accessory', v_box_id, '/movements/farmers-carry.svg'),
    (gen_random_uuid(), 'Face Pull', 'Accessory', v_box_id, '/movements/ring-row.svg'),
    (gen_random_uuid(), 'Banded Pull-Apart', 'Accessory', v_box_id, '/movements/ring-row.svg'),
    (gen_random_uuid(), 'Banded Face Pull', 'Accessory', v_box_id, '/movements/ring-row.svg'),
    (gen_random_uuid(), 'Plank', 'Accessory', v_box_id, '/movements/plank.svg'),
    (gen_random_uuid(), 'Side Plank', 'Accessory', v_box_id, '/movements/plank.svg'),
    (gen_random_uuid(), 'Dead Bug', 'Accessory', v_box_id, '/movements/plank.svg'),
    (gen_random_uuid(), 'Cossack Squat', 'Accessory', v_box_id, '/movements/air-squat.svg'),
    (gen_random_uuid(), 'Broad Jump', 'Accessory', v_box_id, '/movements/broad-jump.svg'),
    (gen_random_uuid(), 'Depth Jump', 'Accessory', v_box_id, '/movements/broad-jump.svg'),
    (gen_random_uuid(), 'Ab Mat Sit-Up', 'Accessory', v_box_id, '/movements/sit-up.svg')
  ON CONFLICT (name, box_id) DO UPDATE SET category = EXCLUDED.category, image_url = EXCLUDED.image_url;
END $$;
