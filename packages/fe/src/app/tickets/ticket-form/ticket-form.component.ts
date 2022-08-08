import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { filter, map } from 'rxjs/operators';

import { AppService } from '../../shared/app.service';
import { CommentItem, TicketItem } from '../../shared/models';

@Component({
  selector: 'thebetabase-ticket-form',
  templateUrl: './ticket-form.component.html',
  styleUrls: ['./ticket-form.component.scss'],
  host: { '[class.page]': 'true' },
})
export class TicketFormComponent implements OnInit {
  ticket: TicketItem | null = null;
  comments: CommentItem[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private appService: AppService,
  ) {}

  ngOnInit(): void {
    this.activatedRoute.params
      .pipe(
        filter((params: Params) => 'id' in params),
        map(({ id }) => id),
      )
      .subscribe(async (id: string) => await this.getTicketData(id));
  }

  private async getTicketData(id: string): Promise<void> {
    // todo add loader
    this.ticket = await this.appService.getZendeskTicket(id);
    console.log(this.ticket);
    this.comments = await this.appService.getZendeskTicketComments(id);
    console.log(this.comments);
  }
}
