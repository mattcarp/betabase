import { DataTypes } from 'sequelize';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import * as twilio from 'twilio';

import db from './index';
import config from '../config';

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
    type: DataTypes.SMALLINT,
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
    type: DataTypes.SMALLINT,
    nullable: false,
  },
  expired: {
    type: DataTypes.SMALLINT,
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
    type: DataTypes.SMALLINT,
    nullable: false,
    field: 'credentials_expired',
  },
  credentialsExpireAt: {
    type: DataTypes.DATE,
    nullable: true,
    field: 'credentials_expire_at',
  },
  isNotified: {
    type: DataTypes.SMALLINT,
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

export const sendEmail = async (to: string, text: string, subject?: string) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'thebetabase3@gmail.com',
      pass: 'ygruysrafvqotmep',
    },
  });
  const message = await transporter.sendMail({
    to,
    text,
    from: '"The Betabase" <noreply@thebetabase.com>',
    subject: subject || 'Reset Password',
  });
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(message));
}

export const getUserByUsername = async (emailCanonical: string) => {
  const response = await User.findOne({ where: { emailCanonical } });
  return response?.dataValues;
}

export const getUserByToken = async (token: string) => {
  const confirmationToken = decodeURIComponent(token);
  try {
    const { dataValues } = await User.findOne({ where: { confirmationToken }});
    return dataValues;
  } catch (e) {
    return null;
  }
}

export const getUser = async (id: string | number) => {
  const { dataValues } = await User.findByPk(id);
  return dataValues;
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

export const sendResetPasswordToken = async (id: number, username: string, email: string) => {
  const hash = bcrypt.hashSync(`${(new Date()).getMilliseconds()}`, 8);
  const confirmationToken = hash.substring(8, hash.length);
  const params = {
    confirmationToken,
    passwordRequestedAt: new Date(),
  };
  await updateUser(id, params);
  const text = 'Hello ' + username + '!\n' +
    'To reset your password - please visit:\nhttps://betabase.herokuapp.com/auth/reset-password?token=' +
    params.confirmationToken + '\n' +
    'Regards,\n' +
    'The Betabase';
  await sendEmail(email, text);
}

export const getUsers = async () => {
  return User.findAll();
}

export const deleteUser = async (id) => {
  const model = await User.destroy({ where: { id } });
  return model;
}

export const sendSms = async ({ telNumbers, message }) => {
  try {
    const messages = [];
    const client = twilio(config.twilioAccountSid, config.twilioAuthToken);
    for (const telNumber of telNumbers) {
      const msg = await client.messages.create({
        from: '+16466635100',
        to: telNumbers,
        body: message,
      });
      messages.push(msg);
    }
    return messages.map(({ errorMessage }) => errorMessage).join(', ');
  } catch (e) {
    return e;
  }
}

db.User = User;
