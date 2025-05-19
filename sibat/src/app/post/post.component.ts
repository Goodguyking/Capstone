import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService } from '../services/data.service';
import { Router } from '@angular/router'; // Import Router
import { MatStepper } from '@angular/material/stepper';
import Swal from 'sweetalert2';
import * as L from 'leaflet';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.css'],
})
export class PostComponent implements OnInit {
  @ViewChild('stepper') stepper!: MatStepper;
  detailsForm: FormGroup;
  collectingMap: L.Map | null = null;
  deliveryMap: L.Map | null = null;
  collectingMarker: L.Marker | null = null;
  deliveryMarker: L.Marker | null = null;

  basePrice: number = 30; // Example base price
  serviceCharge: number = 0;
  deliveryCharge: number = 50; // Example delivery charge
  totalPrice: number = 0;

  mapOptions = {
    layers: [
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      })
    ],
    zoom: 13,
    center: L.latLng(14.5995, 120.9842) // Manila coordinates
  };

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
      collectingLatLng: [''],  // Made optional
      deliveryLatLng: ['']     // Made optional
    });

    // Subscribe to tip changes to update total price
    this.detailsForm.get('tip')?.valueChanges.subscribe(() => {
      this.calculateTotalPrice();
    });
  }

  ngOnInit() {
    setTimeout(() => {
      this.initializeMaps();
    }, 100);
  }

  initializeMaps() {
    // ... existing map initialization code ...
  }

  handleMapClick(e: L.LeafletMouseEvent, mapType: 'collecting' | 'delivery') {
    // ... existing map click handler code ...
  }

  calculateTotalPrice() {
    const tip = this.detailsForm.get('tip')?.value || 0;
    this.serviceCharge = (this.basePrice + tip) * 0.05; // 5% service charge
    this.totalPrice = this.basePrice + this.serviceCharge + this.deliveryCharge;
  }

  onStepChange(event: any) {
    if (event.selectedIndex === 1) { // Summary step
      this.calculateTotalPrice();
    }
  }

  submitErrand() {
    if (this.detailsForm.valid) {
      const errandData = {
        collecting_location: this.detailsForm.get('collectingLocation')?.value,
        collecting_latlng: this.detailsForm.get('collectingLatLng')?.value,
        task_description: this.detailsForm.get('taskDescription')?.value,
        tip: this.detailsForm.get('tip')?.value,
        delivery_location: this.detailsForm.get('deliveryLocation')?.value,
        delivery_latlng: this.detailsForm.get('deliveryLatLng')?.value,
        total_price: this.totalPrice // Include total price in the submission
      };

      this.dataService.createErrand(errandData).subscribe(
        (response: any) => {
          if (response && response.message) {
            const errandId = response.errand_id;

            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: `Errand posted successfully!`,
              confirmButtonText: 'OK',
            }).then(() => {
              Swal.fire({
                title: 'Waiting for a runner...',
                html: 'Please wait while we find a runner to accept your errand.',
                allowOutsideClick: false,
                didOpen: () => {
                  Swal.showLoading();
                },
              });

              const pollingInterval = setInterval(() => {
                this.dataService.checkErrandStatus(errandId).subscribe(
                  (statusResponse: any) => {
                    if (statusResponse && statusResponse.is_accepted === 1) {
                      clearInterval(pollingInterval);
                      const runnerName = statusResponse.runner_name;

                      Swal.fire({
                        icon: 'info',
                        title: 'Runner Found!',
                        text: `A runner (${runnerName}) has accepted your errand. You will be notified shortly.`,
                        confirmButtonText: 'OK',
                      }).then(() => {
                        this.router.navigate(['/chat']);
                      });
                    }
                  },
                  (error) => {
                    console.error('Error checking errand status:', error);
                  }
                );
              }, 5000);
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
}