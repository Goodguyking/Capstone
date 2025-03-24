import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  fullName = '';
  registerEmail = '';
  registerPassword = '';
  errorMessage = '';

  isRegisterMode = false; // Controls animation

  toggleForm() {
    this.isRegisterMode = !this.isRegisterMode;
  }

  onSubmitLogin() {
    console.log('Login:', { email: this.email, password: this.password });
  }

  onSubmitRegister() {
    console.log('Register:', { fullName: this.fullName, email: this.registerEmail, password: this.registerPassword });
  }
}
