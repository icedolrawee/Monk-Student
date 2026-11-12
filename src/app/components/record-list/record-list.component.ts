import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { StudentRegistrationService, SavedMonkStatusRecord } from '../../services/student-registration.service';
import { UserProfileComponent } from '../shared/user-profile/user-profile.component';

@Component({
  selector: 'app-record-list',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, UserProfileComponent],
  templateUrl: './record-list.component.html',
  styleUrl: './record-list.component.css'
})
export class RecordListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly studentRegistrationService = inject(StudentRegistrationService);

  records: SavedMonkStatusRecord[] = [];
  isLoading = true;
  errorMessage = '';
  actionMessage = '';
  isDeletingRecordId: number | null = null;

  ngOnInit(): void {
    this.loadRecords();
  }

  loadRecords(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.studentRegistrationService.getSavedMonkStatusRecords().subscribe({
      next: (response) => {
        this.records = response.records ?? [];
        this.isLoading = false;
        if (!response.success) this.errorMessage = response.message || 'โหลดรายการข้อมูลไม่สำเร็จ';
      },
      error: (error: { status?: number; error?: { message?: string } | string }) => {
        this.isLoading = false;
        const body = error.error;
        this.errorMessage = typeof body === 'object' && body !== null && typeof body.message === 'string'
          ? body.message
          : error.status === 401
            ? 'เซสชันหมดอายุหรือ Token ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่'
            : 'โหลดรายการข้อมูลที่บันทึกไม่สำเร็จ กรุณาตรวจสอบ Backend และฐานข้อมูล';
      }
    });
  }

  deleteRecord(record: SavedMonkStatusRecord): void {
    if (this.isDeletingRecordId !== null) return;
    const confirmed = window.confirm(
      `ต้องการลบรายการบันทึกของรหัสนักศึกษา ${record.STD_CODE} ปีการศึกษา ${record.YEAR} ภาค ${record.SEMESTER} ใช่หรือไม่?`
    );
    if (!confirmed) return;

    this.isDeletingRecordId = record.ID;
    this.actionMessage = '';
    this.studentRegistrationService.deleteSavedMonkStatusRecord(record.ID).subscribe({
      next: (response) => {
        this.isDeletingRecordId = null;
        this.actionMessage = response.message || 'ลบรายการบันทึกสำเร็จ';
        this.loadRecords();
      },
      error: (error: { status?: number; error?: { message?: string } | string }) => {
        this.isDeletingRecordId = null;
        const body = error.error;
        this.actionMessage = typeof body === 'object' && body !== null && typeof body.message === 'string'
          ? body.message
          : 'ลบรายการบันทึกไม่สำเร็จ กรุณาตรวจสอบ Backend และฐานข้อมูล';
      }
    });
  }

  getFullName(record: SavedMonkStatusRecord): string {
    return [record.FIRST_NAME_THAI, record.MIDDLE_NAME_THAI, record.LAST_NAME_THAI]
      .filter((part) => typeof part === 'string' && part.trim())
      .join(' ') || '-';
  }

  getSemesterLabel(value: string | number): string {
    const labels: Record<string, string> = { '1': 'ภาค 1', '2': 'ภาค 2', '3': 'ภาคฤดูร้อน', '4': 'ภาคซ่อม 1', '5': 'ภาคซ่อม 2' };
    return labels[String(value)] ?? `ภาค ${value}`;
  }

  logout(): void {
    this.authService.clearAuthentication();
    void this.router.navigateByUrl('/login');
  }
}
