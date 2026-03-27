import 'dotenv/config';
import { config } from './config';
import { createApp } from './app';
import { runMigrations } from './db/migrate';

async function main() {
  runMigrations();

  const app = createApp();

  app.listen(config.PORT, () => {
    console.log(`🚀 Hero Academy server running on port ${config.PORT}`);
    console.log(`   Mode: ${config.NODE_ENV}`);
  });
}

main().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
