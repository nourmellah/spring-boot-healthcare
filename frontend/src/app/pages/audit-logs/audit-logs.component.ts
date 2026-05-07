import { Component, inject, OnInit } from '@angular/core';

import { HealthcareApiService } from '../../core/services/healthcare-api.service';
import { AuditLog } from '../../models/healthcare.models';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  template: `
    <div class="page-header">
      <div>
        <p class="eyebrow">Traceability</p>
        <h1>Audit logs</h1>
        <p>Review important actions performed across users and medical records.</p>
      </div>

      <div class="page-actions">
        <button class="ghost" type="button" (click)="reload()">Reload</button>
      </div>
    </div>

    @if (error) {
      <div class="notice warning">{{ error }}</div>
    }

    <section class="directory-summary compact-summary">
      <article>
        <span>🧾</span>
        <div>
          <strong>{{ logs.length }}</strong>
          <small>Total events</small>
        </div>
      </article>
      <article>
        <span>＋</span>
        <div>
          <strong>{{ actionCount('CREATE') }}</strong>
          <small>Create actions</small>
        </div>
      </article>
      <article>
        <span>✎</span>
        <div>
          <strong>{{ actionCount('UPDATE') }}</strong>
          <small>Update actions</small>
        </div>
      </article>
    </section>

    <section class="panel app-card">
      <div class="toolbar">
        <div class="search-box">
          <span>⌕</span>
          <input placeholder="Search action, entity, user or details" (input)="query = $any($event.target).value" />
        </div>
        <div class="meta-text">{{ filteredLogs().length }} visible</div>
      </div>

      @if (loading) {
        <div class="loading-row"><span class="spinner"></span> Loading audit trail...</div>
      } @else {
        <div class="audit-timeline">
          @for (log of filteredLogs(); track log.id) {
            <article class="audit-event-card">
              <div class="audit-dot">{{ actionIcon(log.action) }}</div>
              <div class="audit-event-body">
                <header>
                  <div>
                    <strong>{{ log.action || 'ACTION' }} · {{ entityLabel(log) }}</strong>
                    <small>{{ formatTimestamp(log.timestamp) }}</small>
                  </div>
                  <span class="status">#{{ log.entityId || '-' }}</span>
                </header>
                <p>{{ log.details || 'No details available.' }}</p>
                <footer>
                  <span>{{ log.userRole || 'User' }} #{{ log.userId || '-' }}</span>
                  <span>{{ entityLabel(log) }}</span>
                </footer>
              </div>
            </article>
          } @empty {
            <div class="empty-state">
              <span>🧾</span>
              <strong>No audit logs found</strong>
              <p>System activity will appear here once users create or update records.</p>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class AuditLogsComponent implements OnInit {
  private readonly api = inject(HealthcareApiService);

  logs: AuditLog[] = [];
  query = '';
  loading = false;
  error = '';

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.error = '';

    this.api.getAuditLogs().subscribe({
      next: (logs) => {
        this.logs = (logs ?? []).sort((a, b) => {
          const left = new Date(a.timestamp || '').getTime() || 0;
          const right = new Date(b.timestamp || '').getTime() || 0;
          return right - left;
        });
        this.loading = false;
      },
      error: () => {
        this.error = 'Could not load audit logs.';
        this.loading = false;
      },
    });
  }

  filteredLogs(): AuditLog[] {
    const query = this.query.trim().toLowerCase();

    if (!query) return this.logs;

    return this.logs.filter((log) =>
      [log.action, log.entity, log.entityType, log.entityId, log.userId, log.userRole, log.details, log.timestamp]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }

  actionCount(action: string): number {
    return this.logs.filter((log) => log.action === action).length;
  }

  entityLabel(log: AuditLog): string {
    return log.entity || log.entityType || 'Entity';
  }

  formatTimestamp(timestamp?: string): string {
    if (!timestamp) return 'No timestamp';

    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? timestamp : date.toLocaleString();
  }

  actionIcon(action?: string): string {
    if (action === 'CREATE') return '+';
    if (action === 'UPDATE') return '✎';
    if (action === 'DELETE') return '−';
    return '•';
  }
}
