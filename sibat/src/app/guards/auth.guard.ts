import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('token');

    if (!token) {
      console.warn("AuthGuard: No token found! Redirecting to login.");
      this.router.navigate(['/login']);
      return false;
    }

    try {
      const decodedToken: any = jwtDecode(token);

      // Check if the token is expired
      const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
      if (decodedToken.exp && decodedToken.exp < currentTime) {
        console.warn("AuthGuard: Token expired! Redirecting to login.");
        this.router.navigate(['/login']);
        return false;
      }

      console.log("AuthGuard: Token is valid. Access granted.");
      return true;
    } catch (error) {
      console.error("AuthGuard: Invalid token! Redirecting to login.", error);
      this.router.navigate(['/login']);
      return false;
    }
  }
}