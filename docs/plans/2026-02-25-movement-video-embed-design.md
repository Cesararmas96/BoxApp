# Movement Video Embed — Design Document

**Date:** 2026-02-25
**Status:** Approved
**Scope:** `src/pages/Movements.tsx`, new utility `src/lib/videoEmbed.ts`

---

## Summary

Add the ability to view exercise movement demonstrations via embedded video (YouTube/Vimeo) directly inside the movement detail modal. No database schema changes are needed — the `demo_url` field already exists on the `movements` table.

---

## Architecture

### New utility: `src/lib/videoEmbed.ts`

A pure utility function `resolveVideoEmbed(url: string): string | null` that:

- Detects YouTube patterns: `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/shorts/`
  → returns `https://www.youtube.com/embed/{videoId}`
- Detects Vimeo patterns: `vimeo.com/{id}`
  → returns `https://player.vimeo.com/video/{videoId}`
- Detects direct video files (`.mp4`, `.webm`, `.ogg`)
  → returns the URL as-is (handled with `<video>` element)
- Unrecognized or empty URL → returns `null`

---

## UI Changes

### Movement detail modal

Current behavior: shows image + external "VIEW DEMO" link button.

New behavior based on available fields:

| Has image | Has video | Result |
|-----------|-----------|--------|
| No        | No        | No media section |
| Yes       | No        | Image only (current behavior) |
| No        | Yes       | Embedded video player (16:9 iframe) |
| Yes       | Yes       | Tabs: [IMAGEN] [VIDEO] — user can switch |

The video iframe renders with:
```html
<iframe
  src="{embedUrl}"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
  className="w-full aspect-video rounded-xl"
/>
```

For direct `.mp4` URLs, a `<video controls>` element is used instead.

### Movement editor form (admin only)

- The existing `DEMO URL` input field is preserved unchanged.
- A **live preview** is added below the field: if the pasted URL is a recognized YouTube/Vimeo link, a thumbnail is shown immediately using YouTube's thumbnail API (`img.youtube.com/vi/{id}/hqdefault.jpg`) or a Vimeo API call.
- No new fields or DB columns required.

---

## Permissions

Only box admins can set or modify `demo_url`. This is already enforced by the existing form access controls (the edit dialog is only accessible to admins). No additional permission logic needed.

---

## Files to Modify

1. **`src/lib/videoEmbed.ts`** — New file. URL parsing and embed resolution utility.
2. **`src/pages/Movements.tsx`** — Two sections modified:
   - Movement detail modal: add tabs + video player when `demo_url` resolves to a valid embed.
   - Movement editor form: add inline preview below `DEMO URL` field.

---

## Out of Scope

- YouTube Data API auto-search (not included, can be added later)
- ExerciseDB API integration
- Video upload to Supabase Storage
- Member-facing video permissions (admins only can set URLs)
