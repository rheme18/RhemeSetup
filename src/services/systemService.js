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
        this.log(`İşlem başlatılıyor: ${cmd}`, 'info');
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
            this.log(`Beklenmeyen hata: ${e.message}`, 'error');
            return false;
        }
    }

    static async cleanTemp() { 
        this.log('Geçici dosyalar temizleniyor (Yönetici İzni Gerekebilir)...', 'info');
        return this.runCmd(
            `powershell -Command "Start-Process powershell -ArgumentList '-NoProfile -Command Remove-Item -Path ''$env:TEMP/*' -Recurse -Force -ErrorAction SilentlyContinue; Remove-Item -Path ''C:/Windows/Temp/*' -Recurse -Force -ErrorAction SilentlyContinue' -Verb RunAs -Wait"`, 
            'Geçici sistem dosyaları başarıyla temizlendi.', 
            'Temizlik hatası veya kullanıcı izni reddetti'
        );
    }
    
    static async flushDNS() { 
        this.log('DNS ve Winsock ayarları sıfırlanıyor (Yönetici İzni Gerekebilir)...', 'info');
        return this.runCmd(
            `powershell -Command "Start-Process cmd -ArgumentList '/c ipconfig /flushdns && netsh winsock reset' -Verb RunAs -Wait"`, 
            'Ağ önbelleği (DNS) sıfırlandı ve Winsock ağ katmanı yenilendi.', 
            'Ağ sıfırlama hatası veya kullanıcı izni reddetti'
        ); 
    }
    
    static async openTaskManager() { 
        return this.runCmd('taskmgr', 'Görev Yöneticisi başlatıldı.', 'Görev Yöneticisi başlatılamadı'); 
    }
    
    static async updateWinget() { 
        this.log('Sistemdeki tüm Winget uygulamaları için güncellemeler taranıyor ve kuruluyor (Yönetici İzni Gerekebilir)...', 'info');
        return this.runCmd(
            `powershell -Command "Start-Process cmd -ArgumentList '/k winget upgrade --all --silent --accept-source-agreements --accept-package-agreements' -Verb RunAs"`, 
            'Sistem güncellemeleri ayrı bir pencerede başlatıldı.', 
            'Güncelleme tetiklenirken hata oluştu'
        ); 
    }
    
    static async runSfc() { 
        this.log('SFC Taraması başlatılıyor (Yönetici İzni Gerekebilir)...', 'info');
        return this.runCmd(
            `powershell -Command "Start-Process cmd -ArgumentList '/k sfc /scannow' -Verb RunAs"`, 
            'SFC (Sistem Dosyası Denetleyicisi) taraması ayrı bir pencerede başlatıldı.', 
            'SFC başlatma hatası veya kullanıcı izni reddetti'
        ); 
    }
    
    static async runDism() { 
        this.log('DISM İmaj onarımı başlatılıyor (Yönetici İzni Gerekebilir)...', 'info');
        return this.runCmd(
            `powershell -Command "Start-Process cmd -ArgumentList '/k DISM /Online /Cleanup-Image /RestoreHealth' -Verb RunAs"`, 
            'DISM imaj onarımı ayrı bir pencerede başlatıldı.', 
            'DISM başlatma hatası veya kullanıcı izni reddetti'
        ); 
    }
    
    static async enableUltimatePerformance() { 
        this.log('Nihai Performans Modu ekleniyor (Yönetici İzni Gerekebilir)...', 'info');
        return this.runCmd(
            `powershell -Command "Start-Process powercfg -ArgumentList '-duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61' -Verb RunAs -Wait"`, 
            'Nihai Performans (Ultimate Performance) güç planı sisteme eklendi! Güç Seçeneklerinden aktifleştirebilirsiniz.', 
            'Nihai Performans eklenirken hata oluştu veya kullanıcı izni reddetti'
        ); 
    }

    static async runWingetRepair() {
        this.log('Winget paket havuzu sıfırlanıyor ve onarılıyor (Yönetici İzni Gerekebilir)...', 'info');
        return this.runCmd(
            `powershell -Command "Start-Process cmd -ArgumentList '/k winget source reset --force && winget source update' -Verb RunAs"`,
            'Winget kaynakları başarıyla sıfırlandı ve güncellendi.',
            'Winget onarımı tetiklenirken hata oluştu'
        );
    }
    
    static async runDriverUpdate() {
        this.log('Eksik donanım sürücüleri taranıyor (Yönetici İzni Gerekebilir)...', 'info');
        return this.runCmd(
            `powershell -Command "Start-Process powershell -ArgumentList '-NoProfile -Command Write-Host ''Eksik Donanim Suruculeri Araniyor...''; $updates = (New-Object -ComObject Microsoft.Update.Session).CreateUpdateSearcher().Search(''IsInstalled=0 and Type=\\'Driver\\'''').Updates; if ($updates.Count -eq 0) { Write-Host ''Tebrikler, tum suruculeriniz guncel!'' } else { $updates | ForEach-Object { Write-Host $_.Title } }; Read-Host ''Kapatmak icin Entera basin...''' -Verb RunAs"`,
            'Sürücü taraması ayrı bir pencerede başlatıldı.',
            'Sürücü taraması tetiklenirken hata oluştu'
        );
    }

    // Quick Scan / Kritik Kütüphane Taraması
    static async runQuickScan(onProgress) {
        const criticalLibs = [
            { name: "Visual C++ 2015-2022 Redistributable (x64)", id: "Microsoft.VCRedist.2015+.x64" },
            { name: "Visual C++ 2015-2022 Redistributable (x86)", id: "Microsoft.VCRedist.2015+.x86" },
            { name: ".NET Desktop Runtime 8.0 (x64)", id: "Microsoft.DotNet.DesktopRuntime.8" },
            { name: ".NET Desktop Runtime 6.0 (x64)", id: "Microsoft.DotNet.DesktopRuntime.6" },
            { name: "DirectX Runtime Kütüphaneleri", id: "Microsoft.DirectX" }
        ];

        this.log('Sistem Analizi (Quick Scan) başlatılıyor...', 'info');
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
                    this.log(`[YÜKLÜ] ${lib.name} sistemde bulundu.`, 'success');
                } else {
                    this.log(`[EKSİK] ${lib.name} sistemde bulunamadı!`, 'warning');
                }
            } catch (err) {
                results.push({ ...lib, installed: false, error: err.message });
                this.log(`[HATA] ${lib.name} taranamadı: ${err.message}`, 'error');
            }
        }

        this.log('Sistem Analizi tamamlandı.', 'success');
        return results;
    }
}

window.SystemService = SystemService;
window.SystemTools = SystemService; // Geriye dönük uyumluluk için