/**
 * Koneksi Sequelize ke PostgreSQL.
 * URL dari env DATABASE_URL. Supabase wajib SSL + Session pooler :5432.
 */
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgres://lamarkerja:lamarkerja@localhost:5432/lamarkerja';

export function needsPostgresSsl(databaseUrl = '') {
  return (
    /supabase\.com/i.test(databaseUrl) ||
    /sslmode=(require|verify-ca|verify-full)/i.test(databaseUrl)
  );
}

export function sequelizeClientOptions(databaseUrl = DATABASE_URL) {
  const options = {
    dialect: 'postgres',
    logging: false,
    define: {
      timestamps: true
    }
  };
  if (needsPostgresSsl(databaseUrl)) {
    options.dialectOptions = {
      ssl: { require: true, rejectUnauthorized: false }
    };
  }
  return options;
}

export const sequelize = new Sequelize(DATABASE_URL, sequelizeClientOptions(DATABASE_URL));

/**
 * Autentikasi, sync tabel (alter di development), lalu seed data awal.
 */
export async function connectDB(retryCount = 0) {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL terhubung.');

    // Import model setelah sequelize siap agar relasi terdaftar
    await import('../models/index.js');

    const isProd = process.env.NODE_ENV === 'production';
    await sequelize.sync({ alter: !isProd });
    console.log('Skema PostgreSQL sudah disinkronkan.');

    const { seedInitialData } = await import('../helpers/dbHelpers.js');
    await seedInitialData();

    const { seedJobDirectoryIfEmpty } = await import('../services/jobHubService.js');
    seedJobDirectoryIfEmpty().catch((err) =>
      console.warn('Background job directory sync:', err.message)
    );

    const { seedJobNewsIfEmpty } = await import('../services/jobNewsService.js');
    seedJobNewsIfEmpty().catch((err) =>
      console.warn('Background job news sync:', err.message)
    );

    const { startFlyerSweep } = await import('../helpers/uploadCleanup.js');
    startFlyerSweep();

    return sequelize;
  } catch (error) {
    console.error(
      `Gagal terhubung ke PostgreSQL (percobaan ${retryCount + 1}):`,
      error.message
    );
    if (retryCount < 5) {
      console.log('Mencoba ulang dalam 3 detik...');
      await new Promise((r) => setTimeout(r, 3000));
      return connectDB(retryCount + 1);
    }
    throw error;
  }
}

export default sequelize;
