import { Pipe, PipeTransform, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { I18nService } from '../../services/i18n.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Pipe({
  name: 'translate',
  pure: false, // Impure pipe to detect locale changes
  standalone: true
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private destroy$ = new Subject<void>();
  private lastValue: string | null = null;
  private lastKey: string | null = null;
  private lastParams: any = null;

  constructor(
    private i18nService: I18nService,
    private cdr: ChangeDetectorRef
  ) {
    // Subscribe to locale changes to update the pipe
    this.i18nService.currentLocale$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Force change detection when locale changes
        this.cdr.markForCheck();
      });
    
    // Check for initialization and force update when ready
    const checkInitialization = () => {
      if (this.i18nService.isInitialized()) {
        this.lastValue = null; // Force re-evaluation
        this.cdr.markForCheck();
      } else {
        setTimeout(checkInitialization, 50); // Check again in 50ms
      }
    };
    
    checkInitialization();
  }

  transform(key: string, params?: { [key: string]: any }): string {
    // Check if we can return cached value
    if (this.lastKey === key && JSON.stringify(this.lastParams) === JSON.stringify(params)) {
      return this.lastValue || key;
    }

    this.lastKey = key;
    this.lastParams = params;
    this.lastValue = this.i18nService.translate(key, params);
    
    return this.lastValue || key;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
