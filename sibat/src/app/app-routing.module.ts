import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { VerifyUserComponent } from './verify-user/verify-user.component';
import { HomeComponent } from './home/home.component';
import { LayoutComponent } from './layout/layout.component';
import { AuthGuard } from './guards/auth.guard';
import { ProfileComponent } from './profile/profile.component';
import { RegisterRunnerComponent } from './register-runner/register-runner.component';
import { AdminComponent } from './admin/admin.component';
import { UserManagementComponent } from './user-management/user-management.component';
import { ApplicationsComponent } from './applications/applications.component';
import { RunnerComponent } from './runner/runner.component';

const routes: Routes = [
  // Redirect root to login
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Public routes
  { path: 'login', component: LoginComponent },
  { path: 'verify-user', component: VerifyUserComponent },
  { path: 'registration-runner', component: RegisterRunnerComponent },


  { path: 'runner', component: RunnerComponent },
  // Other routes...





  //admin routes

  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [AuthGuard], // Protect admin routes
    children: [
      { path: 'users', component: UserManagementComponent },
      { path: 'applications', component: ApplicationsComponent },
      // { path: 'settings', component: SettingsComponent },
    ]
  },




  // Protected routes
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard], // Protect layout
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'profile', component: ProfileComponent },
    ]
  },

  // Catch-all route
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }