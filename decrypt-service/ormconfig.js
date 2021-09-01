require('dotenv').config();
require('ts-node').register();
const {join} = require('path');

const index = process.env.HOSTNAME ? Number(process.env.HOSTNAME.split('-').pop()) : 0
const parseJsonEnv = (data) => {
  try {
    return JSON.parse(data)
  } catch (e) {
    console.error(`Could not parse JSON ENV: ${e.message}\n${data}`)
    process.exit(1)
  }
}

const POSTGRES_USER = process.env.POSTGRES_USER;
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD;
const POSTGRES_DB = parseJsonEnv(process.env.POSTGRES_DB)[index];
const POSTGRES_PORT = process.env.POSTGRES_PORT;
const POSTGRES_HOST = process.env.POSTGRES_HOST;

module.exports = {
  type: 'postgres',
  port: POSTGRES_PORT,
  host: POSTGRES_HOST,
  username: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  database: POSTGRES_DB,
  logging: ['log', 'info', 'warn', 'error'], //NODE_ENV === 'development' ? true : ['log', 'info', 'warn', 'error'],
  // entities: [join(__dirname, 'src', 'entities/*{.ts,.js}')],
  entities: [join(__dirname, 'src', '/**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, 'src', 'migrations/*{.ts,.js}')],
  cli: {
    migrationsDir: 'src/migrations',
    entitiesDir: 'src/entities',
  },
};
