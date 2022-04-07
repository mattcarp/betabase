import { Component } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { filter, pluck, tap } from 'rxjs/operators';

import { ScenarioItem } from '../../shared/models';
import { AppService } from '../../shared/app.service';

@Component({
  selector: 'app-scenario-form',
  templateUrl: './scenario-form.component.html',
  styleUrls: ['./scenario-form.component.scss'],
  host: { '[class.page]': 'true' },
})
export class ScenarioFormComponent {
  app: string | null = null;
  id: string | null = null;
  scenario: ScenarioItem | null = null;
  isLoading = false;
  coverageOptions = [
    'New Enhancements',
    'Regression - Current Round',
    'Regression',
    'In Development',
    'Archived',
    'Bug Fixes',
  ];
  modeOptions = ['Manual', 'Automated'];
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

  constructor(private appService: AppService, private activatedRoute: ActivatedRoute) {
    activatedRoute.params
      .pipe(
        tap(({ app }) => {
          this.app = app;
          this.setEmptyValues();
        }),
        filter((params: Params) => 'id' in params),
        pluck('id'),
      )
      .subscribe((id: string) => this.fetchData(id));
  }

  get saveBtnLabel(): string {
    return this.id ? 'Save Edits' : 'Save this Case';
  }

  async onSaveClick(): Promise<void> {
    this.id
      ? await this.appService.updateScenario(<ScenarioItem>this.scenario)
      : await this.appService.addScenario(<ScenarioItem>this.scenario);
  }

  onCheckboxChange(value: boolean, key: 'reviewFlag' | 'clientPriority' | 'isSecurity'): void {
    if (this.scenario) {
      this.scenario[key] = value ? 1 : 0;
    }
  }

  private async fetchData(id: string): Promise<void> {
    this.id = id;
    this.isLoading = true;
    const { scenario } = await this.appService.getScenario(id);
    this.scenario = scenario;
    this.isLoading = false;
  }

  private setEmptyValues(): void {
    this.scenario = {
      name: '',
      preconditions: '',
      script: '',
      expectedResult: '',
      coverage: this.coverageOptions[0],
      isSecurity: 0,
      reviewFlag: 0,
      clientPriority: 0,
      flagReason: '',
      mode: this.modeOptions[0],
      appUnderTest: this.app || '',
    };
  }
}
