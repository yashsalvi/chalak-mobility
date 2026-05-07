import { Component, HostListener, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-scroll-to-top',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './scroll-to-top.html',
  styleUrl: './scroll-to-top.css',
})
export class ScrollToTop implements OnInit {
  isVisible = false;
  isBrowser = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (this.isBrowser) {
      this.isVisible = window.scrollY > 300;
    }
  }

  scrollToTop() {
    if (this.isBrowser) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.isVisible = window.scrollY > 300;
    }
  }
}
