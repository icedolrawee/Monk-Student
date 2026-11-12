import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { RecordListComponent } from './components/record-list/record-list.component';
import { StudentRecordComponent } from './components/student-record/student-record.component';
import { StudentDetailComponent } from './components/student-detail/student-detail.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'student-record', component: StudentRecordComponent, canActivate: [authGuard] },
  { path: 'record-list', component: RecordListComponent, canActivate: [authGuard] },
  { path: 'student-detail/:studentId', component: StudentDetailComponent, canActivate: [authGuard] },
  { path: '', pathMatch: 'full', redirectTo: 'student-record' },
  { path: '**', redirectTo: 'student-record' }
];
