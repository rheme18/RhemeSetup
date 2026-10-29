const { exec } = require('child_process');

// Tweak registry ve PowerShell komut haritası
const TWEAK_COMMANDS = {
    'tweak-bing': `
        Set-ItemProperty -Path "HKCU:\\Software\\Policies\\Microsoft\\Windows\\Explorer" -Name "DisableSearchBoxSuggestions" -Value 1 -Type DWord -ErrorAction SilentlyContinue;
        Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Search" -Name "BingSearchEnabled" -Value 0 -Type DWord -ErrorAction SilentlyContinue;
    `,
    'tweak-telemetry': `
        Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" -Name "AllowTelemetry" -Value 0 -Type DWord -ErrorAction SilentlyContinue;
        Stop-Service -Name "DiagTrack" -ErrorAction SilentlyContinue;
        Set-Service -Name "DiagTrack" -StartupType Disabled -ErrorAction SilentlyContinue;
    `,
    'tweak-ads': `
        Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager" -Name "SubscribedContent-338388Enabled" -Value 0 -Type DWord -ErrorAction SilentlyContinue;
        Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager" -Name "SubscribedContent-353696Enabled" -Value 0 -Type DWord -ErrorAction SilentlyContinue;
        Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager" -Name "SystemPaneSuggestionsEnabled" -Value 0 -Type DWord -ErrorAction SilentlyContinue;
    `,
    'tweak-cortana': `
        Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search" -Name "AllowCortana" -Value 0 -Type DWord -ErrorAction SilentlyContinue;
        Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsCopilot" -Name "TurnOffWindowsCopilot" -Value 1 -Type DWord -ErrorAction SilentlyContinue;
    `,
    'tweak-gamedvr': `
        Set-ItemProperty -Path "HKCU:\\System\\GameConfigStore" -Name "GameDVR_Enabled" -Value 0 -Type DWord -ErrorAction SilentlyContinue;
        Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\GameDVR" -Name "AllowGameDVR" -Value 0 -Type DWord -ErrorAction SilentlyContinue;
    `,
    'tweak-fullscreenopt': `
        Set-ItemProperty -Path "HKCU:\\System\\GameConfigStore" -Name "GameDVR_FSEBehaviorMode" -Value 2 -Type DWord -ErrorAction SilentlyContinue;
        Set-ItemProperty -Path "HKCU:\\System\\GameConfigStore" -Name "GameDVR_DXGIHonorFSEModeMode" -Value 1 -Type DWord -ErrorAction SilentlyContinue;
    `,
    'tweak-nodriverupdate': `
        Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate" -Name "ExcludeWUDriversInQualityUpdate" -Value 1 -Type DWord -ErrorAction SilentlyContinue;
    `,
    'tweak-classiccontext': `
        reg add "HKCU\\Software\\Classes\\CLSID\\{86ca1aa0-34fe-4e02-9156-02974e41cd2b}\\InprocServer32" /f /ve;
    `,
    'tweak-onedrive': `
        taskkill /f /im OneDrive.exe;
        $onedrive = "$env:SYSTEMROOT\\SysWOW64\\OneDriveSetup.exe";
        if (!(Test-Path $onedrive)) { $onedrive = "$env:SYSTEMROOT\\System32\\OneDriveSetup.exe" };
        Start-Process $onedrive "/uninstall" -NoNewWindow -Wait;
    `,
    'tweak-bloatware': `
        Get-AppxPackage *CandyCrush* | Remove-AppxPackage;
        Get-AppxPackage *SolitaireCollection* | Remove-AppxPackage;
        Get-AppxPackage *BingNews* | Remove-AppxPackage;
        Get-AppxPackage *BingWeather* | Remove-AppxPackage;
        Get-AppxPackage *People* | Remove-AppxPackage;
    `
};

// Uygulama Fonksiyonu
function applySelectedTweaks() {
    const applyBtn = document.getElementById('apply-tweaks-btn');
    applyBtn.disabled = true;
    applyBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${document.documentElement.lang === 'en' ? 'Applying settings...' : 'Ayarlar Uygulanıyor...'}`;

    let scriptToRun = "";
    let selectedCount = 0;

    // Seçili toggle'ları tara
    Object.keys(TWEAK_COMMANDS).forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox && checkbox.checked) {
            scriptToRun += TWEAK_COMMANDS[id] + "\n";
            selectedCount++;
        }
    });

    if (selectedCount === 0) {
        alert(document.documentElement.lang === 'en' ? 'Select at least one tweak to apply.' : 'Lütfen önce uygulanacak en az bir ayar seçin.');
        applyBtn.disabled = false;
        applyBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> ${document.documentElement.lang === 'en' ? 'Apply Selected Tweaks' : 'Seçili İnce Ayarları Uygula'}`;
        return;
    }

    // PowerShell komutunu Yönetici yetkisi ile tetikle
    const powershellCommand = `powershell -Command "& { ${scriptToRun.replace(/"/g, '\"')} }"`;

    exec(powershellCommand, { name: 'RhemeSetup Admin Execution' }, (error, stdout, stderr) => {
        applyBtn.disabled = false;
        applyBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> ${document.documentElement.lang === 'en' ? 'Apply Selected Tweaks' : 'Seçili İnce Ayarları Uygula'}`;

        if (error) {
            console.error("Tweak hatası:", stderr);
            alert(document.documentElement.lang === 'en' ? 'The operation failed or administrator access was denied. Restart the app as administrator and try again.' : "İşlem sırasında bir hata oluştu veya Yönetici izni reddedildi. Uygulamayı yönetici olarak açıp tekrar deneyin.");
        } else {
            alert(document.documentElement.lang === 'en' ? `Done! ${selectedCount} tweaks were applied successfully.` : `${selectedCount} ince ayar başarıyla uygulandı.`);
            
            // Eğer Klasik Sağ tık seçildiyse Explorer'ı yeniden başlatmak gerekebilir
            if (document.getElementById('tweak-classiccontext').checked) {
                exec('taskkill /f /im explorer.exe & start explorer.exe');
            }
        }
    });
}
