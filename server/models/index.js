/**
 * Daftarkan relasi antar model Sequelize.
 */
import User from './User.js';
import Profile from './Profile.js';
import Application from './Application.js';
import HunterJob from './HunterJob.js';
import JobDirectory from './JobDirectory.js';
import JobNews from './JobNews.js';
import Notification from './Notification.js';
import Setting from './Setting.js';
import Log from './Log.js';
import Visitor from './Visitor.js';

User.hasOne(Profile, { foreignKey: 'userId', onDelete: 'CASCADE' });
Profile.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Application, { foreignKey: 'userId', onDelete: 'CASCADE' });
Application.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Notification, { foreignKey: 'userId', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId' });

Application.hasMany(Notification, { foreignKey: 'applicationId', onDelete: 'SET NULL' });
Notification.belongsTo(Application, { foreignKey: 'applicationId' });

export {
  User,
  Profile,
  Application,
  HunterJob,
  JobDirectory,
  JobNews,
  Notification,
  Setting,
  Log,
  Visitor
};
