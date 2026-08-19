/**
 * Model User — akun login, peran, dan paket (free/pro/vip).
 */
import bcrypt from 'bcryptjs';
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const User = sequelize.define(
  'User',
  {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('admin', 'user'), defaultValue: 'user' },
    plan: { type: DataTypes.ENUM('free', 'pro', 'vip'), defaultValue: 'free' },
    plan_expires_at: { type: DataTypes.DATE, allowNull: true },
    bonus_quota: { type: DataTypes.INTEGER, defaultValue: 0 },
    cv_builder_usage: { type: DataTypes.INTEGER, defaultValue: 0 },
    referral_code: { type: DataTypes.STRING, defaultValue: '' },
    phone: { type: DataTypes.STRING, defaultValue: '' },
    avatar: { type: DataTypes.STRING, defaultValue: '' }
  },
  {
    tableName: 'users'
  }
);

User.beforeCreate(async (user) => {
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
});

User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

User.prototype.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default User;
