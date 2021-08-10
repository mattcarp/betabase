import { Component } from '@angular/core';

@Component({
  selector: 'app-test-details',
  templateUrl: './test-details.component.html',
  styleUrls: ['./test-details.component.scss'],
  host: { '[class.page]': 'true' },
})
export class TestDetailsComponent {}
