/**
 * PM2 Ecosystem Configuration
 *
 * Start services with: pm2 start ecosystem.config.cjs
 */

module.exports = {
  apps: [
    {
      name: 'knowledge-api',
      script: './scripts/start-knowledge-api.sh',
      cwd: __dirname,
      env: {
        NODE_ENV: 'development',
        KNOWLEDGE_API_PORT: 3006,
      },
      env_production: {
        NODE_ENV: 'production',
        KNOWLEDGE_API_PORT: 3006,
      },
      watch: false,
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 1000,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: 'logs/knowledge-api-error.log',
      out_file: 'logs/knowledge-api-out.log',
      merge_logs: true,
    },
  ],
};
