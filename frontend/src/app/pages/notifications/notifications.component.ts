import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { HealthcareApiService } from '../../core/services/healthcare-api.service';
import { EmergencyAlert, Notification } from '../../models/healthcare.models';

type NotificationFilter = 'ALL' | 'UNREAD' | 'EMERGENCY';
type NotificationItemSource = 'notification' | 'emergency';

interface NotificationFeedItem {
  key: string;
  source: NotificationItemSource;
  notificationId?: number;
  emergencyId?: number;
  title: string;
  message: string;
  badge: string;
  type?: string;
  isRead: boolean;
  createdAt?: string;
  link: string;
  emergency?: EmergencyAlert;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page-header">
      <div>
        <p class="eyebrow">Notification center</p>
        <h1>Notifications</h1>
        <p>Appointment updates, care events and emergency alerts in one place.</p>
      </div>

      <div class="page-actions">
        <button class="ghost" type="button" (click)="reload()">Reload</button>
        <button class="secondary" type="button" [disabled]="!unreadCount()" (click)="markAllRead()">
          Mark all read
        </button>
      </div>
    </div>

    @if (error) {
      <div class="notice warning">{{ error }}</div>
    }

    @if (message) {
      <div class="notice success">{{ message }}</div>
    }

    <section class="directory-summary notification-summary-cards">
      <article>
        <span>🔔</span>
        <div>
          <strong>{{ feedItems().length }}</strong>
          <small>Total visible</small>
        </div>
      </article>
      <article>
        <span>●</span>
        <div>
          <strong>{{ unreadCount() }}</strong>
          <small>Unread</small>
        </div>
      </article>
      <article>
        <span>🚨</span>
        <div>
          <strong>{{ emergencyCount() }}</strong>
          <small>Emergency related</small>
        </div>
      </article>
    </section>

    <section class="panel app-card">
      <header class="section-heading">
        <div>
          <p class="eyebrow">Inbox</p>
          <h2>Latest notifications</h2>
        </div>
        <div class="segment-control">
          <button type="button" [class.active]="filter === 'ALL'" (click)="filter = 'ALL'">All</button>
          <button type="button" [class.active]="filter === 'UNREAD'" (click)="filter = 'UNREAD'">Unread</button>
          <button type="button" [class.active]="filter === 'EMERGENCY'" (click)="filter = 'EMERGENCY'">Emergency</button>
        </div>
      </header>

      @if (loading) {
        <div class="loading-row"><span class="spinner"></span> Loading notifications...</div>
      } @else {
        <div class="alert-feed notification-feed">
          @for (item of filteredItems(); track item.key) {
            <article
              class="alert-card notification-center-item"
              [class.unread-notification]="!item.isRead"
              [class.critical-alert]="item.emergency?.severity === 'CRITICAL'"
            >
              <div class="notification-leading">
                <span [class]="'notification-type-icon ' + itemTone(item)">{{ itemIcon(item) }}</span>
              </div>

              <div class="alert-body">
                <header>
                  <div>
                    <strong>{{ item.title }}</strong>
                    <small>{{ formatDate(item.createdAt) }}</small>
                  </div>
                  <span [class]="itemStatusClass(item)">{{ item.badge }}</span>
                </header>

                <p>{{ item.message }}</p>

                <div class="alert-meta">
                  <span>{{ item.source === 'emergency' ? 'Emergency alert' : typeLabel(item.type) }}</span>
                  @if (item.emergency) {
                    <span>{{ item.emergency.status || 'ACTIVE' }}</span>
                    <span>{{ patientName(item.emergency) }}</span>
                  }
                </div>

                <footer>
                  <a class="tiny" [routerLink]="item.link">Open</a>
                  @if (item.notificationId && !item.isRead) {
                    <button class="secondary tiny" type="button" (click)="markReadFromItem(item)">Mark read</button>
                  }
                </footer>
              </div>
            </article>
          } @empty {
            <div class="empty-state">
              <span>✓</span>
              <strong>No notifications found</strong>
              <p>{{ emptyText() }}</p>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class NotificationsComponent implements OnInit {
  readonly auth = inject(AuthService);

  private readonly api = inject(HealthcareApiService);

  notifications: Notification[] = [];
  emergencies: EmergencyAlert[] = [];
  filter: NotificationFilter = 'ALL';
  loading = false;
  error = '';
  message = '';

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    const user = this.auth.currentUser;
    this.loading = true;
    this.error = '';
    this.message = '';

    const emergenciesRequest = this.canUseEmergency() && user?.id
      ? user.role === 'PATIENT'
        ? this.api.getPatientEmergencies(user.id)
        : this.api.getActiveEmergencies()
      : of([] as EmergencyAlert[]);

    forkJoin({
      notifications: this.api.getNotifications().pipe(
        catchError(() => {
          this.error = 'Could not load notifications.';
          return of([] as Notification[]);
        }),
      ),
      emergencies: emergenciesRequest.pipe(
        catchError(() => {
          this.error = this.error || 'Could not load emergency alerts.';
          return of([] as EmergencyAlert[]);
        }),
      ),
    }).subscribe({
      next: ({ notifications, emergencies }) => {
        this.notifications = notifications ?? [];
        this.emergencies = (emergencies ?? []).filter((alert) =>
          this.auth.hasRole(['PATIENT']) || ['ACTIVE', 'IN_PROGRESS'].includes(alert.status ?? 'ACTIVE'),
        );
        this.loading = false;
      },
      error: () => {
        this.error = 'Could not load the notification center.';
        this.notifications = [];
        this.emergencies = [];
        this.loading = false;
      },
    });
  }

  markReadFromItem(item: NotificationFeedItem): void {
    if (!item.notificationId) return;
    this.markRead(item.notificationId);
  }

  markRead(id: number): void {
    this.api.markNotificationAsRead(id).subscribe({
      next: () => {
        this.notifications = this.notifications.map((notification) =>
          notification.id === id ? { ...notification, isRead: true } : notification,
        );
      },
      error: () => {
        this.error = 'Could not mark notification as read.';
      },
    });
  }

  markAllRead(): void {
    this.api.markAllNotificationsAsRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map((notification) => ({ ...notification, isRead: true }));
        this.message = 'All backend notifications were marked as read.';
      },
      error: () => {
        this.error = 'Could not mark notifications as read.';
      },
    });
  }

  filteredItems(): NotificationFeedItem[] {
    const items = this.feedItems();

    if (this.filter === 'UNREAD') {
      return items.filter((item) => !item.isRead);
    }

    if (this.filter === 'EMERGENCY') {
      return items.filter((item) => item.type === 'EMERGENCY_ALERT' || item.source === 'emergency');
    }

    return items;
  }

  feedItems(): NotificationFeedItem[] {
    const items: NotificationFeedItem[] = this.notifications.map((notification) => ({
      key: `notification-${notification.id ?? `${notification.createdAt}-${notification.title}`}`,
      source: 'notification',
      notificationId: notification.id,
      title: notification.title || 'Notification',
      message: notification.message || 'No notification details available.',
      badge: Boolean(notification.isRead) ? 'Read' : 'Unread',
      type: notification.type,
      isRead: Boolean(notification.isRead),
      createdAt: notification.createdAt,
      link: this.linkForNotification(notification),
    }));

    const notificationEmergencyIds = new Set(
      this.notifications
        .filter((notification) => this.isEmergencyNotification(notification))
        .map((notification) => notification.relatedEntityId)
        .filter((id): id is number => typeof id === 'number'),
    );

    const emergencyItems = this.emergencies
      .filter((alert) => !alert.id || !notificationEmergencyIds.has(alert.id))
      .map((alert) => this.emergencyToItem(alert));

    return [...items, ...emergencyItems].sort((a, b) => this.sortTime(b.createdAt) - this.sortTime(a.createdAt));
  }

  unreadCount(): number {
    return this.feedItems().filter((item) => !item.isRead).length;
  }

  emergencyCount(): number {
    return this.feedItems().filter((item) => item.type === 'EMERGENCY_ALERT' || item.source === 'emergency').length;
  }

  itemIcon(item: NotificationFeedItem): string {
    if (item.source === 'emergency' || item.type === 'EMERGENCY_ALERT') return '🚨';
    if (item.type?.startsWith('APPOINTMENT')) return '📅';
    if (item.type === 'PRESCRIPTION_CREATED') return 'Rx';
    if (item.type === 'LAB_RESULT_AVAILABLE') return '🧪';
    return '🔔';
  }

  itemTone(item: NotificationFeedItem): string {
    if (item.source === 'emergency' || item.type === 'EMERGENCY_ALERT') return 'danger';
    if (!item.isRead) return 'primary';
    return 'neutral';
  }

  itemStatusClass(item: NotificationFeedItem): string {
    if (item.source === 'emergency') return `status ${this.severityClass(item.emergency?.severity)}`;
    return item.isRead ? 'status reviewed' : 'status pending';
  }

  typeLabel(type?: string): string {
    if (!type) return 'General notification';
    return type.replaceAll('_', ' ').toLowerCase();
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

  patientName(alert: EmergencyAlert): string {
    const name = `${alert.patient?.firstName ?? ''} ${alert.patient?.lastName ?? ''}`.trim();
    return name || `Patient #${alert.patient?.id ?? '-'}`;
  }

  emptyText(): string {
    if (this.filter === 'UNREAD') return 'Unread backend notifications will appear here.';
    if (this.filter === 'EMERGENCY') return 'Emergency notifications and active alerts will appear here.';
    return 'New appointment, prescription, lab and emergency notifications will appear here.';
  }

  private emergencyToItem(alert: EmergencyAlert): NotificationFeedItem {
    return {
      key: `emergency-${alert.id ?? `${alert.createdAt}-${alert.description}`}`,
      source: 'emergency',
      emergencyId: alert.id,
      title: `${alert.severity || 'MEDIUM'} emergency alert`,
      message: alert.description || 'Emergency alert requires review.',
      badge: alert.severity || 'MEDIUM',
      type: 'EMERGENCY_ALERT',
      isRead: false,
      createdAt: alert.createdAt,
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

  private severityClass(severity?: string): string {
    return (severity ?? 'MEDIUM').toLowerCase();
  }

  private sortTime(value?: string): number {
    if (!value) return 0;
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  private canUseEmergency(): boolean {
    return this.auth.hasRole(['ADMIN', 'DOCTOR', 'PATIENT']);
  }
}
