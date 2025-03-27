import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'sibat';

  constructor(private router: Router) {}

  shouldShowSidenav(): boolean {
    console.log('Current Route:', this.router.url); // Debugging
    return this.router.url !== '/login';
  }
}
