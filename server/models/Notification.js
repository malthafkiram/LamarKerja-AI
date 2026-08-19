/**
 * Model Notification — kotak masuk HRD (simulasi) per pengguna.
 */
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Notification = sequelize.define(
  'Notification',
  {
    userId: { type: DataTypes.INTEGER, allowNull: true },
    applicationId: { type: DataTypes.INTEGER, allowNull: true },
    company_name: { type: DataTypes.STRING, allowNull: false },
    position: { type: DataTypes.STRING, defaultValue: '' },
    sender_email: { type: DataTypes.STRING, defaultValue: '' },
    type: {
      type: DataTypes.ENUM(
        'interview_invitation',
        'technical_test',
        'status_update',
        'hr_screening',
        'offering'
      ),
      defaultValue: 'interview_invitation'
    },
    title: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    raw_snippet: { type: DataTypes.TEXT, defaultValue: '' },
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
    interview_date: { type: DataTypes.DATE, allowNull: true },
    meeting_link: { type: DataTypes.STRING, defaultValue: '' }
  },
  {
    tableName: 'notifications'
  }
);

export default Notification;
