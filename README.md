# RhemeSetup 2.1

![License](https://img.shields.io/badge/license-MIT-brightgreen.svg)
![Platform](https://img.shields.io/badge/platform-Windows%2010%20%7C%2011-0078D6.svg)
![Architecture](https://img.shields.io/badge/architecture-Electron%20%7C%20Node.js%20%7C%20PowerShell-00D2FF.svg)
![Backend](https://img.shields.io/badge/backend-winget%20%7C%20PowerShell-7A00FF.svg)

RhemeSetup is a Windows desktop toolkit for setting up a fresh system. It brings together a Winget app library, package presets, runtime checks, maintenance shortcuts, performance tweaks, and an activity log.

The interface supports Turkish and English, light and dark appearance, and five accent colors. Preferences are saved on the current Windows user profile.

## Architecture

- Electron and Chromium render the HTML, CSS, and vanilla JavaScript interface.
- The Electron main process and Node.js services run Windows commands and collect system information.
- Winget provides package search, installation, and removal features.

## Run from source

1. Install Node.js and the Windows App Installer (Winget).
2. Run `npm install`.
3. Run `npm start`.

System maintenance actions may require administrator rights. Review each selected action before applying it.

## Packaging

The default `npm run dist` creates an unpacked application directory. When ready to create the portable executable, run `npm run dist:portable`. Portable packaging has not been run for this source update.

## Requirements

- Windows 10 or Windows 11
- Node.js for running from source
- Winget for package management features

## Safety

Some maintenance and tweak actions change Windows services, settings, or registry values. Review their effects before running them and create a Windows restore point when appropriate. RhemeSetup is an independent community project and is not affiliated with Microsoft.

## License

MIT. See [LICENSE](LICENSE).
