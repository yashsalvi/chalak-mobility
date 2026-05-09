import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  trigger,
  transition,
  style,
  animate,
  state,
  keyframes,
  animateChild,
  group,
  query,
  stagger,
} from '@angular/animations';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Subject, takeUntil } from 'rxjs';
import { I18nService, SupportedLocale, Locale } from '../../../services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    TranslatePipe,
  ],
  templateUrl: './language-switcher.html',
  styleUrls: ['./language-switcher.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    // Define slideDown animation
    trigger('slideDown', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0%)', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ transform: 'translateY(0%)', opacity: 1 }),
        animate('300ms ease-in', style({ transform: 'translateY(-100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class LanguageSwitcherComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  currentLocale: SupportedLocale = 'en';
  supportedLocales: Locale[] = [];
  isOpen = false;
  
  constructor(private i18nService: I18nService) {}
  
  ngOnInit(): void {
    this.supportedLocales = this.i18nService.supportedLocales;
    
    this.i18nService.currentLocale$
      .pipe(takeUntil(this.destroy$))
      .subscribe(locale => {
        this.currentLocale = locale;
      });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  get currentLocaleInfo(): Locale | undefined {
    return this.i18nService.getLocaleInfo(this.currentLocale);
  }
  
  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }
  
  closeDropdown(): void {
    this.isOpen = false;
  }
  
  async selectLocale(locale: SupportedLocale): Promise<void> {
    if (locale === this.currentLocale) {
      this.closeDropdown();
      return;
    }
    
    try {
      await this.i18nService.setLocale(locale);
      this.closeDropdown();
    } catch (error) {
      console.error('Failed to change locale:', error);
    }
  }
  
  // Close dropdown when clicking outside
  onBackdropClick(): void {
    this.closeDropdown();
  }
}
