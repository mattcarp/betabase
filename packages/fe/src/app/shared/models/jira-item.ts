export interface JiraItem {
  browserMajor: string;
  browserMinor: string;
  browserName: string;
  build: string;
  comments: string;
  createdAt: Date;
  createdBy: string;
  deploymentStamp: Date;
  id: number;
  inProd: string;
  input: string;
  isSecurity: number;
  osMajor: string;
  osMinor: string;
  osName: string;
  passFail: string;
  path: string;
  result: string;
  scenarioId: number;
  ticket: string;
  updatedAt: Date;
  updatedBy: string;
}
