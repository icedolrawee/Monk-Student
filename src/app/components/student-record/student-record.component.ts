import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserProfileComponent } from '../shared/user-profile/user-profile.component';
import {
  Student,
  Registration,
  AvailableTerm,
  StudentRegistrationService
} from '../../services/student-registration.service';

@Component({
  selector: 'app-student-record',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, UserProfileComponent],
  templateUrl: './student-record.component.html',
  styleUrl: './student-record.component.css'
})
export class StudentRecordComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly studentRegistrationService = inject(StudentRegistrationService);

  studentId = '';
  semester = '';
  academicYear = '';
  availableTerms: AvailableTerm[] = [];
  isLoadingTerms = true;
  termsLoadMessage = '';
  isSearching = false;
  isSaving = false;

  get availableYears(): string[] {
    return [...new Set(this.availableTerms.map((term) => term.year))];
  }

  get availableSemesters(): string[] {
    return this.availableTerms
      .filter((term) => term.year === this.academicYear)
      .map((term) => term.semester);
  }

  ngOnInit(): void {
    this.loadSystemTerms();
  }

  getSemesterLabel(semester: string): string {
    const labels: Record<string, string> = {
      '1': 'ภาค 1',
      '2': 'ภาค 2',
      '3': 'ภาคฤดูร้อน',
      '4': 'ภาคซ่อม 1',
      '5': 'ภาคซ่อม 2'
    };

    return labels[semester] ?? ('ภาค ' + semester);
  }
  showResult = false;
  saveMessage = '';
  errorMessage = '';
  student: Student | null = null;
  registration: Registration[] = [];
  registrationMessage = '';

  searchStudent(): void {
    this.errorMessage = '';
    this.saveMessage = '';
    this.registrationMessage = '';
    this.showResult = false;
    this.student = null;
    this.registration = [];
    this.academicYear = '';
    this.semester = '';

    const studentId = this.studentId.trim();
    if (!studentId) {
      this.errorMessage = 'กรุณากรอกรหัสนักศึกษา';
      return;
    }

    this.isSearching = true;
    this.studentRegistrationService
      .getStudentRegistration(studentId, '', '')
      .subscribe({
        next: (response) => {
          this.isSearching = false;
          this.student = response.student;
          this.registration = [];
          this.academicYear = '';
          this.semester = '';
          this.registrationMessage = response.student
            ? 'กรุณาเลือกปีการศึกษาและภาคการศึกษา'
            : '';
          this.errorMessage = response.student
            ? ''
            : response.message ?? 'ไม่มีรหัสนักศึกษานี้ในระบบ';

          this.showResult = !!response.student;

        },
        error: (error: { status?: number; error?: { message?: string } | string }) => {
          this.isSearching = false;
          this.errorMessage = this.getLookupErrorMessage(error);
        }
      });
  }

  private loadSystemTerms(): void {
    this.isLoadingTerms = true;
    this.termsLoadMessage = '';

    this.studentRegistrationService.getSystemTerms().subscribe({
      next: (response) => {
        this.availableTerms = response.available_terms ?? [];
        this.isLoadingTerms = false;
        this.termsLoadMessage = this.availableTerms.length === 0
          ? 'ยังไม่มีปีการศึกษาที่พร้อมให้เลือก'
          : '';
      },
      error: () => {
        this.availableTerms = [];
        this.isLoadingTerms = false;
        this.termsLoadMessage = 'โหลดรายการปีการศึกษาไม่สำเร็จ กรุณาลองโหลดหน้าเว็บใหม่';
      }
    });
  }

  onAcademicYearChange(): void {
    // Require an explicit semester selection for the newly selected year.
    this.semester = '';
    this.registration = [];
    this.registrationMessage = '';
    this.errorMessage = '';
    this.saveMessage = '';
  }

  onSemesterChange(): void {
    this.loadRegistrationForSelectedTerm();
  }

  private loadRegistrationForSelectedTerm(): void {
    const studentId = this.studentId.trim();

    if (!studentId || !this.academicYear || !this.semester || this.isSearching) {
      return;
    }

    const selectedTermExists = this.availableTerms.some(
      (term) => term.year === this.academicYear && term.semester === this.semester
    );

    if (!selectedTermExists) {
      return;
    }

    this.errorMessage = '';
    this.registrationMessage = '';
    this.saveMessage = '';
    this.registration = [];
    this.isSearching = true;

    this.studentRegistrationService
      .getStudentRegistration(studentId, this.academicYear, this.semester)
      .subscribe({
        next: (response) => {
          this.isSearching = false;
          this.registration = response.registration ?? [];
          this.registrationMessage = response.success
            ? ''
            : response.message ?? 'ไม่พบข้อมูลการลงทะเบียน';
        },
        error: (error: { status?: number; error?: { message?: string } | string }) => {
          this.isSearching = false;
          this.errorMessage = this.getLookupErrorMessage(error);
        }
      });
  }

  private getLookupErrorMessage(error: { status?: number; error?: { message?: string } | string }): string {
    const status = error.status ?? 0;
    const responseMessage = typeof error.error === 'object' && error.error !== null
      ? error.error.message
      : typeof error.error === 'string'
        ? error.error
        : '';

    if (status === 0) {
      return 'เชื่อมต่อ Backend ที่พอร์ต 4000 ไม่ได้ กรุณาตรวจสอบว่า Backend กำลังทำงานอยู่';
    }
    if (status === 401) {
      return responseMessage || 'เซสชันหมดอายุหรือ Token ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่';
    }
    if (status === 403) {
      return responseMessage || 'บัญชีนี้ไม่มีสิทธิ์ตรวจสอบข้อมูลนักศึกษา';
    }
    if (status >= 500) {
      return 'Backend ตอบสนองแล้ว แต่ตรวจสอบข้อมูลในฐานข้อมูลไม่สำเร็จ (HTTP ' + status + ') กรุณาตรวจสอบ Backend log';
    }
    return responseMessage || 'ตรวจสอบข้อมูลไม่สำเร็จ (HTTP ' + status + ')';
  }

  saveStudent(): void {
    if (this.isSaving) {
      return;
    }

    if (!this.showResult || !this.student || !this.academicYear || !this.semester || this.registration.length === 0) {
      this.errorMessage = 'ต้องเลือกปีการศึกษาและภาคการศึกษา และตรวจสอบว่าลงทะเบียนแล้วก่อนบันทึกข้อมูล';
      return;
    }

    this.errorMessage = '';
    this.saveMessage = '';
    this.isSaving = true;

    this.studentRegistrationService
      .saveMonkStatus(this.student.STD_CODE, this.academicYear, this.semester)
      .subscribe({
        next: (response) => {
          this.isSaving = false;
          this.saveMessage = response.message || 'บันทึกสถานะพระสำเร็จ';
        },
        error: (error: { status?: number; error?: { message?: string } | string }) => {
          this.isSaving = false;
          const responseMessage = typeof error.error === 'object' && error.error !== null
            ? error.error.message
            : '';
          if (responseMessage) {
            this.errorMessage = responseMessage;
          } else if (error.status === 404) {
            this.errorMessage = 'Backend ที่พอร์ต 4000 ยังไม่รู้จัก API บันทึกสถานะพระ กรุณารีสตาร์ต Backend แล้วลองใหม่';
          } else if (error.status === 0) {
            this.errorMessage = 'เชื่อมต่อ Backend ไม่ได้ กรุณาตรวจสอบว่า Backend ทำงานที่พอร์ต 4000';
          } else {
            this.errorMessage = `บันทึกสถานะพระไม่สำเร็จ (HTTP ${error.status ?? 'ไม่ทราบสถานะ'}) กรุณาตรวจสอบ Backend log`;
          }
        }
      });
  }

  clearForm(): void {
    this.studentId = '';
    this.semester = '';
    this.academicYear = '';
    this.showResult = false;
    this.saveMessage = '';
    this.errorMessage = '';
    this.student = null;
    this.registration = [];
    this.registrationMessage = '';
  }

  logout(): void {
    this.authService.clearAuthentication();
    void this.router.navigateByUrl('/login');
  }
}
