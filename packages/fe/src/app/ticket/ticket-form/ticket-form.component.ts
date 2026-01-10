import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { filter, map } from 'rxjs/operators';

import { AppService } from '../../shared/app.service';
import { CommentItem, TicketItem, ZendeskUser } from '../../shared/models';

@Component({
  selector: 'app-ticket-form',
  templateUrl: './ticket-form.component.html',
  styleUrls: ['./ticket-form.component.scss'],
  host: { '[class.page]': 'true' },
})
export class TicketFormComponent implements OnInit {
  @Input() ticketId?: number;
  ticket: TicketItem | null = null;
  comments: CommentItem[] = [];
  isLoading = false;

  private users: ZendeskUser[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private appService: AppService,
  ) {
  }

  async ngOnInit(): Promise<void> {
    if (this.ticketId) {
      await this.getTicketData(this.ticketId.toString());
    } else {
      this.activatedRoute.params
        .pipe(
          filter((params: Params) => 'id' in params),
          map(({ id }) => id),
        )
        .subscribe(async (id: string) => await this.getTicketData(id));
    }
  }

  getUserNameById(userId: number): string {
    const user = this.users?.find(({ id }) => id === userId);
    return user?.name || '';
  }

  private async getTicketData(id: string): Promise<void> {
    this.isLoading = true;
    this.ticket = await this.appService.getZendeskTicket(id);
    this.comments = await this.appService.getZendeskTicketComments(id);
    const userIds = this.comments.map(({ authorId }) => authorId);
    if (userIds?.length) {
      this.users = await this.appService.getZendeskUsers(userIds);
    }
    this.isLoading = false;
  }
}
