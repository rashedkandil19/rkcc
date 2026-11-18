# RK Control Center – Arabic, Speed, Phone Layout & Muscle Picker

## Arabic
- Language button in the top bar (and on the sign-in page), plus a Language option in Settings → Preferences.
- Full right-to-left layout. The choice is remembered on the device and saved to your account (`settings` table, key `language`) – no schema change.
- What you type (notes, titles, names, exercises) is never translated or altered.
- If any English text is left on screen in Arabic mode, open the browser console and run `rkMissingTranslations()` to list it.

## Faster loading
- Pages (Finance, Reports, Tasks...) are now downloaded when first opened instead of all at startup; the rest load quietly in the background.
- Sign-in startup runs preferences + lookup lists in parallel, and skips the `seed_defaults` call once it has run in this browser.
- Overview loads today's workouts in parallel with its other queries.
- Browser hints (`preconnect` / `modulepreload`) start the Supabase library download earlier.

## Phones, tablets, large screens
- Tables no longer push the whole page sideways (a 620px minimum width was overriding the scroll container); they scroll inside their card.
- Added styles that the app already used but the stylesheet never defined: tabs, bar charts, kanban, calendar, habit cells, invoice item rows. Kanban scrolls sideways on phones.
- 16px form fields on phones (stops iOS zooming), sticky Save/Cancel in dialogs, tablet and wide-screen breakpoints.

## Workouts: pick by muscle
- In the workout form, a new "Pick the exercises you did" section: one list per muscle (Chest, Back, Shoulders, Biceps, Triceps, Forearms, Legs, Glutes, Abs, Cardio).
- Ticking an exercise adds it to the Exercises box; unticking removes it; editing the box updates the ticks. Existing workouts are pre-ticked when you edit them.
- Stored in the existing `exercises` field, so the database and old workouts are unaffected. `workout_type` still uses the values allowed by the database.

# RK Control Center – Mobile & Performance Update

## Mobile responsiveness
- Sidebar navigation becomes a sticky, horizontally scrollable navigation strip on tablets and phones.
- Main content, cards, grids, forms, dialogs, search, and notifications adapt to narrow screens.
- Wide tables scroll inside the viewport instead of forcing the entire page wider than the phone.
- Form dialogs switch to a single-column layout on small screens.

## Performance improvements
- Shared workspace/project/client/account/category lookups are cached for 30 seconds while navigating.
- Lookup queries request only the columns used by the app instead of every column.
- Reports/dashboard queries are limited to the selected report period and capped to avoid downloading tens of thousands of rows on initial load.
- Finance history requests now have explicit safety limits.

## Deployment
1. Replace the deployed project files with the contents of this ZIP.
2. Keep your existing `js/config.js` values (Supabase Project URL and public anon/publishable key).
3. Do not rerun `supabase/schema.sql`; this update does not require a database migration.
4. Push to GitHub and wait for the Vercel deployment to finish.
5. Open the site and hard-refresh (`Ctrl + Shift + R`).

## Validation
- `npm test`: 20/20 tests passed.
- `node --check` for all JavaScript modules: passed.
- The deployed Vercel site was not changed or directly load-tested as part of this ZIP update.
