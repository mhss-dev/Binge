import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { NgxPageScrollCoreModule } from 'ngx-page-scroll-core';
import { AuthGuard } from './authguard.service';


export const appConfig: ApplicationConfig = {

  providers: [AuthGuard, provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes, withInMemoryScrolling({scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled'})), provideHttpClient(), provideAnimationsAsync(), BrowserAnimationsModule]
};
