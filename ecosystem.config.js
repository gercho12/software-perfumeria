module.exports = {
  apps: [
    {
      name: 'frontend',
      script: 'npm',
      args: 'start',
      cwd: './',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      watch: false,
      autorestart: true,
      max_restarts: 10
    },
    {
      name: 'backend',
      script: 'src/backend/index.js',
      cwd: './',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      watch: false,
      autorestart: true,
      max_restarts: 10
    }
  ]
}