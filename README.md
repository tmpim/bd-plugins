# BetterDiscord Plugins
A collection of BetterDiscord plugins developed by Tmpim.

## Usage
Install plugins with the `install-plugin` script.
For example:
```
$> ./install-plugin BadgeClasses
Installing Plugin: BadgeClasses... OK

$>
```

## Plugins
---
### AddQuote
> Adds an 'Add Quote' button to message action bar.

This plugin only works in the `tmpim` guild.

### BadgeClasses
> Adds CSS classes to the channel badges when you have pings

---
### NoDrag
> Adds a setting to disable reordering of channels/categories.

Disables channel dragging by default.

Right clicking on a guild's sidebar grants an option to
temporarily re-enable channel reordering. The delay before
the ability is re-enabled is configurable in settings.

---
### Tetrio
> Pops up a message when tmpim spyglass reports an active tetr.io lobby.

---
### ThemeIPC
**This plugin only works under UNIX systems.**
> Hosts a UNIX IPC socket and listens for theme change commands.

The IPC socket is located at `/tmp/discord_theme`.

Send either the string `light` or `dark` to change the theme.
