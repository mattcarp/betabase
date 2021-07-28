export interface ScenarioItem {
  id: number;
  name: string;
  coverage: string;
  appUnderTest: string;
  mostRecent: Date;
  lastTest: string;
  enhancementSortOrder?: number;
}
