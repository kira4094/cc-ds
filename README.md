# cc-ds

**DeepSeek balance & cache hit rate statusline for Claude Code.**

Displays real-time DeepSeek account balance and cache hit rate in the CC status bar.

```
[¥ 12.34] [ 87%]
```

## How to install

Two ways:

### Option 1: Plugin install (recommended)

Inside Claude Code:

```
/plugin marketplace add kira4094/cc-ds
/plugin install cc-ds
/reload-plugins
```

Restart Claude Code. That's it.

### Option 2: npm install

```bash
npm install -g cc-ds
cc-ds install
```

**Important: Restart Claude Code after installation for the plugin to activate.**

## How to uninstall

### Plugin uninstall
```
/plugin uninstall cc-ds
/reload-plugins
```

### npm uninstall
```bash
cc-ds uninstall --purge   # unregister plugin + delete data
npm uninstall -g cc-ds
```

Restart Claude Code.

## License

MIT
