# ICPC AAST Aswan Scoreboard

A training portal for the ICPC AAST Aswan community. Trainees earn XP for attending sessions,
solving private sheets, joining Codeforces contests, answering Learning Hub questions and a daily
puzzle. The leaderboard ranks them by XP.

Built with Next.js (App Router), Prisma, PostgreSQL (Neon) and Tailwind.

## Features

| Area | What it does |
| --- | --- |
| Accounts | Email + password, signed cookie session, Codeforces handle verification by a code |
| Roles | Trainee, Instructor, Admin |
| Attendance | Sessions and camps, attendance and "active" bonus, XP given and taken back |
| Learning Hub | Materials per level and week, check-in question (once per material) |
| Sheets | A sheet is a private Codeforces group contest; solves are synced into XP |
| Contests | Participation, solves, upsolves and top 3 places among trainees |
| Daily puzzle | One puzzle per day (Cairo date), XP set per puzzle |
| XP ledger | Every change is a row in `XpTransaction`; `User.totalXp` is the sum of it |
| Admin tools | Adjust XP by hand with a reason, edit or delete content (deleting takes the XP back), reset a user's password |

## XP rules

All values live in `src/config/xp.config.ts`. Change a number there and it applies everywhere.
"First to solve" is disabled (0 XP) until a value is chosen.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill it in.
3. `npx prisma migrate deploy` to create the tables, then `npx prisma generate`.
4. `npm run dev` and open http://localhost:3000
5. Register with an email listed in `ADMIN_EMAILS` to get the Admin role.

## Codeforces

- Needs `CF_API_KEY` and `CF_API_SECRET` from an account that manages the private group.
- Check access to a contest: log in as staff and open `/api/admin/cf-check?url=<contest link>`.
- Codeforces allows about one request per 2 seconds, so syncs are queued (see `src/lib/codeforces.ts`).

## Scheduled sync

`vercel.json` runs `/api/cron/sync-sheets` every day at 02:00 UTC. It syncs sheets and recent
contests (least recently synced first), refreshes Codeforces rank, rating and avatar, and deletes old
login-attempt rows. It needs `CRON_SECRET`. Staff can also press "Sync now" on the sheets and
contests pages.

## Security notes

- Passwords are hashed with bcrypt; the hash never leaves the server.
- Correct answers (check-in and puzzle) are checked on the server and never sent to the browser.
- After 8 failed logins for one email (or 30 from one IP) in 15 minutes, login is blocked for the rest of that window.
- Login cookies last 30 days and are not revoked by a password reset.

## Scripts

`npm run dev`, `npm run build`, `npm run lint`
