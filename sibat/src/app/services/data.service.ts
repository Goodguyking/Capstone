import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiUrl = 'http://localhost/capstone/backend/routes.php';

  constructor(private http: HttpClient) {}

  // Login Request
  login(loginData: { username: string; password: string }): Observable<any> {
    return new Observable((observer) => {
      this.http.post<any>(`${this.apiUrl}?route=auth/login`, loginData).subscribe(
        (data) => {
          if (data.token && data.role) {
            // 🔹 Store the JWT token and user role in localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('userRole', data.role);

            observer.next(data);
            observer.complete();
          } else {
            observer.error({ error: 'Login failed' });
          }
        },
        (error) => {
          console.error('Login error:', error);
          observer.error({ error: 'Something went wrong' });
        }
      );
    });
  }

  

  // Register Request
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}?route=auth/register`, userData);
  }

  verifyUser(data: { email: string; verification_code: string }) {
    return this.http.post<any>(`${this.apiUrl}?route=verify-email`, data);
  }
  
  









}
