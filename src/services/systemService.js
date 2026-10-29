class SystemService {
    static async log(message, type = 'info') {
        // UI Konsoluna Ekle
        const consoleEl = document.getElementById('log-console');
        if (consoleEl) {
            const time = new Date().toLocaleTimeString('tr-TR');
            const colorClass = type === 'error' ? 'log-error' : type === 'success' ? 'log-success' : type === 'warning' ? 'log-warning' : 'log-info';
            consoleEl.innerHTML += `<p class="${colorClass}">[${time}] ${message}</p>`;
            consoleEl.scrollTop = consoleEl.scrollHeight;
        }
        // Logs/system.log dosyasına yaz
        if (window.api && window.api.writeLog) {
            window.api.writeLog(message, type);
        }
    }

    static async runCmd(cmd, successMsg, errorMsg) {
        this.log(document.documentElement.lang === 'en' ? `Starting operation: ${cmd}` : `İşlem başlatılıyor: ${cmd}`, 'info');
        try {
            const result = await window.api.runCommand(cmd);
            if (result.success) { 
                this.log(successMsg, 'success'); 
                return true; 
            } else { 
            this.log(`${errorMsg}: ${result.error}`, 'error'); 
                return false; 
            }
        } catch (e) {
            this.log(document.documentElement.lang === 'en' ? `Unexpected error: ${e.message}` : `Beklenmeyen hata: ${e.message}`, 'error');
            return false;
        }
    }

    static async cleanTemp() { 
        this.log(document.documentElement.lang === 'en' ? 'Cleaning temporary files (administrator permission may be required)...' : 'Geçici dosyalar temizleniyor (Yönetici İzni Gerekebilir)...', 'info');
        return this.runCmd(
            `powershell -Command "Start-Process powershell -ArgumentList '-NoProfile -Command Remove-Item -Path ''$env:TEMP/*' -Recurse -Force -ErrorAction SilentlyContinue; Remove-Item -Path ''C:/Windows/Temp/*' -Recurse -Force -ErrorAction SilentlyContinue' -Verb RunAs -Wait"`, 
            document.documentElement.lang === 'en' ? 'Temporary system files were cleaned successfully.' : 'Geçici sistem dosyaları başarıyla temizlendi.', 
            document.documentElement.lang === 'en' ? 'Cleanup failed or permission was denied' : 'Temizlik hatası veya kullanıcı izni reddetti'
        );
    }
    
    static async flushDNS() { 
        this.log(document.documentElement.lang === 'en' ? 'Resetting DNS and Winsock (administrator permission may be required)...' : 'DNS ve Winsock ayarları sıfırlanıyor (Yönetici İzni Gerekebilir)...', 'info');
        return this.runCmd(
            `powershell -Command "Start-Process cmd -ArgumentList '/c ipconfig /flushdns && netsh winsock reset' -Verb RunAs -Wait"`, 
            document.documentElement.lang === 'en' ? 'DNS cache was flushed and Winsock was reset.' : 'Ağ önbelleği (DNS) sıfırlandı ve Winsock ağ katmanı yenilendi.', 
            document.documentElement.lang === 'en' ? 'Network reset failed or permission was denied' : 'Ağ sıfırlama hatası veya kullanıcı izni reddetti'
        ); 
    }
    
    static async openTaskManager() { 
        return this.runCmd('taskmgr', document.documentElement.lang === 'en' ? 'Task Manager started.' : 'Görev Yöneticisi başlatıldı.', document.documentElement.lang === 'en' ? 'Could not start Task Manager' : 'Görev Yöneticisi başlatılamadı'); 
    }
    
    static async updateWinget() { 
        this.log(document.documentElement.lang === 'en' ? 'Checking and installing updates for all Winget apps (administrator permission may be required)...' : 'Sistemdeki tüm Winget uygulamaları için güncellemeler taranıyor ve kuruluyor (Yönetici İzni Gerekebilir)...', 'info');
        return this.runCmd(
            `powershell -Command "Start-Process cmd -ArgumentList '/k winget upgrade --all --silent --accept-source-agreements --accept-package-agreements' -Verb RunAs"`, 
            document.documentElement.lang === 'en' ? 'System updates started in a separate window.' : 'Sistem güncellemeleri ayrı bir pencerede başlatıldı.', 
            document.documentElement.lang === 'en' ? 'Could not start updates' : 'Güncelleme tetiklenirken hata oluştu'
        ); 
    }
    
    static async runSfc() { 
        this.log(document.documentElement.lang === 'en' ? 'Starting SFC scan (administrator permission may be required)...' : 'SFC Taraması başlatılıyor (Yönetici İzni Gerekebilir)...', 'info');
        return this.runCmd(
            `powershell -Command "Start-Process cmd -ArgumentList '/k sfc /scannow' -Verb RunAs"`, 
            document.documentElement.lang === 'en' ? 'SFC scan started in a separate window.' : 'SFC (Sistem Dosyası Denetleyicisi) taraması ayrı bir pencerede başlatıldı.', 
            document.documentElement.lang === 'en' ? 'Could not start SFC or permission was denied' : 'SFC başlatma hatası veya kullanıcı izni reddetti'
        ); 
    }
    
    static async runDism() { 
        this.log(document.documentElement.lang === 'en' ? 'Starting DISM image repair (administrator permission may be required)...' : 'DISM İmaj onarımı başlatılıyor (Yönetici İzni Gerekebilir)...', 'info');
        return this.runCmd(
            `powershell -Command "Start-Process cmd -ArgumentList '/k DISM /Online /Cleanup-Image /RestoreHealth' -Verb RunAs"`, 
            document.documentElement.lang === 'en' ? 'DISM image repair started in a separate window.' : 'DISM imaj onarımı ayrı bir pencerede başlatıldı.', 
            document.documentElement.lang === 'en' ? 'Could not start DISM or permission was denied' : 'DISM başlatma hatası veya kullanıcı izni reddetti'
        ); 
    }
    
    static async enableUltimatePerformance() { 
        this.log(document.documentElement.lang === 'en' ? 'Adding Ultimate Performance mode (administrator permission may be required)...' : 'Nihai Performans Modu ekleniyor (Yönetici İzni Gerekebilir)...', 'info');
        return this.runCmd(
            `powershell -Command "Start-Process powercfg -ArgumentList '-duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61' -Verb RunAs -Wait"`, 
            document.documentElement.lang === 'en' ? 'Ultimate Performance power plan added. Enable it in Power Options.' : 'Nihai Performans (Ultimate Performance) güç planı sisteme eklendi! Güç Seçeneklerinden aktifleştirebilirsiniz.', 
            document.documentElement.lang === 'en' ? 'Could not add Ultimate Performance or permission was denied' : 'Nihai Performans eklenirken hata oluştu veya kullanıcı izni reddetti'
        ); 
    }

    static async runWingetRepair() {
        this.log(document.documentElement.lang === 'en' ? 'Resetting and repairing Winget sources (administrator permission may be required)...' : 'Winget paket havuzu sıfırlanıyor ve onarılıyor (Yönetici İzni Gerekebilir)...', 'info');
        return this.runCmd(
            `powershell -Command "Start-Process cmd -ArgumentList '/k winget source reset --force && winget source update' -Verb RunAs"`,
            document.documentElement.lang === 'en' ? 'Winget sources were reset and updated.' : 'Winget kaynakları başarıyla sıfırlandı ve güncellendi.',
            document.documentElement.lang === 'en' ? 'Could not repair Winget sources' : 'Winget onarımı tetiklenirken hata oluştu'
        );
    }
    
    static async runDriverUpdate() {
        this.log(document.documentElement.lang === 'en' ? 'Scanning for missing device drivers (administrator permission may be required)...' : 'Eksik donanım sürücüleri taranıyor (Yönetici İzni Gerekebilir)...', 'info');
        const driverTitle = document.documentElement.lang === 'en' ? 'Searching for missing device drivers...' : 'Eksik Donanım Sürücüleri Aranıyor...';
        const noUpdates = document.documentElement.lang === 'en' ? 'All device drivers are up to date!' : 'Tebrikler, tüm sürücüleriniz güncel!';
        const closePrompt = document.documentElement.lang === 'en' ? 'Press Enter to close...' : 'Kapatmak için Entera basın...';
        return this.runCmd(
            `powershell -Command "Start-Process powershell -ArgumentList '-NoProfile -Command Write-Host ''${driverTitle}''; $updates = (New-Object -ComObject Microsoft.Update.Session).CreateUpdateSearcher().Search(''IsInstalled=0 and Type=\\'Driver\\'''').Updates; if ($updates.Count -eq 0) { Write-Host ''${noUpdates}'' } else { $updates | ForEach-Object { Write-Host $_.Title } }; Read-Host ''${closePrompt}''' -Verb RunAs"`,
            document.documentElement.lang === 'en' ? 'Driver scan started in a separate window.' : 'Sürücü taraması ayrı bir pencerede başlatıldı.',
            document.documentElement.lang === 'en' ? 'Could not start driver scan' : 'Sürücü taraması tetiklenirken hata oluştu'
        );
    }

    // Quick Scan / Kritik Kütüphane Taraması
    static async runQuickScan(onProgress) {
        const criticalLibs = [
            { name: "Visual C++ 2015-2022 Redistributable (x64)", id: "Microsoft.VCRedist.2015+.x64" },
            { name: "Visual C++ 2015-2022 Redistributable (x86)", id: "Microsoft.VCRedist.2015+.x86" },
            { name: ".NET Desktop Runtime 8.0 (x64)", id: "Microsoft.DotNet.DesktopRuntime.8" },
            { name: ".NET Desktop Runtime 6.0 (x64)", id: "Microsoft.DotNet.DesktopRuntime.6" },
            { name: document.documentElement.lang === 'en' ? "DirectX Runtime Libraries" : "DirectX Runtime Kütüphaneleri", id: "Microsoft.DirectX" }
        ];

        this.log(document.documentElement.lang === 'en' ? 'Starting system analysis...' : 'Sistem Analizi (Quick Scan) başlatılıyor...', 'info');
        const results = [];

        for (let i = 0; i < criticalLibs.length; i++) {
            const lib = criticalLibs[i];
            if (onProgress) onProgress(lib.name, i, criticalLibs.length);
            
            try {
                // winget list ile id'ye göre kontrol et
                const res = await window.api.runCommand(`winget list --id "${lib.id}"`);
                const isInstalled = res.success && res.output.includes(lib.id);
                results.push({ ...lib, installed: isInstalled });
                
                if (isInstalled) {
                    this.log(document.documentElement.lang === 'en' ? `[INSTALLED] ${lib.name} was found.` : `[YÜKLÜ] ${lib.name} sistemde bulundu.`, 'success');
                } else {
                    this.log(document.documentElement.lang === 'en' ? `[MISSING] ${lib.name} was not found.` : `[EKSİK] ${lib.name} sistemde bulunamadı!`, 'warning');
                }
            } catch (err) {
                results.push({ ...lib, installed: false, error: err.message });
                this.log(document.documentElement.lang === 'en' ? `[ERROR] Could not scan ${lib.name}: ${err.message}` : `[HATA] ${lib.name} taranamadı: ${err.message}`, 'error');
            }
        }

        this.log(document.documentElement.lang === 'en' ? 'System analysis complete.' : 'Sistem Analizi tamamlandı.', 'success');
        return results;
    }
}

window.SystemService = SystemService;
window.SystemTools = SystemService; // Geriye dönük uyumluluk için
