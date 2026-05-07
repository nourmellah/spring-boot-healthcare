import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="auth-page">
      <section class="auth-card">
        <div class="auth-copy">
          <div class="brand-mark large">+</div>
          <p class="eyebrow">Healthcare Management</p>
          <h1>Secure hospital dashboard</h1>
          <p>
            Start with the default bootstrap admin, then manage patients, doctors,
            appointments, prescriptions, lab results, vital signs and emergencies.
          </p>
          <div class="hint-box">
            <strong>Default admin</strong>
            <span>admin@hospital.com / Admin&#64;123456</span>
          </div>
        </div>

        <form class="panel form-panel" [formGroup]="form" (ngSubmit)="submit()">
          <h2>Sign in</h2>
          <label>
            Email
            <input type="email" formControlName="email" placeholder="admin@hospital.com" />
          </label>
          <label>
            Password
            <input type="password" formControlName="password" placeholder="Admin@123456" />
          </label>

          @if (error) {
            <p class="error">{{ error }}</p>
          }

          <button class="primary full" type="submit" [disabled]="form.invalid || loading">
            {{ loading ? 'Signing in...' : 'Login' }}
          </button>
        </form>
      </section>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  loading = false;
  error = '';

  readonly form = this.fb.nonNullable.group({
    email: ['admin@hospital.com', [Validators.required, Validators.email]],
    password: ['Admin@123456', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/app/dashboard']),
      error: (error) => {
        this.error = error.error?.message || error.error?.error || 'Login failed. Check backend and credentials.';
        this.loading = false;
      },
    });
  }
}
