import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent {
  constructor(private router: Router) {}

  logout() {
    // Clear JWT and any stored user data
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('jwt'); // Make sure you are storing the JWT with this key
    localStorage.removeItem('token'); // Clear token

    // Redirect to login page
    this.router.navigate(['/login']);
  }
}
