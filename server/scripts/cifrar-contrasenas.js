import bcrypt from 'bcryptjs';
import { pool, query } from '../src/config/db.js';
import { env } from '../src/config/env.js';

async function main() {
  const usuarios = await query('SELECT id, usuario, contrasena FROM usuario ORDER BY id');
  const pendientes = usuarios.filter((fila) => !fila.contrasena.startsWith('$2'));

  if (!pendientes.length) {
    console.log(`Nada por hacer: las ${usuarios.length} contrasenas ya estan cifradas`);
    return;
  }

  console.log(`Cifrando ${pendientes.length} de ${usuarios.length} contrasenas con bcrypt`);

  let procesadas = 0;
  for (const fila of pendientes) {
    const hash = await bcrypt.hash(fila.contrasena, env.bcryptRounds);
    await pool.execute('UPDATE usuario SET contrasena = ? WHERE id = ?', [hash, fila.id]);
    procesadas += 1;

    if (procesadas % 50 === 0) {
      console.log(`${procesadas} de ${pendientes.length}`);
    }
  }

  console.log(`Listo: ${procesadas} contrasenas cifradas. Las credenciales de ingreso no cambiaron`);
}

main()
  .catch((error) => {
    console.error('Fallo el cifrado de contrasenas');
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
