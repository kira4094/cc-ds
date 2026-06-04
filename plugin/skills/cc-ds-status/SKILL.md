# cc-ds:status

Configure cc-ds as your DeepSeek balance & cache hit rate statusline.

## Usage

cc-ds auto-registers via Setup hook. To manually trigger:

```
node "C:/Users/kiray/.claude/plugins/cache/cc-ds/cc-ds/<version>/scripts/register-statusline.cjs"
```

After: `/reload-plugins`

## What it shows

```
[¥276.45 | hit 98%]
```

- Balance: DeepSeek account balance (5 min cache)
- Hit rate: Cache hit percentage from current session

## Uninstall

Remove via `/plugin` or delete the plugin directory.
