/**
 * Entry server: hubungkan PostgreSQL lalu listen di PORT.
 */
import './loadEnv.js';
import { createApp } from './app.js';
import { connectDB } from './config/database.js';

const PORT = process.env.PORT || 5000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`Server LamarKerja AI berjalan di port ${PORT}`);
  console.log(`Backend API: http://localhost:${PORT}/api`);
});

connectDB().catch((err) => {
  console.error('Peringatan koneksi PostgreSQL:', err.message);
});
