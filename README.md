# kwin-toggleterminal

KWin script for toggling your terminal with a global hotkey.

*Note*: This is the README for version 2.x.x, which works on KDE Plasma 6. If
you're using KDE Plasma 5, see version 1.x.x on the branch
[`plasma5`](https://github.com/DvdGiessen/kwin-toggleterminal/tree/plasma5).

## Installation

This script depends on a helper program to actually launch the terminal app via
D-Bus when it's not already running, because there is no API for KWin scripts to
start programs directly ([bug](https://bugs.kde.org/show_bug.cgi?id=474207)).
Without it this script can toggle your terminal when its already running but not
start a new instance of it.

Install [`dbus-app-launcher`](https://github.com/DvdGiessen/dbus-app-launcher)
to enable starting new instances of your terminal app.

To install this script:

```sh
kpackagetool6 -t KWin/Script -i .
```

To upgrade if already installed:

```sh
kpackagetool6 -t KWin/Script -u .
```

## Configuration

### Via the System Settings GUI

After installation the script can be found in System Settings > Window
Management > KWin Scripts.

Enable it, and optionally change the configuration to your own terminal. By
default this script starts [`foot`](https://codeberg.org/dnkl/foot). Also see
the usage recommendations below for how you could set this up further.

You can configure the hotkey by going to System Settings > Keyboard > Shortcuts
and searching for the "Toggle Terminal" action in the KWin category. Configure
any custom shortcut you like.

(Note: KWin doesn't always correctly detect changes to the configuration. If
your changes are not applied, run `qdbus org.kde.KWin /KWin reconfigure` or log
out and in again to restart KWin.)

### Via the command line

Enable the script:

```sh
kwriteconfig6 --file kwinrc --group Plugins --key toggleterminalEnabled true
qdbus org.kde.KWin /KWin reconfigure
```

Configure a hotkey for the KWin "Toggle Terminal" action:

```sh
kwriteconfig6 --file kglobalshortcutsrc --group kwin --key ToggleTerminal 'Meta+`,none,Toggle Terminal'
qdbus org.kde.KWin /KWin reconfigure
```

To configure a different terminal:

```sh
kwriteconfig6 --file kwinrc --group Script-toggleterminal --key windowNamePrefix foot
kwriteconfig6 --file kwinrc --group Script-toggleterminal --key windowNameSuffix ''
kwriteconfig6 --file kwinrc --group Script-toggleterminal --key launchCommand /usr/bin/foot
qdbus org.kde.KWin /KWin reconfigure
```

## Usage

Press the configured hotkey to summon or hide your terminal.

A few recommendations to make it more seamless:

- Use an easy to access hotkey. I personally use Meta+\` since it's similar to
  what I'm used to from most Quake-style terminals.
- Set up Window Rules (under System Settings > Window Management > Window Rules)
  to exclude the terminal window from the taskbar, pager and switcher.
- Since this script finds the window to toggle by looking at its caption, this
  means it may no longer correctly detect the window if its caption was changed.

  In a terminal may happen because a program running inside changes it. If your
  terminal emulator of choice doesn't have a caption with a fixed prefix/suffix,
  you can consider running inside a terminal multiplexer such as `tmux` which
  always prepends the session name to the caption. In `foot` this can be done by
  adding the following option to `~/.config/foot/foot.ini`:

  ```ini
  shell=/usr/bin/tmux new -As foot
  ```
- Configure your terminal to run in full-screen mode. In `foot` you can add the
  following option to `~/.config/foot/foot.ini`:

  ```ini
  initial-window-mode=fullscreen
  ```

  You can also make the terminal semi-transparent using a Window Rule to set the
  active opacity to less than 100%.

## Troubleshooting

- If your terminal is not starting, check that the `dbus-app-launcher` service is woring:

  ```sh
  qdbus nl.dvdgiessen.dbusapplauncher /nl/dvdgiessen/DBusAppLauncher nl.dvdgiessen.dbusapplauncher.Exec.Cmd /usr/bin/foot
  ```

- If your terminal does not minimize and maximize, check that the window name
  prefix and suffix are correctly configured.

  An easy way to view the captions of all windows, be they hidden or not, is by
  checking the KWin debug console. To access it open KRunner, type `kwin`, and
  click on `Open KWin debug console`. The first tab gives you a list of all open
  windows. You can expand them to view their `caption` property.

## License and contributing

`kwin-toggleterminal` is free software licensed under the
[GPLv3](https://github.com/DvdGiessen/kwin-toggleterminal/blob/plasma6/LICENSE).

If you have fixed a bug or want to contribute a feature, feel free to open a
pull request on [GitHub](https://github.com/DvdGiessen/kwin-toggleterminal).
