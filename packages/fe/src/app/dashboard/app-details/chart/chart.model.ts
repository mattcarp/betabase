import { ChartType } from 'chart.js';

export interface ChartOption {
  isLoading: boolean;
  type: ChartType;
  title: string;
  labels: string[];
  datasets: any;
  result?: string | number;
}
