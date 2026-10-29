const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');

let mainWindow = null;
let uiLanguage = 'tr';

// Log Klasörü ve Dosyası Hazırlama
const logDir = path.join(__dirname, 'logs');
const logFile = path.join(logDir, 'system.log');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

function writeLog(message, type = 'info') {
    const time = new Date().toISOString();
    const logLine = `[${time}] [${type.toUpperCase()}] ${message}\n`;
    try {
        fs.appendFileSync(logFile, logLine, 'utf8');
    } catch (e) {
        console.error('Log yazma hatası:', e);
    }
}

// CPU İstatistiklerini Al
function getCpuInfo() {
    const cpus = os.cpus();
    let user = 0, nice = 0, sys = 0, idle = 0, irq = 0;
    for (const cpu of cpus) {
        user += cpu.times.user;
        nice += cpu.times.nice;
        sys += cpu.times.sys;
        idle += cpu.times.idle;
        irq += cpu.times.irq;
    }
    const total = user + nice + sys + idle + irq;
    return { idle, total };
}

function calculateCpuUsage() {
    const start = getCpuInfo();
    return new Promise((resolve) => {
        setTimeout(() => {
            const end = getCpuInfo();
            const idleDifference = end.idle - start.idle;
            const totalDifference = end.total - start.total;
            if (totalDifference === 0) resolve(0);
            const percentage = 100 - Math.floor((100 * idleDifference) / totalDifference);
            resolve(percentage);
        }, 200);
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 850,
        minWidth: 1024,
        minHeight: 768,
        frame: false,
        transparent: false,
        backgroundColor: '#0a0a0c',
        webPreferences: {
            preload: path.join(__dirname, 'src', 'services', 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'src', 'pages', 'index.html'));
    
    // Geliştirici konsolunu aç (İsteğe bağlı, geliştirme aşaması için açık bırakılabilir)
    // mainWindow.webContents.openDevTools();

    // Sistem İstatistiklerini 2 Saniyede Bir Gönder
    setInterval(async () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            const cpuUsage = await calculateCpuUsage();
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMem = totalMem - freeMem;
            const ramUsage = Math.floor((usedMem / totalMem) * 100);
            const totalGB = (totalMem / (1024 * 1024 * 1024)).toFixed(1);
            const usedGB = (usedMem / (1024 * 1024 * 1024)).toFixed(1);
            
            mainWindow.webContents.send('system-stats', {
                cpu: cpuUsage,
                ram: ramUsage,
                ramDetails: `${usedGB} GB / ${totalGB} GB`
            });
        }
    }, 2000);

    writeLog('RhemeSetup started.', 'info');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// Pencere İşlemleri
ipcMain.on('window-min', () => mainWindow.minimize());
ipcMain.on('window-max', () => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
});
ipcMain.on('window-close', () => mainWindow.close());
ipcMain.on('set-language', (_event, language) => {
    uiLanguage = language === 'en' ? 'en' : 'tr';
});

// Güvenli Komut Çalıştırıcı (Loglamalı ve Hata Kontrollü)
ipcMain.handle('run-command', async (event, command) => {
    // Windows'ta UTF-8 kod sayfasını (65001) aktif ederek Türkçe karakterlerin düzgün gelmesini sağlıyoruz.
    const utf8Command = process.platform === 'win32' ? `chcp 65001 > nul && ${command}` : command;
    writeLog(uiLanguage === 'en' ? `System command started: ${command}` : `Sistem komutu başlatıldı: ${command}`, 'command');
    return new Promise((resolve) => {
        exec(utf8Command, { encoding: 'utf8' }, (error, stdout, stderr) => {
            if (error) {
                writeLog(uiLanguage === 'en' ? `ERROR - Command: ${command} | Reason: ${error.message}` : `HATA - Komut: ${command} | Sebep: ${error.message}`, 'error');
                resolve({ success: false, error: error.message, code: error.code });
            } else if (stderr && stderr.trim().length > 0 && !stdout) {
                writeLog(uiLanguage === 'en' ? `WARNING - Command: ${command} | Details: ${stderr}` : `UYARI - Komut: ${command} | Detay: ${stderr}`, 'warning');
                resolve({ success: false, error: stderr });
            } else {
                writeLog(uiLanguage === 'en' ? `SUCCESS - Command: ${command}` : `BAŞARILI - Komut: ${command}`, 'success');
                resolve({ success: true, output: stdout });
            }
        });
    });
});

// Canlı Log Kaydetme ve Okuma
ipcMain.on('write-log', (event, { message, type }) => {
    writeLog(message, type);
});

ipcMain.handle('read-logs', async () => {
    try {
        if (fs.existsSync(logFile)) {
            return fs.readFileSync(logFile, 'utf8');
        }
        return uiLanguage === 'en' ? 'No log entries yet.' : 'Henüz log kaydı bulunmuyor.';
    } catch (error) {
        return uiLanguage === 'en' ? `Could not read logs: ${error.message}` : `Log okuma hatası: ${error.message}`;
    }
});

// Auto-Update Yapısı (Skelet ve Loglama)
try {
    const { autoUpdater } = require('electron-updater');
    
    autoUpdater.on('checking-for-update', () => {
        writeLog(uiLanguage === 'en' ? 'Checking for updates...' : 'Güncelleme kontrol ediliyor...', 'updater');
    });
    
    autoUpdater.on('update-available', (info) => {
        writeLog(uiLanguage === 'en' ? `Update available: ${info.version}` : `Yeni güncelleme bulundu: ${info.version}`, 'updater');
        if (mainWindow) {
            mainWindow.webContents.send('update-message', { status: 'available', version: info.version });
        }
    });
    
    autoUpdater.on('update-not-available', (info) => {
        writeLog(uiLanguage === 'en' ? 'The app is up to date.' : 'Uygulama güncel.', 'updater');
        if (mainWindow) {
            mainWindow.webContents.send('update-message', { status: 'up-to-date' });
        }
    });
    
    autoUpdater.on('error', (err) => {
        writeLog(uiLanguage === 'en' ? `Update error: ${err.message}` : `Güncelleme hatası: ${err.message}`, 'error');
        if (mainWindow) {
            mainWindow.webContents.send('update-message', { status: 'error', error: err.message });
        }
    });
    
    autoUpdater.on('download-progress', (progressObj) => {
        writeLog(uiLanguage === 'en' ? `Download progress: ${Math.floor(progressObj.percent)}%` : `İndirme yüzdesi: ${Math.floor(progressObj.percent)}%`, 'updater');
    });
    
    autoUpdater.on('update-downloaded', (info) => {
        writeLog(uiLanguage === 'en' ? 'Update downloaded. It will be installed after restart.' : 'Güncelleme başarıyla indirildi. Yeniden başlatılıp kurulacak.', 'updater');
        if (mainWindow) {
            mainWindow.webContents.send('update-message', { status: 'downloaded' });
        }
    });

    ipcMain.on('check-for-updates', () => {
        writeLog(uiLanguage === 'en' ? 'The user started an update check.' : 'Kullanıcı güncelleme aramayı tetikledi.', 'updater');
        autoUpdater.checkForUpdatesAndNotify().catch(e => {
            writeLog(uiLanguage === 'en' ? `Update error: ${e.message}` : `Güncelleme hatası: ${e.message}`, 'error');
        });
    });
} catch (e) {
    writeLog(uiLanguage === 'en' ? `The update service is unavailable: ${e.message}` : `electron-updater yüklenmemiş veya yüklenirken hata oluştu: ${e.message}`, 'warning');
    
    ipcMain.on('check-for-updates', () => {
        writeLog(uiLanguage === 'en' ? 'The update service is unavailable (electron-updater is missing).' : 'Güncelleme servisi aktif değil (electron-updater eksik).', 'warning');
        if (mainWindow) {
            mainWindow.webContents.send('update-message', { status: 'error', error: uiLanguage === 'en' ? 'The update service is not ready.' : 'Güncelleme servisi hazır değil.' });
        }
    });
}

// --- YENİ: SİSTEM DONANIM ÖZELLİKLERİ SORGULAMA ---
let systemSpecs = { cpu: 'Bilinmiyor', gpu: 'Bilinmiyor', ram: 'Bilinmiyor', os: 'Bilinmiyor' };

async function scanSystemSpecs() {
    try {
        const execPromise = (cmd) => new Promise(resolve => exec(cmd, (err, stdout) => resolve(stdout ? stdout.trim() : '')));
        
        // OS Sürümü
        const osOutput = await execPromise('wmic os get caption');
        if (osOutput) {
            const lines = osOutput.split('\n').map(l => l.trim()).filter(l => l !== '' && !l.toLowerCase().includes('caption'));
            if (lines.length > 0) systemSpecs.os = lines[0];
        }
        
        // CPU Model
        const cpuOutput = await execPromise('wmic cpu get name');
        if (cpuOutput) {
            const lines = cpuOutput.split('\n').map(l => l.trim()).filter(l => l !== '' && !l.toLowerCase().includes('name'));
            if (lines.length > 0) systemSpecs.cpu = lines[0];
        }
        
        // GPU Model
        const gpuOutput = await execPromise('wmic path win32_VideoController get name');
        if (gpuOutput) {
            const lines = gpuOutput.split('\n').map(l => l.trim()).filter(l => l !== '' && !l.toLowerCase().includes('name'));
            if (lines.length > 0) systemSpecs.gpu = lines[0];
        }
        
        // RAM Miktarı
        const totalMem = os.totalmem();
        const gb = (totalMem / (1024 * 1024 * 1024)).toFixed(0);
        systemSpecs.ram = `${gb} GB RAM`;
    } catch (e) {
        console.error('Sistem donanım özellikleri alınamadı:', e);
    }
}

// Uygulama başladığında donanım taramasını tetikle
app.whenReady().then(() => {
    setTimeout(scanSystemSpecs, 1000);
});

// IPC Handler - Donanım özelliklerini renderer'a gönder
ipcMain.handle('get-system-specs', async () => {
    return systemSpecs;
});
