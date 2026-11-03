import EmbeddedPostgres from "embedded-postgres";
import { mkdirSync } from "fs";

const port = Number(process.env.PG_PORT || 54329);
const databaseDir = process.env.PG_DATA_DIR || "./data/pg";

mkdirSync(databaseDir, { recursive: true });

const pg = new EmbeddedPostgres({
  databaseDir,
  user: "postgres",
  password: "postgres",
  port,
  persistent: true,
});

await pg.initialise();
await pg.start();

try {
  await pg.createDatabase("mallinabella");
} catch (error) {
  console.log(`createDatabase skipped: ${error.message}`);
}

console.log(`Postgres ready at postgresql://postgres:postgres@127.0.0.1:${port}/mallinabella`);

const stop = async () => {
  await pg.stop();
  process.exit(0);
};

process.on("SIGINT", stop);
process.on("SIGTERM", stop);

await new Promise(() => {});
