const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  Menu,
  shell,
} = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = !app.isPackaged;
const STORE_FILE = 'notes-store.json';

function storePath() {
  return path.join(app.getPath('userData'), STORE_FILE);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 800,
    minHeight: 560,
    title: 'Notes',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 18 },
    backgroundColor: '#00000000',
    vibrancy: 'under-window',
    visualEffectState: 'active',
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (process.platform === 'darwin') {
    win.setWindowButtonVisibility(true);
  }

  if (isDev) {
    win.loadURL('http://127.0.0.1:5173');
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function buildMenu() {
  const template = [
    ...(process.platform === 'darwin'
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),
    {
      label: 'Arquivo',
      submenu: [
        {
          label: 'Nova Nota',
          accelerator: 'CmdOrCtrl+N',
          click: (_item, focused) => {
            focused?.webContents.send('menu:new-note');
          },
        },
        { type: 'separator' },
        process.platform === 'darwin' ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: 'Editar',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'Exibir',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Janela',
      submenu: [{ role: 'minimize' }, { role: 'zoom' }],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    const iconPath = path.join(__dirname, '..', 'build', 'icon.icns');
    if (fs.existsSync(iconPath)) {
      app.dock.setIcon(iconPath);
    }
  }

  buildMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('store:get', async () => {
  try {
    return fs.readFileSync(storePath(), 'utf8');
  } catch {
    return null;
  }
});

ipcMain.handle('store:set', async (_event, json) => {
  fs.writeFileSync(storePath(), json, 'utf8');
});

ipcMain.handle('dialog:export', async (_event, payload) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath: payload.defaultPath,
    filters: payload.filters ?? [{ name: 'All', extensions: ['*'] }],
  });
  if (canceled || !filePath) return null;
  fs.writeFileSync(filePath, payload.content, 'utf8');
  return filePath;
});

ipcMain.handle('dialog:pick-image', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic'] },
    ],
  });
  if (canceled || !filePaths[0]) return null;
  const filePath = filePaths[0];
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).slice(1).toLowerCase() || 'png';
  const mime =
    ext === 'jpg' || ext === 'jpeg'
      ? 'image/jpeg'
      : ext === 'gif'
        ? 'image/gif'
        : ext === 'webp'
          ? 'image/webp'
          : 'image/png';
  return {
    name: path.basename(filePath),
    dataUrl: `data:${mime};base64,${buffer.toString('base64')}`,
  };
});
