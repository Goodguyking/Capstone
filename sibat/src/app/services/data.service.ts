import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
  
  getUserProfile(): Observable<any> {
    const token = localStorage.getItem('token'); // Retrieve JWT token
  
    if (!token) {
      return new Observable((observer) => {
        observer.error({ error: 'User not logged in' });
      });
    }
  
    return this.http.get<any>(`${this.apiUrl}?route=getUserData`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
  

  uploadProfilePicture(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('profilepic', file); // Append file
  
    const token = localStorage.getItem('token');
  
    return this.http.post<any>(`${this.apiUrl}?route=uploadProfilePic`, formData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  updateUserProfile(userData: { first_name: string; last_name: string; email: string; location: string }): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post(`${this.apiUrl}?route=updateUserProfile`, userData, { headers });
  }
}








