import { Component, OnDestroy } from '@angular/core';

import { SupportConstants } from './support.constant';
import { AppService } from '../shared/app.service';

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

  constructor(private appService: AppService) {}

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
    console.log('this.selectedContacts', this.selectedContacts);
    console.log('this.message', message);
    const telNumbers = this.selectedContacts
      .filter((item) => !!item?.phone?.length)
      .map(({ phone }) => phone);
    await this.appService.sendSms({ telNumbers, message });
  }
}
