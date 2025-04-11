import { Component } from '@angular/core';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent {
  logout(): void {
    // Add your logout logic here
    console.log('Logout clicked');
  }
}
