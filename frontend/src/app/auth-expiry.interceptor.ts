import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authExpiryInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);
  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && req.headers.has('Authorization')) {
        const auth = injector.get(AuthService);
        if (auth.isSessionRejected(error)) {
          auth.expireSession();
        }
      }
      return throwError(() => error);
    })
  );
};
