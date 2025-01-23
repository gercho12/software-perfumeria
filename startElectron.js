const http = require('http');
const { exec } = require('child_process');

let electronStarted = false; // Control para evitar múltiples inicios

const checkServer = (port, callback) => {
  const options = {
    hostname: 'localhost',
    port: port,
    method: 'GET',
  };

  const req = http.request(options, (res) => {
    if (res.statusCode === 200) {
      callback(true);
    } else {
      callback(false);
    }
  });

  req.on('error', () => {
    callback(false);
  });

  req.end();
};

const startElectron = () => {
  const port = 3000; // Puerto de la aplicación React
  const checkInterval = setInterval(() => {
    console.log("Comprobando si la aplicación React está lista...");
    checkServer(port, (isRunning) => {
      if (isRunning && !electronStarted) {
        clearInterval(checkInterval);
        electronStarted = true; // Marcar como iniciado
        console.log("Iniciando Electron...");
        exec('npx electron main.js', (err) => {
          if (err) {
            console.error(`Error al iniciar Electron: ${err}`);
          }
        });
      }
    });
  }, 1000); // Comprobar cada segundo
};

console.log("Esperando a que la aplicación React esté lista...");
startElectron();
