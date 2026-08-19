/**
 * Model Application — riwayat lamaran yang dikirim atau masih draf.
 */
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Application = sequelize.define(
  'Application',
  {
    userId: { type: DataTypes.INTEGER, allowNull: true },
    company_name: { type: DataTypes.STRING, allowNull: false },
    position: { type: DataTypes.STRING, allowNull: false },
    source: { type: DataTypes.STRING, defaultValue: 'LamarKerja' },
    job_url: { type: DataTypes.TEXT, defaultValue: '' },
    recipient_email: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    email_subject: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    email_body: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    brochure_image_path: { type: DataTypes.STRING, defaultValue: '' },
    extracted_data: { type: DataTypes.JSONB, defaultValue: {} },
    match_score: { type: DataTypes.INTEGER, defaultValue: 0 },
    match_analysis: { type: DataTypes.JSONB, defaultValue: {} },
    attachments: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    status: { type: DataTypes.STRING, defaultValue: 'draft' },
    sent_at: { type: DataTypes.DATE, allowNull: true },
    applied_at: { type: DataTypes.DATE, allowNull: true },
    error_message: { type: DataTypes.TEXT, defaultValue: '' },
    notes: { type: DataTypes.TEXT, defaultValue: '' }
  },
  {
    tableName: 'applications'
  }
);

export default Application;
