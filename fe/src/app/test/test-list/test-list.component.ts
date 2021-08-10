import { Component } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { filter, pluck, tap } from 'rxjs/operators';

import { TestItem } from '../../shared/models';
import { AppService } from '../../shared/app.service';

@Component({
  selector: 'app-test-list',
  templateUrl: './test-list.component.html',
  styleUrls: ['./test-list.component.scss'],
  host: { '[class.page]': 'true' },
})
export class TestListComponent {
  tests: TestItem[] = [];
  app: string | null = null;

  constructor(private appService: AppService, private activatedRoute: ActivatedRoute) {
    activatedRoute.params
      .pipe(
        filter((params: Params) => 'app' in params),
        pluck('app'),
        tap((app: string) => {
          this.app = app;
        }),
      )
      .subscribe((app: string) => this.fetchData(app));
  }

  private async fetchData(app: string): Promise<void> {
    this.tests = await this.appService.getAllTests(app);
    console.log(this.tests);
  }
}
