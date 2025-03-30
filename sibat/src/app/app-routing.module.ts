import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { VerifyUserComponent } from './verify-user/verify-user.component';
import { HomeComponent } from './home/home.component';
import { LayoutComponent } from './layout/layout.component';
import { AuthGuard } from './guards/auth.guard';
import { ProfileComponent } from './profile/profile.component';
import { RegisterRunnerComponent } from './register-runner/register-runner.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent }, 
  { path: 'verify-user', component: VerifyUserComponent },

  
  { path: 'registration-runner', component: RegisterRunnerComponent },
  { 
    path: '', 
    component: LayoutComponent, 
    canActivate: [AuthGuard], // Protect layout
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'profile', component: ProfileComponent },
      // { path: 'settings', component: SettingsComponent },
      // Remove the redirectTo: 'home' here
    ]
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' }, // Redirect root to login
  { path: '**', redirectTo: 'login' } // Catch-all route
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
