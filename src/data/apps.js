// Varsayılan 3D İkon (Sadece internet tamamen koparsa devreye girecek yedek görsel)
const DEFAULT_3D_ICON = "https://img.icons8.com/3d-fluency/94/box-important.png";

const appDatabase = [
    // Tarayıcılar (Browsers)
    { name: "Google Chrome", id: "Google.Chrome", category: "Tarayıcılar", icon: "https://img.icons8.com/color/48/chrome--v1.png" },
    { name: "Mozilla Firefox", id: "Mozilla.Firefox", category: "Tarayıcılar", icon: "https://img.icons8.com/color/48/firefox.png" },
    { name: "Brave Browser", id: "Brave.Brave", category: "Tarayıcılar", icon: "https://img.icons8.com/color/48/brave-web-browser.png" },
    { name: "Opera GX", id: "Opera.OperaGX", category: "Tarayıcılar", icon: "https://img.icons8.com/color/48/opera.png" },
    { name: "Vivaldi", id: "VivaldiTechnologies.Vivaldi", category: "Tarayıcılar", icon: "https://img.icons8.com/color/48/vivaldi.png" },
    { name: "Opera", id: "Opera.Opera", category: "Tarayıcılar", icon: "https://img.icons8.com/color/48/opera-neon.png" },
    
    // İletişim & Sosyal (Messaging)
    { name: "Discord", id: "Discord.Discord", category: "İletişim", icon: "https://img.icons8.com/color/48/discord-logo.png" },
    { name: "Telegram Desktop", id: "Telegram.TelegramDesktop", category: "İletişim", icon: "https://img.icons8.com/color/48/telegram-app.png" },
    { name: "WhatsApp", id: "WhatsApp.WhatsApp", category: "İletişim", icon: "https://img.icons8.com/color/48/whatsapp--v1.png" },
    { name: "Zoom", id: "Zoom.Zoom", category: "İletişim", icon: "https://img.icons8.com/color/48/zoom.png" },
    { name: "Slack", id: "SlackTechnologies.Slack", category: "İletişim", icon: "https://img.icons8.com/color/48/slack-new.png" },
    { name: "Microsoft Teams", id: "Microsoft.Teams", category: "İletişim", icon: "https://img.icons8.com/color/48/microsoft-teams.png" },
    { name: "Skype", id: "Microsoft.Skype", category: "İletişim", icon: "https://img.icons8.com/color/48/skype.png" },

    // Oyun Platformları (Gaming)
    { name: "Steam", id: "Valve.Steam", category: "Oyun", icon: "https://img.icons8.com/color/48/steam.png" },
    { name: "Epic Games Launcher", id: "EpicGames.EpicGamesLauncher", category: "Oyun", icon: "https://img.icons8.com/color/48/epic-games.png" },
    { name: "Ubisoft Connect", id: "Ubisoft.Connect", category: "Oyun", icon: "https://img.icons8.com/color/48/ubisoft.png" },
    { name: "GOG Galaxy", id: "GOG.Galaxy", category: "Oyun", icon: "https://img.icons8.com/color/48/gog-galaxy.png" },
    { name: "Riot Client", id: "RiotGames.RiotClient", category: "Oyun", icon: "https://img.icons8.com/color/48/riot-games.png" },
    { name: "EA App", id: "ElectronicArts.EADesktop", category: "Oyun", icon: "https://img.icons8.com/color/48/ea-sports.png" },
    { name: "Battle.net", id: "Blizzard.BattleNet", category: "Oyun", icon: "https://img.icons8.com/color/48/blizzard.png" },
    { name: "Roblox", id: "Roblox.Roblox", category: "Oyun", icon: "https://img.icons8.com/color/48/roblox.png" },

    // Geliştirici & Editörler (Developer Tools)
    { name: "Visual Studio Code", id: "Microsoft.VisualStudioCode", category: "Geliştirici", icon: "https://img.icons8.com/color/48/visual-studio.png" },
    { name: "Visual Studio Community 2022", id: "Microsoft.VisualStudio.2022.Community", category: "Geliştirici", icon: "https://img.icons8.com/color/48/visual-studio-2019.png" },
    { name: "Python 3.12", id: "Python.Python.3.12", category: "Geliştirici", icon: "https://img.icons8.com/color/48/python--v1.png" },
    { name: "Node.js (LTS)", id: "OpenJS.NodeJS.LTS", category: "Geliştirici", icon: "https://img.icons8.com/color/48/nodejs.png" },
    { name: "Git", id: "Git.Git", category: "Geliştirici", icon: "https://img.icons8.com/color/48/git.png" },
    { name: "GitHub Desktop", id: "GitHub.GitHubDesktop", category: "Geliştirici", icon: "https://img.icons8.com/color/48/github--v1.png" },
    { name: "Docker Desktop", id: "Docker.DockerDesktop", category: "Geliştirici", icon: "https://img.icons8.com/color/48/docker.png" },
    { name: "Postman", id: "Postman.Postman", category: "Geliştirici", icon: "https://img.icons8.com/color/48/postman-api.png" },
    { name: "PyCharm Community", id: "JetBrains.PyCharm.Community", category: "Geliştirici", icon: "https://img.icons8.com/color/48/pycharm.png" },
    { name: "Notepad++", id: "Notepad++.Notepad++", category: "Geliştirici", icon: "https://img.icons8.com/color/48/notepad.png" },
    { name: "Sublime Text 4", id: "SublimeHQ.SublimeText.4", category: "Geliştirici", icon: "https://img.icons8.com/color/48/sublime-text.png" },
    { name: "Android Studio", id: "Google.AndroidStudio", category: "Geliştirici", icon: "https://img.icons8.com/color/48/android-studio.png" },
    { name: "Java JDK 21", id: "Oracle.JDK.21", category: "Geliştirici", icon: "https://img.icons8.com/color/48/java-properties.png" },
    { name: "DBeaver Community", id: "dbeaver.dbeaver", category: "Geliştirici", icon: "https://img.icons8.com/color/48/dbeaver.png" },
    { name: "DB Browser for SQLite", id: "DBBrowserForSQLite.DBBrowserForSQLite", category: "Geliştirici", icon: "https://img.icons8.com/color/48/sqlite.png" },
    { name: "PuTTY", id: "SimonTatham.PuTTY", category: "Geliştirici", icon: "https://img.icons8.com/color/48/putty.png" },
    { name: "WinSCP", id: "WinSCP.WinSCP", category: "Geliştirici", icon: "https://img.icons8.com/color/48/winscp.png" },

    // Multimedya & Video/Ses (Multimedia)
    { name: "Spotify", id: "Spotify.Spotify", category: "Multimedya", icon: "https://img.icons8.com/color/48/spotify--v1.png" },
    { name: "VLC Media Player", id: "VideoLAN.VLC", category: "Multimedya", icon: "https://img.icons8.com/color/48/vlc.png" },
    { name: "OBS Studio", id: "OBSProject.OBSStudio", category: "Multimedya", icon: "https://img.icons8.com/color/48/obs-studio.png" },
    { name: "CapCut", id: "ByteDance.CapCut", category: "Multimedya", icon: "https://img.icons8.com/color/48/capcut.png" },
    { name: "Audacity", id: "Audacity.Audacity", category: "Multimedya", icon: "https://img.icons8.com/color/48/audacity.png" },
    { name: "Handbrake", id: "HandBrake.HandBrake", category: "Multimedya", icon: "https://img.icons8.com/color/48/handbrake.png" },

    // Tasarım & 3D (Design)
    { name: "Figma", id: "Figma.Figma", category: "Tasarım", icon: "https://img.icons8.com/color/48/figma--v1.png" },
    { name: "Blender", id: "BlenderFoundation.Blender", category: "Tasarım", icon: "https://img.icons8.com/color/48/blender-3d.png" },
    { name: "GIMP", id: "GIMP.GIMP", category: "Tasarım", icon: "https://img.icons8.com/color/48/gimp.png" },
    { name: "Inkscape", id: "Inkscape.Inkscape", category: "Tasarım", icon: "https://img.icons8.com/color/48/inkscape.png" },
    { name: "Krita", id: "Krita.Krita", category: "Tasarım", icon: "https://img.icons8.com/color/48/krita.png" },
    { name: "ShareX", id: "ShareX.ShareX", category: "Tasarım", icon: "https://img.icons8.com/color/48/sharex.png" },

    // Sistem & Faydalı Araçlar (System Tools)
    { name: "7-Zip", id: "7zip.7zip", category: "Araçlar", icon: "https://img.icons8.com/color/48/7zip.png" },
    { name: "WinRAR", id: "RARLab.WinRAR", category: "Araçlar", icon: "https://img.icons8.com/color/48/winrar.png" },
    { name: "Microsoft PowerToys", id: "Microsoft.PowerToys", category: "Araçlar", icon: "https://img.icons8.com/color/48/microsoft-powertoys.png" },
    { name: "Rufus", id: "Rufus.Rufus", category: "Araçlar", icon: "https://raw.githubusercontent.com/pbatard/rufus/master/res/rufus.ico" },
    { name: "AnyDesk", id: "AnyDeskSoftwareGmbH.AnyDesk", category: "Araçlar", icon: "https://img.icons8.com/color/48/anydesk.png" },
    { name: "TeamViewer", id: "TeamViewer.TeamViewer", category: "Araçlar", icon: "https://img.icons8.com/color/48/teamviewer.png" },
    { name: "Revo Uninstaller", id: "RevoUninstaller.RevoUninstaller", category: "Araçlar", icon: "https://img.icons8.com/color/48/revo-uninstaller.png" },
    { name: "CPU-Z", id: "CPUID.CPU-Z", category: "Araçlar", icon: "https://img.icons8.com/color/48/cpu-z.png" },
    { name: "HWMonitor", id: "CPUID.HWMonitor", category: "Araçlar", icon: "https://img.icons8.com/color/48/hwmonitor.png" },
    { name: "CrystalDiskInfo", id: "CrystalDewWorld.CrystalDiskInfo", category: "Araçlar", icon: "https://img.icons8.com/color/48/crystaldiskinfo.png" },
    { name: "Everything", id: "voidtools.Everything", category: "Araçlar", icon: "https://www.voidtools.com/favicon.ico" },
    { name: "WizTree", id: "AntibodySoftware.WizTree", category: "Araçlar", icon: "https://diskanalyzer.com/favicon.ico" },

    // Güvenlik & Bulut (Security & Cloud)
    { name: "Malwarebytes", id: "Malwarebytes.Malwarebytes", category: "Güvenlik", icon: "https://img.icons8.com/color/48/malwarebytes.png" },
    { name: "Bitwarden", id: "Bitwarden.Bitwarden", category: "Güvenlik", icon: "https://img.icons8.com/color/48/bitwarden.png" },
    { name: "KeePassXC", id: "KeePassXC.KeePassXC", category: "Güvenlik", icon: "https://img.icons8.com/color/48/keepassxc.png" },
    { name: "Google Drive", id: "Google.Drive", category: "Bulut", icon: "https://img.icons8.com/color/48/google-drive--v1.png" },
    { name: "Dropbox", id: "Dropbox.Dropbox", category: "Bulut", icon: "https://img.icons8.com/color/48/dropbox.png" },
    { name: "OneDrive", id: "Microsoft.OneDrive", category: "Bulut", icon: "https://img.icons8.com/color/48/onedrive.png" },

    // Ofis & Üretkenlik (Office & Productivity)
    { name: "LibreOffice", id: "LibreOffice.LibreOffice", category: "Üretkenlik", icon: "https://img.icons8.com/color/48/libreoffice.png" },
    { name: "Adobe Acrobat Reader DC", id: "Adobe.Acrobat.Reader.64-bit", category: "Üretkenlik", icon: "https://img.icons8.com/color/48/adobe-acrobat-reader.png" },
    { name: "Foxit PDF Reader", id: "Foxit.FoxitReader", category: "Üretkenlik", icon: "https://img.icons8.com/color/48/foxit-pdf-reader.png" },
    { name: "Notion", id: "Notion.Notion", category: "Üretkenlik", icon: "https://img.icons8.com/color/48/notion.png" },
    { name: "Obsidian", id: "Obsidian.Obsidian", category: "Üretkenlik", icon: "https://img.icons8.com/color/48/obsidian.png" }
];