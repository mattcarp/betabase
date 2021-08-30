import { DataTypes, QueryTypes } from 'sequelize';
import moment from 'moment';

import db from './index';

export const User = db.sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    length: 255,
    nullable: false,
  },
  usernameCanonical: {
    type: DataTypes.STRING,
    length: 255,
    nullable: false,
    unique: true,
    field: 'username_canonical',
  },
  email: {
    type: DataTypes.STRING,
    length: 255,
    nullable: false,
  },
  emailCanonical: {
    type: DataTypes.STRING,
    length: 255,
    nullable: false,
    unique: true,
    field: 'email_canonical',
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    nullable: false,
  },
  salt: {
    type: DataTypes.STRING,
    length: 255,
    nullable: false,
  },
  password: {
    type: DataTypes.STRING,
    length: 255,
    nullable: false,
  },
  lastLogin: {
    type: DataTypes.DATE,
    nullable: true,
    field: 'last_login',
  },
  locked: {
    type: DataTypes.BOOLEAN,
    nullable: false,
  },
  expired: {
    type: DataTypes.BOOLEAN,
    nullable: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    nullable: true,
    field: 'expires_at',
  },
  confirmationToken: {
    type: DataTypes.STRING,
    length: 255,
    nullable: true,
    field: 'confirmation_token',
  },
  passwordRequestedAt: {
    type: DataTypes.DATE,
    nullable: true,
    field: 'password_requested_at',
  },
  roles: {
    type: DataTypes.TEXT,
    nullable: false,
  },
  credentialsExpired: {
    type: DataTypes.BOOLEAN,
    nullable: false,
    field: 'credentials_expired',
  },
  credentialsExpireAt: {
    type: DataTypes.DATE,
    nullable: true,
    field: 'credentials_expire_at',
  },
  isNotified: {
    type: DataTypes.BOOLEAN,
    nullable: true,
    field: 'is_notified',
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at',
  },
  mobilePhone: {
    type: DataTypes.STRING,
    length: 255,
    nullable: true,
    field: 'mobile_phone',
  },
  org: {
    type: DataTypes.STRING,
    length: 127,
    nullable: true,
  },
  fName: {
    type: DataTypes.STRING,
    length: 127,
    nullable: true,
    field: 'f_name',
  },
  lName: {
    type: DataTypes.STRING,
    length: 127,
    nullable: true,
    field: 'l_name',
  },
  jiraUsername: {
    type: DataTypes.STRING,
    length: 127,
    nullable: true,
    field: 'jira_username',
  },
}, {
  freezeTableName: true,
  tableName: 'user',
});

export const getUserByUsername = async (emailCanonical: string) => {
  const model = await User.findOne({ where: { emailCanonical } });
  return model;
}

export const addUser = async (params) => {
  const model = await User.create(params);
  await model.save();
  return model;
}

export const updateUser = async (id, params) => {
  const model = await User.update({ ...params }, { where: { id }});
  return model;
}

db.User = User;
