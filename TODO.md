# TODO.md

## Prompt 2 Backend Completion

- [ ] Explore backend routes and tracking/parcels services to derive real status + dates.
- [ ] Update `GET /me/parcels` to return required fields per parcel.
- [ ] Implement `GET /me/dashboard` (active/delivered/delayed/returned, weeklyActivity, monthlyOverview, nextEta).
- [ ] Implement weekly & monthly aggregation from real parcel records (no placeholder values).
- [ ] Compute `nextEta` using backend ETA calculations.
- [ ] Update `src/pages/user/UserDashboard.tsx` to consume `GET /me/dashboard` and remove fallback/mock data.
- [ ] Run backend checks and frontend build.
- [ ] Verify dashboard displays real values; ensure no placeholder statistics remain.

