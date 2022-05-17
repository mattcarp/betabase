import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { KeycloakService } from 'keycloak-angular';
import { filter, pluck, tap } from 'rxjs/operators';
import { Editor, Toolbar } from 'ngx-editor';

import { ScenarioItem } from '../../shared/models';
import { AppService } from '../../shared/app.service';
import { DialogWarningComponent } from '../../shared/layout/dialog-warning/dialog-warning.component';

@Component({
  selector: 'app-scenario-form',
  templateUrl: './scenario-form.component.html',
  styleUrls: ['./scenario-form.component.scss'],
  host: { '[class.page]': 'true' },
})
export class ScenarioFormComponent implements OnDestroy {
  app: string | undefined;
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
  preconditionsEditor: Editor;
  scriptEditor: Editor;
  expectedResultEditor: Editor;
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

  constructor(
    private appService: AppService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private keycloakService: KeycloakService,
    private dialog: MatDialog,
  ) {
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

    this.preconditionsEditor = new Editor();
    this.scriptEditor = new Editor();
    this.expectedResultEditor = new Editor();
  }

  get saveBtnLabel(): string {
    return this.id ? 'Save Edits' : 'Save this Case';
  }

  get isAdmin(): boolean {
    return this.keycloakService.isUserInRole('admin');
  }

  ngOnDestroy(): void {
    this.preconditionsEditor?.destroy();
    this.scriptEditor?.destroy();
    this.expectedResultEditor?.destroy();
  }

  async onSaveClick(): Promise<void> {
    const id = this.id
      ? await this.appService.updateScenario(<ScenarioItem>this.scenario)
      : await this.appService.addScenario(<ScenarioItem>this.scenario);
    await this.router.navigate(['/scenario', this.app, id, 'show']);
  }

  onCheckboxChange(value: boolean, key: 'reviewFlag' | 'clientPriority' | 'isSecurity'): void {
    if (this.scenario) {
      this.scenario[key] = value ? 1 : 0;
    }
  }

  async onDeleteClick(): Promise<void> {
    this.dialog.open(DialogWarningComponent, {
      data: 'delete',
      width: '500px',
      autoFocus: false,
    }).afterClosed()
      .pipe(filter((remove: boolean) => remove))
      .subscribe(async () => {
        await this.appService.deleteScenario(this.scenario?.id);
        await this.router.navigate([`/dashboard/${this.app}/show`]);
      });
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
