import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { SelectUtilityConstants } from './select-utility.constants';

@Component({
  selector: 'app-select-utility',
  templateUrl: './select-utility.component.html',
  styleUrls: ['./select-utility.component.scss'],
})
export class SelectUtilityComponent {
  selectedItem: string;
  selectedApp = this.router.url.split('/')[2];

  private buttonsConstants = SelectUtilityConstants;

  constructor(private router: Router) {
    this.selectedItem = '';
  }

  get utilityItems(): { title: string; url: string; class?: string }[] {
    return this.buttonsConstants.utilities;
  }

  get docItems(): { title: string; url: string; class?: string }[] {
    return this.buttonsConstants.docs;
  }

  onMenuItemClick(value: string): void {
    switch (value) {
      case 'media':
        window.open('https://aomad2-webapp01-int.smcdp-aws.net/media-analysis/files-upload', '_blank');
        break;
      case 'ddp':
        window.open('https://aomad2-webapp01-int.smcdp-aws.net/media-analysis/files-upload', '_blank');
        break;
      case 'extract-frame':
        window.open('https://aomad2-webapp01-int.smcdp-aws.net/media-analysis/extract-frame', '_blank');
        break;
      case 'resources':
        this.router.navigate([`/${value}`]);
        break;
      case 'document-new':
        window.open(`https://thebetabase.com/${this.selectedApp}/report/document/new/false`, '_blank');
        break;
      case 'document-priority':
        window.open(`https://thebetabase.com/${this.selectedApp}/report/document/priority/false`, '_blank');
        break;
      case 'document-development':
        window.open(`https://thebetabase.com/${this.selectedApp}/report/document/in_development/false`, '_blank');
        break;
      case 'document-archived':
        window.open(`https://thebetabase.com/${this.selectedApp}/report/document/archived/false`, '_blank');
        break;
      default:
        break;
    }

    setTimeout(() => {
      this.selectedItem = '';
    });
  }
}
