class WingetService {
    static async checkWinget() {
        const res = await window.api.runCommand('where winget');
        return res.success && res.output.toLowerCase().includes('winget.exe');
    }

    static async getInstalledCount() {
        // WMIC yerine modern sistemlerde çalışan winget list komutunu kullanıp satır sayıyoruz.
        const res = await window.api.runCommand('winget list');
        if (res.success) {
            const lines = res.output.split('\n').filter(l => l.trim() !== '');
            // İlk 2 satır başlık olduğundan onları çıkarıyoruz
            return lines.length > 2 ? lines.length - 2 : 0;
        }
        return "Bilinmiyor";
    }

    // KURULUM MOTORU
    static async installApps(appIds, onProgress) {
        const progressContainer = document.getElementById('install-progress-container');
        const statusText = document.getElementById('install-status-text');
        const progressBar = document.getElementById('install-progress-bar');
        const progressPercentage = document.getElementById('install-progress-percentage');
        
        if (progressContainer) progressContainer.classList.remove('hidden');
        
        SystemService.log(`Toplu kurulum başlatıldı. Toplam seçilen uygulama sayısı: ${appIds.length}`, 'info');
        
        for (let i = 0; i < appIds.length; i++) {
            const id = appIds[i];
            
            // Başlangıç yüzdesi (Örn: 0. eleman başlarken en az %5 gösterilsin ki dondu sanılmasın)
            const startPercent = Math.max(5, Math.floor((i / appIds.length) * 100));
            
            if (statusText) statusText.innerText = `Kuruluyor: ${id} (${i + 1}/${appIds.length})`;
            if (progressBar) progressBar.style.width = `${startPercent}%`;
            if (progressPercentage) progressPercentage.innerText = `%${startPercent}`;
            
            if (onProgress) onProgress(id, i, appIds.length, 'installing');
            SystemService.log(`Kurulum Başlatıldı: ${id} (${i + 1}/${appIds.length})...`, 'info');
            
            // Winget parametreleri: --silent --accept-source-agreements --accept-package-agreements
            const cmd = `winget install --id "${id}" --silent --accept-source-agreements --accept-package-agreements`;
            const result = await window.api.runCommand(cmd);
            
            // İşlem BİTTİĞİNDE barı ilerlet
            const endPercent = Math.floor(((i + 1) / appIds.length) * 100);
            if (progressBar) progressBar.style.width = `${endPercent}%`;
            if (progressPercentage) progressPercentage.innerText = `%${endPercent}`;

            if (result.success) {
                SystemService.log(`BAŞARILI: ${id} sisteme başarıyla kuruldu.`, 'success');
                if (onProgress) onProgress(id, i + 1, appIds.length, 'success');
            } else {
                SystemService.log(`HATA (${id}): Kurulum başarısız oldu. Hata: ${result.error}`, 'error');
                if (onProgress) onProgress(id, i + 1, appIds.length, 'error', result.error);
            }
        }
        
        if (statusText) statusText.innerText = `Tüm kurulum işlemleri tamamlandı!`;
        if (progressBar) progressBar.style.width = '100%';
        if (progressPercentage) progressPercentage.innerText = '%100';
        
        SystemService.log('Toplu kurulum işlemleri tamamlandı.', 'success');
        setTimeout(() => {
            if (progressContainer) progressContainer.classList.add('hidden');
        }, 4000);
    }

    // KALDIRMA MOTORU
    static async uninstallApps(appIds, onProgress) {
        const progressContainer = document.getElementById('install-progress-container');
        const statusText = document.getElementById('install-status-text');
        const progressBar = document.getElementById('install-progress-bar');
        const progressPercentage = document.getElementById('install-progress-percentage');
        
        if (progressContainer) progressContainer.classList.remove('hidden');
        
        SystemService.log(`Toplu kaldırma işlemi başlatıldı. Toplam seçilen uygulama sayısı: ${appIds.length}`, 'info');
        
        for (let i = 0; i < appIds.length; i++) {
            const id = appIds[i];
            
            // Başlangıç yüzdesi
            const startPercent = Math.max(5, Math.floor((i / appIds.length) * 100));
            
            if (statusText) statusText.innerText = `Kaldırılıyor: ${id} (${i + 1}/${appIds.length})`;
            if (progressBar) progressBar.style.width = `${startPercent}%`;
            if (progressPercentage) progressPercentage.innerText = `%${startPercent}`;
            
            if (onProgress) onProgress(id, i, appIds.length, 'uninstalling');
            SystemService.log(`Kaldırma İşlemi Başlatıldı: ${id} (${i + 1}/${appIds.length})...`, 'info');
            
            // Winget kaldırma parametreleri: --silent
            const cmd = `winget uninstall --id "${id}" --silent`;
            const result = await window.api.runCommand(cmd);
            
            // İşlem BİTTİĞİNDE barı ilerlet
            const endPercent = Math.floor(((i + 1) / appIds.length) * 100);
            if (progressBar) progressBar.style.width = `${endPercent}%`;
            if (progressPercentage) progressPercentage.innerText = `%${endPercent}`;

            if (result.success) {
                SystemService.log(`SİLİNDİ: ${id} sistemden başarıyla kaldırıldı.`, 'success');
                if (onProgress) onProgress(id, i + 1, appIds.length, 'success');
            } else {
                SystemService.log(`KALDIRMA HATASI (${id}): Program kaldırılamadı veya bulunamadı. Hata: ${result.error}`, 'error');
                if (onProgress) onProgress(id, i + 1, appIds.length, 'error', result.error);
            }
        }
        
        if (statusText) statusText.innerText = `Kaldırma işlemleri tamamlandı!`;
        if (progressBar) progressBar.style.width = '100%';
        if (progressPercentage) progressPercentage.innerText = '%100';
        
        SystemService.log('Toplu kaldırma işlemleri tamamlandı.', 'success');
        setTimeout(() => {
            if (progressContainer) progressContainer.classList.add('hidden');
        }, 4000);
    }
}

window.WingetService = WingetService;