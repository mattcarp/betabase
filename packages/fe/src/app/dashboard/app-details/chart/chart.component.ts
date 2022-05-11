import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ChartData, ChartOptions, ChartType } from 'chart.js';

import { ChartOption } from './chart.model';

@Component({
  selector: 'app-chart',
  templateUrl: 'chart.component.html',
  styleUrls: ['chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartComponent {
  @Input() set inputOptions(options: ChartOption | undefined) {
    if (options) {
      this.chartType = options.type;
      this.title = options.title;
      this.chartData.labels = options.labels;
      this.chartData.datasets = options.datasets;
      this.result = options.result ? `${options.result}%` : '';
    }
  }

  title: string | undefined = '';
  result = '';
  chartLegend = true;
  chartType: ChartType = 'pie';
  chartData: ChartData<'pie', number[], string | string[]> = {
    datasets: [{
      data: [],
    }],
    labels: [],
  };
  chartOptions: ChartOptions = {
    responsive: true,
    aspectRatio: 1.5,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          padding: 5,
          usePointStyle: true,
        },
      },
    },
  };
}
