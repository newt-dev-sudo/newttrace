# Datadog Query Cookbook

Ready-to-use queries for common Discord bot analytics scenarios. Replace `my-bot` with your actual `service` name.

## Core metrics

### Total installs today
```
@service:my-bot @event:guild_join
```

### Total uninstalls today
```
@service:my-bot @event:guild_leave
```

### Net growth (installs minus leaves)
Build a Datadog metric query with:
- `guild_join` count minus `guild_leave` count

---

## Attribution

### Installs by source
```
@service:my-bot @event:guild_join
```
Group by facet: `attributes.source`

### Installs from TOPGG specifically
```
@service:my-bot @event:guild_join @source:topgg
```

### Installs with unknown source
These are users who clicked a raw Discord OAuth URL instead of your tracked link.
```
@service:my-bot @event:guild_join @source:unknown
```

---

## Activation

### All activations
```
@service:my-bot @event:guild_activated
```

### Activation rate
Build a ratio in Datadog:
```
guild_activated count / guild_join count
```

### Average time to activation
```
avg(@meta.time_to_activation_ms)
```

### Activations by first command
```
@service:my-bot @event:guild_activated
```
Group by facet: `attributes.meta.first_command`

---

## Server quality

### Installs by server size
```
@service:my-bot @event:guild_join
```
Group by facet: `attributes.guild_size`

### Large servers only
```
@service:my-bot @event:guild_join @guild_size:large
```

### Average member count at join
```
avg(@attributes.member_count)
```

---

## Funnel analysis

### Step 1: User clicks tracked link
Tracked outside Datadog (TOPGG dashboard, analytics)

### Step 2: Bot added to server
```
@service:my-bot @event:guild_join
```

### Step 3: Server activates
```
@service:my-bot @event:guild_activated
```

### Conversion: Click → Install
```
guild_join count / tracked clicks
```

### Conversion: Install → Activate
```
guild_activated count / guild_join count
```

---

## Churn and retention

### Servers that left today
```
@service:my-bot @event:guild_leave
```

### Churn rate
```
guild_leave count / guild_join count (same period)
```

### High-risk servers (never activated)
Query `guild_join`, subtract guilds that also have `guild_activated`.

---

## Time-based analysis

### Installs this week vs last week
Use Datadog's time comparison feature on `@service:my-bot @event:guild_join`

### Peak install hours
```
@service:my-bot @event:guild_join
```
Group by: time of day

### Weekend vs weekday installs
Apply day-of-week filter to `@service:my-bot @event:guild_join`

---

## Command usage

### Total interactions
```
@service:my-bot @event:interaction
```

### Specific command usage
```
@service:my-bot @event:command_used @attributes.command:play
```

### Most popular commands
```
@service:my-bot @event:command_used
```
Group by facet: `attributes.command`
