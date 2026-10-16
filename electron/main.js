const { app, BrowserWindow, ipcMain, dialog, shell, Notification } = require('electron');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE_PATH = path.join(DATA_DIR, 'studyflow-db.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readDatabase() {
  try {
    ensureDataDir();
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to read local database:', err);
  }
  return null;
}

function writeDatabase(data) {
  try {
    ensureDataDir();
    const tempPath = `${DB_FILE_PATH}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, DB_FILE_PATH);
    return { ok: true, path: DB_FILE_PATH };
  } catch (err) {
    console.error('Failed to write local database:', err);
    return { ok: false, error: err.message };
  }
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#020617',
    title: 'StudyFlow — Desktop Study Planner & Focus Studio',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const distIndex = path.join(__dirname, '..', 'dist', 'index.html');
  const isDevServer = process.env.ELECTRON_DEV === 'true' || !fs.existsSync(distIndex);

  if (isDevServer) {
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      if (fs.existsSync(distIndex)) {
        mainWindow.loadFile(distIndex);
      }
    });
  } else {
    mainWindow.loadFile(distIndex);
  }
}

app.whenReady().then(() => {
  ipcMain.handle('db:load', async () => {
    return {
      data: readDatabase(),
      dbPath: DB_FILE_PATH
    };
  });

  ipcMain.handle('db:save', async (_event, payload) => {
    return writeDatabase(payload);
  });

  ipcMain.handle('db:getPath', async () => {
    ensureDataDir();
    return DB_FILE_PATH;
  });

  ipcMain.handle('db:revealInFolder', async () => {
    ensureDataDir();
    if (fs.existsSync(DB_FILE_PATH)) {
      shell.showItemInFolder(DB_FILE_PATH);
    } else {
      shell.openPath(DATA_DIR);
    }
    return { ok: true };
  });

  ipcMain.handle('db:exportBackup', async (_event, payload) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export StudyFlow Backup',
      defaultPath: `studyflow-backup-${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: 'JSON Database Backup', extensions: ['json'] }]
    });
    if (result.canceled || !result.filePath) {
      return { canceled: true };
    }
    fs.writeFileSync(result.filePath, JSON.stringify(payload, null, 2), 'utf-8');
    return { ok: true, filePath: result.filePath };
  });

  ipcMain.handle('db:importBackup', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import StudyFlow Backup',
      filters: [{ name: 'JSON Database Backup', extensions: ['json'] }],
      properties: ['openFile']
    });
    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return { canceled: true };
    }
    const content = fs.readFileSync(result.filePaths[0], 'utf-8');
    const parsed = JSON.parse(content);
    writeDatabase(parsed);
    return { ok: true, data: parsed, filePath: result.filePaths[0] };
  });

  ipcMain.handle('app:notify', async (_event, { title, body }) => {
    if (Notification.isSupported()) {
      new Notification({ title: title || 'StudyFlow', body: body || '' }).show();
    }
    return { ok: true };
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
