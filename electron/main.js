import { app, BrowserWindow, Tray, Menu, Notification, ipcMain, nativeImage, session } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = !!process.env.ELECTRON_DEV;

// Windows 개발 모드에서 시스템 알림이 동작하려면 반드시 설정 필요
app.setAppUserModelId('com.yourname.hourly');

let win = null;
let tray = null;

function createWindow() {
  win = new BrowserWindow({
    width: 430,
    height: 900,
    title: 'Hourly',
    autoHideMenuBar: true,
    webPreferences: {
      preload: app.isPackaged
        ? path.join(process.resourcesPath, 'app.asar.unpacked', 'electron', 'preload.cjs')
        : path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Ctrl+Shift+I 로 DevTools 열기 (디버깅용)
  win.webContents.on('before-input-event', (_e, input) => {
    if (input.control && input.shift && input.key === 'I') {
      win.webContents.toggleDevTools();
    }
  });

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
  // 렌더러에서 Web Notification API 권한 요청 시 자동 허용
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(permission === 'notifications');
  });

  createWindow();
  createTray();

  ipcMain.handle('notify', (_evt, opts) => {
    try {
      new Notification({
        title: opts?.title || 'Hourly',
        body: opts?.body || 'Hourly check-in',
        silent: false
      }).show();
      return true;
    } catch (e) {
      console.error('Notification error:', e);
      return false;
    }
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
