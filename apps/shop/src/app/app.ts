import { Component, ChangeDetectionStrategy } from '@angular/core';

// Layout
import { Header } from './layout/header/header';
import { Footer } from './layout/footer/footer';
import { ScrollToTop } from './layout/scroll-to-top/scroll-to-top';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    Header,
    Footer,
    ScrollToTop,
    RouterModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}