import { Component } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { filter, pluck, tap } from 'rxjs/operators';

import { ScenarioItem, TestItem } from '../../shared/models';
import { AppService } from '../../shared/app.service';
import { DialogWarningComponent } from '../../shared/layout/dialog-warning/dialog-warning.component';

@Component({
  selector: 'app-test-details',
  templateUrl: './test-details.component.html',
  styleUrls: ['./test-details.component.scss'],
  host: { '[class.page]': 'true' },
})
export class TestDetailsComponent {
  scenario: ScenarioItem | null = null;
  test: TestItem | null = null;
  isLoading = false;

  private app: string = '';

  constructor(
    private appService: AppService,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private router: Router,
  ) {
    activatedRoute.params
      .pipe(
        tap(({ app }) => this.app = app),
        filter((params: Params) => 'id' in params),
        pluck('id'),
      )
      .subscribe((id: string) => this.fetchData(id));
  }

  async onDeleteClick(): Promise<void> {
    this.dialog.open(DialogWarningComponent, {
      data: 'delete',
      width: '500px',
      autoFocus: false,
    }).afterClosed()
      .pipe(filter((remove: boolean) => remove))
      .subscribe(async () => {
        await this.appService.deleteTest(this.test?.id);
        await this.router.navigate(['/test', this.app]);
      });
  }

  private async fetchData(id: string): Promise<void> {
    this.isLoading = true;
    this.test = await this.appService.getTest(id);
    const { scenario } = await this.appService.getScenario(`${this.test.scenarioId}`);
    this.scenario = scenario;
    this.isLoading = false;
  }
}
