/**
 * Model Log — jejak audit aksi sistem (login, kirim email, crawl, dll).
 */
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Log = sequelize.define(
  'Log',
  {
    type: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    metadata: { type: DataTypes.JSONB, defaultValue: {} }
  },
  {
    tableName: 'logs'
  }
);

export default Log;
