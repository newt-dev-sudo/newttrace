# Activation Tracking

## What is activation?

**Activation** is the moment a newly installed bot receives its first meaningful interaction in a server. It is the single most important conversion signal for a Discord bot.

A user who adds your bot but never uses it is functionally the same as a bounced visitor on a website. Activation separates real installs from dead ones.

newttrace automatically computes this for you.

## How it works

When a bot joins a server:

1. `guildCreate` fires
2. newttrace records the join time and any attribution source
3. The SDK waits for the first `interactionCreate` from that guild
4. On the first interaction, it emits a `guild_activated` event

The activation event includes **time-to-activation** — how many milliseconds passed between join and first interaction.

## Event schema

```json
{
  "event": "guild_activated",
  "timestamp": 1712345678901,
  "bot_id": "abc123",
  "guild_id": "987654321",
  "source": "campaign_summer_2024",
  "version": "1.0.0",
  "meta": {
    "time_to_activation_ms": 45000,
    "first_command": "play",
    "interaction_type": 2,
    "user_id": "111222333"
  }
}
```

## Why this matters

| Metric | What it tells you |
|--------|-------------------|
| `guild_join` vs `guild_activated` | How many installs actually get used |
| `time_to_activation_ms` | How quickly users engage — fast = good onboarding |
| Activation by source | Which bot listing sites send engaged users vs. bouncers |
| Activation by guild size | Do large or small servers activate faster? |

## Example: Tracking activation quality

You run a campaign on TOPGG for one day and see 100 `guild_join` events but only 30 `guild_activated` events. Your activation rate is 30%.

You try DiscordBotList the next day: 80 `guild_join` and 40 `guild_activated`. Activation rate is 50%.

**Conclusion:** DBL sends higher-quality traffic even at lower volume.

## Querying in Datadog

**All activations:**
```
@service:my-discord-bot @event:guild_activated
```

**Activation rate over time:**
Build a ratio of `guild_activated` / `guild_join` in a Datadog dashboard widget.

**Average time to activation:**
```
avg(@meta.time_to_activation_ms)
```

**Activation by first command:**
```
@service:my-discord-bot @event:guild_activated @meta.first_command:play
```

This tells you which command is most commonly the user's first experience.

**Activation by guild size:**
```
@service:my-discord-bot @event:guild_activated @meta.guild_size:small
@service:my-discord-bot @event:guild_activated @meta.guild_size:large
```

## Practical scenarios

**Scenario 1: Onboarding flow A/B test**

You change your bot's welcome message to include a "Quick Start" button. Compare activation rates before and after:

```
@service:my-bot @event:guild_activated
# Filter by version to compare
```

**Scenario 2: Detecting churn risk**

Guilds that never activate within 24 hours are likely to remove your bot. Query:

```
@service:my-bot @event:guild_join
```

Subtract guilds that also have `guild_activated`. The remainder is your at-risk cohort.

**Scenario 3: Command popularity at first use**

```
@service:my-bot @event:guild_activated
# Group by @meta.first_command
```

If 80% of users' first command is `/help`, your bot may lack clear onboarding.

## Limitations

- Activation is tracked **in-memory**. If your bot restarts, pending guilds lose their join timestamp. The guild will still get a `guild_join` event, but `guild_activated` will have `time_to_activation_ms: 0` (or won't fire if the join was lost).
- For persistent tracking across restarts, implement an external state store.
- Only one `guild_activated` event is emitted per guild. Subsequent interactions do not trigger it again.
