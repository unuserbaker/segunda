import { DataSource } from 'typeorm';
console.log('Cargando configuración de la base de datos desde variables de entorno...');
console.log(process.env);

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[DataSource] Variable de entorno requerida no definida: ${key}`,
    );
  }
  return value;
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: requireEnv('DB_HOST'),
  port: parseInt(requireEnv('DB_PORT'), 10),
  username: requireEnv('DB_USERNAME'),
  password: requireEnv('DB_PASSWORD'),
  database: requireEnv('DB_DATABASE'),
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
});