/**
 * Model HunterJob — hasil crawl Auto-Hunter yang disimpan untuk dilamar.
 */
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const HunterJob = sequelize.define(
  'HunterJob',
  {
    source: { type: DataTypes.STRING, defaultValue: 'WebScraper' },
    platform: { type: DataTypes.STRING, defaultValue: 'Portal Karir' },
    title: { type: DataTypes.STRING, allowNull: false },
    company: { type: DataTypes.STRING, allowNull: false },
    location: { type: DataTypes.STRING, defaultValue: 'Indonesia / Remote' },
    job_url: { type: DataTypes.TEXT, allowNull: false, unique: true },
    contact_email: { type: DataTypes.STRING, defaultValue: '' },
    requirements: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    description: { type: DataTypes.TEXT, defaultValue: '' },
    match_score: { type: DataTypes.INTEGER, defaultValue: 0 },
    match_analysis: { type: DataTypes.JSONB, defaultValue: {} },
    status: {
      type: DataTypes.ENUM('found', 'queued', 'applied', 'skipped'),
      defaultValue: 'found'
    },
    applied_at: { type: DataTypes.DATE, allowNull: true }
  },
  {
    tableName: 'hunter_jobs'
  }
);

export default HunterJob;
