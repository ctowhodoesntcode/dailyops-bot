const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 380,
        height: 600,
        alwaysOnTop: true,
        transparent: true,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('index.html');
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    // This makes it float over everything else
    mainWindow.setAlwaysOnTop(true, 'floating');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

ipcMain.on('show-notification', (event, { title, body }) => {
    new Notification({ title, body }).show();
});

ipcMain.on('close-app', () => {
    app.quit();
});
ipcMain.on('minimize-app', () => {
    mainWindow.minimize();
});

ipcMain.on('resize-window', (event, { width, height, isBubble }) => {
    if (mainWindow) {
        mainWindow.setMinimumSize(width, height);
        mainWindow.setSize(width, height, true); // animate resize
        
        // Remove macOS native square shadow when in bubble mode
        if (isBubble !== undefined) {
            mainWindow.setHasShadow(!isBubble);
        }
    }
});