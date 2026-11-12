import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Student {
  STD_CODE: string;
  PRENAME_NO: number | string | null;
  FIRST_NAME_THAI: string | null;
  MIDDLE_NAME_THAI: string | null;
  LAST_NAME_THAI: string | null;
  FACULTY_NO: string | number | null;
  MAJOR_NO: string | number | null;
  FACULTY_NAME_THAI: string | null;
  MAJOR_NAME_THAI: string | null;
  [key: string]: unknown;
}

export interface Registration {
  YEAR: string | number;
  SEMESTER: string | number;
  STD_CODE: string;
  COURSE_NO?: string | null;
  SECTION_NO?: string | number | null;
  CREDIT?: string | number | null;
  [key: string]: unknown;
}

export interface AvailableTerm {
  year: string;
  semester: string;
}

export interface SystemTermsResponse {
  success: boolean;
  message?: string;
  available_terms: AvailableTerm[];
}

export interface StudentRegistrationResponse {
  success: boolean;
  message?: string;
  student: Student | null;
  registration: Registration[];
}

export interface SavedMonkStatusRecord {
  ID: number;
  STD_CODE: string;
  YEAR: string | number;
  SEMESTER: string | number;
  INSERT_USER: string;
  INSERT_DATE: string | null;
  FIRST_NAME_THAI: string | null;
  MIDDLE_NAME_THAI: string | null;
  LAST_NAME_THAI: string | null;
  FACULTY_NO: string | number | null;
  FACULTY_NAME_THAI: string | null;
  MAJOR_NAME_THAI: string | null;
}

export interface SavedMonkStatusListResponse {
  success: boolean;
  message?: string;
  records: SavedMonkStatusRecord[];
}

export interface MonkStatusSaveResponse {
  success: boolean;
  message?: string;
  record?: {
    id: number;
    studentId: string;
    year: string;
    semester: string;
    insertUser: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class StudentRegistrationService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = 'http://localhost:4000/api/students';

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return token ? new HttpHeaders({ Authorization: 'Bearer ' + token }) : new HttpHeaders();
  }

  getSavedMonkStatusRecords(): Observable<SavedMonkStatusListResponse> {
    return this.http.get<SavedMonkStatusListResponse>(
      this.apiUrl + '/monk-status',
      { headers: this.authHeaders() }
    );
  }

  getStudentRegistrationHistory(studentId: string): Observable<StudentRegistrationResponse> {
    return this.http.get<StudentRegistrationResponse>(
      `${this.apiUrl}/${encodeURIComponent(studentId)}/registration-history`,
      { headers: this.authHeaders() }
    );
  }

  getSystemTerms(): Observable<SystemTermsResponse> {
    return this.http.get<SystemTermsResponse>(this.apiUrl + '/terms', { headers: this.authHeaders() });
  }

  getStudentRegistration(
    studentId: string,
    year: string,
    semester: string
  ): Observable<StudentRegistrationResponse> {
    const params = new HttpParams()
      .set('year', year)
      .set('semester', semester);

    return this.http.get<StudentRegistrationResponse>(
      `${this.apiUrl}/${encodeURIComponent(studentId)}/registration`,
      { params, headers: this.authHeaders() }
    );
  }

  deleteSavedMonkStatusRecord(recordId: number): Observable<{ success: boolean; message?: string }> {
    return this.http.delete<{ success: boolean; message?: string }>(
      `${this.apiUrl}/monk-status/${recordId}`,
      { headers: this.authHeaders() }
    );
  }

  saveMonkStatus(studentId: string, year: string, semester: string): Observable<MonkStatusSaveResponse> {
    return this.http.post<MonkStatusSaveResponse>(
      `${this.apiUrl}/monk-status`,
      { studentId, year, semester },
      { headers: this.authHeaders() }
    );
  }
}
