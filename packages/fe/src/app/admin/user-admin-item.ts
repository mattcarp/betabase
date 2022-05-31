export interface UserAdminItem {
  confirmationToken: string;
  createdAt: Date | null;
  credentialsExpireAt: Date | null;
  credentialsExpired: boolean;
  email: string;
  emailCanonical: string;
  enabled: boolean;
  expired: boolean;
  expiresAt: Date | null;
  fName: string;
  id: number;
  isNotified: boolean | null;
  jiraUsername: string;
  lName: string;
  lastLogin: Date;
  locked: boolean
  mobilePhone: string;
  org: string
  passwordRequestedAt: Date | null;
  roles: string;
  salt: string;
  updatedAt: Date | null;
  username: string;
  usernameCanonical: string;
}
