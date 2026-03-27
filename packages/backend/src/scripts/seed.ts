import 'dotenv/config';
import { initDb } from '../db/index';
import { runMigrations } from '../db/migrate';
import { runSeed } from '../seed/index';

runMigrations();
initDb();
runSeed();
