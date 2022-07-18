export interface RoundItem {
  id?: number;
  currentFlag?: number;
  app?: string;
  notes?: string;
  clientNotes?: string;
  name?: string;
  startsAt?: Date | null;
  endsAt?: Date | null;
  releaseDate?: Date;
  createdAt?: Date;
  updatedAt?: Date | null;
  releaseNum?: string;
}
