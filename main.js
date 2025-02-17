const { app, BrowserWindow, Notification, Menu, Tray, ipcMain, nativeImage } = require('electron');
const path = require("path");

let win;

// **Pencereyi oluşturma fonksiyonu**
const createWindow = () => {
   win = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  win.loadFile('index.html'); // HTML dosyasını yükle
  win.setMenuBarVisibility(false);

  win.on('close', (event) => {
    if (app.quitting) {
      win = null;
    } else {
      event.preventDefault();
      win.hide();
    }
  });
};

let tray = null;
const createTray = () => {
  const iconPath = path.resolve(app.getAppPath(), "./source/icon.png"); // ✅ **Doğru dosya yolu**
  const icon = nativeImage.createFromPath(iconPath);
  
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Uygulamayı Kapat', 
      click: () => {
        if (win) {
          win.destroy();  // Pencereyi yok et
        }
        tray.destroy();
        app.exit(); // Uygulama tamamen kapatılır
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip('Coin Master'); // Tooltip göster

  tray.on('double-click', () => {
    if (win) {
      win.show();  // Pencereyi görünür yap
    }
  });
};

app.whenReady().then(() => {
  app.setAppUserModelId("Coin Master");
  createWindow();
  createTray();

  // Uygulama aktif olduğunda yeni pencere oluşturma
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// **Tüm pencereler kapatıldığında uygulamayı sonlandır**
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.on("send-notification", (event, { title, body }) => {
  const iconPath = path.resolve(app.getAppPath(), "./source/icon.png"); // ✅ **Bildirim ikonu için de düzeltildi**
  const icon = nativeImage.createFromPath(iconPath);
  
  new Notification({ 
    title, 
    body,
    icon: icon // Doğru dosya yolunu kullan
  }).show();
});
