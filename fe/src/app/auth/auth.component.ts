import { Component } from '@angular/core';

@Component({
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
})
export class AuthComponent {
  get isAgreeTerms(): boolean {
    return !!localStorage.getItem('[BB]-SonyMusicTerms');
  }
}
