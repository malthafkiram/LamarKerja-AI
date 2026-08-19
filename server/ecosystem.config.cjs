module.exports = {
  apps: [
    {
      name: 'lamarkerja-api',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '800M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ]
};
