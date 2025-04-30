import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService } from '../services/data.service';
import { Router } from '@angular/router'; // Import Router
import Swal from 'sweetalert2';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.css'],
})
export class PostComponent {
  detailsForm: FormGroup;

  basePrice: number = 100; // Example base price
  serviceCharge: number = 0;
  deliveryCharge: number = 50; // Example delivery charge
  totalPrice: number = 0;

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private router: Router // Inject Router
  ) {
    this.detailsForm = this.fb.group({
      collectingLocation: ['', Validators.required],
      taskDescription: ['', Validators.required],
      tip: [0, [Validators.required, Validators.min(0)]],
      deliveryLocation: ['', Validators.required],
    });
  }

  // ...existing methods...

  submitErrand() {
    const errandData = {
      collecting_location: this.detailsForm.get('collectingLocation')?.value,
      task_description: this.detailsForm.get('taskDescription')?.value,
      tip: this.detailsForm.get('tip')?.value,
      delivery_location: this.detailsForm.get('deliveryLocation')?.value,
    };
  
    // Calculate the total price
    this.totalPrice =
      this.basePrice +
      this.serviceCharge +
      this.deliveryCharge +
      (errandData.tip || 0);
  
    this.dataService.createErrand(errandData).subscribe(
      (response: any) => {
        if (response && response.message) {
          const errandId = response.errand_id;
  
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: `Errand posted successfully! Errand ID: ${errandId}`,
            confirmButtonText: 'OK',
          }).then(() => {
            // Show loading screen
            Swal.fire({
              title: 'Waiting for a runner...',
              html: 'Please wait while we find a runner to accept your errand.',
              allowOutsideClick: false,
              didOpen: () => {
                Swal.showLoading();
              },
            });
  
            // Start polling for the errand status
            const pollingInterval = setInterval(() => {
              this.dataService.checkErrandStatus(errandId).subscribe(
                (statusResponse: any) => {
                  if (statusResponse && statusResponse.is_accepted === 1) {
                    clearInterval(pollingInterval); // Stop polling
  
                    const runnerName = statusResponse.runner_name; // Assuming the API returns the runner's name
  
                    Swal.fire({
                      icon: 'info',
                      title: 'Runner Found!',
                      text: `A runner (${runnerName}) has accepted your errand. You will be notified shortly.`,
                      confirmButtonText: 'OK',
                    }).then(() => {
                      // Navigate to the chat page
                      this.router.navigate(['/chat']); // Replace '/chat' with your chat route
                    });
                  }
                },
                (error) => {
                  console.error('Error checking errand status:', error);
                }
              );
            }, 5000); // Poll every 5 seconds
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Unexpected response from the server.',
          });
        }
      },
      (error) => {
        console.error('Error:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to post errand. Please try again.',
        });
      }
    );
  }
}