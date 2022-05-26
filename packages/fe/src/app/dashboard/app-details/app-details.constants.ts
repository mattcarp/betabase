import { Options } from '@angular-slider/ngx-slider';

import { ChartOption } from './chart/chart.model';

export const detailsChartOptions: {
  completion: ChartOption;
  browser: ChartOption;
  total: ChartOption;
  yearSlider: {
    value: number;
    highValue: number;
    options: Options;
  }
  monthSlider: {
    value: number;
    highValue: number;
    options: Options;
  }
  months: { key: string, value: string }[]
} = {
  completion: {
    isLoading: true,
    type: 'doughnut',
    title: 'Completion Projection',
    datasets: [
      {
        data: [],
        backgroundColor: ['#9adad9', '#ffa4b6'],
        hoverBackgroundColor: ['#4bc0c0', '#ff6384'],
        hoverBorderColor: 'rgba(0, 0, 0, 0.1)',
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
  yearSlider: {
    value: 0,
    highValue: 0,
    options: {
      floor: 0,
      ceil: 0,
      step: 1,
      showTicks: true,
    },
  },
  monthSlider: {
    value: 0,
    highValue: 0,
    options: {
      floor: 0,
      ceil: 0,
      step: 1,
      showTicks: true,
    },
  },
  months: [
    {
      key: '01',
      value: 'Jan.',
    },
    {
      key: '02',
      value: 'Feb.',
    },
    {
      key: '03',
      value: 'Mar.',
    },
    {
      key: '04',
      value: 'Apr.',
    },
    {
      key: '05',
      value: 'May',
    },
    {
      key: '06',
      value: 'Jun.',
    },
    {
      key: '07',
      value: 'Jul.',
    },
    {
      key: '08',
      value: 'Aug.',
    },
    {
      key: '09',
      value: 'Sep.',
    },
    {
      key: '10',
      value: 'Oct.',
    },
    {
      key: '11',
      value: 'Nov.',
    },
    {
      key: '12',
      value: 'Dec.',
    },
  ],
};
