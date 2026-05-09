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
import { AuthService, RegisterRequest } from '../services/auth.service';
import { Subject, takeUntil } from 'rxjs';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    TranslatePipe,
  ],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class RegisterComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  registerForm!: FormGroup;
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
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[\d\s\-\+\(\)]{10,20}$/)]],
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      dateOfBirth: ['', [Validators.required, Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)]],
      agreeToTerms: [false, Validators.requiredTrue],
      agreeToPrivacy: [false, Validators.requiredTrue],
    });

    this.registerForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.errorMessage = '';
      });
  }

  onSubmit(): void {
    if (this.registerForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const registerData: RegisterRequest = {
      email: this.registerForm.value.email!,
      phone: this.registerForm.value.phone!,
      firstName: this.registerForm.value.firstName!,
      lastName: this.registerForm.value.lastName!,
      password: this.registerForm.value.password!,
      dateOfBirth: this.registerForm.value.dateOfBirth!,
      agreeToTerms: this.registerForm.value.agreeToTerms!,
      agreeToPrivacy: this.registerForm.value.agreeToPrivacy!,
    };

    this.authService.register(registerData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.router.navigate(['/auth/otp'], {
              queryParams: {
                identifier: registerData.email,
                purpose: 'signup'
              }
            });
          } else {
            this.errorMessage = response.message || 'Registration failed';
          }
          this.isSubmitting = false;
        },
        error: (error) => {
          this.errorMessage = error.message || 'Registration failed';
          this.isSubmitting = false;
        },
      });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  // Form getters
  get email(): AbstractControl {
    return this.registerForm.get('email')!;
  }

  get phone(): AbstractControl {
    return this.registerForm.get('phone')!;
  }

  get firstName(): AbstractControl {
    return this.registerForm.get('firstName')!;
  }

  get lastName(): AbstractControl {
    return this.registerForm.get('lastName')!;
  }

  get password(): AbstractControl {
    return this.registerForm.get('password')!;
  }

  get dateOfBirth(): AbstractControl {
    return this.registerForm.get('dateOfBirth')!;
  }

  get agreeToTerms(): AbstractControl {
    return this.registerForm.get('agreeToTerms')!;
  }

  get agreeToPrivacy(): AbstractControl {
    return this.registerForm.get('agreeToPrivacy')!;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field?.valid && field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (field?.errors) {
      const errors = field.errors;
      if (errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (errors['email']) {
        return 'Please enter a valid email address';
      }
      if (errors['pattern']) {
        return 'Please enter a valid phone number';
      }
      if (errors['minlength']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${errors['minlength'].requiredLength} characters`;
      }
      if (errors['requiredTrue']) {
        return 'You must agree to continue';
      }
    }
    return '';
  }
}
