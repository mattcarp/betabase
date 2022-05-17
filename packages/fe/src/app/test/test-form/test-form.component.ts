import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { tap } from 'rxjs/operators';

import { AppService } from '../../shared/app.service';
import { ScenarioItem, TestItem } from '../../shared/models';

@Component({
  selector: 'app-test-form',
  templateUrl: './test-form.component.html',
  styleUrls: ['./test-form.component.scss'],
  host: { '[class.page]': 'true' },
})
export class TestFormComponent {
  app: string | null = null;
  scenario: ScenarioItem | null = null;
  test: TestItem | null = null;
  isLoading = false;
  config: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    height: '15rem',
    minHeight: '5rem',
    placeholder: 'Enter text here...',
    translate: 'no',
    defaultParagraphSeparator: 'p',
    defaultFontName: 'Arial',
    toolbarHiddenButtons: [['bold']],
    customClasses: [
      {
        name: 'quote',
        class: 'quote',
      },
      {
        name: 'redText',
        class: 'redText',
      },
      {
        name: 'titleText',
        class: 'titleText',
        tag: 'h2',
      },
    ],
  };
  browserNameOptions = ['Microsoft Edge', 'Firefox', 'Chrome', 'Safari', 'Android Browser'];
  browserVersionOptions = [...Array(111).keys()].slice(15).map(String);
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

  async onSaveClick(): Promise<void> {
    this.isLoading = true;
    const params = { ...this.test, scenarioId: this.scenario?.id! };
    this.test?.id
      ? await this.appService.updateTest(params)
      : await this.appService.addTest(params);
    this.isLoading = false;
    await this.router.navigate(['/scenario', this.app, this.test?.id, 'show']);
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
