import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('token'); 

    console.log("AuthGuard Check - Token Found:", token ? "✅ Yes" : "❌ No"); 
    console.log("Navigating to:", this.router.url);

    if (!token) {
      console.warn("AuthGuard: No token found! Redirecting to login.");
      this.router.navigate(['/login']);
      return false;
    }

    return true; 
  }
}
