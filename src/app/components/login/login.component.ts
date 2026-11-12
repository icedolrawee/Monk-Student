import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginResponse } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  isLoading = false;
  showPassword = false;
  errorMessage = '';
  successMessage = '';

  constructor() {
    this.errorMessage = this.authService.consumeSessionExpiredMessage() ?? '';
  }

  readonly loginForm = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', Validators.required]
  });

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.isLoading) {
      return;
    }

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const { username, password } = this.loginForm.getRawValue();

    this.authService.login({
      email: username.trim(),
      password
    }).subscribe({
      next: (response: LoginResponse) => {
        this.isLoading = false;

        if (this.isLoginSuccessful(response)) {
          this.authService.saveToken(response);
          this.authService.saveEmail(username.trim());

          // Confirm the issued JWT with the backend before opening protected pages.
          this.authService.verifyToken().subscribe({
            next: (verification) => {
              if (verification.success && verification.valid) {
                void this.router.navigateByUrl('/student-record');
                return;
              }
              this.authService.clearAuthentication();
              this.errorMessage = 'ตรวจสอบ Token ไม่ผ่าน กรุณาเข้าสู่ระบบใหม่';
            },
            error: () => {
              this.authService.clearAuthentication();
              this.errorMessage = 'ไม่สามารถตรวจสอบ Token กับ Backend ได้ กรุณาตรวจสอบ Backend แล้วลองใหม่';
            }
          });
          return;
        }

        this.errorMessage = this.getLoginResponseError(response);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.errorMessage = this.getUserFriendlyError(error);
      }
    });
  }

  private isLoginSuccessful(response: LoginResponse): boolean {
    return response.success === true && this.authService.hasLoginToken(response);
  }

  private getLoginResponseError(response: LoginResponse): string {
    const message = typeof response.message === 'string' ? response.message.toLowerCase() : '';

    if (message.includes('e-mail or password invalid') || message.includes('invalid credentials')) {
      return 'Email/Username หรือ Password ไม่ถูกต้อง กรุณาตรวจสอบข้อมูลอีกครั้ง';
    }

    if (message.includes('unable to connect to authen365') || message.includes('authen365')) {
      return 'ไม่สามารถเชื่อมต่อระบบยืนยันตัวตน Authen365 ได้ กรุณาลองใหม่ภายหลัง';
    }

    if (message.includes('does not have permission') || message.includes('ไม่มีสิทธิ์')) {
      return 'บัญชีนี้ยังไม่มีสิทธิ์เข้าใช้งานระบบเจ้าหน้าที่ กรุณาตรวจสอบ Email และ ROLE = ST ใน MONK_USER_LOGIN';
    }

    if (message.includes('unauthorized access')) {
      return 'กรุณากรอก Email/Username และ Password ให้ครบถ้วน';
    }

    if (message.includes('ระบบยืนยันตัวตนยังไม่ได้ตั้งค่า') || message.includes('token_secret')) {
      return 'ระบบยังไม่ได้ตั้งค่าความปลอดภัยสำหรับ Token กรุณาให้ผู้ดูแลระบบตั้งค่า TOKEN_SECRET ใน backend/.env แล้วเริ่ม Backend ใหม่';
    }

    if (message.includes('เกิดข้อผิดพลาดในการเข้าสู่ระบบ')) {
      return 'Backend พบข้อผิดพลาดระหว่างเข้าสู่ระบบ กรุณาตรวจสอบ Backend Log เพื่อระบุสาเหตุ';
    }

    return typeof response.message === 'string' && response.message.trim()
      ? `เข้าสู่ระบบไม่สำเร็จ: ${response.message}`
      : 'เข้าสู่ระบบไม่สำเร็จ: Backend ไม่ได้ส่งรายละเอียดสาเหตุกลับมา';
  }

  private getUserFriendlyError(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'ไม่สามารถเชื่อมต่อระบบ Login ได้ กรุณาตรวจสอบว่า Backend กำลังทำงานอยู่';
    }

    if (error.status === 400) {
      return 'ข้อมูลเข้าสู่ระบบไม่ถูกต้อง กรุณาตรวจสอบข้อมูลอีกครั้ง';
    }

    if (error.status === 401) {
      return 'Email/Username หรือ Password ไม่ถูกต้อง หรือบัญชีไม่มีสิทธิ์เข้าใช้งานระบบเจ้าหน้าที่';
    }

    if (error.status === 403) {
      return 'บัญชีนี้ไม่มีสิทธิ์เข้าใช้งานระบบเจ้าหน้าที่';
    }

    return 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง';
  }
}
