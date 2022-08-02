import { Component, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { SupportConstants } from './support.constant';
import { AppService } from '../shared/app.service';
import { DialogWarningComponent } from '../shared/layout/dialog-warning/dialog-warning.component';

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss'],
  host: { '[class.page]': 'true' },
})
export class SupportComponent implements OnDestroy {
  isSetupConference = false;
  isSendEmail = false;
  selectedContacts: { email: string; name: string; phone: string; isChecked: boolean }[] = [];
  contacts = SupportConstants.contacts;
  emailSubject = '';

  constructor(private appService: AppService, private dialog: MatDialog) {}

  ngOnDestroy(): void {
    this.selectedContacts = [];
    this.contacts.forEach(({ isChecked }) => isChecked = false);
  }

  onSetupConferenceClick(): void {
    this.isSetupConference = !this.isSetupConference;
  }

  onChangeContact(isChecked: boolean, id: number): void {
    this.contacts[id].isChecked = isChecked;
    this.selectedContacts = this.contacts.filter((item: any) => item.isChecked);
  }

  onChangeSendEmail(isChecked: boolean): void {
    this.isSendEmail = isChecked;
  }

  async onSendSmsClick(message: string): Promise<void> {
    let data = '';
    const telNumbers = this.selectedContacts
      .filter((item) => !!item?.phone?.length)
      .map(({ phone }) => phone);
    const resultSms = await this.appService.sendSms({ telNumbers, message });
    if (resultSms?.length) {
      data = resultSms;
    }
    if (this.isSendEmail) {
      const emails = this.selectedContacts
        .filter((item) => !!item?.email?.length)
        .map(({ email }) => email);
      const resultEmail = await this.appService.sendEmail({ emails, message, subject: this.emailSubject });
      if (resultEmail?.length) {
        data += '/n' + resultEmail;
      }
    }
    if (!data?.length) {
      data = `Message${telNumbers?.length > 1 || this.isSendEmail ? 's have' : ' has'} been sent`;
    }
    this.dialog.open(DialogWarningComponent, {
      data,
      width: '250px',
      autoFocus: false,
    });
  }
}
