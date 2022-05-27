export interface AppListData {
  aomaScenarios?: {
    scenarioCount?: number;
  };
  promoScenarios?: {
    scenarioCount?: number;
  };
  promoAdminScenarios?: {
    scenarioCount?: number;
  };
  dxScenarios?: {
    scenarioCount?: number;
  };
  partnerPreviewerScenarios?: {
    scenarioCount?: number;
  };
  aomaRound?: {
    notes?: string;
    clientNotes?: string;
    app?: string;
    startsAt?: Date;
    endsAt?: Date;
    name?: string;
    releaseNum?: string;
    releaseDate?: Date;
  };
  promoRound?: {
    notes?: string;
    clientNotes?: string;
    app?: string;
    startsAt?: Date;
    endsAt?: Date;
    name?: string;
    releaseNum?: string;
    releaseDate?: string;
  };
  promoAdminRound?: {
    notes?: string;
    clientNotes?: string;
    app?: string;
    startsAt?: Date;
    endsAt?: Date;
    name?: string;
    releaseNum?: string;
    releaseDate?: Date;
  };
  dxRound?: {
    notes?: string;
    clientNotes?: string;
    app?: string;
    startsAt?: Date;
    endsAt?: Date;
    name?: string;
    releaseNum?: string;
    releaseDate?: Date;
  };
  partnerPreviewerRound?: {
    notes?: string;
    clientNotes?: string;
    app?: string;
    startsAt?: Date;
    endsAt?: Date;
    name?: string;
    releaseNum?: string;
    releaseDate?: Date;
  };
  aomaTestCount?: number;
  aomaFails?: number;
  promoTestCount?: number;
  promoFails?: number;
  promoAdminTestCount?: number;
  promoAdminFails?: number;
  dxTestCount?: number;
  dxFails?: number;
  partnerPreviewerTestCount?: number;
  partnerPreviewerFails?: number;
}
