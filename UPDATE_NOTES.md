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
