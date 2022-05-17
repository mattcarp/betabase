import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Editor, Toolbar } from 'ngx-editor';
import { filter, pluck, tap } from 'rxjs/operators';

import { RoundItem } from '../../shared/models';
import { AppService } from '../../shared/app.service';
import { DialogWarningComponent } from '../../shared/layout/dialog-warning/dialog-warning.component';

@Component({
  selector: 'app-round-form',
  templateUrl: './round-form.component.html',
  styleUrls: ['./round-form.component.scss'],
  host: { '[class.page]': 'true' },
})
export class RoundFormComponent implements OnDestroy {
  round: RoundItem | null = null;
  isLoading = false;
  notesEditor: Editor;
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
    private dialog: MatDialog,
  ) {
    activatedRoute.params
      .pipe(
        tap((params: Params) => this.round = { app: params['app'] }),
        filter((params: Params) => 'id' in params),
        pluck('id'),
      )
      .subscribe((id: string) => this.fetchData(id));

    this.notesEditor = new Editor();
  }

  ngOnDestroy(): void {
    this.notesEditor?.destroy();
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
    const id = this.round?.id
      ? await this.appService.updateRound(this.round)
      : await this.appService.addRound(this.round);
    await this.router.navigate(['/round', this.round?.app, id, 'show']);
  }

  async onDeleteClick(): Promise<void> {
    this.dialog.open(DialogWarningComponent, {
      data: 'delete',
      width: '500px',
      autoFocus: false,
    }).afterClosed()
      .pipe(filter((remove: boolean) => remove))
      .subscribe(async () => {
        await this.appService.deleteRound(this.round?.id);
        await this.router.navigate(['/round', this.round?.app]);
      });
  }

  private async fetchData(id: string): Promise<void> {
    this.isLoading = true;
    this.round = await this.appService.getRound(id);
    this.isLoading = false;
  }
}
