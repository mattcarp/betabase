export interface TestItem {
  browserMajor?: string;
  browserMinor?: string;
  browserName?: string;
  build?: string;
  comments?: string;
  createdAt?: Date;
  createdBy?: string;
  deploymentStamp?: Date;
  id?: number;
  inProd?: string;
  input?: string;
  osMajor?: string;
  osMinor?: string;
  osName?: string;
  passFail?: string;
  path?: string;
  result?: string;
  ticket?: string;
  updatedAt?: Date;
  updatedBy?: string;
  scenarioId?: number;
}
