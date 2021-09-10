import { Component } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { filter, pluck, tap } from 'rxjs/operators';

import { RoundItem } from '../../shared/models';
import { AppService } from '../../shared/app.service';

@Component({
  selector: 'app-round-form',
  templateUrl: './round-form.component.html',
  styleUrls: ['./round-form.component.scss'],
})
export class RoundFormComponent {
  round: RoundItem | null = null;
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

  constructor(private appService: AppService, private activatedRoute: ActivatedRoute, private router: Router) {
    activatedRoute.params
      .pipe(
        tap(() => this.round = {}),
        filter((params: Params) => 'id' in params),
        pluck('id'),
      )
      .subscribe((id: string) => this.fetchData(id));
  }

  onCheckboxChange(value: boolean): void {
    if (this.round) {
      this.round.currentFlag = value ? 1 : 0;
    }
  }

  onDateChange(propName: string, { value = new Date() }): void {
    if (this.round) {
      this.round = { ...this.round, [propName]: new Date(new Date(value).setSeconds(0)) };
    }
  }

  async onSaveClick(): Promise<void> {
    if (!this.round) { return; }
    const { id } = this.round?.id
      ? await this.appService.updateRound(this.round)
      : await this.appService.addRound(this.round);
    await this.router.navigate(['/round', this.round?.app, id, 'show']);
  }

  async onDeleteClick(): Promise<void> {
    await this.appService.deleteRound(this.round?.id);
    await this.router.navigate(['/round', this.round?.app]);
  }

  private async fetchData(id: string): Promise<void> {
    this.isLoading = true;
    this.round = await this.appService.getRound(id);
    this.isLoading = false;
  }
}
