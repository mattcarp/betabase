import { Component } from '@angular/core';

import { SupportConstants } from './support.constant';

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss'],
  host: { '[class.page]': 'true' },
})
export class SupportComponent {
  isSetupConference = false;
  isSendEmail = false;
  selectedContacts: { email: string; name: string; phone: string; isChecked: boolean }[] = [];
  contacts = SupportConstants.contacts;

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
}
