export interface ScenarioItem {
  id: number;
  name?: string;
  coverage?: string;
  appUnderTest?: string;
  mostRecent?: Date;
  lastTest?: string;
  enhancementSortOrder?: number;
  clientPriority?: number
  createdAt?: Date;
  createdBy?: string;
  currentRegressionSortOrder?: number;
  expectedResult?: string;
  flagReason?: string;
  isSecurity?: number;
  mode?: string;
  preconditions?: string;
  prioritySortOrder?: number;
  reviewFlag?: number;
  script?: string;
  tags?: string;
  updatedAt?: Date;
  updatedBy?: string;
}
