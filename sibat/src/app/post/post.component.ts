import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService } from '../services/data.service';
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

  constructor(private fb: FormBuilder, private dataService: DataService) {
    this.detailsForm = this.fb.group({
      collectingLocation: ['', Validators.required],
      taskDescription: ['', Validators.required],
      tip: [0, [Validators.required, Validators.min(0)]],
      deliveryLocation: ['', Validators.required],
    });
  }

  calculateTotal() {
    const tip = this.detailsForm.get('tip')?.value || 0;
    this.serviceCharge = this.basePrice * 0.05; // 5% service charge
    this.totalPrice = this.basePrice + this.serviceCharge + this.deliveryCharge + tip;
  }

  proceedToSummary() {
    if (this.detailsForm.invalid) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Please fill out all required fields.',
      });
      return;
    }

    this.calculateTotal();
    const stepper = document.querySelector('mat-horizontal-stepper');
    if (stepper) {
      (stepper as any).selectedIndex = 1; // Move to Step 2
    }
  }

  submitErrand() {
    const errandData = {
      collecting_location: this.detailsForm.get('collectingLocation')?.value,
      task_description: this.detailsForm.get('taskDescription')?.value,
      tip: this.detailsForm.get('tip')?.value,
      delivery_location: this.detailsForm.get('deliveryLocation')?.value,
    };
  
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
  
                    Swal.fire({
                      icon: 'info',
                      title: 'Runner Found!',
                      text: 'A runner has accepted your errand. You will be notified shortly.',
                      confirmButtonText: 'OK',
                    }).then(() => {
                      // Reset the form and navigate back to Step 1
                      this.detailsForm.reset();
                      const stepper = document.querySelector('mat-horizontal-stepper');
                      if (stepper) {
                        (stepper as any).selectedIndex = 0;
                      }
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