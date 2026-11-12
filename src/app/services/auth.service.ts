import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success?: boolean;
  message?: string;
  token?: string;
  accessToken?: string;
  access_token?: string;
  results?: { token?: string; accessToken?: string; access_token?: string; EMAIL?: string; mail?: string; ROLE?: string };
  data?: { token?: string; accessToken?: string; access_token?: string; results?: { token?: string; access_token?: string; mail?: string; ROLE?: string } };
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly loginUrl = 'http://localhost:4000/api/service/login';
  private readonly verifyTokenUrl = 'http://localhost:4000/api/service/verifytoken';
  private readonly tokenStorageKey = 'auth_token';
  private readonly emailStorageKey = 'auth_email';
  private readonly sessionExpiredMessageKey = 'auth_session_expired';
  private expiryTimer: ReturnType<typeof setTimeout> | null = null;
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.loginUrl, credentials);
  }

  verifyToken(): Observable<{ success: boolean; valid: boolean; user?: { email: string; role: string }; message?: string }> {
    const token = this.getToken();
    let headers = new HttpHeaders();
    if (token) headers = headers.set('Authorization', 'Bearer ' + token);
    return this.http.get<{ success: boolean; valid: boolean; user?: { email: string; role: string }; message?: string }>(
      this.verifyTokenUrl,
      { headers }
    );
  }

  private extractToken(response: LoginResponse): string | null {
    const nestedResults = response.results && typeof response.results === 'object' ? response.results : undefined;
    const nestedData = response.data && typeof response.data === 'object' ? response.data : undefined;
    const nestedDataResults = nestedData?.results && typeof nestedData.results === 'object' ? nestedData.results : undefined;
    const token = response.token ?? response.accessToken ?? response.access_token
      ?? nestedResults?.token ?? nestedResults?.accessToken ?? nestedResults?.access_token
      ?? nestedData?.token ?? nestedData?.accessToken ?? nestedData?.access_token
      ?? nestedDataResults?.token ?? nestedDataResults?.access_token;
    return typeof token === 'string' && token.trim() ? token.trim() : null;
  }

  saveToken(response: LoginResponse): void {
    const token = this.extractToken(response);
    if (!token) return;
    sessionStorage.setItem(this.tokenStorageKey, token);
    this.startExpiryTimer();
  }

  hasLoginToken(response: LoginResponse): boolean {
    return this.extractToken(response) !== null;
  }

  getResponseEmail(response: LoginResponse): string | null {
    const candidates = [response['EMAIL'], response['email'], response['mail'], response.results?.EMAIL, response.results?.mail, response.data?.results?.mail];
    const email = candidates.find((value): value is string => typeof value === 'string' && value.includes('@'));
    return email?.trim() || null;
  }

  saveEmail(email: string): void {
    sessionStorage.setItem(this.emailStorageKey, email.trim());
  }

  getEmail(): string | null {
    return sessionStorage.getItem(this.emailStorageKey);
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.tokenStorageKey);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    const expiryTime = this.getTokenExpiryTime(token);
    if (expiryTime === null || expiryTime <= Date.now()) {
      this.logout(true);
      return false;
    }
    this.startExpiryTimer();
    return true;
  }

  startExpiryTimer(): void {
    this.clearExpiryTimer();
    if (typeof window === 'undefined') return;
    const token = this.getToken();
    if (!token) return;
    const expiryTime = this.getTokenExpiryTime(token);
    if (expiryTime === null || expiryTime <= Date.now()) {
      this.logout(true);
      return;
    }
    this.expiryTimer = setTimeout(() => this.logout(true), expiryTime - Date.now());
  }

  private getTokenExpiryTime(token: string): number | null {
    try {
      const payloadPart = token.split('.')[1];
      if (!payloadPart) return null;
      const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(normalized)) as { exp?: unknown };
      return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  logout(sessionExpired = false): void {
    this.clearExpiryTimer();
    this.clearAuthentication();
    if (sessionExpired && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(this.sessionExpiredMessageKey, 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
    }
    void this.router.navigate(['/login']);
  }

  consumeSessionExpiredMessage(): string | null {
    if (typeof sessionStorage === 'undefined') return null;
    const message = sessionStorage.getItem(this.sessionExpiredMessageKey);
    sessionStorage.removeItem(this.sessionExpiredMessageKey);
    return message;
  }

  clearAuthentication(): void {
    this.clearExpiryTimer();
    sessionStorage.removeItem(this.tokenStorageKey);
    sessionStorage.removeItem(this.emailStorageKey);
  }

  private clearExpiryTimer(): void {
    if (this.expiryTimer !== null) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
  }
}
