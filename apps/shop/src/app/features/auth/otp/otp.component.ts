import {
  Component,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService, OtpRequest, OtpVerification } from '../services/auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-otp',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
  ],
  templateUrl: './otp.html',
  styleUrls: ['./otp.css'],
})
export class OtpComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  otpForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  isSubmitting = false;
  isResending = false;
  
  identifier: string = '';
  purpose: 'login' | 'signup' | 'reset_password' = 'signup';
  otpSent = false;
  expiresIn = 0;
  attemptsRemaining = 3;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.getRouteParams();
    
    // Check if user is already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
      return;
    }
    
    // Auto-send OTP if identifier is provided
    if (this.identifier) {
      this.sendOtp();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    });

    this.otpForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.errorMessage = '';
      });
  }

  private getRouteParams(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.identifier = params['identifier'] || '';
        this.purpose = params['purpose'] || 'signup';
      });
  }

  sendOtp(): void {
    if (!this.identifier || this.isResending) {
      return;
    }

    this.isResending = true;
    this.errorMessage = '';
    this.successMessage = '';

    const otpData: OtpRequest = {
      identifier: this.identifier,
      purpose: this.purpose,
    };

    this.authService.sendOtp(otpData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.otpSent = true;
            this.expiresIn = response.otpExpiry || 300;
            this.attemptsRemaining = response.attemptsRemaining || 3;
            this.successMessage = response.message || 'OTP sent successfully';
          } else {
            this.errorMessage = response.message || 'Failed to send OTP';
          }
          this.isResending = false;
        },
        error: (error) => {
          this.errorMessage = error.message || 'Failed to send OTP';
          this.isResending = false;
        },
      });
  }

  verifyOtp(): void {
    if (this.otpForm.invalid || this.isSubmitting || !this.otpSent) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const verificationData: OtpVerification = {
      identifier: this.identifier,
      otp: this.otpForm.value.otp!,
      purpose: this.purpose,
    };

    this.authService.verifyOtp(verificationData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage = 'OTP verified successfully';
            
            // Navigate based on purpose
            setTimeout(() => {
              if (this.purpose === 'signup') {
                this.router.navigate(['/']);
              } else if (this.purpose === 'login') {
                this.router.navigate(['/']);
              } else if (this.purpose === 'reset_password') {
                this.router.navigate(['/auth/reset-password']);
              }
            }, 1000);
          } else {
            this.errorMessage = response.message || 'OTP verification failed';
            this.attemptsRemaining--;
          }
          this.isSubmitting = false;
        },
        error: (error) => {
          this.errorMessage = error.message || 'OTP verification failed';
          this.isSubmitting = false;
        },
      });
  }

  resendOtp(): void {
    this.sendOtp();
  }

  onBack(): void {
    if (this.purpose === 'signup') {
      this.router.navigate(['/auth/register']);
    } else if (this.purpose === 'login') {
      this.router.navigate(['/auth/login']);
    }
  }

  // Form getters
  get otp(): AbstractControl {
    return this.otpForm.get('otp')!;
  }

  getErrorMessage(fieldName: string): string {
    const field = this.otpForm.get(fieldName);
    if (field?.errors) {
      const errors = field.errors;
      if (errors['required']) {
        return 'OTP is required';
      }
      if (errors['pattern']) {
        return 'OTP must be 6 digits';
      }
    }
    return '';
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}
