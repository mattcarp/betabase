import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';

import { AppService } from '../shared/app.service';
import { DialogWarningComponent } from '../shared/layout/dialog-warning/dialog-warning.component';
import { UserItem } from '../user/user-item';

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss'],
  host: { '[class.page]': 'true' },
})
export class SupportComponent implements OnDestroy, OnInit {
  isSetupConference = false;
  isSendEmail = false;
  selectedContacts: UserItem[] = [];
  contacts: UserItem[] = [];
  emailSubject = '';

  constructor(private appService: AppService, private dialog: MatDialog) {}

  getContactName(contact: UserItem): string {
    let name = '';
    if (contact?.fName?.length) {
      name += contact?.fName;
    }
    if (contact?.lName?.length) {
      name += ` ${contact?.lName}`;
    }
    if (!name?.length) {
      name += contact?.username || contact?.usernameCanonical;
    }
    if (contact?.org?.length) {
      name += ` (${contact?.org})`;
    }
    return name;
  }

  async ngOnInit(): Promise<void> {
    const contacts = await this.appService.getUsers();
    this.contacts = contacts.filter(({ mobilePhone }) => !!mobilePhone?.length);
  }

  ngOnDestroy(): void {
    this.selectedContacts = [];
  }

  onSetupConferenceClick(): void {
    this.isSetupConference = !this.isSetupConference;
  }

  onChangeContact(isChecked: boolean, contact: UserItem): void {
    if (isChecked) {
      this.selectedContacts.push(contact);
    } else {
      this.selectedContacts = this.selectedContacts.filter(({ id }) => id !== contact?.id);
    }
  }

  onChangeSendEmail(isChecked: boolean): void {
    this.isSendEmail = isChecked;
  }

  async onSendSmsClick(message: string): Promise<void> {
    let data = '';
    const telNumbers = this.selectedContacts
      .filter((item) => !!item?.mobilePhone?.length)
      .map(({ mobilePhone }) => String(mobilePhone));
    const resultSms = await this.appService.sendSms({ telNumbers, message });
    if (resultSms?.hasOwnProperty('moreInfo')) {
      data = `Error while sending sms:\n`
        + `status: ${resultSms?.status}\n`
        + `code: ${resultSms?.code}\n`
        + `more info: ${resultSms?.moreInfo}`;
    }
    if (resultSms?.length) {
      data = resultSms;
    }
    if (this.isSendEmail) {
      const emails = this.selectedContacts
        .filter((item) => !!item?.email?.length)
        .map(({ email }) => String(email));
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
      width: '500px',
      autoFocus: false,
    });
  }
}
