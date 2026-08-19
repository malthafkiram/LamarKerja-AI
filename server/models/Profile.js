/**
 * Model Profile — data CV, skill, dan SMTP Gmail pribadi per pengguna.
 */
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Profile = sequelize.define(
  'Profile',
  {
    userId: { type: DataTypes.INTEGER, allowNull: true },
    full_name: { type: DataTypes.STRING, defaultValue: '' },
    email: { type: DataTypes.STRING, defaultValue: '' },
    phone: { type: DataTypes.STRING, defaultValue: '' },
    city: { type: DataTypes.STRING, defaultValue: '' },
    linkedin_url: { type: DataTypes.STRING, defaultValue: '' },
    portfolio_url: { type: DataTypes.STRING, defaultValue: '' },
    github_url: { type: DataTypes.STRING, defaultValue: '' },
    headline: { type: DataTypes.STRING, defaultValue: '' },
    summary: { type: DataTypes.TEXT, defaultValue: '' },
    skills: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    experience: { type: DataTypes.JSONB, defaultValue: [] },
    education: { type: DataTypes.JSONB, defaultValue: [] },
    certifications: { type: DataTypes.JSONB, defaultValue: [] },
    target_roles: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    cv_filename: { type: DataTypes.STRING, defaultValue: '' },
    cv_path: { type: DataTypes.STRING, defaultValue: '' },
    cv_text: { type: DataTypes.TEXT, defaultValue: '' },
    portfolio_filename: { type: DataTypes.STRING, defaultValue: '' },
    portfolio_path: { type: DataTypes.STRING, defaultValue: '' },
    other_files: { type: DataTypes.JSONB, defaultValue: [] },
    smtp_user: { type: DataTypes.STRING, defaultValue: '' },
    smtp_pass: { type: DataTypes.STRING, defaultValue: '' },
    sender_name: { type: DataTypes.STRING, defaultValue: '' },
    generated_cv: { type: DataTypes.JSONB, allowNull: true },
    target_role: { type: DataTypes.STRING, defaultValue: '' }
  },
  {
    tableName: 'profiles'
  }
);

export default Profile;
