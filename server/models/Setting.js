/**
 * Model Setting — satu baris pengaturan global (AI, SMTP, kuota harian).
 * Kunci API tidak di-hardcode; isi lewat env atau menu admin.
 */
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Setting = sequelize.define(
  'Setting',
  {
    groq_api_key: { type: DataTypes.STRING, defaultValue: '' },
    kimi_api_key: { type: DataTypes.STRING, defaultValue: '' },
    gemini_api_key: { type: DataTypes.STRING, defaultValue: '' },
    database_url: { type: DataTypes.STRING, defaultValue: '' },
    mongodb_uri: { type: DataTypes.STRING, defaultValue: '' },
    ai_provider: { type: DataTypes.STRING, defaultValue: 'groq' },
    ai_model: { type: DataTypes.STRING, defaultValue: 'openai/gpt-oss-120b' },
    smtp_host: { type: DataTypes.STRING, defaultValue: 'smtp.gmail.com' },
    smtp_port: { type: DataTypes.INTEGER, defaultValue: 465 },
    smtp_secure: { type: DataTypes.INTEGER, defaultValue: 1 },
    smtp_user: { type: DataTypes.STRING, defaultValue: '' },
    smtp_pass: { type: DataTypes.STRING, defaultValue: '' },
    sender_name: { type: DataTypes.STRING, defaultValue: '' },
    daily_limit: { type: DataTypes.INTEGER, defaultValue: 30 },
    auto_send_enabled: { type: DataTypes.INTEGER, defaultValue: 0 },
    min_match_score: { type: DataTypes.INTEGER, defaultValue: 70 }
  },
  {
    tableName: 'settings'
  }
);

export default Setting;
