module.exports = {
  apps: [
    {
      name: 'frontend',
      script: 'npm',
      args: 'start',
      cwd: './',
      env: {
        PORT: 3000,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'backend',
      script: 'npm',
      args: 'start',
      cwd: './src/backend',
      env: {
        PORT: 3001,
        NODE_ENV: 'production'
      }
    }
  ]
};