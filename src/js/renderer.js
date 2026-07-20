// Global Seçim Listesi ve Görünüm Durumu
let selectedApps = [];
let currentCategory = "all";
let searchQuery = "";
let currentView = "local"; // "local" veya "global"
let globalSearchResults = [];

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
        btn.innerText = cat === 'all' ? 'Tümü' : cat;
        
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
        appGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fa-solid fa-face-frown" style="font-size: 32px; margin-bottom: 10px;"></i>
                <p>Yerel kütüphanede eşleşen uygulama bulunamadı.</p>
                <button id="btn-global-search" class="btn btn-primary" style="margin-top: 15px;">
                    <i class="fa-solid fa-globe"></i> Winget Mağazasında Ara
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
        infoDiv.innerHTML = `
            <h4>${app.name}</h4>
            <span>${app.category}</span>
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
    selectedCountText.innerText = `${count} uygulama seçildi`;
    
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
    const text = `${selectedApps.length} uygulamayı sisteminizden tamamen kaldırmak istediğinize emin misiniz?`;
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
            Sistem taranıyor, lütfen bekleyin...
        </li>
    `;
    startScanBtn.disabled = true;
    startScanBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Taranıyor...';

    const results = await SystemService.runQuickScan((libName, idx, total) => {
        scanList.innerHTML = `
            <li class="scan-item">
                <div class="scan-item-info">
                    <i class="fa-solid fa-spinner fa-spin text-info" style="color: var(--accent);"></i>
                    <div>
                        <span class="lib-name">${libName}</span>
                        <div class="lib-id">Sorgulanıyor (${idx + 1}/${total})</div>
                    </div>
                </div>
                <span class="status-badge scanning">Tarama Sürüyor...</span>
            </li>
        `;
    });

    scanList.innerHTML = '';
    results.forEach(res => {
        const item = document.createElement('li');
        item.className = 'scan-item';
        
        const badgeClass = res.installed ? 'installed' : 'missing';
        const badgeText = res.installed ? 'YÜKLÜ' : 'EKSİK';
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
    startScanBtn.innerHTML = '<i class="fa-solid fa-radar"></i> Taramayı Tekrarla';
});

// --- 6. PRESET / PAKET YÖNETİMİ ---
const exportBtn = document.getElementById('export-preset-btn');
const importBtn = document.getElementById('import-preset-btn');
const fileInput = document.getElementById('import-file-input');
const quickPresets = document.querySelectorAll('.quick-preset-card');

// Preset Dışa Aktar (JSON Dosyası İndir)
if (exportBtn) exportBtn.addEventListener('click', () => {
    if (selectedApps.length === 0) {
        alert("Lütfen önce dışa aktarılacak uygulamaları kütüphaneden seçin.");
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
    
    SystemService.log(`Paket başarıyla dışa aktarıldı: ${selectedApps.length} uygulama.`, 'success');
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
                alert("Geçersiz paket formatı! JSON dizi veya preset objesi olmalıdır.");
                return;
            }
            
            // Sadece veritabanında mevcut olanları seçime al
            const validIds = appDatabase.map(a => a.id);
            selectedApps = appsList.filter(id => validIds.includes(id));
            
            renderAppGrid();
            updateBatchButtons();
            SystemService.log(`Yerel paket başarıyla içe aktarıldı. ${selectedApps.length} uygulama seçildi.`, 'success');
            // Kütüphane sayfasını aç
            const libNav = document.querySelector('[data-target="library"]');
            if (libNav) libNav.click();
        } catch (err) {
            alert("Dosya okunurken hata oluştu: " + err.message);
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
        SystemService.log(`"${card.querySelector('h4').innerText}" başarıyla seçildi!`, 'success');
        
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
                
                consoleEl.innerHTML += `<p class="${logClass}">${line}</p>`;
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
        if (updateModalText) updateModalText.innerText = "Güncellemeler kontrol ediliyor...";
        if (updateOkBtn) updateOkBtn.classList.add('hidden');
        if (updateModal) updateModal.classList.remove('hidden');
        window.api.checkForUpdates();
    });
}

if (window.api && window.api.onUpdateMessage) {
    window.api.onUpdateMessage((data) => {
        if (data.status === 'available') {
            updateModalText.innerText = `Yeni bir güncelleme mevcut: v${data.version}. İndiriliyor, lütfen bekleyin...`;
        } else if (data.status === 'up-to-date') {
            updateModalText.innerText = "RhemeSetup güncel durumdadır. Yeni bir güncelleme bulunmuyor.";
        } else if (data.status === 'downloaded') {
            updateModalText.innerText = "Güncelleme başarıyla indirildi. Kurulumu tamamlamak için uygulamayı yeniden başlatın.";
            updateOkBtn.classList.remove('hidden');
        } else if (data.status === 'error') {
            updateModalText.innerText = `Güncelleme hatası: ${data.error}`;
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
    appGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 50px; color: var(--text-muted);">
            <i class="fa-solid fa-spinner fa-spin" style="font-size: 28px; margin-bottom: 12px;"></i>
            <p>Winget mağazasında aranıyor: <strong style="color: var(--accent)">"${query}"</strong></p>
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
                <p>Winget araması başarısız: ${err.message}</p>
                <button class="btn" style="margin-top: 15px;" onclick="switchToLocalView()">
                    <i class="fa-solid fa-arrow-left"></i> Yerel Kütüphaneye Dön
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
            Winget Mağazası — <strong style="color: var(--accent)">${globalSearchResults.length}</strong> sonuç
        </span>
        <button class="btn" onclick="switchToLocalView()" style="font-size: 12px; padding: 6px 14px;">
            <i class="fa-solid fa-arrow-left"></i> Yerel Kütüphaneye Dön
        </button>
    `;
    appGrid.appendChild(backBtn);
    
    if (globalSearchResults.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);';
        emptyDiv.innerHTML = '<p>Sonuç bulunamadı.</p>';
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
                    <i class="fa-solid fa-download"></i> Kur
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
    SystemService.log(`Winget mağazasından yükleniyor: ${name} (${id})`, 'info');
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
            
            if (cpuEl) cpuEl.innerText = specs.cpu || 'Bilinmiyor';
            if (gpuEl) gpuEl.innerText = specs.gpu || 'Bilinmiyor';
            if (ramEl) ramEl.innerText = specs.ram || 'Bilinmiyor';
            if (osEl)  osEl.innerText  = specs.os  || 'Bilinmiyor';
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
            SystemService.log('Lütfen uygulamak için en az bir ince ayar seçin.', 'warning');
            return;
        }
        
        SystemService.log(`${enabled.length} ince ayar uygulanıyor... (Yönetici izni gerekebilir)`, 'info');
        
        const combinedCmd = enabled.map(id => tweakCommands[id]).join(' & ');
        const psCmd = `powershell -Command "Start-Process cmd -ArgumentList '/k ${combinedCmd.replace(/"/g, '\\"')} && echo Tum ayarlar basariyla uygulandiTEMAMMESAJI' -Verb RunAs"`;
        
        await window.api.runCommand(psCmd);
        SystemService.log('İnce ayarlar uygulandı. Değişiklikler bir sonraki oturumda tam olarak etkinleşecek.', 'success');
    });
}

// Sayfayı Başlat
document.addEventListener('DOMContentLoaded', initializeLibrary);