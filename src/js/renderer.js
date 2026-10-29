// Global Seçim Listesi ve Görünüm Durumu
let selectedApps = [];
let currentCategory = "all";
let searchQuery = "";
let currentView = "local"; // "local" veya "global"
let globalSearchResults = [];

const APP_CATEGORY_LABELS = {
    all: ['Tümü', 'All'],
    Browsers: ['Tarayıcılar', 'Browsers'], Tarayıcılar: ['Tarayıcılar', 'Browsers'],
    Communication: ['İletişim', 'Communication'], İletişim: ['İletişim', 'Communication'],
    Games: ['Oyun', 'Games'], Oyun: ['Oyun', 'Games'],
    Development: ['Geliştirici', 'Development'], Geliştirici: ['Geliştirici', 'Development'],
    Media: ['Multimedya', 'Media'], Multimedya: ['Multimedya', 'Media'],
    Design: ['Tasarım', 'Design'], Tasarım: ['Tasarım', 'Design'],
    Utilities: ['Araçlar', 'Utilities'], Araçlar: ['Araçlar', 'Utilities'],
    Security: ['Güvenlik', 'Security'], Güvenlik: ['Güvenlik', 'Security'],
    Cloud: ['Bulut', 'Cloud'], Bulut: ['Bulut', 'Cloud'],
    Productivity: ['Üretkenlik', 'Productivity'], Üretkenlik: ['Üretkenlik', 'Productivity']
};

function getCategoryLabel(category, language = document.documentElement.lang) {
    const labels = APP_CATEGORY_LABELS[category];
    return labels ? labels[language === 'en' ? 1 : 0] : category;
}

// --- 1. NAVİGASYON (SİDEBAR SEÇİMİ) ---
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(nav => nav.classList.remove('active'));
        pages.forEach(page => page.classList.remove('active'));
        
        item.classList.add('active');
        const targetPage = document.getElementById(item.dataset.target);
        if (targetPage) targetPage.classList.add('active');
        
        // İşlem Günlüğü sayfası açıldıysa logları yenile
        if (item.dataset.target === 'history') {
            loadSystemLogs();
        }
    });
});

// --- 2. PENCERE KONTROLLERİ ---
document.getElementById('btn-min').onclick = () => window.api.windowMin();
document.getElementById('btn-max').onclick = () => window.api.windowMax();
document.getElementById('btn-close').onclick = () => window.api.windowClose();

// --- 3. DİNAMİK UYGULAMA KÜTÜPHANESİ ---
const appGrid = document.getElementById('app-grid');
const searchInput = document.getElementById('app-search');
const selectedCountText = document.getElementById('selected-count');
const installBtn = document.getElementById('install-selected-btn');
const uninstallBtn = document.getElementById('uninstall-selected-btn');
const selectAllCheckbox = document.getElementById('select-all-checkbox');

// Arayüzü İlk Kez Yükle
function initializeLibrary() {
    renderCategoryFilters();
    renderAppGrid();
    updateBatchButtons();
}

// Kategorileri Veritabanından Çıkar ve Filtre Butonlarını Oluştur
function renderCategoryFilters() {
    const filtersContainer = document.getElementById('category-filters');
    // Benzersiz kategorileri bul
    const categories = ['all', ...new Set(appDatabase.map(app => app.category))];
    
    // Konteyneri temizle, sadece "Tümü" kalsın
    filtersContainer.innerHTML = '';
    
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `filter-btn ${cat === currentCategory ? 'active' : ''}`;
        btn.dataset.category = cat;
        btn.innerText = getCategoryLabel(cat);
        
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = cat;
            renderAppGrid();
        });
        
        filtersContainer.appendChild(btn);
    });
}

// Uygulama Kartlarını Render Et (İkon Kırılma ve Tırnak Çakışma Hatası Düzeltildi)
function renderAppGrid() {
    if (!appGrid) return;
    appGrid.innerHTML = '';
    
    if (currentView === 'global') {
        renderGlobalAppGrid();
        return;
    }
    
    // Arama ve Kategori Filtrelemesi yap
    const filteredApps = appDatabase.filter(app => {
        const matchesCategory = (currentCategory === 'all' || app.category === currentCategory);
        const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             app.id.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (filteredApps.length === 0) {
        const en = document.documentElement.lang === 'en';
        appGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fa-solid fa-face-frown" style="font-size: 32px; margin-bottom: 10px;"></i>
                <p>${en ? 'No matching apps were found in the local library.' : 'Yerel kütüphanede eşleşen uygulama bulunamadı.'}</p>
                <button id="btn-global-search" class="btn btn-primary" style="margin-top: 15px;">
                    <i class="fa-solid fa-globe"></i> ${en ? 'Search the Winget Store' : 'Winget Mağazasında Ara'}
                </button>
            </div>
        `;
        
        const globalSearchBtn = document.getElementById('btn-global-search');
        if (globalSearchBtn) {
            globalSearchBtn.onclick = () => runGlobalWingetSearch(searchQuery);
        }
        return;
    }

    filteredApps.forEach(app => {
        const isSelected = selectedApps.includes(app.id);
        const card = document.createElement('div');
        card.className = `app-card ${isSelected ? 'selected' : ''}`;
        card.dataset.id = app.id;
        
        // --- Güvenli İkon Alanı (DOM tabanlı fallback - HTML String çakışmalarını önler) ---
        const iconWrapper = document.createElement('div');
        iconWrapper.className = 'app-icon-wrapper';

        if (app.icon) {
            const img = document.createElement('img');
            img.className = 'app-icon';
            img.src = app.icon;
            img.alt = `${app.name} Icon`;
            img.onerror = function() {
                this.remove();
                iconWrapper.innerHTML = `<i class="fa-solid fa-cube app-icon-fallback"></i>`;
            };
            iconWrapper.appendChild(img);
        } else {
            iconWrapper.innerHTML = `<i class="fa-solid fa-cube app-icon-fallback"></i>`;
        }

        const infoDiv = document.createElement('div');
        infoDiv.className = 'app-info';
        const categoryLabel = getCategoryLabel(app.category);
        infoDiv.innerHTML = `
            <h4>${app.name}</h4>
            <span>${categoryLabel}</span>
        `;

        const indicatorDiv = document.createElement('div');
        indicatorDiv.className = 'app-select-indicator';
        indicatorDiv.innerHTML = `
            <label class="custom-checkbox">
                <input type="checkbox" class="app-checkbox" data-id="${app.id}" ${isSelected ? 'checked' : ''}>
                <span class="checkmark"></span>
            </label>
        `;

        card.appendChild(iconWrapper);
        card.appendChild(infoDiv);
        card.appendChild(indicatorDiv);

        // Karta Tıklayınca Seçim Durumunu Değiştir (Checkbox'a tıklama ile çakışmasın)
        card.addEventListener('click', (e) => {
            if (e.target.type === 'checkbox' || e.target.classList.contains('checkmark')) return;
            toggleAppSelection(app.id);
        });

        // Checkbox tıklama olayı
        const checkbox = card.querySelector('.app-checkbox');
        checkbox.addEventListener('change', () => {
            toggleAppSelection(app.id);
        });

        appGrid.appendChild(card);
    });
}

// Seçim Durumunu Ekle / Çıkar
function toggleAppSelection(id) {
    if (selectedApps.includes(id)) {
        selectedApps = selectedApps.filter(appId => appId !== id);
    } else {
        selectedApps.push(id);
    }
    
    // Kartı görsel olarak güncelle
    renderAppGrid();
    updateBatchButtons();
}

// Butonları Seçilen Sayısına Göre Güncelle (Disabled/Enabled)
function updateBatchButtons() {
    const count = selectedApps.length;
    selectedCountText.innerText = document.documentElement.lang === 'en' ? `${count} apps selected` : `${count} uygulama seçildi`;
    
    if (count > 0) {
        installBtn.classList.remove('disabled');
        uninstallBtn.classList.remove('disabled');
        installBtn.disabled = false;
        uninstallBtn.disabled = false;
    } else {
        installBtn.classList.add('disabled');
        uninstallBtn.classList.add('disabled');
        installBtn.disabled = true;
        uninstallBtn.disabled = true;
    }
    
    // Tümünü Seç checkbox durumunu güncelle
    const allFilteredIds = appDatabase
        .filter(app => currentCategory === 'all' || app.category === currentCategory)
        .map(app => app.id);
    
    const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedApps.includes(id));
    selectAllCheckbox.checked = allSelected;
}

// Arama Giriş Takibi
if (searchInput) searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderAppGrid();
});

// Tümünü Seç / Seçimi Kaldır
if (selectAllCheckbox) selectAllCheckbox.addEventListener('change', () => {
    const allFilteredIds = appDatabase
        .filter(app => {
            const matchesCategory = (currentCategory === 'all' || app.category === currentCategory);
            const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        })
        .map(app => app.id);

    if (selectAllCheckbox.checked) {
        // Zaten seçili olmayanları ekle
        allFilteredIds.forEach(id => {
            if (!selectedApps.includes(id)) selectedApps.push(id);
        });
    } else {
        // Filtrelenenleri seçimden çıkar
        selectedApps = selectedApps.filter(id => !allFilteredIds.includes(id));
    }
    renderAppGrid();
    updateBatchButtons();
});

// --- 4. TOPLU KURULUM & KALDIRMA ---
if (installBtn) installBtn.addEventListener('click', async () => {
    if (selectedApps.length === 0) return;
    await WingetService.installApps(selectedApps, (appId, idx, total, status) => {
        // İsteğe bağlı kurulum aşaması takibi yapılabilir
    });
    // Kurulum sonrası listeyi yenile
    selectedApps = [];
    renderAppGrid();
    updateBatchButtons();
});

// Kaldırma Onay Penceresi Yönetimi
const confirmModal = document.getElementById('confirm-modal');
const confirmYesBtn = document.getElementById('confirm-yes-btn');
const confirmNoBtn = document.getElementById('confirm-no-btn');

if (uninstallBtn) uninstallBtn.addEventListener('click', () => {
    if (selectedApps.length === 0) return;
    // Onay modalını aç
    const text = document.documentElement.lang === 'en'
        ? `Are you sure you want to completely uninstall ${selectedApps.length} apps from your system?`
        : `${selectedApps.length} uygulamayı sisteminizden tamamen kaldırmak istediğinize emin misiniz?`;
    const confirmModalText = document.getElementById('confirm-modal-text');
    if (confirmModalText) confirmModalText.innerText = text;
    if (confirmModal) confirmModal.classList.remove('hidden');
});

if (confirmYesBtn) confirmYesBtn.onclick = async () => {
    if (confirmModal) confirmModal.classList.add('hidden');
    await WingetService.uninstallApps(selectedApps);
    selectedApps = [];
    renderAppGrid();
    updateBatchButtons();
};

if (confirmNoBtn) confirmNoBtn.onclick = () => {
    if (confirmModal) confirmModal.classList.add('hidden');
};

// --- 5. SİSTEM ANALİZİ (QUICK SCAN) ---
const startScanBtn = document.getElementById('start-scan-btn');
const scanList = document.getElementById('scan-list');

if (startScanBtn) startScanBtn.addEventListener('click', async () => {
    if (!scanList) return;
    scanList.innerHTML = `
        <li class="scan-item empty-state">
            <i class="fa-solid fa-spinner fa-spin" style="font-size: 24px; color: var(--accent);"></i>
            ${document.documentElement.lang === 'en' ? 'Scanning system, please wait...' : 'Sistem taranıyor, lütfen bekleyin...'}
        </li>
    `;
    startScanBtn.disabled = true;
    startScanBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${document.documentElement.lang === 'en' ? 'Scanning...' : 'Taranıyor...'}`;

    const results = await SystemService.runQuickScan((libName, idx, total) => {
        scanList.innerHTML = `
            <li class="scan-item">
                <div class="scan-item-info">
                    <i class="fa-solid fa-spinner fa-spin text-info" style="color: var(--accent);"></i>
                    <div>
                        <span class="lib-name">${libName}</span>
                        <div class="lib-id">${document.documentElement.lang === 'en' ? 'Checking' : 'Sorgulanıyor'} (${idx + 1}/${total})</div>
                    </div>
                </div>
                <span class="status-badge scanning">${document.documentElement.lang === 'en' ? 'Scanning...' : 'Tarama Sürüyor...'}</span>
            </li>
        `;
    });

    scanList.innerHTML = '';
    results.forEach(res => {
        const item = document.createElement('li');
        item.className = 'scan-item';
        
        const badgeClass = res.installed ? 'installed' : 'missing';
        const badgeText = res.installed ? (document.documentElement.lang === 'en' ? 'INSTALLED' : 'YÜKLÜ') : (document.documentElement.lang === 'en' ? 'MISSING' : 'EKSİK');
        const badgeIcon = res.installed ? '<i class="fa-solid fa-circle-check"></i>' : '<i class="fa-solid fa-circle-xmark"></i>';
        const itemIcon = res.installed 
            ? `<i class="fa-solid fa-check-double" style="color: var(--success);"></i>` 
            : `<i class="fa-solid fa-triangle-exclamation" style="color: var(--danger);"></i>`;

        item.innerHTML = `
            <div class="scan-item-info">
                ${itemIcon}
                <div>
                    <span class="lib-name">${res.name}</span>
                    <div class="lib-id">${res.id}</div>
                </div>
            </div>
            <span class="status-badge ${badgeClass}">${badgeIcon} ${badgeText}</span>
        `;
        scanList.appendChild(item);
    });

    startScanBtn.disabled = false;
    startScanBtn.innerHTML = `<i class="fa-solid fa-radar"></i> ${document.documentElement.lang === 'en' ? 'Scan Again' : 'Taramayı Tekrarla'}`;
});

// --- 6. PRESET / PAKET YÖNETİMİ ---
const exportBtn = document.getElementById('export-preset-btn');
const importBtn = document.getElementById('import-preset-btn');
const fileInput = document.getElementById('import-file-input');
const quickPresets = document.querySelectorAll('.quick-preset-card');

// Preset Dışa Aktar (JSON Dosyası İndir)
if (exportBtn) exportBtn.addEventListener('click', () => {
    if (selectedApps.length === 0) {
        alert(document.documentElement.lang === 'en' ? 'Select apps from the library before exporting.' : 'Lütfen önce dışa aktarılacak uygulamaları kütüphaneden seçin.');
        return;
    }
    
    const presetData = {
        name: "RhemePreset-" + new Date().toISOString().split('T')[0],
        apps: selectedApps
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(presetData, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `${presetData.name}.json`);
    dlAnchor.click();
    
    SystemService.log(document.documentElement.lang === 'en' ? `Package exported successfully: ${selectedApps.length} apps.` : `Paket başarıyla dışa aktarıldı: ${selectedApps.length} uygulama.`, 'success');
});

// Preset İçe Aktar (Dosya Seçici Tetikle)
if (importBtn) importBtn.addEventListener('click', () => {
    if (fileInput) fileInput.click();
});

if (fileInput) fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const parsed = JSON.parse(event.target.result);
            let appsList = [];
            if (Array.isArray(parsed)) {
                appsList = parsed;
            } else if (parsed && Array.isArray(parsed.apps)) {
                appsList = parsed.apps;
            } else {
                alert(document.documentElement.lang === 'en' ? 'Invalid package format. Expected a JSON array or preset object.' : 'Geçersiz paket formatı! JSON dizi veya preset objesi olmalıdır.');
                return;
            }
            
            // Sadece veritabanında mevcut olanları seçime al
            const validIds = appDatabase.map(a => a.id);
            selectedApps = appsList.filter(id => validIds.includes(id));
            
            renderAppGrid();
            updateBatchButtons();
            SystemService.log(document.documentElement.lang === 'en' ? `Package imported. ${selectedApps.length} apps selected.` : `Yerel paket başarıyla içe aktarıldı. ${selectedApps.length} uygulama seçildi.`, 'success');
            // Kütüphane sayfasını aç
            const libNav = document.querySelector('[data-target="library"]');
            if (libNav) libNav.click();
        } catch (err) {
            alert(document.documentElement.lang === 'en' ? `Could not read file: ${err.message}` : 'Dosya okunurken hata oluştu: ' + err.message);
        }
    };
    reader.readAsText(file);
});

// Hazır Şablon Paketler
quickPresets.forEach(card => {
    card.addEventListener('click', () => {
        const type = card.dataset.preset;
        let appsToSelect = [];

        if (type === 'basic') {
            appsToSelect = ["Google.Chrome", "VideoLAN.VLC", "Spotify.Spotify", "Discord.Discord", "7zip.7zip", "Adobe.Acrobat.Reader.64-bit"];
        } else if (type === 'developer') {
            appsToSelect = ["Microsoft.VisualStudioCode", "Python.Python.3.12", "OpenJS.NodeJS.LTS", "Git.Git", "GitHub.GitHubDesktop", "Notepad++.Notepad++", "Docker.DockerDesktop"];
        } else if (type === 'gamer') {
            appsToSelect = ["Valve.Steam", "EpicGames.EpicGamesLauncher", "RiotGames.RiotClient", "Discord.Discord", "CPUID.CPU-Z"];
        }

        // Seçimleri veritabanındaki geçerli ID'lere göre filtrele
        const validIds = appDatabase.map(a => a.id);
        selectedApps = appsToSelect.filter(id => validIds.includes(id));
        
        renderAppGrid();
        updateBatchButtons();
        SystemService.log(document.documentElement.lang === 'en' ? `"${card.querySelector('h4').innerText}" selected.` : `"${card.querySelector('h4').innerText}" başarıyla seçildi!`, 'success');
        
        // Kütüphane sayfasını aç
        document.querySelector('[data-target="library"]').click();
    });
});

// --- 7. İŞLEM GÜNLÜĞÜ (LOG) OKUYUCU ---
const refreshLogsBtn = document.getElementById('refresh-logs-btn');
const clearConsoleBtn = document.getElementById('clear-console-btn');

async function loadSystemLogs() {
    if (window.api && window.api.readLogs) {
        const logs = await window.api.readLogs();
        const consoleEl = document.getElementById('log-console');
        if (consoleEl) {
            consoleEl.innerHTML = '';
            // Her satırı renklendirerek yaz
            const lines = logs.split('\n');
            lines.forEach(line => {
                if (line.trim() === '') return;
                let logClass = 'log-info';
                if (line.includes('[SUCCESS]')) logClass = 'log-success';
                else if (line.includes('[ERROR]')) logClass = 'log-error';
                else if (line.includes('[WARNING]') || line.includes('[COMMAND]')) logClass = 'log-warning';
                
                let displayLine = document.documentElement.lang === 'en'
                    ? line.replace('Henüz log kaydı bulunmuyor.', 'No log entries yet.')
                        .replace('[YÜKLÜ]', '[INSTALLED]').replace('[EKSİK]', '[MISSING]')
                        .replace('[HATA]', '[ERROR]').replace('İşlem başlatılıyor:', 'Starting operation:')
                        .replace('RhemeSetup Başlatıldı.', 'RhemeSetup started.')
                        .replace('Sistem Komutu Tetiklendi:', 'System command started:')
                        .replace('Sistem komutu başlatıldı:', 'System command started:')
                        .replace('Sebep:', 'Reason:').replace('Detay:', 'Details:')
                        .replace('HATA - Komut:', 'ERROR - Command:').replace('UYARI - Komut:', 'WARNING - Command:')
                        .replace('BAŞARILI - Komut:', 'SUCCESS - Command:')
                        .replace('Güncelleme kontrol ediliyor...', 'Checking for updates...')
                        .replace('Yeni güncelleme bulundu:', 'Update available:').replace('Uygulama güncel.', 'The app is up to date.')
                        .replace('Güncelleme hatası:', 'Update error:').replace('İndirme yüzdesi:', 'Download progress:')
                        .replace('Kullanıcı güncelleme aramayı tetikledi.', 'The user started an update check.')
                        .replace('Güncelleme başarıyla indirildi. Yeniden başlatılıp kurulacak.', 'Update downloaded. It will be installed after restart.')
                        .replace('Güncelleme servisi aktif değil (electron-updater eksik).', 'The update service is unavailable (electron-updater is missing).')
                        .replace('Henüz log kaydı bulunmuyor.', 'No log entries yet.')
                        .replace('Geçici dosyalar temizleniyor', 'Cleaning temporary files')
                        .replace('Sistem Analizi (Quick Scan) başlatılıyor...', 'Starting system analysis...')
                        .replace('Sistem Analizi tamamlandı.', 'System analysis complete.')
                        .replace('Toplu kurulum başlatıldı. Toplam seçilen uygulama sayısı:', 'Batch installation started. Selected apps:')
                        .replace('Kurulum Başlatıldı:', 'Installation started:').replace('BAŞARILI:', 'SUCCESS:')
                        .replace('Kurulum başarısız oldu. Hata:', 'Installation failed. Error:')
                        .replace('Toplu kurulum işlemleri tamamlandı.', 'Batch installation completed.')
                        .replace('Toplu kaldırma işlemi başlatıldı. Toplam seçilen uygulama sayısı:', 'Batch uninstall started. Selected apps:')
                        .replace('Kaldırma İşlemi Başlatıldı:', 'Uninstall started:').replace('SİLİNDİ:', 'REMOVED:')
                        .replace('KALDIRMA HATASI:', 'UNINSTALL ERROR:').replace('Kaldırma işlemleri tamamlandı!', 'Uninstallation is complete!')
                        .replace('Toplu kaldırma işlemleri tamamlandı.', 'Batch uninstall completed.')
                        .replace('Paket başarıyla dışa aktarıldı:', 'Package exported successfully:')
                        .replace('Yerel paket başarıyla içe aktarıldı.', 'Package imported.')
                        .replace('uygulama seçildi.', 'apps selected.')
                    : line;
                if (document.documentElement.lang === 'en') {
                    const dictionary = window.RHEME_AUTO_TEXT || {};
                    Object.keys(dictionary).sort((a, b) => b.length - a.length).forEach(turkish => {
                        if (turkish.length > 4 && displayLine.includes(turkish)) {
                            displayLine = displayLine.split(turkish).join(dictionary[turkish]);
                        }
                    });
                }
                consoleEl.innerHTML += `<p class="${logClass}">${displayLine}</p>`;
            });
            consoleEl.scrollTop = consoleEl.scrollHeight;
        }
    }
}

if (refreshLogsBtn) refreshLogsBtn.onclick = loadSystemLogs;
if (clearConsoleBtn) clearConsoleBtn.onclick = () => {
    const consoleEl = document.getElementById('log-console');
    if (consoleEl) consoleEl.innerHTML = '';
};

// --- 8. ANLIK PERFORMANS İZLEME (CPU & RAM) ---
const cpuVal = document.getElementById('cpu-val');
const cpuBar = document.getElementById('cpu-bar');
const ramVal = document.getElementById('ram-val');
const ramBar = document.getElementById('ram-bar');
const ramDetail = document.getElementById('ram-detail');

if (window.api && window.api.onSystemStats) {
    window.api.onSystemStats((stats) => {
        if (cpuVal) cpuVal.innerText = `${stats.cpu}%`;
        if (cpuBar) cpuBar.style.width = `${stats.cpu}%`;
        
        if (ramVal) ramVal.innerText = `${stats.ram}%`;
        if (ramBar) ramBar.style.width = `${stats.ram}%`;
        if (ramDetail) ramDetail.innerText = stats.ramDetails;
    });
}

// --- 9. AUTO-UPDATE HATA VE BİLDİRİM YÖNETİMİ ---
const btnUpdateCheck = document.getElementById('btn-update-check');
const updateModal = document.getElementById('update-modal');
const updateModalText = document.getElementById('update-modal-text');
const updateOkBtn = document.getElementById('update-ok-btn');
const updateCloseBtn = document.getElementById('update-close-btn');

if (btnUpdateCheck) {
    btnUpdateCheck.addEventListener('click', () => {
        if (updateModalText) updateModalText.innerText = document.documentElement.lang === 'en' ? 'Checking for updates...' : 'Güncellemeler kontrol ediliyor...';
        if (updateOkBtn) updateOkBtn.classList.add('hidden');
        if (updateModal) updateModal.classList.remove('hidden');
        window.api.checkForUpdates();
    });
}

if (window.api && window.api.onUpdateMessage) {
    window.api.onUpdateMessage((data) => {
        if (data.status === 'available') {
            updateModalText.innerText = document.documentElement.lang === 'en' ? `Update v${data.version} is available. Downloading...` : `Yeni bir güncelleme mevcut: v${data.version}. İndiriliyor, lütfen bekleyin...`;
        } else if (data.status === 'up-to-date') {
            updateModalText.innerText = document.documentElement.lang === 'en' ? 'RhemeSetup is up to date.' : 'RhemeSetup güncel durumdadır. Yeni bir güncelleme bulunmuyor.';
        } else if (data.status === 'downloaded') {
            updateModalText.innerText = document.documentElement.lang === 'en' ? 'Update downloaded. Restart the app to finish installing.' : 'Güncelleme başarıyla indirildi. Kurulumu tamamlamak için uygulamayı yeniden başlatın.';
            updateOkBtn.classList.remove('hidden');
        } else if (data.status === 'error') {
            updateModalText.innerText = document.documentElement.lang === 'en' ? `Update error: ${data.error}` : `Güncelleme hatası: ${data.error}`;
        }
    });
}

if (updateCloseBtn) updateCloseBtn.onclick = () => {
    if (updateModal) updateModal.classList.add('hidden');
};

if (updateOkBtn) updateOkBtn.onclick = () => {
    if (updateModal) updateModal.classList.add('hidden');
};

// =========================================================
// --- 10. WİNGET GLOBAL ARAMA (MAĞAZA ARAMALARI) ---
// =========================================================
async function runGlobalWingetSearch(query) {
    if (!query || query.trim() === '') return;
    
    currentView = 'global';
    globalSearchResults = [];
    
    if (!appGrid) return;
    const en = document.documentElement.lang === 'en';
    appGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 50px; color: var(--text-muted);">
            <i class="fa-solid fa-spinner fa-spin" style="font-size: 28px; margin-bottom: 12px;"></i>
            <p>${en ? 'Searching the Winget Store:' : 'Winget mağazasında aranıyor:'} <strong style="color: var(--accent)">"${query}"</strong></p>
        </div>
    `;
    
    try {
        const result = await window.api.runCommand(`winget search "${query}" --accept-source-agreements`);
        if (result.success && result.output) {
            globalSearchResults = parseWingetOutput(result.output);
        }
        renderGlobalAppGrid();
    } catch (err) {
        appGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fa-solid fa-circle-exclamation" style="font-size: 28px; margin-bottom: 10px; color: #ef4444;"></i>
                <p>${document.documentElement.lang === 'en' ? 'Winget search failed:' : 'Winget araması başarısız:'} ${err.message}</p>
                <button class="btn" style="margin-top: 15px;" onclick="switchToLocalView()">
                    <i class="fa-solid fa-arrow-left"></i> ${document.documentElement.lang === 'en' ? 'Back to Local Library' : 'Yerel Kütüphaneye Dön'}
                </button>
            </div>
        `;
    }
}

function parseWingetOutput(rawOutput) {
    const results = [];
    const lines = rawOutput.split('\n');
    let headerFound = false;
    let idColStart = -1;
    let versionColStart = -1;
    
    for (const line of lines) {
        if (!headerFound && line.includes('Ad') && line.includes('Kimlik')) {
            idColStart = line.indexOf('Kimlik');
            if (idColStart === -1) idColStart = line.indexOf('Id');
            versionColStart = line.indexOf('Sürüm');
            if (versionColStart === -1) versionColStart = line.indexOf('Version');
            headerFound = true;
            continue;
        }
        
        if (!headerFound && line.includes('Name') && line.includes('Id')) {
            idColStart = line.indexOf('Id');
            versionColStart = line.indexOf('Version');
            headerFound = true;
            continue;
        }
        
        if (headerFound && line.match(/^[-]+/)) continue;
        
        if (headerFound && idColStart > 0 && line.trim().length > 0) {
            const name = line.substring(0, idColStart).trim();
            const rest = line.substring(idColStart).trim();
            const parts = rest.split(/\s{2,}/);
            const id = parts[0] ? parts[0].trim() : '';
            const version = parts[1] ? parts[1].trim() : '';
            
            if (name && id && id.includes('.')) {
                results.push({ name, id, version, source: 'winget' });
            }
        }
    }
    
    return results;
}

// Global Arama Sonuçlarını Güvenli Şekilde Oluşturma (Tırnak çakışmasını önler)
function renderGlobalAppGrid() {
    if (!appGrid) return;
    appGrid.innerHTML = '';
    
    const backBtn = document.createElement('div');
    backBtn.style.cssText = 'grid-column: 1 / -1; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;';
    backBtn.innerHTML = `
        <span style="color: var(--text-muted); font-size: 13px;">
            <i class="fa-solid fa-globe" style="color: var(--accent)"></i>
            ${document.documentElement.lang === 'en' ? 'Winget Store —' : 'Winget Mağazası —'} <strong style="color: var(--accent)">${globalSearchResults.length}</strong> ${document.documentElement.lang === 'en' ? 'results' : 'sonuç'}
        </span>
        <button class="btn" onclick="switchToLocalView()" style="font-size: 12px; padding: 6px 14px;">
            <i class="fa-solid fa-arrow-left"></i> ${document.documentElement.lang === 'en' ? 'Back to Local Library' : 'Yerel Kütüphaneye Dön'}
        </button>
    `;
    appGrid.appendChild(backBtn);
    
    if (globalSearchResults.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);';
        emptyDiv.innerHTML = `<p>${document.documentElement.lang === 'en' ? 'No results found.' : 'Sonuç bulunamadı.'}</p>`;
        appGrid.appendChild(emptyDiv);
        return;
    }
    
    globalSearchResults.forEach(app => {
        const card = document.createElement('div');
        card.className = 'app-card';
        
        card.innerHTML = `
            <div class="app-icon-wrapper">
                <i class="fa-solid fa-cube app-icon-fallback"></i>
            </div>
            <div class="app-info">
                <h4>${app.name}</h4>
                <span style="color: var(--accent); font-size: 11px;">${app.id}</span>
            </div>
            <div class="app-select-indicator">
                <button class="btn btn-primary install-winget-btn" style="font-size: 11px; padding: 5px 12px;">
                    <i class="fa-solid fa-download"></i> ${document.documentElement.lang === 'en' ? 'Install' : 'Kur'}
                </button>
            </div>
        `;

        const btn = card.querySelector('.install-winget-btn');
        btn.addEventListener('click', () => {
            installFromWinget(app.id, app.name);
        });

        appGrid.appendChild(card);
    });
}

function switchToLocalView() {
    currentView = 'local';
    globalSearchResults = [];
    renderAppGrid();
}

async function installFromWinget(id, name) {
    SystemService.log(document.documentElement.lang === 'en' ? `Installing from Winget: ${name} (${id})` : `Winget mağazasından yükleniyor: ${name} (${id})`, 'info');
    await window.api.runCommand(`cmd /c start cmd /k "winget install --id ${id} -e --accept-package-agreements --accept-source-agreements"`);
}


// =========================================================
// --- 11. RENK TEMASI SEÇİCİ (ACCENT COLOR CUSTOMIZER) ---
// =========================================================
const THEMES = {
    blue:   { accent: '#00f2fe', grad: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    purple: { accent: '#da22ff', grad: 'linear-gradient(135deg, #9733ee 0%, #da22ff 100%)' },
    green:  { accent: '#38ef7d', grad: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
    orange: { accent: '#ff8c00', grad: 'linear-gradient(135deg, #f7971e 0%, #ff8c00 100%)' },
    pink:   { accent: '#f857a6', grad: 'linear-gradient(135deg, #ff5858 0%, #f857a6 100%)' }
};

// Global-ready interface strings and persistent user preferences.
const TRANSLATIONS = {
    tr: {
        page_0: 'Uygulama Kütüphanesi', page_1: 'Sisteminiz için gerekli tüm popüler yazılımları seçip tek tıkla kurun veya kaldırın.', page_2: 'Güncelleme Denetle', page_3: 'Kütüphanede uygulama ara...', page_4: 'Tümü', page_5: 'Seçilenleri Kur', page_6: 'Seçilenleri Kaldır', page_7: 'Sistem Analizi', page_8: 'Format sonrası gerekli kritik çalışma kütüphanelerini denetleyin.', page_9: 'Sistem Donanım Bilgileri', page_10: 'Sorgulanıyor...', page_11: 'Sistem Optimizasyon Araçları', page_12: 'Windows performansını artıracak bakım ve temizlik araçlarını çalıştırın.', page_13: 'Performans & İnce Ayarlar', page_14: 'Paket (Preset) Yönetimi', page_15: 'İşlem Günlüğü', page_16: 'Ayarlar ve Otomasyon Tercihleri', page_17: 'Ayarları Kaydet', selectAll:'Tümünü Seç', selectedCount:'{count} uygulama seçildi', scanTitle:'Kritik Çalışma Zamanı Kütüphaneleri (Runtimes)', scanButton:'Taramayı Başlat', scanHint:'Taramayı başlatmak için yukarıdaki butona tıklayın.',
        appearanceTitle: 'Görünüm ve Dil', languageLabel: 'Uygulama Dili', languageDescription: 'Arayüz dilini seçin.',
        themeLabel: 'Görünüm Teması', themeDescription: 'Açık veya koyu görünümü seçin.', darkTheme: 'Koyu', lightTheme: 'Açık',
        navLibrary: 'Uygulama Kütüphanesi', navScan: 'Sistem Analizi', navTools: 'Sistem Araçları', navTweaks: 'Performans & İnce Ayar',
        navPresets: 'Paket Yönetimi', navHistory: 'İşlem Günlüğü', navSettings: 'Ayarlar & Otomasyon', monitorTitle: 'Sistem Durumu',
        cpuUsage: 'CPU Kullanımı', ramUsage: 'RAM Kullanımı', saveSettings: 'Ayarları Kaydet', saved: 'Ayarlar kaydedildi.'
    },
    en: {
        page_0: "App Library", page_1: "Choose popular software for your system and install or remove it with one click.", page_2: "Check for Updates", page_3: "Search apps in the library...", page_4: "All", page_5: "Install Selected", page_6: "Uninstall Selected", page_7: "System Analysis", page_8: "Check the critical runtime libraries required for your system and games after a fresh Windows installation.", page_9: "System Hardware", page_10: "Checking...", page_11: "System Maintenance Tools", page_12: "Run maintenance and cleanup tools to improve Windows performance.", page_13: "Performance & Tweaks", page_14: "Package Presets", page_15: "Activity Log", page_16: "Settings & Automation", page_17: "Save Settings", selectAll:'Select All', selectedCount:'{count} apps selected', scanTitle:'Critical Runtime Libraries', scanButton:'Start Scan', scanHint:'Click the button above to start scanning.', appearanceTitle: 'Appearance & Language', languageLabel: 'Application language', languageDescription: 'Choose the interface language.',
        themeLabel: 'Appearance theme', themeDescription: 'Choose light or dark appearance.', darkTheme: 'Dark', lightTheme: 'Light',
        navLibrary: 'App Library', navScan: 'System Analysis', navTools: 'System Tools', navTweaks: 'Performance & Tweaks',
        navPresets: 'Package Management', navHistory: 'Activity Log', navSettings: 'Settings & Automation', monitorTitle: 'System Status',
        cpuUsage: 'CPU Usage', ramUsage: 'RAM Usage', saveSettings: 'Save Settings', saved: 'Settings saved.'
    }
};

// Translate text added after the initial page render (empty states, search results, etc.).
function localizeAddedUiNode(root) {
    const language = document.documentElement.lang || 'tr';
    const dictionary = window.RHEME_AUTO_TEXT || {};
    const translate = (node) => {
        if (!node || node.nodeType !== Node.TEXT_NODE || !node.nodeValue.trim()) return;
        if (!node.__rhemeTurkish) node.__rhemeTurkish = node.nodeValue;
        const original = node.__rhemeTurkish.trim();
        if (language === 'en') {
            const translated = TRANSLATIONS.en[original] || dictionary[original];
            if (translated) node.nodeValue = node.__rhemeTurkish.replace(original, translated);
        } else {
            node.nodeValue = node.__rhemeTurkish;
        }
    };
    if (root.nodeType === Node.TEXT_NODE) {
        translate(root);
        return;
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) translate(node);
}

function applyLanguage(language) {
    const selected = TRANSLATIONS[language] ? language : 'tr';
    document.documentElement.lang = selected;
    if (window.api?.setLanguage) window.api.setLanguage(selected);
    // Translate every remaining static UI text node from its original Turkish text.
    const autoText = {
        "Windows'u post-format optimize etmek, gereksiz arka plan servislerini kapatmak ve gizliliğinizi korumak için ince ayarları uygulayın.": 'Apply tweaks to optimize Windows and protect your privacy.',
        "Windows Update'in ekran kartı ve sistem donanımlarına otomatik eski sürücü kurmasını engeller.": 'Prevent Windows Update from installing older device drivers.',
        "OneDrive'ı Tamamen Kaldır": 'Remove OneDrive Completely',
        "OneDrive'ı sistemden siler ve Dosya Gezgini gezinme bölmesinden simgesini temizler.": 'Uninstall OneDrive and remove it from File Explorer.',
        "RhemeSetup'ı Kapat": 'Close RhemeSetup',
        
        'Sistem Utilitiesı':'System Tools', 'Paket Yönetimi':'Package Management', 'CPU Kullanımı':'CPU Usage', 'RAM Kullanımı':'RAM Usage',
        '0 uygulama seçildi':'0 apps selected',
        'Format sonrası sisteminizin düzgün çalışması ve oyun performansı için gerekli kritik çalışma kütüphanelerini denetleyin.':'Check the critical runtime libraries required for your system and games after a fresh Windows installation.',
        'Eksik kütüphaneler DLL hatalarına veya uygulamaların açılmamasına neden olabilir.':'Missing runtimes can cause DLL errors or prevent applications from starting.',
        'Windows performansını artıracak profesyonel bakım işlemlerini ve temizlik araçlarını çalıştırın.':'Run maintenance and cleanup tools to improve Windows performance.',
        'Windows 10/11 gizli "Nihai Performans" güç şemasını aktifleştirir.':'Enable the hidden Windows 10/11 Ultimate Performance power plan.',
        'Sistem kaynaklarını anlık izlemek için Windows Task Managerni açar.':'Open Windows Task Manager to monitor system resources.',
        'Winget kaynak havuzunu sıfırlayıp zorla günceller, kurulum hatalarını giderir.':'Reset and update Winget sources to fix installation issues.',
        'Donanım Sürücülerini Tara':'Scan Device Drivers',
        'Winget Havuzunu Onar (Doctor)':'Repair Winget Sources (Doctor)',
        'Winget aracılığıyla kurulmuş tüm güncel yazılımları tespit edip sessizce yükseltir.':'Find and silently update installed apps using Winget.',
        'Windows\'u post-format optimize etmek, gereksiz arka plan servislerini kapatmak ve gizliliğinizi korumak için ince ayarları uygulayın.':'Apply tweaks to optimize Windows, disable background services, and protect your privacy.',
        'Başlat Menüsü Bing Aramalarını Kapat':'Disable Bing Search in Start',
        'Başlat menüsünde arama yaparken internet sonuçlarının yüklenmesini engeller, aramayı hızlandırır.':'Stop web results from loading in Start search and make it faster.',
        'Windows Telemetri ve İzlemeyi Devre Dışı Bırak':'Disable Windows Telemetry and Tracking',
        'Arka planda Microsoft veri toplama servislerini kapatarak işlemci ve bellek yükünü azaltır.':'Disable Microsoft data collection services to reduce CPU and memory use.',
        'Windows Bildirimlerini ve Reklam Önerilerini Kapat':'Disable Windows Notifications and Ad Suggestions',
        'Kilit ekranı önerileri, başlangıç ipuçları ve rahatsız edici Windows bildirimlerini devre dışı bırakır.':'Disable lock screen suggestions, startup tips, and Windows notifications.',
        'Cortana ve Copilot Asistanlarını Kapat':'Disable Cortana and Copilot',
        'Arka planda gereksiz kaynak tüketen Cortana ve Windows 11 Copilot yapay zeka servislerini kapatır.':'Disable Cortana and Windows 11 Copilot background services.',
        'Xbox Game DVR ve Games Çubuğunu Kapat':'Disable Xbox Game DVR and Game Bar',
        'Games içi otomatik arka plan kayıt özelliğini kapatarak oyunlarda FPS dalgalanmasını önler.':'Disable background game recording to prevent FPS drops.',
        'Tam Ekran İyileştirmelerini Devre Dışı Bırak':'Disable Fullscreen Optimizations',
        'Gameslarda girdi gecikmesini (input lag) düşürmek için Windows zorunlu tam ekran iyileştirmelerini kapatır.':'Disable fullscreen optimizations to reduce input lag in games.',
        'Windows Update Sürücü Updatemelerini Engelle':'Block Driver Updates from Windows Update',
        'Windows Update\'in ekran kartı ve sistem donanımlarına otomatik eski sürücü kurmasını engeller.':'Prevent Windows Update from automatically installing older device drivers.',
        'Windows 11 Klasik Sağ Tık Menüsünü Geri Getir':'Restore the Classic Windows 11 Context Menu',
        '"Daha fazla seçenek göster" menüsünü kaldırıp eski hızlı Windows 10 sağ tık menüsünü aktif eder.':'Replace Show more options with the classic Windows 10 context menu.',
        'OneDrive\'ı Tamamen Kaldır':'Remove OneDrive Completely',
        'OneDrive\'ı sistemden siler ve Dosya Gezgini gezinme bölmesinden simgesini temizler.':'Uninstall OneDrive and remove it from File Explorer.',
        'Gömülü Bloatware Uygulamalarını Sil':'Remove Bundled Bloatware Apps',
        'Candy Crush, Solitaire, Weather, News gibi varsayılan Windows AppX paketlerini kaldırır.':'Remove bundled Windows apps such as Candy Crush, Solitaire, Weather, and News.',
        'Paket (Preset) Yönetimi':'Package Preset Management',
        'Kendi özelleştirilmiş kurulum paketlerinizi JSON olarak dışa aktarın veya hazır şablonları içe aktarın.':'Export custom setup packages as JSON or import saved presets.',
        'Şu anda seçtiğiniz uygulamaları paket halinde kaydedebilir veya daha önce kaydettiğiniz paketi yükleyebilirsiniz.':'Save selected apps as a package or load a package saved earlier.',
        'Mevcut Seçimi Paket Yap (Dışa Aktar)':'Export Current Selection as Package',
        'Hazır Paket Yükle (İçe Aktar)':'Import Saved Package',
        'Sistem kullanım amacınıza göre hazırlanmış standart paketleri tek tıklamayla uygulayabilirsiniz.':'Install a ready-made package tailored to your needs.',
        'Temel Kullanıcı Paketi':'Essential User Package',
        'Chrome, VLC, Spotify, Discord, 7-Zip ve Acrobat Reader içerir.':'Includes Chrome, VLC, Spotify, Discord, 7-Zip, and Acrobat Reader.',
        'Yazılımcı Paketi':'Developer Package',
        'VS Code, Python, Node.js, Git, GitHub Desktop, Notepad++ ve Docker içerir.':'Includes VS Code, Python, Node.js, Git, GitHub Desktop, Notepad++, and Docker.',
        'Steam, Epic Games, Riot, Discord ve CPU-Z kütüphanelerini içerir.':'Includes Steam, Epic Games, Riot, Discord, and CPU-Z.',
        'RhemeSetup ile yapılan tüm arka plan işlemlerini ve Winget çıktılarını canlı olarak izleyin.':'Monitor background operations and Winget output in real time.',
        'RhemeSetup kurulum motorunun davranışlarını, otomasyon kurallarını ve sistem entegrasyonlarını özelleştirin.':'Customize setup behavior, automation rules, and system integrations.',
        'Türkçe':'Turkish', '60 Saniye':'60 seconds', '120 Saniye (Varsayılan)':'120 seconds (Default)', '300 Saniye (5 Dakika)':'300 seconds (5 minutes)', 'RhemeSetup\'ı Kapat':'Close RhemeSetup',
        'Simge Durumuna Küçült':'Minimize', 'Ekranı Kapla':'Maximize', 'Kapat':'Close',
'Uygulama Kütüphanesi':'App Library','Sisteminiz için gerekli tüm popüler yazılımları seçip tek tıkla kurun veya kaldırın.':'Choose popular software and install or remove it with one click.','Updateme Denetle':'Check for Updates','Sistem Optimizasyon Utilitiesı':'System Maintenance Tools','Junk File Cleanup':'Junk File Cleanup','DNS and Network Reset':'DNS and Network Reset','Sistemdeki Tüm Programları Update':'Update All Apps','Gamescu Paketi':'Gamer Package','Local Package Actions':'Local Package Actions','Ready-made Setup Presets':'Ready-made Setup Presets','Refresh':'Refresh','Clear Console':'Clear Console','Light veya koyu görünümü seçin.':'Choose light or dark appearance.','Kurulum & Winget Motor Otomasyonu':'Setup & Winget Automation','Security & Otomatik Kurtarma':'Security & Recovery','Raporlama & Log Otomasyonu':'Reporting & Logs','Uygulama Updatemesi':'Application Update','Konsolu Temizle':'Clear Console','Yenile':'Refresh','Program Kaldırma Onayı':'Uninstall Confirmation','Evet, Kaldır':'Yes, Uninstall','İptal Et':'Cancel','Uygulama Kurulum / Kaldırma İşlemi':'App Installation / Removal','İşlemi İptal Et / Durdur':'Cancel / Stop','Yeniden Başlat ve Kur':'Restart and Install','Kapat':'Close',
        'Güncelleme Denetle':'Check for Updates','Kütüphanede uygulama ara...':'Search apps in library...','Tümü':'All','Seçilenleri Kur':'Install Selected','Seçilenleri Kaldır':'Uninstall Selected','Tümünü Seç':'Select All',
        'Sistem Analizi':'System Analysis','Kritik Çalışma Zamanı Kütüphaneleri (Runtimes)':'Critical Runtime Libraries','Taramayı başlatmak için yukarıdaki butona tıklayın.':'Click the button above to start scanning.','Taramayı Başlat':'Start Scan',
        'Sistem Donanım Bilgileri':'System Hardware','İşlemci (CPU)':'Processor (CPU)','Ekran Kartı (GPU)':'Graphics (GPU)','Sistem Belleği':'System Memory','İşletim Sistemi':'Operating System','Sorgulanıyor...':'Checking...',
        'Sistem Optimizasyon Araçları':'System Maintenance Tools','Sistem Optimizasyon Utilitiesı':'System Maintenance Tools','Junk File Cleanup':'Junk File Cleanup','DNS and Network Reset':'DNS and Network Reset','SFC /Scannow Taraması':'SFC /Scannow','DISM İmaj Onarımı':'DISM Image Repair','Sistemdeki Tüm Programları Update':'Update All Apps','Sistemdeki Tüm Programları Güncelle':'Update All Apps','Seçili İnce Ayarları Uygula':'Apply Selected Tweaks','Gizlilik & Telemetri':'Privacy & Telemetry','Performans & Games':'Performance & Gaming','Windows Sistem İnce Ayarları':'Windows System Tweaks','Local Package Actions':'Local Package Actions','Ready-made Setup Presets':'Ready-made Setup Presets','Refresh':'Refresh','Clear Console':'Clear Console','Raporlama & Log Otomasyonu':'Reporting & Logs','Security & Otomatik Kurtarma':'Security & Recovery','Ayarlar Uygulanıyor...':'Applying settings...','Geçici sistem ve kullanıcı dosyalarını (%TEMP%) silerek yer açar.':'Free up space by removing temporary files (%TEMP%).','DNS önbelleğini sıfırlar, Winsock ayarlarını yenileyerek ağ hatalarını düzeltir.':'Flush DNS and reset Winsock to fix network issues.',
        'Windows sistem dosyalarını tarar ve bozuk olanları otomatik olarak onarır.':'Scan and repair corrupt Windows system files.','Windows sistem imaj deposunu internet üzerinden onarır ve yapılandırır.':'Repair the Windows component store using online sources.','Nihai Performans Planı':'Ultimate Performance Plan','Task Manager':'Task Manager',
        'Sistemdeki eksik veya güncel olmayan aygıt sürücülerini bulur.':'Find missing or outdated device drivers.','Performans & İnce Ayarlar':'Performance & Tweaks','İşlem Günlüğü':'Activity Log','Ayarlar ve Otomasyon Tercihleri':'Settings & Automation','Ayarları Kaydet':'Save Settings',
        'Windows\'u post-format optimize etmek, gereksiz arka plan servislerini kapatmak ve gizliliğinizi korumak için ince ayarları uygulayın.':'Apply tweaks to optimize Windows, disable background services, and protect your privacy.','Windows Update\'in ekran kartı ve sistem donanımlarına otomatik eski sürücü kurmasını engeller.':'Prevent Windows Update from automatically installing older device drivers.','OneDrive\'ı Tamamen Kaldır':'Remove OneDrive Completely','OneDrive\'ı sistemden siler ve Dosya Gezgini gezinme bölmesinden simgesini temizler.':'Uninstall OneDrive and remove it from File Explorer.','RhemeSetup\'ı Kapat':'Close RhemeSetup',
        'Görünüm ve Dil':'Appearance & Language','Uygulama Dili':'Application Language','Arayüz dilini seçin.':'Choose the interface language.','Görünüm Teması':'Appearance Theme','Açık veya koyu görünümü seçin.':'Choose light or dark appearance.','Koyu':'Dark','Açık':'Light',
        'Sistem Optimizasyon Utilitiesı':'System Maintenance Tools','Junk File Cleanup':'Junk File Cleanup','DNS and Network Reset':'DNS and Network Reset','SFC /Scannow Taraması':'SFC /Scannow','DISM İmaj Onarımı':'DISM Image Repair','Sistemdeki Tüm Programları Update':'Update All Apps','Sistemdeki Tüm Programları Güncelle':'Update All Apps','Local Package Actions':'Local Package Actions','Ready-made Setup Presets':'Ready-made Setup Presets','Gamescu Paketi':'Gamer Package','Raporlama & Log Otomasyonu':'Reporting & Logs','Security & Otomatik Kurtarma':'Security & Recovery','Konsolu Temizle':'Clear Console','Yenile':'Refresh','Program Kaldırma Onayı':'Uninstall Confirmation','Evet, Kaldır':'Yes, Uninstall','İptal Et':'Cancel','Uygulama Güncellemesi':'Application Update','Kapat':'Close','Yeniden Başlat ve Kur':'Restart and Install',
        'Kurulum & Winget Motor Otomasyonu':'Setup & Winget Automation','Sessiz / Katılımsız Kurulum (Silent Mode)':'Silent Installation','Uygulamalar kurulurken kurulum pencerelerini (wizard) tamamen gizler (`--silent` parametresi).':'Hide installer windows using the --silent option.','EULA ve Anlaşmaları Otomatik Kabul Et':'Automatically Accept Agreements','Paket lisans sözleşmelerini ve kaynak koşullarını onay istemeden otomatik doğrular (`--accept-package-agreements`).':'Automatically accept package and source agreements.','Mevcut Ayarları ve Kullanıcı Verilerini Koru':'Keep Existing Settings and User Data','Updateme ve kaldırma işlemlerinde kullanıcı profil dizinlerini temizlemeden korur.':'Preserve user profile data during update and uninstall operations.','İndirme Bağlantı Zaman Aşımı (Timeout)':'Download Timeout','Yavaş bağlantılarda uygulamanın askıda kalmaması için azami bekleme süresi.':'Maximum wait time for slow connections.','Toplu Kurulum Öncesi Geri Yükleme Noktası Oluştur':'Create Restore Point Before Batch Install','İşleme başlamadan önce Windows Sistem Geri Yükleme Noktası (System Restore Point) alır.':'Create a Windows restore point before starting.','Kaldırma İşlemlerinde Yedek Onayı İste':'Confirm Backup Before Uninstall','Toplu program kaldırma öncesinde kritik kayıt girdilerini yedekleme uyarısı sunar.':'Show a reminder to back up important registry entries before batch uninstall.','İşlem Bitiş & Kapanış Eylemleri':'Completion & Exit Actions','İşlem Bittiğinde Windows Bildirimi Gönder':'Notify When Operation Completes','Tüm indirme ve kurulum işlemleri tamamlandığında masaüstü bildirimi ile haber verir.':'Show a desktop notification when operations finish.','Tüm İşlemler Bittiğinde Otomatik Eylem':'Automatic Action After Completion','Seçilen toplu paket kurulumu/güncellemesi bittiğinde sistemin ne yapacağını belirleyin.':'Choose what happens after a batch install or update.','Hiçbir Şey Yapma (Bekle)':'Do Nothing (Wait)','RhemeSetup\'ı Kapat':'Close RhemeSetup','Sistemi Yeniden Başlat (Reboot)':'Restart System','Bilgisayarı Kapat':'Shut Down Computer','Konsol Çıktılarını Otomatik Metin Dosyasına Kaydet':'Save Console Output to Log File','Tüm kurulum loglarını otomatik olarak `logs/rhemesetup_latest.log` dosyasına yazar.':'Automatically save setup logs to logs/rhemesetup_latest.log.','Uygulama Kurulum / Kaldırma İşlemi':'App Installation / Removal','Kuruluma başlanıyor...':'Starting installation...','İşlemi İptal Et / Durdur':'Cancel / Stop','İşlem sürerken pencereyi kapatmayın. İptal durumunda mevcut adım tamamlandıktan sonra durdurulacaktır.':'Do not close the window while an operation is running. Cancellation takes effect after the current step.','Seçilen uygulamalar sisteminizden kaldırılacaktır. Devam etmek istiyor musunuz?':'Selected apps will be removed. Do you want to continue?','RhemeSetup için yeni bir güncelleme kontrol ediliyor...':'Checking for RhemeSetup updates...'
    };
    window.RHEME_AUTO_TEXT = autoText;
    if (selected === 'en') {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
            if (!node.__rhemeTurkish) node.__rhemeTurkish = node.nodeValue;
            const original = node.__rhemeTurkish.trim();
            const translated = selected === 'en' ? (TRANSLATIONS.en[original] || autoText[original]) : null;
            if (translated) node.nodeValue = node.__rhemeTurkish.replace(original, translated);
            else if (selected === 'tr') node.nodeValue = node.__rhemeTurkish;
        }
        document.querySelectorAll('input[placeholder]').forEach(input => {
            if (!input.dataset.originalPlaceholder) input.dataset.originalPlaceholder = input.placeholder;
            input.placeholder = autoText[input.dataset.originalPlaceholder] || input.dataset.originalPlaceholder;
        });
    } else {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) if (node.__rhemeTurkish) node.nodeValue = node.__rhemeTurkish;
        document.querySelectorAll('input[placeholder]').forEach(input => {
            if (input.dataset.originalPlaceholder) input.placeholder = input.dataset.originalPlaceholder;
        });
    }
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const value = TRANSLATIONS[selected][element.dataset.i18n];
        if (!value) return;
        const icon = element.querySelector('i');
        element.textContent = '';
        if (icon) element.appendChild(icon);
        element.appendChild(document.createTextNode(value));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const value = TRANSLATIONS[selected][element.dataset.i18nPlaceholder];
        if (value) element.placeholder = value;
    });
    document.querySelectorAll('[title]').forEach(element => {
        if (!element.dataset.originalTitle) element.dataset.originalTitle = element.title;
        element.title = selected === 'en' ? (autoText[element.dataset.originalTitle] || element.dataset.originalTitle) : element.dataset.originalTitle;
    });
    const ariaLabels = {
        'Accent color': { tr: 'Vurgu rengi', en: 'Accent color' },
        Language: { tr: 'Dil', en: 'Language' },
        'Application language': { tr: 'Uygulama dili', en: 'Application language' },
        'Appearance theme': { tr: 'Görünüm teması', en: 'Appearance theme' }
    };
    document.querySelectorAll('[aria-label]').forEach(element => {
        if (!element.dataset.originalAriaLabel) element.dataset.originalAriaLabel = element.getAttribute('aria-label');
        const values = ariaLabels[element.dataset.originalAriaLabel];
        if (values) element.setAttribute('aria-label', values[selected]);
    });
    if (!window.__rhemeUiObserver && window.MutationObserver) {
        window.__rhemeUiObserver = new MutationObserver(records => {
            records.forEach(record => record.addedNodes.forEach(localizeAddedUiNode));
        });
        window.__rhemeUiObserver.observe(document.body, { childList: true, subtree: true });
    }
    const countLabel = document.getElementById('selected-count');
    if (countLabel) countLabel.textContent = selected === 'en' ? `${selectedApps.length} apps selected` : `${selectedApps.length} uygulama seçildi`;
    renderCategoryFilters();
    renderAppGrid();
    document.querySelectorAll('.locale-btn').forEach(button => {
        const active = button.dataset.language === selected;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
    });
    const select = document.getElementById('set-language');
    if (select) select.value = selected;
    localStorage.setItem('rheme-language', selected);
}

function applyAppearance(mode) {
    const selected = mode === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.themeMode = selected;
    const select = document.getElementById('set-theme-mode');
    if (select) select.value = selected;
    localStorage.setItem('rheme-appearance', selected);
}

function loadPreferences() {
    applyLanguage(localStorage.getItem('rheme-language') || 'tr');
    applyAppearance(localStorage.getItem('rheme-appearance') || 'dark');
    const languageSelect = document.getElementById('set-language');
    const themeSelect = document.getElementById('set-theme-mode');
    if (languageSelect) languageSelect.addEventListener('change', () => applyLanguage(languageSelect.value));
    if (themeSelect) themeSelect.addEventListener('change', () => applyAppearance(themeSelect.value));
    document.querySelectorAll('.locale-btn').forEach(button => button.addEventListener('click', () => applyLanguage(button.dataset.language)));
    const saveButton = document.getElementById('save-settings-btn');
    try {
        const settings = JSON.parse(localStorage.getItem('rheme-settings') || '{}');
        Object.keys(settings).forEach(id => {
            const control = document.getElementById(id);
            if (control) control.type === 'checkbox' ? control.checked = settings[id] : control.value = settings[id];
        });
    } catch (error) { console.warn('Saved preferences could not be loaded.', error); }
    if (saveButton) saveButton.onclick = () => {
        const settings = {};
        document.querySelectorAll('.settings-container input[type="checkbox"]').forEach(control => { settings[control.id] = control.checked; });
        document.querySelectorAll('.settings-container select:not(#set-language):not(#set-theme-mode)').forEach(control => { settings[control.id] = control.value; });
        localStorage.setItem('rheme-settings', JSON.stringify(settings));
        alert(TRANSLATIONS[document.documentElement.lang].saved);
    };
}

loadPreferences();

function applyTheme(themeName) {
    const theme = THEMES[themeName];
    if (!theme) return;
    
    const root = document.documentElement;
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--accent-grad', theme.grad);
    
    document.querySelectorAll('.theme-dot').forEach(dot => {
        dot.classList.toggle('active', dot.dataset.theme === themeName);
    });
    
    localStorage.setItem('rheme-accent-theme', themeName);
}

// Sayfa yüklendiğinde kayıtlı temayı uygula
(function loadSavedTheme() {
    const saved = localStorage.getItem('rheme-accent-theme') || 'blue';
    applyTheme(saved);
})();

// Renk dotlarına tıklama olayları
document.querySelectorAll('.theme-dot').forEach(dot => {
    dot.addEventListener('click', () => {
        applyTheme(dot.dataset.theme);
    });
});


// =========================================================
// --- 12. DONANIM ÖZELLİKLERİ YÜKLEYICI ---
// =========================================================
async function loadSystemSpecs() {
    if (window.api && window.api.getSystemSpecs) {
        try {
            const specs = await window.api.getSystemSpecs();
            const cpuEl = document.getElementById('spec-cpu');
            const gpuEl = document.getElementById('spec-gpu');
            const ramEl = document.getElementById('spec-ram');
            const osEl  = document.getElementById('spec-os');
            
            const unknown = document.documentElement.lang === 'en' ? 'Unknown' : 'Bilinmiyor';
            const localizedSpec = value => !value || value === 'Bilinmiyor' ? unknown : value;
            if (cpuEl) cpuEl.innerText = localizedSpec(specs.cpu);
            if (gpuEl) gpuEl.innerText = localizedSpec(specs.gpu);
            if (ramEl) ramEl.innerText = localizedSpec(specs.ram);
            if (osEl)  osEl.innerText  = localizedSpec(specs.os);
        } catch (err) {
            console.error('Sistem özellikleri alınamadı:', err);
        }
    }
}

// Sistem Analizi sekmesine tıklanınca donanım bilgilerini güncelle
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        if (item.dataset.target === 'quick-scan') {
            setTimeout(loadSystemSpecs, 500);
        }
    });
});


// =========================================================
// --- 13. PERFORMANS & İNCE AYARLAR (TWEAKS) ---
// =========================================================
const tweakCommands = {
    'tweak-bing': `reg add "HKCU\\SOFTWARE\\Policies\\Microsoft\\Windows\\Explorer" /v DisableSearchBoxSuggestions /t REG_DWORD /d 1 /f`,
    'tweak-telemetry': `sc config DiagTrack start= disabled & sc stop DiagTrack & reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" /v AllowTelemetry /t REG_DWORD /d 0 /f`,
    'tweak-gamedvr': `reg add "HKCU\\System\\GameConfigStore" /v GameDVR_Enabled /t REG_DWORD /d 0 /f & reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\GameDVR" /v AllowGameDVR /t REG_DWORD /d 0 /f`,
    'tweak-notifications': `reg add "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\PushNotifications" /v ToastEnabled /t REG_DWORD /d 0 /f`,
    'tweak-cortana': `reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search" /v AllowCortana /t REG_DWORD /d 0 /f`
};

const applyTweaksBtn = document.getElementById('apply-tweaks-btn');
if (applyTweaksBtn) {
    applyTweaksBtn.addEventListener('click', async () => {
        const enabled = Object.keys(tweakCommands).filter(id => {
            const el = document.getElementById(id);
            return el && el.checked;
        });
        
        if (enabled.length === 0) {
            SystemService.log(document.documentElement.lang === 'en' ? 'Select at least one tweak to apply.' : 'Lütfen uygulamak için en az bir ince ayar seçin.', 'warning');
            return;
        }
        
        SystemService.log(document.documentElement.lang === 'en' ? `Applying ${enabled.length} tweaks... (administrator permission may be required)` : `${enabled.length} ince ayar uygulanıyor... (Yönetici izni gerekebilir)`, 'info');
        
        const combinedCmd = enabled.map(id => tweakCommands[id]).join(' & ');
        const psCmd = `powershell -Command "Start-Process cmd -ArgumentList '/k ${combinedCmd.replace(/"/g, '\\"')} && echo Tum ayarlar basariyla uygulandiTEMAMMESAJI' -Verb RunAs"`;
        
        await window.api.runCommand(psCmd);
        SystemService.log(document.documentElement.lang === 'en' ? 'Tweaks applied. Changes will take full effect in the next session.' : 'İnce ayarlar uygulandı. Değişiklikler bir sonraki oturumda tam olarak etkinleşecek.', 'success');
    });
}

// Sayfayı Başlat
document.addEventListener('DOMContentLoaded', initializeLibrary);
