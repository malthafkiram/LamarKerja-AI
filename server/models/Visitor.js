/**
 * Model Visitor — anonymous unique visitor (cookie id, not a login).
 * No IP stored. first_seen / last_seen only.
 */
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Visitor = sequelize.define(
  'Visitor',
  {
    visitor_id: { type: DataTypes.STRING(36), primaryKey: true },
    first_seen: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    last_seen: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    tableName: 'visitors',
    timestamps: false
  }
);

export default Visitor;
