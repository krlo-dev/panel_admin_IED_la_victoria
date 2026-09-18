import { crearApp } from './app.js';
import { env } from './config/env.js';
import { pool, verifyConnection } from './config/db.js';

async function main() {
  await verifyConnection();

  const app = crearApp();
  const server = app.listen(env.port, () => {
    console.log(`API disponible en http://localhost:${env.port}/api`);
  });

  const apagar = async (senal) => {
    console.log(`Cerrando el servidor por ${senal}`);
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => apagar('SIGINT'));
  process.on('SIGTERM', () => apagar('SIGTERM'));
}

main().catch((error) => {
  console.error('No fue posible iniciar el servidor');
  console.error(error.message);
  process.exit(1);
});
