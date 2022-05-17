import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Editor, Toolbar } from 'ngx-editor';
import { tap } from 'rxjs/operators';

import { AppService } from '../../shared/app.service';
import { ScenarioItem, TestItem } from '../../shared/models';

@Component({
  selector: 'app-test-form',
  templateUrl: './test-form.component.html',
  styleUrls: ['./test-form.component.scss'],
  host: { '[class.page]': 'true' },
})
export class TestFormComponent implements OnDestroy {
  app: string | null = null;
  scenario: ScenarioItem | null = null;
  test: TestItem | null = null;
  isLoading = false;
  inputEditor: Editor;
  resultEditor: Editor;
  commentsEditor: Editor;
  toolbarEditor: Toolbar = [
    ['bold', 'italic'],
    ['underline', 'strike'],
    ['code', 'blockquote'],
    ['ordered_list', 'bullet_list'],
    [{ heading: ['h1', 'h2', 'h3', 'h4'] }],
    ['link', 'image'],
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right', 'align_justify'],
  ];
  browserNameOptions = ['Microsoft Edge', 'Firefox', 'Chrome', 'Safari', 'Android Browser'];
  browserVersionOptions = [...Array(111).keys()].slice(14).map(String);
  osNameOptions = ['Windows', 'Mac OS', 'iOS', 'Android', 'Linux (Ubuntu)'];
  osVersionOptions = ['Vista', 'XP', ...Array(21).keys()].map(String);
  passFailOptions = ['Pending', 'Pass', 'Fail'];
  inProdOptions = ['Yes', 'No', 'Unsure'];

  constructor(
    private appService: AppService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
  ) {
    activatedRoute.params
      .pipe(tap(({ app }) => {
        this.test = {};
        this.scenario = { appUnderTest: app };
      }))
      .subscribe(({ scenarioId, id }) => this.fetchData(scenarioId, id));

    this.inputEditor = new Editor();
    this.resultEditor = new Editor();
    this.commentsEditor = new Editor();
  }

  get isCreateTestBtnDisabled(): boolean {
    return (
      !this.test?.browserName?.length ||
      !this.test.browserMinor?.length ||
      !this.test.browserMajor?.length ||
      !this.test.osName?.length ||
      !this.test.osMinor?.length ||
      !this.test.osMajor?.length ||
      !this.test.passFail?.length
    );
  }

  get saveBtnLabel(): string {
    return this.test?.id ? 'Save Edits' : 'Save this Test';
  }

  ngOnDestroy(): void {
    this.inputEditor?.destroy();
    this.resultEditor?.destroy();
    this.commentsEditor?.destroy();
  }

  async onSaveClick(): Promise<void> {
    this.isLoading = true;
    const params = { ...this.test, scenarioId: this.scenario?.id! };
    this.test?.id
      ? await this.appService.updateTest(params)
      : await this.appService.addTest(params);
    this.isLoading = false;
    await this.router.navigate(['/test', this.scenario?.appUnderTest, this.test?.id, 'show']);
  }

  private async fetchData(scenarioId: string, testId: string): Promise<void> {
    this.isLoading = true;
    if (testId) {
      this.test = await this.appService.getTest(testId);
      const { scenario } = await this.appService.getScenario(`${this.test.scenarioId}`);
      this.scenario = scenario;
    }
    if (scenarioId) {
      const { scenario } = await this.appService.getScenario(scenarioId);
      this.scenario = scenario;
    }
    this.isLoading = false;
  }
}
