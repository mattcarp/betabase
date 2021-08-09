import { Component } from '@angular/core';

@Component({
  selector: 'app-test-list',
  templateUrl: './test-list.component.html',
  styleUrls: ['./test-list.component.scss'],
  host: { '[class.page]': 'true' },
})
export class TestListComponent {}
