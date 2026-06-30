import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

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
  username: process.env.DB_USERNAME || requireEnv('DB_USER'),
  password: process.env.PGPASSWORD || requireEnv('DB_PASSWORD'),
  database: process.env.DB_DATABASE || requireEnv('DB_NAME'),
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
});
