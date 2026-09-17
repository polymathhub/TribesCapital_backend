# Messaging presence

The messaging active-user endpoint returns the authenticated member first, followed by other members currently tracked as online by the messaging Socket.IO gateway.

The authenticated member is displayed as `You` in the compact people list. Presence is backed by the messaging socket connection lifecycle; the server tracks multiple connections per user before emitting offline state.
