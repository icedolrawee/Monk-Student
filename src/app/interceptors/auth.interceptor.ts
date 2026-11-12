import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

const TOKEN_STORAGE_KEY = 'auth_token';
const LOGIN_URL = '/api/service/login';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  // Login failures must not trigger an authenticated-session logout.
  if (request.url.includes(LOGIN_URL)) {
    return next(request);
  }

  const authService = inject(AuthService);
  if (typeof sessionStorage === 'undefined') {
    return next(request);
  }

  const token = sessionStorage.getItem(TOKEN_STORAGE_KEY);
  const authenticatedRequest = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && token) {
        authService.logout(true);
      }
      return throwError(() => error);
    })
  );
};
