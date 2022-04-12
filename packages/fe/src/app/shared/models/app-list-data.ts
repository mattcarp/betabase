export interface AppListData {
  aomaScenarios: {
    scenarioCount: number;
  };
  promoScenarios: {
    scenarioCount: number;
  };
  partnerPreviewerScenarios: {
    scenarioCount: number;
  };
  aomaRound: {
    notes: string;
    clientNotes: string;
    app: string;
    startsAt: Date;
    endsAt: Date;
    name: string;
    releaseNum: string;
    releaseDate: Date;
  };
  promoRound: {
    notes: string;
    clientNotes: string;
    app: string;
    startsAt: Date;
    endsAt: Date;
    name: string;
    releaseNum: string;
    releaseDate: string;
  };
  dxRound: {
    notes: string;
    clientNotes: string;
    app: string;
    startsAt: Date;
    endsAt: Date;
    name: string;
    releaseNum: string;
    releaseDate: Date;
  };
  grasLiteRound: {
    notes: string;
    clientNotes: string;
    app: string;
    startsAt: Date;
    endsAt: Date;
    name: string;
    releaseNum: string;
    releaseDate: Date;
  };
  partnerPreviewerRound: {
    notes: string;
    clientNotes: string;
    app: string;
    startsAt: Date;
    endsAt: Date;
    name: string;
    releaseNum: string;
    releaseDate: Date;
  };
  aomaTestCount: number;
  promoTestCount: number;
  partnerPreviewerTestCount: number;
  aomaFails: number;
  promoFails: number;
  partnerPreviewerFails: number;
}
