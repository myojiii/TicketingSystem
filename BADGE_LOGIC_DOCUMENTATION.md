# Badge Visibility Logic - Implementation Summary

## Overview

The badge visibility system indicates whether an agent's reply message has been viewed by the client, separate from whether the client has replied.

## Core Rules

### Badge Display Logic

```javascript
const showBadge = hasAgentReply && !hasClientViewed;
```

**Rules:**

1. ✅ **Show Badge** if: `hasAgentReply === true` AND `hasClientViewed === false`
2. ✅ **Hide Badge** if: `hasClientViewed === true` (regardless of client reply status)
3. ✅ **Client reply is NOT required** to hide the badge

## Database Fields

### Ticket Schema Fields

```javascript
{
  hasAgentReply: { type: Boolean, default: false },    // Staff sent a message
  hasAgentView: { type: Boolean, default: false },     // Client viewed the message
  lastMessageAt: Date                                   // Timestamp of last message
}
```

## Frontend Implementation

### Badge Logic (client.js)

```javascript
const hasAgentReply = ticket.hasAgentReply || false; // Agent replied?
const hasClientViewed = ticket.hasAgentView || false; // Client viewed?
const showBadge = hasAgentReply && !hasClientViewed; // Show badge?
```

### Auto-Refresh

- Tickets auto-refresh **every 5 seconds** when on "My Tickets" tab
- This detects new messages from staff and shows the badge immediately

## Backend Implementation

### Endpoint: POST `/api/tickets/:id/mark-viewed`

**When:** Client opens a ticket
**Action:** Sets `hasAgentView = true`
**Result:** Badge disappears on next refresh

### Message Posting Logic

**When:** Staff sends a message
**Actions:**

1. Sets `hasAgentReply = true`
2. Resets `hasAgentView = false` (so badge appears)
3. Updates `lastMessageAt` timestamp

## Workflow

```
1. Staff sends message
   ↓
   hasAgentReply: true
   hasAgentView: false
   ↓
   BADGE APPEARS ✓

2. Client opens ticket
   ↓
   Calls POST /api/tickets/:id/mark-viewed
   ↓
   hasAgentView: true
   ↓
   BADGE DISAPPEARS ✓
   (Client can now read without replying)

3. Staff sends another message
   ↓
   hasAgentReply: true
   hasAgentView: false
   ↓
   BADGE APPEARS AGAIN ✓
```

## Key Points

✅ **Badge only indicates message viewing status**

- Not dependent on whether client replied
- Only depends on: hasAgentReply && !hasAgentView

✅ **Immediate response**

- Client views ticket → 300ms delay → Badge disappears
- Staff sends message → 5 second poll → Badge appears

✅ **Persistent across sessions**

- Backend flags persist in database
- Not dependent on local storage

## Testing Checklist

- [ ] Staff sends message → Badge appears within 5 seconds
- [ ] Client opens ticket → Badge disappears within 1 second
- [ ] Client doesn't reply → Badge still disappears (not required to reply)
- [ ] Staff sends another message → Badge reappears
- [ ] Multiple tickets with different states show correct badges
- [ ] Refresh page → Badge state persists
- [ ] Switch devices → Badge state syncs (database driven)
