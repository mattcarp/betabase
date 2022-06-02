import { Component } from '@angular/core';

@Component({
  selector: 'app-user',
  template: '<router-outlet></router-outlet>',
  host: { '[class.page]': 'true' },
})
export class UserComponent {}
