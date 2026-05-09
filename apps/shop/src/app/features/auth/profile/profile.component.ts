import {
  Component,
  OnInit,
  OnDestroy,
} from '@angular/core';
import {
  CommonModule,
} from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../services/auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
  ],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export class ProfileComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isLoading = false;
  errorMessage = '';
  profile: any = null;
  isEditing = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.getProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.profile = response.data;
          } else {
            this.errorMessage = response.message || 'Failed to load profile';
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = error.message || 'Failed to load profile';
          this.isLoading = false;
        },
      });
  }

  onEdit(): void {
    this.isEditing = !this.isEditing;
  }

  onSave(): void {
    if (!this.profile) return;

    this.isEditing = true;
    const updateData = {
      firstName: this.profile.user.firstName,
      lastName: this.profile.user.lastName,
      dateOfBirth: this.profile.user.dateOfBirth,
      preferences: {
        emailNotifications: this.profile.preferences.emailNotifications,
        smsNotifications: this.profile.preferences.smsNotifications,
        preferredLanguage: this.profile.preferences.preferredLanguage,
        currency: this.profile.preferences.currency,
      },
    };

    this.authService.updateProfile(updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.profile = response.data;
            this.isEditing = false;
          } else {
            this.errorMessage = response.message || 'Failed to update profile';
          }
        },
        error: (error) => {
          this.errorMessage = error.message || 'Failed to update profile';
          this.isEditing = false;
        },
      });
  }

  onCancel(): void {
    this.isEditing = false;
  }

  onLogout(): void {
    this.authService.logout();
  }

  get initials(): string {
    if (!this.profile?.user) return '';
    const { firstName, lastName } = this.profile.user;
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }

  get fullName(): string {
    if (!this.profile?.user) return '';
    const { firstName, lastName } = this.profile.user;
    return `${firstName || ''} ${lastName || ''}`.trim();
  }

  get verificationStatus(): { label: string; class: string } {
    if (!this.profile?.user) return { label: 'Unknown', class: 'unknown' };
    
    const { isEmailVerified, isPhoneVerified, isKycCompleted } = this.profile.user;
    
    if (isKycCompleted) {
      return { label: 'Verified', class: 'verified' };
    } else if (isEmailVerified && isPhoneVerified) {
      return { label: 'Partially Verified', class: 'partial' };
    } else {
      return { label: 'Not Verified', class: 'unverified' };
    }
  }

  onFieldChange(fieldName: string, event: any): void {
    // This will be used for form inputs when editing
    console.log(`Profile field ${fieldName} changed:`, event.target.value);
  }

  onPreferenceChange(preferenceName: string, event: any): void {
    // This will be used for preference changes
    console.log(`Preference ${preferenceName} changed:`, event.target.checked);
  }
}
