import { app, BrowserWindow, Tray, Menu, Notification, ipcMain, nativeImage } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = !!process.env.ELECTRON_DEV;

let win = null;
let tray = null;

function createWindow() {
  win = new BrowserWindow({
    width: 430,
    height: 900,
    title: 'Hourly',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  win.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      win.hide();
    }
  });
}

function createTray() {
  const iconPath = path.join(__dirname, process.platform === 'darwin' ? 'icon.icns' : 'icon.ico');
  let img;
  try {
    img = nativeImage.createFromPath(iconPath);
    if (img.isEmpty()) img = nativeImage.createEmpty();
  } catch {
    img = nativeImage.createEmpty();
  }
  tray = new Tray(img);
  tray.setToolTip('Hourly');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show', click: () => win?.show() },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } }
  ]));
  tray.on('click', () => win?.show());
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  ipcMain.handle('notify', (_evt, opts) => {
    if (!Notification.isSupported()) return false;
    new Notification({
      title: opts?.title || 'Hourly',
      body: opts?.body || 'Hourly check-in'
    }).show();
    return true;
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else win?.show();
  });
});

app.on('window-all-closed', (e) => {
  if (process.platform !== 'darwin') return;
});

app.on('before-quit', () => { app.isQuitting = true; });
