/**
 * Model JobNews — artikel berita loker/magang dari Google News RSS (bukan kartu lamar).
 */
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const JobNews = sequelize.define(
  'JobNews',
  {
    title: { type: DataTypes.STRING, allowNull: false },
    source: { type: DataTypes.STRING, defaultValue: '' },
    url: { type: DataTypes.TEXT, allowNull: false, unique: 'job_news_url_key' },
    published_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    snippet: { type: DataTypes.TEXT, defaultValue: '' },
    kind: { type: DataTypes.STRING, allowNull: false, defaultValue: 'loker' },
    company_guess: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
    raw_query: { type: DataTypes.STRING, defaultValue: '' }
  },
  {
    tableName: 'job_news'
  }
);

export default JobNews;
