import { delay, takeUntil } from 'rxjs/operators';
import { BehaviorSubject, Subject } from 'rxjs';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { VariablesService } from '@parts/services/variables.service';

@Component({
  selector: 'app-deeplink',
  templateUrl: './deeplink.component.html',
  styleUrls: ['./deeplink.component.scss'],
})
export class DeeplinkComponent implements OnInit, OnDestroy {
  deeplink$ = new BehaviorSubject<string | null>(null);

  private destroy$ = new Subject<void>();

  constructor(public variablesService: VariablesService) {}

  ngOnInit(): void {
    this.variablesService.deeplink$
      .pipe(delay(200), takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.deeplink$.next(data);
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
