import { AsyncPipe } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { interval, Subscription } from 'rxjs';

import { AuthService } from '../core/services/auth.service';
import { HealthcareApiService } from '../core/services/healthcare-api.service';
import { EmergencyAlert, Notification, UserRole } from '../models/healthcare.models';

interface MenuItem {
  label: string;
  patientLabel?: string;
  doctorLabel?: string;
  labLabel?: string;
  path: string;
  icon: string;
  roles?: UserRole[];
}

interface TopbarNotificationItem {
  key: string;
  source: 'notification' | 'emergency';
  notificationId?: number;
  title: string;
  subtitle: string;
  message: string;
  type?: string;
  badge: string;
  createdAt?: string;
  isRead: boolean;
  link: string;
  emergency?: EmergencyAlert;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AsyncPipe],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <a class="brand" routerLink="/app/dashboard">
          <div class="brand-mark">+</div>
          <div>
            <strong>MediCore</strong>
            <span>{{ workspaceName() }}</span>
          </div>
        </a>

        <nav class="nav" aria-label="Main navigation">
          @for (item of menu; track item.path) {
            @if (canSee(item)) {
              <a [routerLink]="item.path" routerLinkActive="active">
                <span>{{ item.icon }}</span>
                {{ labelFor(item) }}
              </a>
            }
          }
        </nav>

        @if (canUseEmergency()) {
          <div class="sidebar-card alert-sidebar-card">
            <div class="sidebar-alert-head">
              <span class="pulse-dot tiny-pulse"></span>
              <strong>{{ auth.hasRole(['PATIENT']) ? 'My alerts' : 'Live triage' }}</strong>
            </div>
            <p>{{ activeEmergencies.length }} active alert{{ activeEmergencies.length === 1 ? '' : 's' }}</p>
            <small>{{ criticalCount() }} critical · {{ highCount() }} high priority</small>
            <a routerLink="/app/emergencies">Open alert center</a>
          </div>
        }
      </aside>

      <main class="main-panel">
        <header class="topbar">
          @if (auth.currentUser$ | async; as user) {
            <div class="topbar-title">
              <strong>{{ greeting() }}, {{ user.firstName }}</strong>
              <span>{{ workspaceName() }} · {{ currentSection() }}</span>
            </div>

            <div class="topbar-actions">
              <div class="notification-wrap">
                <button
                  class="notification-button"
                  [class.has-alerts]="notificationBadgeCount()"
                  type="button"
                  (click)="toggleNotifications()"
                  aria-label="Notifications"
                >
                  <span>🔔</span>
                  @if (notificationBadgeCount()) {
                    <em>{{ notificationBadgeCount() }}</em>
                  }
                </button>

                @if (notificationsOpen) {
                  <section class="notification-popover">
                    <header>
                      <div>
                        <strong>Notifications</strong>
                        <small>Includes active emergency alerts</small>
                      </div>
                      <button class="tiny" type="button" (click)="loadNotificationData()">Reload</button>
                    </header>

                    @if (topbarItems().length) {
                      <div class="notification-summary-strip">
                        <span><b>{{ unreadNotificationCount() }}</b> unread</span>
                        <span><b>{{ emergencyNotificationCount() }}</b> emergency</span>
                        <span><b>{{ topbarItems().length }}</b> total</span>
                      </div>
                    }

                    <div class="notification-list">
                      @for (item of topbarItems().slice(0, 6); track item.key) {
                        <a class="notification-item" [routerLink]="item.link" (click)="openNotificationItem(item)">
                          <span [class]="'severity-dot ' + topbarDotClass(item)"></span>
                          <div>
                            <strong>{{ item.title }}</strong>
                            <small>{{ item.subtitle }} · {{ formatDate(item.createdAt) }}</small>
                            <p>{{ item.message }}</p>
                          </div>
                        </a>
                      } @empty {
                        <p class="empty compact">No notifications right now.</p>
                      }
                    </div>

                    <footer>
                      <a routerLink="/app/notifications" (click)="notificationsOpen = false">Open notification center →</a>
                    </footer>
                  </section>
                }
              </div>

              <div class="user-pill">
                <div class="avatar">{{ initials(user.firstName, user.lastName) }}</div>
                <div>
                  <strong>{{ user.firstName }} {{ user.lastName }}</strong>
                  <span>{{ user.role }}</span>
                </div>
              </div>

              <button class="ghost" type="button" (click)="logout()">Logout</button>
            </div>
          }
        </header>

        <section class="content">
          <router-outlet />
        </section>
      </main>
    </div>
  `,
})
export class ShellComponent implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);

  private readonly router = inject(Router);
  private readonly api = inject(HealthcareApiService);

  notificationsOpen = false;
  notifications: Notification[] = [];
  activeEmergencies: EmergencyAlert[] = [];

  private polling?: Subscription;

  readonly menu: MenuItem[] = [
    { label: 'Dashboard', path: '/app/dashboard', icon: '⌂' },
    { label: 'My profile', path: '/app/my-profile', icon: '🧍', roles: ['PATIENT'] },
    { label: 'Patients', path: '/app/patients', icon: '👥', roles: ['ADMIN', 'DOCTOR'] },
    { label: 'Doctors', path: '/app/doctors', icon: '🩺', roles: ['ADMIN', 'DOCTOR', 'PATIENT'] },
    { label: 'Specialties', path: '/app/specialties', icon: '✦', roles: ['ADMIN'] },
    {
      label: 'Appointments',
      patientLabel: 'My appointments',
      doctorLabel: 'My schedule',
      path: '/app/appointments',
      icon: '📅',
      roles: ['ADMIN', 'DOCTOR', 'PATIENT'],
    },
    {
      label: 'Prescriptions',
      patientLabel: 'My prescriptions',
      path: '/app/prescriptions',
      icon: 'Rx',
      roles: ['ADMIN', 'DOCTOR', 'PATIENT'],
    },
    {
      label: 'Lab Results',
      patientLabel: 'My results',
      labLabel: 'Result entry',
      path: '/app/lab-results',
      icon: '🧪',
      roles: ['ADMIN', 'DOCTOR', 'PATIENT', 'LAB_TECHNICIAN'],
    },
    {
      label: 'Vital Signs',
      patientLabel: 'My vitals',
      path: '/app/vital-signs',
      icon: '♡',
      roles: ['ADMIN', 'DOCTOR', 'PATIENT'],
    },
    {
      label: 'Emergencies',
      patientLabel: 'Emergency help',
      path: '/app/emergencies',
      icon: '🚨',
      roles: ['ADMIN', 'DOCTOR', 'PATIENT'],
    },
    {
      label: 'Notifications',
      path: '/app/notifications',
      icon: '🔔',
      roles: ['ADMIN', 'DOCTOR', 'PATIENT', 'LAB_TECHNICIAN'],
    },
    { label: 'Accounts', path: '/app/accounts', icon: '⚙', roles: ['ADMIN'] },
    { label: 'Audit logs', path: '/app/audit-logs', icon: '🧾', roles: ['ADMIN'] },
  ];

  ngOnInit(): void {
    this.loadNotificationData();
    this.polling = interval(20000).subscribe(() => this.loadNotificationData());
  }

  ngOnDestroy(): void {
    this.polling?.unsubscribe();
  }

  canSee(item: MenuItem): boolean {
    return this.auth.hasRole(item.roles ?? []);
  }

  canUseEmergency(): boolean {
    return this.auth.hasRole(['ADMIN', 'DOCTOR', 'PATIENT']);
  }

  labelFor(item: MenuItem): string {
    const role = this.auth.currentUser?.role;

    if (role === 'PATIENT' && item.patientLabel) return item.patientLabel;
    if (role === 'DOCTOR' && item.doctorLabel) return item.doctorLabel;
    if (role === 'LAB_TECHNICIAN' && item.labLabel) return item.labLabel;

    return item.label;
  }

  workspaceName(): string {
    const role = this.auth.currentUser?.role;

    if (role === 'ADMIN') return 'Administration workspace';
    if (role === 'DOCTOR') return 'Doctor workspace';
    if (role === 'PATIENT') return 'Patient portal';
    if (role === 'LAB_TECHNICIAN') return 'Laboratory workspace';

    return 'Healthcare platform';
  }

  initials(firstName?: string, lastName?: string): string {
    return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || 'U';
  }

  greeting(): string {
    const hour = new Date().getHours();

    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';

    return 'Good evening';
  }

  currentSection(): string {
    const match = this.menu.find((item) => this.router.url.startsWith(item.path));
    return match ? this.labelFor(match) : 'Dashboard';
  }

  toggleNotifications(): void {
    this.notificationsOpen = !this.notificationsOpen;

    if (this.notificationsOpen) {
      this.loadNotificationData();
    }
  }

  loadNotificationData(): void {
    const user = this.auth.currentUser;

    if (!user?.id) {
      this.notifications = [];
      this.activeEmergencies = [];
      return;
    }

    this.api.getNotifications().subscribe({
      next: (notifications) => {
        this.notifications = notifications ?? [];
      },
      error: () => {
        this.notifications = [];
      },
    });

    if (!this.canUseEmergency()) {
      this.activeEmergencies = [];
      return;
    }

    const request = user.role === 'PATIENT'
      ? this.api.getPatientEmergencies(user.id)
      : this.api.getActiveEmergencies();

    request.subscribe({
      next: (alerts) => {
        this.activeEmergencies = (alerts ?? []).filter((alert) =>
          ['ACTIVE', 'IN_PROGRESS'].includes(alert.status ?? 'ACTIVE'),
        );
      },
      error: () => {
        this.activeEmergencies = [];
      },
    });
  }

  topbarItems(): TopbarNotificationItem[] {
    const items: TopbarNotificationItem[] = this.notifications.map((notification) => ({
      key: `notification-${notification.id ?? `${notification.createdAt}-${notification.title}`}`,
      source: 'notification',
      notificationId: notification.id,
      title: notification.title || 'Notification',
      subtitle: this.typeLabel(notification.type),
      message: notification.message || 'No details available.',
      type: notification.type,
      badge: Boolean(notification.isRead) ? 'Read' : 'Unread',
      createdAt: notification.createdAt,
      isRead: Boolean(notification.isRead),
      link: this.linkForNotification(notification),
    }));

    const notificationEmergencyIds = new Set(
      this.notifications
        .filter((notification) => this.isEmergencyNotification(notification))
        .map((notification) => notification.relatedEntityId)
        .filter((id): id is number => typeof id === 'number'),
    );

    const emergencyItems = this.activeEmergencies
      .filter((alert) => !alert.id || !notificationEmergencyIds.has(alert.id))
      .map((alert) => this.emergencyToItem(alert));

    return [...items, ...emergencyItems].sort((a, b) => this.sortTime(b.createdAt) - this.sortTime(a.createdAt));
  }

  unreadNotificationCount(): number {
    return this.topbarItems().filter((item) => !item.isRead).length;
  }

  emergencyNotificationCount(): number {
    return this.topbarItems().filter((item) => item.type === 'EMERGENCY_ALERT' || item.source === 'emergency').length;
  }

  notificationBadgeCount(): number {
    return this.unreadNotificationCount();
  }

  openNotificationItem(item: TopbarNotificationItem): void {
    this.notificationsOpen = false;

    if (!item.notificationId || item.isRead) return;

    this.api.markNotificationAsRead(item.notificationId).subscribe({
      next: () => {
        this.notifications = this.notifications.map((notification) =>
          notification.id === item.notificationId ? { ...notification, isRead: true } : notification,
        );
      },
      error: () => undefined,
    });
  }

  topbarDotClass(item: TopbarNotificationItem): string {
    if (item.source === 'emergency' || item.type === 'EMERGENCY_ALERT') {
      return this.severityClass(item.emergency?.severity ?? 'CRITICAL');
    }

    return item.isRead ? 'low' : 'medium';
  }

  sortedEmergencies(): EmergencyAlert[] {
    const rank: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

    return [...this.activeEmergencies].sort(
      (a, b) => (rank[a.severity ?? 'MEDIUM'] ?? 2) - (rank[b.severity ?? 'MEDIUM'] ?? 2),
    );
  }

  criticalCount(): number {
    return this.activeEmergencies.filter((alert) => alert.severity === 'CRITICAL').length;
  }

  highCount(): number {
    return this.activeEmergencies.filter((alert) => alert.severity === 'HIGH').length;
  }

  severityClass(severity?: string): string {
    return (severity ?? 'MEDIUM').toLowerCase();
  }

  patientName(alert: EmergencyAlert): string {
    const name = `${alert.patient?.firstName ?? ''} ${alert.patient?.lastName ?? ''}`.trim();
    return name || `Patient #${alert.patient?.id ?? '-'}`;
  }

  formatDate(value?: string): string {
    if (!value) return 'No date';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }

  typeLabel(type?: string): string {
    if (!type) return 'General notification';
    return type.replaceAll('_', ' ').toLowerCase();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/home']);
  }

  private emergencyToItem(alert: EmergencyAlert): TopbarNotificationItem {
    return {
      key: `emergency-${alert.id ?? `${alert.createdAt}-${alert.description}`}`,
      source: 'emergency',
      title: `${alert.severity || 'MEDIUM'} emergency alert`,
      subtitle: `${alert.status || 'ACTIVE'} · ${this.patientName(alert)}`,
      message: alert.description || 'Emergency alert requires review.',
      type: 'EMERGENCY_ALERT',
      badge: alert.severity || 'MEDIUM',
      createdAt: alert.createdAt,
      isRead: false,
      link: '/app/emergencies',
      emergency: alert,
    };
  }

  private linkForNotification(notification: Notification): string {
    const entity = (notification.relatedEntity ?? '').toLowerCase();

    if (entity.includes('appointment')) return '/app/appointments';
    if (entity.includes('prescription')) return '/app/prescriptions';
    if (entity.includes('lab')) return '/app/lab-results';
    if (entity.includes('emergency')) return '/app/emergencies';

    if (notification.type?.startsWith('APPOINTMENT')) return '/app/appointments';
    if (notification.type === 'PRESCRIPTION_CREATED') return '/app/prescriptions';
    if (notification.type === 'LAB_RESULT_AVAILABLE') return '/app/lab-results';
    if (notification.type === 'EMERGENCY_ALERT') return '/app/emergencies';

    return '/app/notifications';
  }

  private isEmergencyNotification(notification: Notification): boolean {
    const entity = (notification.relatedEntity ?? '').toLowerCase();
    return notification.type === 'EMERGENCY_ALERT' || entity.includes('emergency');
  }

  private sortTime(value?: string): number {
    if (!value) return 0;
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  }
}
