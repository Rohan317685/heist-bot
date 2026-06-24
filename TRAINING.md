# Heist Support Bot — Training Doc

## What the bot does

Whenever someone posts a message in the support channel, the bot automatically:
1. Creates a **ticket** (tracked internally)
2. Replies in a thread with a welcome message, FAQ link, and a **Resolve Ticket** button

## How tickets work

| Action | What happens |
|---|---|
| **Someone posts in the channel** | Bot replies in thread with FAQ link + Resolve button |
| **Click "Resolve Ticket"** | Thread gets marked resolved. Message: *"This has been marked as resolved. Reply to reopen."* |
| **Someone replies to a resolved thread** | Ticket reopens automatically |

### Who can resolve a ticket?
- The person who originally asked the question
- Any support team member (added via `/support enable`)

## Slash commands

All `/support` commands can be used by the **owner** and **admins** only.

### Enable a support team member
```
/support enable @user
```
or use their raw user ID:
```
/support enable U1234567890
```

### Disable a support team member
```
/support disable @user
/support disable U1234567890
```

## Permission levels

| Role | Who | Permissions |
|---|---|---|
| **Owner** | One person (set in config) | Can enable/disable **anyone** including admins |
| **Admin** | Added by owner via `.env` | Can enable/disable regular users. **Cannot** disable the owner or other admins |
| **Support Team** | Managed via `/support enable` | Can resolve tickets. Cannot manage other members |
| **User** | Everyone else | Can resolve their own tickets |

## FAQ link

The FAQ link shown in auto-replies is configured by the owner in `.env` (`FAQ_LINK`).

## Support team list

To see who's currently on the support team: `http://<pi-ip>:3000/api/support/team`

## Ticket stats

To see how many tickets are open/resolved: `http://<pi-ip>:3000/api/stats`
