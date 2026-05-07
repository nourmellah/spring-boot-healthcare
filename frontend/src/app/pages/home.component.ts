import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="landing-page">
      <nav class="landing-nav">
        <a class="landing-brand" routerLink="/">
          <span class="brand-mark">+</span>
          <span><strong>MediCore</strong><small>Healthcare platform</small></span>
        </a>
        <div class="landing-actions">
          @if (auth.isLoggedIn) {
            <a class="ghost" routerLink="/app/dashboard">Open dashboard</a>
          } @else {
            <a class="ghost" routerLink="/login">Sign in</a>
          }
        </div>
      </nav>

      <section class="landing-hero">
        <div class="hero-copy">
          <p class="eyebrow">Hospital operations system</p>
          <h1>One workspace for patients, doctors and urgent care.</h1>
          <p>
            Manage appointments, medical records, lab results, vital signs and emergency alerts from a clean clinical dashboard.
          </p>
          <div class="hero-actions">
            <a class="primary" routerLink="/login">Access the platform</a>
            @if (auth.isLoggedIn) {
              <a class="secondary" routerLink="/app/dashboard">Go to dashboard</a>
            }
          </div>
          <div class="trust-row">
            <span>JWT secured</span>
            <span>Role based</span>
            <span>Spring Boot API</span>
          </div>
        </div>

        <div class="hero-console">
          <div class="console-header">
            <span></span><span></span><span></span>
            <strong>Live hospital view</strong>
          </div>
          <div class="pulse-card critical">
            <div><span class="pulse-dot"></span><strong>Emergency alert</strong></div>
            <small>Critical patient signal routed to care team</small>
          </div>
          <div class="mini-grid">
            <article><strong>24</strong><span>appointments</span></article>
            <article><strong>12</strong><span>active doctors</span></article>
            <article><strong>98%</strong><span>triage coverage</span></article>
            <article><strong>7</strong><span>lab updates</span></article>
          </div>
        </div>
      </section>

      <section class="landing-modules">
        <article><span>👥</span><h3>Patient records</h3><p>Profiles, contacts, blood group and medical notes.</p></article>
        <article><span>🩺</span><h3>Care team</h3><p>Doctors, specialties, schedules and consultation details.</p></article>
        <article><span>📅</span><h3>Appointments</h3><p>Book visits and move appointments through their workflow.</p></article>
        <article><span>🚨</span><h3>Emergency alerts</h3><p>Urgent alerts behave like live notifications in the app.</p></article>
      </section>
    </main>
  `,
})
export class HomeComponent {
  readonly auth = inject(AuthService);
}
