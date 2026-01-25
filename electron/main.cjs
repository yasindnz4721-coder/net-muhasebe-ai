const { app, BrowserWindow, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
let backendProcess;
let frontendProcess;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false // Yerel dosya erişim hatalarını önlemek için
    },
    title: 'NetMuhasebe.ai - Muhasebe Çözümü',
    autoHideMenuBar: true
  });

  if (!app.isPackaged) {
    // Geliştirme modu: Vite sunucusuna bağlan
    mainWindow.loadURL('http://localhost:3000');
  } else {
    // ÜRETİM MODU (EXE): 
    // 404 hatasında gördüğümüz yolu (app.asar/out/index.html) hedefliyoruz.
    const indexPath = path.join(app.getAppPath(), 'out', 'index.html');

    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      // Dosya hala bulunamazsa beyaz ekran yerine hata detayını göster
      mainWindow.loadURL(`data:text/html,<h1>Hata: index.html Bulunamadı</h1><p>Aranan Yol: ${indexPath}</p>`);
    }
  }

  mainWindow.once('ready-to-show', () => {
    // Pencereyi hemen gösterme, sayfa yüklendiğinde gösterilecek
  });

  // Geliştirme modunda sayfa yüklenemezse (Vite henüz hazır değilse) tekrar dene
  if (!app.isPackaged) {
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.log('Sayfa yüklenemedi, landing.html gösteriliyor...', errorDescription);
      mainWindow.loadFile(path.join(__dirname, '..', 'landing.html'));
    });

    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.show();
    });
  } else {
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
    });
  }
}

function startBackend() {
  try {
    const isPackaged = app.isPackaged;
    const serverPath = isPackaged
      ? path.join(process.resourcesPath, 'server', 'index.js')
      : path.join(__dirname, '..', 'server', 'index.js');

    // Uygulama paketlendiğinde node_modules içindeki node.exe kullanılabilir veya sistemdeki node aranır.
    // Genelde paketlenmiş uygulamalarda sidecar binary kullanılır ama burada node --watch/index.js varsayıyoruz.
    const spawnPath = isPackaged ? 'node' : 'node';

    backendProcess = spawn(spawnPath, [serverPath], {
      cwd: isPackaged ? path.join(process.resourcesPath, 'server') : path.join(__dirname, '..', 'server'),
      env: { ...process.env, PORT: 3001 },
      stdio: 'pipe',
      shell: true
    });

    backendProcess.stdout.on('data', (data) => console.log(`[Backend]: ${data}`));
    backendProcess.stderr.on('data', (data) => console.error(`[Backend Error]: ${data}`));
  } catch (err) {
    console.error('Backend başlatma hatası:', err);
  }
}

function startFrontend() {
  if (app.isPackaged) return;

  try {
    const vitePath = process.platform === 'win32'
      ? path.join(__dirname, '..', 'node_modules', '.bin', 'vite.cmd')
      : path.join(__dirname, '..', 'node_modules', '.bin', 'vite');

    console.log('Frontend başlatılıyor:', vitePath);

    frontendProcess = spawn(vitePath, ['--port', '3000'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe',
      shell: true
    });

    frontendProcess.stdout.on('data', (data) => console.log(`[Frontend]: ${data}`));
    frontendProcess.stderr.on('data', (data) => console.error(`[Frontend Error]: ${data}`));
  } catch (err) {
    console.error('Frontend başlatma hatası:', err);
  }
}

app.whenReady().then(() => {
  startBackend();
  startFrontend();

  createWindow();

  // Geliştirme modunda pencereyi yüklemeye çalış
  if (!app.isPackaged) {
    setTimeout(() => {
      mainWindow.loadURL('http://localhost:3000');
    }, 1000);
  }
});

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill();
  if (frontendProcess) frontendProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
  if (backendProcess) backendProcess.kill();
  if (frontendProcess) frontendProcess.kill();
});