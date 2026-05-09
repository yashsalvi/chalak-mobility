import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { VehicleSearch } from '../vehicle-search/vehicle-search';
import { RecentBookings } from '../recent-bookings/recent-bookings';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule, VehicleSearch, RecentBookings, LanguageSwitcherComponent, TranslatePipe],
  standalone: true,
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  isProfileOpen = false;
  showRecentBookingsPanel = false;

  toggleProfile() {
    this.isProfileOpen = !this.isProfileOpen;
  }

  editProfile() {
    // TODO: wire this to a real profile page later.
  }

  openSettings() {
    // TODO: wire this to a real settings page later.
  }

  openRecentBookingsPanel() {
    this.isProfileOpen = false;
    this.showRecentBookingsPanel = true;
  }

  closeRecentBookingsPanel() {
    this.showRecentBookingsPanel = false;
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event) {
    this.closeRecentBookingsPanel();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-dropdown') && !target.closest('.recent-bookings-panel-content')) {
      this.isProfileOpen = false;
    }
  }
}
