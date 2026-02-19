const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    },
    title: 'Net Muhasebe - Yapay Zeka Destekli Finansal Çözümler',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'icon.png')
  });

  // Paketlenmiş modda doğrudan canlı siteye yönlendir
  // Bu sayede her zaman en güncel versiyonu kullanır
  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadURL('https://netmuhasebe.net.tr');
  }

  // Dış bağlantıları (WhatsApp vb.) varsayılan tarayıcıda aç
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});