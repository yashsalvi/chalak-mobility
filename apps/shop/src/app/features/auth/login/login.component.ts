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
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService, LoginRequest } from '../services/auth.service';
import { Subject, takeUntil } from 'rxjs';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    TranslatePipe,
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  loginForm!: FormGroup;
  isLoading = false;
  showPassword = false;
  errorMessage = '';
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    
    // Check if user is already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.loginForm = this.fb.group({
      identifier: ['', [Validators.required]],
      password: ['', [Validators.required]],
      rememberMe: [false],
    });

    // Subscribe to form changes
    this.loginForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.errorMessage = '';
      });
  }

  onSubmit(): void {
    if (this.loginForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const loginData: LoginRequest = {
      identifier: this.loginForm.value.identifier!,
      password: this.loginForm.value.password!,
      rememberMe: this.loginForm.value.rememberMe || false,
    };

    this.authService.login(loginData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Navigate to home or intended page
            const redirectUrl = this.getRedirectUrl();
            this.router.navigate([redirectUrl || '/']);
          } else {
            this.errorMessage = response.message || 'Login failed';
          }
          this.isSubmitting = false;
        },
        error: (error) => {
          this.errorMessage = error.message || 'Login failed';
          this.isSubmitting = false;
        },
      });
  }

  onOtpLogin(): void {
    const identifier = this.loginForm.value.identifier;
    if (!identifier) {
      this.errorMessage = 'Please enter email or phone number';
      return;
    }

    this.router.navigate(['/auth/otp'], {
      queryParams: {
        identifier,
        purpose: 'login'
      }
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onForgotPassword(): void {
    const identifier = this.loginForm.value.identifier;
    if (identifier) {
      this.router.navigate(['/auth/reset-password'], {
        queryParams: {
          identifier
        }
      });
    }
  }

  onRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  private getRedirectUrl(): string {
    const tree = this.router.parseUrl(this.router.url);
    if (tree.queryParams['redirect']) {
      return decodeURIComponent(tree.queryParams['redirect']);
    }
    return '';
  }

  // Form getters for template access
  get identifier(): AbstractControl {
    return this.loginForm.get('identifier')!;
  }

  get password(): AbstractControl {
    return this.loginForm.get('password')!;
  }

  get rememberMe(): AbstractControl {
    return this.loginForm.get('rememberMe')!;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field?.valid && field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors) {
      const errors = field.errors;
      if (errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (errors['email']) {
        return 'Please enter a valid email address';
      }
      if (errors['minlength']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${errors['minlength'].requiredLength} characters`;
      }
    }
    return '';
  }
}
