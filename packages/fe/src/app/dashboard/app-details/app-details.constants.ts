import { ChartOption } from './chart/chart.model';

export const detailsChartOptions: {
  completion: ChartOption;
  browser: ChartOption;
  total: ChartOption;
} = {
  completion: {
    isLoading: true,
    type: 'doughnut',
    title: 'Completion Projection',
    datasets: [
      {
        data: [],
      },
    ],
    labels: [],
  },
  browser: {
    isLoading: true,
    type: 'doughnut',
    title: 'Browsers Tested',
    datasets: [
      {
        data: [],
      },
    ],
    labels: [],
  },
  total: {
    isLoading: true,
    type: 'line',
    title: 'Total Tests',
    datasets: [
      {
        data: [],
        label: [],
      },
      {
        data: [],
        label: [],
      },
    ],
    labels: [],
  },
};
