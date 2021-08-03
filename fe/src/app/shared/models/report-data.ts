import { ScenarioItem } from './scenario-item';
import { JiraItem } from './jira-item';

export interface ReportData {
  roundNotes: {
    notes: string;
    clientNotes: string;
    app: string;
    startsAt: Date;
    endsAt: Date;
    name: string;
    releaseNum: string;
    releaseDate: Date;
  };
  deployment: {
    build: string;
    branch: string;
    deployedAt: Date;
  };
  enhancementScenarios: ScenarioItem[];
  regressionScenarios: ScenarioItem[];
  priorities: ScenarioItem[];
  testsToday: number;
  testsYesterday: number;
  testsThisWeek: number;
  jiras: JiraItem[];
  testCount: number;
  enhancementCount: number;
  regressionCount: number;
  flaggedCount: number;
  priorityCount: number;
  flaggedScenarios: ScenarioItem[];
  priorityScenarios: ScenarioItem[];
}
