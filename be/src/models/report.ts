import { DataTypes } from 'sequelize';

import db from './index';

export const Report = db.sequelize.define('Report', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
}, {
  freezeTableName: true,
  tableName: 'report',
});

db.Report = Report;
