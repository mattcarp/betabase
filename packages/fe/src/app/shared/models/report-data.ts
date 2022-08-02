import { ScenarioItem } from './scenario-item';
import { JiraItem } from './jira-item';
import { Deployment } from './deployment';
import { RoundItem } from './round-item';

export interface ReportData {
  roundNotes?: RoundItem;
  deployment?: Deployment;
  enhancementScenarios?: ScenarioItem[];
  regressionScenarios?: ScenarioItem[];
  priorities?: ScenarioItem[];
  testsToday?: number;
  testsYesterday?: number;
  testsThisWeek?: number;
  jiras?: JiraItem[];
  testCount?: number;
  enhancementCount?: number;
  regressionCount?: number;
  flaggedCount?: number;
  priorityCount?: number;
  flaggedScenarios?: ScenarioItem[];
  priorityScenarios?: ScenarioItem[];
}
