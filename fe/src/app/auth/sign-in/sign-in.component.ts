import { Component, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['../auth.component.scss'],
})
export class SignInComponent {
  @ViewChild('username') username: ElementRef<HTMLInputElement> | undefined;
  @ViewChild('password') password: ElementRef<HTMLInputElement> | undefined;
  @ViewChild('rect') rect: ElementRef | undefined;

  constructor(private router: Router) {
    setTimeout(() => this.password?.nativeElement.focus(), 500);
    setTimeout(() => this.username?.nativeElement.focus(), 1500);
  }

  handle1(): void {
    this.rect?.nativeElement.setAttribute('class', 'rect2');
  }

  handle2(): void {
    this.rect?.nativeElement.setAttribute('class', 'rect1');
  }

  onSignInClick(): void {
    this.router.navigate(['/dashboard']);
  }

  onHelpClick(): void {}
}
