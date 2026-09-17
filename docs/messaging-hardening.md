# Messaging hardening

The messaging layer now treats delivery UX, access control, and mobile behavior as one product surface.

## Core guarantees

- Conversation access is checked before message, reaction, read, report, and attachment operations.
- Public community channels remain readable without creating a member row for every active user.
- Unread counts are grouped by conversation instead of issuing one count query per conversation.
- Notification failures are logged and isolated from successful message creation.
- Mentioned users receive a mention notification instead of an additional generic message notification.
- Empty text messages are rejected unless they contain an attachment.
- Message edit content is trimmed and cannot be empty.
- Attachment filenames are generated from a random identifier and a MIME-derived extension.
- Message pagination limits are clamped to a safe range at the controller and service boundaries.
- Mobile messaging supports safe-area padding, touch targets, reduced motion, narrow screens, landscape layouts, and high-contrast preferences.
