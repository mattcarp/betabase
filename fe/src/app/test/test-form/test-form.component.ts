import { Component } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { filter, pluck, tap } from 'rxjs/operators';

import { AppService } from '../../shared/app.service';
import { ScenarioItem, TestItem } from '../../shared/models';

@Component({
  selector: 'app-test-form',
  templateUrl: './test-form.component.html',
  styleUrls: ['./test-form.component.scss'],
})
export class TestFormComponent {
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
    toolbarHiddenButtons: [
      ['bold'],
    ],
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
        tag: 'h1',
      },
    ],
  };
  browserNameOptions = ['Internet Explorer', 'Firefox', 'Chrome', 'Safari', 'Android Browser'];
  browserVersionOptions = [...Array(81).keys()].slice(3);
  osNameOptions = ['Windows', 'Mac OS', 'iOS', 'Android', 'Linux (Ubuntu)'];
  passFailOptions = ['Pending', 'Pass', 'Fail'];
  inProdOptions = ['Yes', 'No', 'Unsure'];

  constructor(
    private appService: AppService,
    private activatedRoute: ActivatedRoute,
  ) {
    activatedRoute.params
      .pipe(
        tap(() => this.test = {}),
        filter((params: Params) => 'scenarioId' in params),
        pluck('scenarioId'),
      )
      .subscribe((scenarioId: string) => this.fetchData(scenarioId));
  }

  get isCreateTestBtnDisabled(): boolean {
    return !this.test?.browserName?.length || !this.test.browserMinor?.length
      || !this.test.browserMajor?.length || !this.test.osName?.length
      || !this.test.osMinor?.length || !this.test.osMajor?.length || !this.test.passFail?.length
  }

  async onCreateTestClick(): Promise<void> {
    const params = { ...this.test, scenarioId: this.scenario?.id }
    await this.appService.addTest(params);
  }

  private async fetchData(id: string): Promise<void> {
    this.isLoading = true;
    const { scenario } = await this.appService.getScenario(id);
    this.scenario = scenario;
    this.isLoading = false;
  }
}
