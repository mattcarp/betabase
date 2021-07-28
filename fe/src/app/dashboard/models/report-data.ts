import { ScenarioItem } from './scenario-item';

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
}
