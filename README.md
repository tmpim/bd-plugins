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
### BadgeClasses
> Adds CSS classes to the channel badges when you have pings
---
### ThemeIPC
**This plugin only works under UNIX systems.**
> Hosts a UNIX IPC socket and listens for theme change commands.

The IPC socket is located at `/tmp/discord_theme`.
Send either the string `light` or `dark` to change the theme.
