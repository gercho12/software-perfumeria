const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'src/preload.js'), // Adjust if necessary
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    }
  });
  mainWindow.maximize(); // Maximize the window

  // Load the React app
  mainWindow.loadURL('http://localhost:3000'); // Ensure the React app is running
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// On macOS, create a new window in the app when the dock icon is clicked
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
