import 'dotenv/config';

function requerida(nombre) {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(`Variable de entorno requerida sin valor: ${nombre}`);
  }
  return valor;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    user: requerida('DB_USER'),
    password: process.env.DB_PASSWORD ?? '',
    database: requerida('DB_NAME'),
    connectionLimit: Number(process.env.DB_POOL_LIMIT ?? 10)
  },
  jwt: {
    secreto: requerida('JWT_SECRET'),
    expiraEn: process.env.JWT_EXPIRA_EN ?? '8h'
  },
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 10)
};

export const isProduction = env.nodeEnv === 'production';
