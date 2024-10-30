const { app, BrowserWindow } = require('electron');
const path = require('path');

app.setName("Binge");


function createWindow() {
  const win = new BrowserWindow({
    width: 1440, 
    height: 900,
    title: "Binge",
    icon: path.join(__dirname, '../assets/icon-only.png'),
    autoHideMenuBar: true,

    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      
    },
  });

  app.dock.setIcon(path.join(__dirname, '../assets/icon-only.png'));

  win.loadFile(path.join(__dirname, '../dist/binge/browser/index.html'));

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