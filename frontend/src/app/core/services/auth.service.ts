import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse, RegisterRequest, UserRole } from '../../models/healthcare.models';

const TOKEN_KEY = 'healthcare_token';
const USER_KEY = 'healthcare_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/auth';
  private readonly currentUserSubject = new BehaviorSubject<LoginResponse | null>(this.readStoredUser());

  readonly currentUser$ = this.currentUserSubject.asObservable();


  register(payload: RegisterRequest): Observable<{ message: string; email: string; role: UserRole }> {
    return this.http.post<{ message: string; email: string; role: UserRole }>(`${this.apiUrl}/register`, payload);
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response));
        this.currentUserSubject.next(response);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSubject.next(null);
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get currentUser(): LoginResponse | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return Boolean(this.token && this.currentUser);
  }

  hasRole(roles: UserRole[] = []): boolean {
    if (!roles.length) return true;
    const role = this.currentUser?.role;
    return Boolean(role && roles.includes(role));
  }

  private readStoredUser(): LoginResponse | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as LoginResponse;
    } catch {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
  }
}
