module.exports = {
  apps: [
    {
      name: 'msgflow-backend',
      script: 'backend/dist/src/main.js',
      instances: 'max', // Scale across all available CPU cores for 1000+ users
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      max_memory_restart: '1G',
      autorestart: true,
      watch: false,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
