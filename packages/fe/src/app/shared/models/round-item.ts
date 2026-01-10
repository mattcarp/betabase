export interface RoundItem {
  id?: number;
  currentFlag?: number;
  app?: string;
  notes?: string;
  clientNotes?: string;
  name?: string;
  startsAt?: string | Date;
  endsAt?: string | Date;
  releaseDate?: Date;
  createdAt?: Date;
  updatedAt?: string | Date;
  releaseNum?: string;
}
