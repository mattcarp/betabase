import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldDefaultOptions } from '@angular/material/form-field';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AuthModule } from './auth/auth.module';
import { MainModule } from './shared/layout/main/main.module';
import { AuthInterceptor } from './auth/interceptors/auth.interceptor';
import { ErrorHandlerInterceptor } from './auth/interceptors/error-handler.interceptor';

const appearance: MatFormFieldDefaultOptions = {
  appearance: 'outline',
};

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatSnackBarModule,
    AppRoutingModule,
    AuthModule,
    MainModule,
  ],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: appearance,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorHandlerInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
