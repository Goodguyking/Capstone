import { Component, OnInit } from '@angular/core';
import { DataService } from '../services/data.service';
import Swal from 'sweetalert2';
import { jwtDecode } from 'jwt-decode'; // Correct import
import { Router } from '@angular/router'; // Import Router

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css'],
})
export class TasksComponent implements OnInit {
  errands: any[] = []; // Array to store errands

  constructor(private dataService: DataService, private router: Router) {} // Inject Router

  ngOnInit(): void {
    this.fetchErrands(); // Fetch errands from the database
  }

  fetchErrands() {
    this.dataService.getErrands().subscribe(
      (response: any) => {
        console.log('Fetched errands:', response); // Debug log

        // Convert is_accepted to a number and filter errands
        this.errands = response.filter((errand: any) => Number(errand.is_accepted) === 0);

        console.log('Filtered errands:', this.errands); // Debug log
      },
      (error) => {
        console.error('Error fetching errands:', error);
      }
    );
  }

  acceptErrand(errandId: number) {
    const token = localStorage.getItem('token'); // Retrieve the token from localStorage
  
    if (!token) {
      Swal.fire('Error!', 'You are not logged in.', 'error');
      return;
    }
  
    try {
      // Decode the token to get the userid
      const decodedToken: any = jwtDecode(token);
      const runnerId = decodedToken.userid || decodedToken.uid || decodedToken.id; // Adjust based on token structure
  
      if (!runnerId) {
        Swal.fire('Error!', 'Invalid runner ID. Please log in again.', 'error');
        return;
      }
  
      // Send the errand_id and runner_id to the backend
      this.dataService.acceptErrand(errandId, runnerId).subscribe(
        (response: any) => {
          Swal.fire('Accepted!', 'You have accepted the errand.', 'success');
  
          // Redirect to the chat using the chat_id returned from the backend
          if (response.chat_id) {
            this.router.navigate(['/runner/chat', response.chat_id]); // Navigate to the chat component with the chat ID
          } else {
            Swal.fire('Error!', 'Failed to create or fetch chat.', 'error');
          }
        },
        (error) => {
          console.error('Error accepting errand:', error);
          Swal.fire('Error!', 'Failed to accept the errand. Please try again.', 'error');
        }
      );
    } catch (error) {
      console.error('Error decoding token:', error);
      Swal.fire('Error!', 'Failed to decode token. Please log in again.', 'error');
    }
  }
}