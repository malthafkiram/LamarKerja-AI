/**
 * Model JobDirectory — agregasi loker dari portal publik yang bisa di-fetch.
 */
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const JobDirectory = sequelize.define(
  'JobDirectory',
  {
    title: { type: DataTypes.STRING, allowNull: false },
    company: { type: DataTypes.STRING, allowNull: false },
    location: { type: DataTypes.STRING, defaultValue: 'Indonesia' },
    platform: { type: DataTypes.STRING, allowNull: false },
    platform_badge_color: { type: DataTypes.STRING, defaultValue: '#0077B5' },
    job_url: { type: DataTypes.TEXT, allowNull: false, unique: true },
    contact_email: { type: DataTypes.STRING, defaultValue: '' },
    salary: { type: DataTypes.STRING, defaultValue: 'Kompetitif' },
    experience_level: { type: DataTypes.STRING, defaultValue: 'Semua Level' },
    work_type: { type: DataTypes.STRING, defaultValue: 'Full-time' },
    category: { type: DataTypes.STRING, defaultValue: 'IT & Software' },
    description: { type: DataTypes.TEXT, defaultValue: '' },
    requirements: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    posted_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    tags: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] }
  },
  {
    tableName: 'job_directories'
  }
);

export default JobDirectory;
