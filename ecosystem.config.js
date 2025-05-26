module.exports = {
  apps: [
    {
      name: 'perfumeria-app',
      script: 'npm',
      args: 'start',
      cwd: './',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
};