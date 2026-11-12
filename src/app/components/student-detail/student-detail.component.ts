import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Registration, Student, StudentRegistrationService } from '../../services/student-registration.service';
import { UserProfileComponent } from '../shared/user-profile/user-profile.component';

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, UserProfileComponent],
  templateUrl: './student-detail.component.html',
  styleUrl: './student-detail.component.css'
})
export class StudentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly service = inject(StudentRegistrationService);

  studentId = '';
  student: Student | null = null;
  registration: Registration[] = [];
  selectedYear = '';
  selectedSemester = '';
  isLoading = true;
  errorMessage = '';

  get availableYears(): string[] {
    return [...new Set(this.registration.map((item) => String(item.YEAR)))].sort((a, b) => b.localeCompare(a));
  }

  get availableSemesters(): string[] {
    const items = this.selectedYear
      ? this.registration.filter((item) => String(item.YEAR) === this.selectedYear)
      : this.registration;
    return [...new Set(items.map((item) => String(item.SEMESTER)))].sort((a, b) => a.localeCompare(b));
  }

  get filteredRegistration(): Registration[] {
    return this.registration.filter((item) =>
      (!this.selectedYear || String(item.YEAR) === this.selectedYear) &&
      (!this.selectedSemester || String(item.SEMESTER) === this.selectedSemester)
    );
  }

  onYearChange(): void {
    this.selectedSemester = '';
  }

  ngOnInit(): void {
    this.studentId = this.route.snapshot.paramMap.get('studentId') ?? '';
    const requestedYear = this.route.snapshot.queryParamMap.get('year') ?? '';
    const requestedSemester = this.route.snapshot.queryParamMap.get('semester') ?? '';
    if (!this.studentId) {
      this.isLoading = false;
      this.errorMessage = 'ไม่พบรหัสนักศึกษา';
      return;
    }
    this.service.getStudentRegistrationHistory(this.studentId).subscribe({
      next: (response) => {
        this.student = response.student;
        this.registration = response.registration ?? [];
        this.selectedYear = this.availableYears.includes(requestedYear)
          ? requestedYear
          : this.availableYears[0] ?? '';
        const semestersForRequestedYear = this.availableSemesters;
        this.selectedSemester = semestersForRequestedYear.includes(requestedSemester)
          ? requestedSemester
          : semestersForRequestedYear[0] ?? '';
        this.errorMessage = response.success ? '' : response.message || 'ไม่พบข้อมูลนักศึกษา';
        this.isLoading = false;
      },
      error: (error: { status?: number; error?: { message?: string } | string }) => {
        this.isLoading = false;
        const body = error.error;
        this.errorMessage = typeof body === 'object' && body !== null && typeof body.message === 'string'
          ? body.message
          : error.status === 401
            ? 'เซสชันหมดอายุหรือ Token ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่'
            : 'โหลดประวัติการลงทะเบียนไม่สำเร็จ กรุณาตรวจสอบ Backend และฐานข้อมูล';
      }
    });
  }

  getFullName(): string {
    if (!this.student) return '-';
    return [this.student.FIRST_NAME_THAI, this.student.MIDDLE_NAME_THAI, this.student.LAST_NAME_THAI]
      .filter((part) => typeof part === 'string' && part.trim()).join(' ') || '-';
  }

  getSemesterLabel(value: string | number): string {
    const labels: Record<string, string> = { '1': 'ภาค 1', '2': 'ภาค 2', '3': 'ภาคฤดูร้อน', '4': 'ภาคซ่อม 1', '5': 'ภาคซ่อม 2' };
    return labels[String(value)] ?? 'ภาค ' + value;
  }

  logout(): void {
    this.authService.clearAuthentication();
    void this.router.navigateByUrl('/login');
  }
}
