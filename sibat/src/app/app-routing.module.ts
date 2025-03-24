import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { VerifyUserComponent } from './verify-user/verify-user.component';
import { HomeComponent } from './home/home.component';

const routes: Routes = [

  { path: 'login', component: LoginComponent },
  { path: 'verify-user', component: VerifyUserComponent },
  { path: 'home', component: HomeComponent }, // 🔹 Define HomeComponent route







  { path: '', redirectTo: '/login', pathMatch: 'full' }, 


];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
