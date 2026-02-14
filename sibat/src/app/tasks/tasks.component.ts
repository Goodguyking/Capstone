import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataService } from '../services/data.service';
import Swal from 'sweetalert2';
import { jwtDecode } from 'jwt-decode'; 
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css'],
})
export class TasksComponent implements OnInit, OnDestroy {
  errands: any[] = [];
  private pollingSubscription: Subscription | undefined;

  constructor(private dataService: DataService, private router: Router) {}

  ngOnInit(): void {
    this.fetchErrands(); // initial fetch

    // Poll every 5 seconds for new errands
    this.pollingSubscription = interval(5000).subscribe(() => {
      this.fetchErrands();
    });
  }

  ngOnDestroy(): void {
    // Stop polling when component is destroyed
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  fetchErrands() {
    this.dataService.getErrands().subscribe(
      (response: any) => {
        // Only show errands that are not yet accepted
        this.errands = response.filter((errand: any) => Number(errand.is_accepted) === 0);
        console.log('Updated errands:', this.errands);
      },
      (error) => {
        console.error('Error fetching errands:', error);
      }
    );
  }

  acceptErrand(errandId: number) {
    const token = localStorage.getItem('token');
    if (!token) {
      Swal.fire('Error!', 'You are not logged in.', 'error');
      return;
    }

    const errand = this.errands.find(e => e.errand_id === errandId);
    if (errand && Number(errand.is_accepted) === 1) {
      Swal.fire('Already Taken!', 'This errand has already been accepted.', 'warning');
      this.errands = this.errands.filter(e => e.errand_id !== errandId);
      return;
    }

    try {
      const decodedToken: any = jwtDecode(token);
      const runnerId = decodedToken.userid || decodedToken.uid || decodedToken.id;
      if (!runnerId) {
        Swal.fire('Error!', 'Invalid runner ID. Please log in again.', 'error');
        return;
      }

      this.dataService.acceptErrand(errandId, runnerId).subscribe(
        (response: any) => {
          Swal.fire('Accepted!', 'You have accepted the errand.', 'success');
          if (response.chat_id) {
            this.router.navigate(['/runner/chat', response.chat_id]);
          }
        },
        (error) => {
          const errorMessage = error.error?.error || error.error || 'Failed to accept the errand.';
          if (errorMessage.includes('already') || errorMessage.includes('accepted')) {
            Swal.fire('Already Taken!', 'This errand has already been accepted.', 'warning');
            this.errands = this.errands.filter(e => e.errand_id !== errandId);
          } else {
            Swal.fire('Error!', errorMessage, 'error');
          }
        }
      );
    } catch (error) {
      console.error('Error decoding token:', error);
      Swal.fire('Error!', 'Failed to decode token. Please log in again.', 'error');
    }
  }
}
