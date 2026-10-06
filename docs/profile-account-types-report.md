# Profile and Account Access Report

## What Changed

The profile page now places a larger circular photo across the cover/profile boundary and shows the account label directly below it. That label reflects the saved account category: Member, Investor, Facility Operator, or Guest.

Profile editing supports both avatar and cover images. Cover images are previewed before saving, capped at 5 MB, and saved through the authenticated `PATCH /api/users/me` endpoint. The profile progress percentage is calculated from saved profile fields, including the avatar and cover photo.

Signup now saves the selected account category, and existing users can update that category themselves from Profile Settings. The profile API accepts only the four supported categories; it cannot grant administrative access. Existing account roles such as `admin` remain separate and continue to control administrative authorization.

## Account Access

- Community Members retain the existing member behavior.
- Facility Operators are stored as a distinct account category. Their product permissions currently match the existing member behavior.
- Investors can read Project Pipeline and Due Diligence API data. The account-type guard blocks non-GET writes to those routes.
- Read-only Guests can read course and lesson content, event listings, community browsing endpoints, and contractor listings. Guest writes, member-specific/private routes, Investor tools, and messaging navigation are blocked.

Public course/event/contractor GET endpoints remain anonymously public as before. Guest accounts are distinct authenticated accounts with additional server-side route restrictions.

Administrators can prepare a prewritten account-type reminder from Announcements. The reminder is not sent automatically; the administrator reviews the title and message and explicitly broadcasts it to existing users through the existing in-app notification flow.

## Swagger

After starting the backend, open `http://localhost:3000/api/docs` (or replace the port/API prefix with your configured values). Swagger supports bearer-token authorization and documents signup categories, profile image fields, and the relevant endpoint groups.

## Database Changes

Apply both migrations before deploying the backend against an existing database:

- `20261001120000_add_user_cover_photo`
- `20261001130000_add_user_account_type`

Run `npx prisma migrate deploy` in the backend project. New accounts default to `COMMUNITY_MEMBER`; legacy accounts receive that same default when the account-type migration is applied.

## Verification

The frontend and backend production builds passed. Prisma schema validation passed. Auth and access-guard tests passed, including Investor signup persistence and guest/investor access checks. Account-type DTO tests passed for all four supported categories and rejected `ADMIN`. Swagger UI and OpenAPI JSON both returned HTTP 200 in a local smoke test.
