import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-register-runner',
  templateUrl: './register-runner.component.html',
  styleUrls: ['./register-runner.component.css']
})
export class RegisterRunnerComponent implements OnInit {
  firstFormGroup: FormGroup;
  secondFormGroup: FormGroup;
  selectedFiles: { [key: string]: File | null } = {};
  fileErrors: { [key: string]: string } = {};
  isSubmitting = false;
  
  // Define allowed file types
  private allowedIdTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  private allowedDocTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

  constructor(private fb: FormBuilder, private router: Router, private dataService: DataService) {
    this.firstFormGroup = this.fb.group({
      modeOfTransport: ['', Validators.required],
      emergencyContactPerson: ['', Validators.required],
      emergencyContactNumber: ['', [Validators.required, Validators.pattern('^[0-9]{11}$')]]
    });

    this.secondFormGroup = this.fb.group({
      agreement: [false, Validators.requiredTrue]
    });
  }

  ngOnInit() {
    // Initialize selectedFiles with null values
    this.selectedFiles = {
      'validId1': null,
      'validId2': null,
      'policeClearance': null,
      'barangayClearance': null
    };
    
    // Initialize fileErrors with empty strings
    this.fileErrors = {
      'validId1': '',
      'validId2': '',
      'policeClearance': '',
      'barangayClearance': ''
    };
  }

  isValidFileType(file: File, fieldName: string): boolean {
    // Check if it's an ID field or document field
    const allowedTypes = fieldName.includes('Id') ? this.allowedIdTypes : this.allowedDocTypes;
    
    if (!allowedTypes.includes(file.type)) {
      const allowedExtensions = fieldName.includes('Id') ? 'JPG, JPEG, PNG' : 'PDF, JPG, JPEG, PNG';
      this.fileErrors[fieldName] = `Invalid file type. Only ${allowedExtensions} files are allowed.`;
      return false;
    }
    
    // File size validation (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.fileErrors[fieldName] = 'File size exceeds 5MB limit.';
      return false;
    }
    
    // Clear any previous errors
    this.fileErrors[fieldName] = '';
    return true;
  }

  onFileSelect(event: Event, fieldName: string) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      if (this.isValidFileType(file, fieldName)) {
        this.selectedFiles[fieldName] = file;
        console.log(`File selected for ${fieldName}:`, this.selectedFiles[fieldName]?.name);
      } else {
        // Reset the file input
        input.value = '';
        this.selectedFiles[fieldName] = null;
        console.log(`Invalid file for ${fieldName}:`, file.name);
      }
    }
  }

  onSubmit(): void {
    console.log('Submit button clicked');
    
    if (this.isSubmitting) {
      console.log('Already submitting, ignoring duplicate click');
      return;
    }
    
    // Check if there are any file errors
    const hasFileErrors = Object.values(this.fileErrors).some(error => error !== '');
    
    // Check if form is valid and all files are selected and no file errors
    if (this.firstFormGroup.valid && this.secondFormGroup.valid && this.allFilesSelected() && !hasFileErrors) {
      console.log('Form is valid and all files are selected');
      this.isSubmitting = true;
      
      try {
        const formData = new FormData();
        formData.append('modeOfTransport', this.firstFormGroup.value.modeOfTransport);
        formData.append('emergencyContactPerson', this.firstFormGroup.value.emergencyContactPerson);
        formData.append('emergencyContactNumber', this.firstFormGroup.value.emergencyContactNumber);

        // Append files
        if (this.selectedFiles['validId1']) {
          formData.append('validId1', this.selectedFiles['validId1']);
        }
        if (this.selectedFiles['validId2']) {
          formData.append('validId2', this.selectedFiles['validId2']);
        }
        if (this.selectedFiles['policeClearance']) {
          formData.append('policeClearance', this.selectedFiles['policeClearance']);
        }
        if (this.selectedFiles['barangayClearance']) {
          formData.append('barangayClearance', this.selectedFiles['barangayClearance']);
        }

        console.log('Sending form data to server...');
        
        // Send the data to the server
        this.dataService.applyAsRunner(formData).subscribe({
          next: (response) => {
            console.log('Application submitted successfully:', response);
            Swal.fire({
              icon: 'success',
              title: 'Thank You for Registering!',
              text: 'Please wait for approval of your application.',
              confirmButtonText: 'OK'
            }).then(() => this.router.navigate(['/home']));
          },
          error: (error) => {
            console.error('Error submitting application:', error);
            Swal.fire({
              icon: 'error',
              title: 'Submission Failed',
              text: error.error?.message || 'There was an issue submitting your application. Please try again.',
              confirmButtonText: 'OK'
            });
            this.isSubmitting = false;
          },
          complete: () => {
            this.isSubmitting = false;
          }
        });
      } catch (err) {
        console.error('Exception while preparing form data:', err);
        Swal.fire({
          icon: 'error',
          title: 'Submission Error',
          text: 'An unexpected error occurred. Please try again.',
          confirmButtonText: 'OK'
        });
        this.isSubmitting = false;
      }
    } else {
      console.log('Form validation failed');
      console.log('First form valid:', this.firstFormGroup.valid);
      console.log('Second form valid:', this.secondFormGroup.valid);
      console.log('All files selected:', this.allFilesSelected());
      console.log('File errors:', this.fileErrors);
      
      // Show proper validation errors
      if (hasFileErrors) {
        const errorMessages = Object.values(this.fileErrors).filter(error => error !== '');
        Swal.fire({
          icon: 'error',
          title: 'Invalid File Format',
          text: errorMessages[0] || 'One or more files have invalid formats.',
          confirmButtonText: 'OK'
        });
      } else if (!this.allFilesSelected()) {
        Swal.fire({
          icon: 'error',
          title: 'Missing Documents',
          text: 'Please upload all required documents before submitting.',
          confirmButtonText: 'OK'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Form Incomplete',
          text: 'Please fill out all required fields correctly and accept the terms and conditions.',
          confirmButtonText: 'OK'
        });
      }
    }
  }

  allFilesSelected(): boolean {
    return (
      !!this.selectedFiles['validId1'] &&
      !!this.selectedFiles['validId2'] &&
      !!this.selectedFiles['policeClearance'] &&
      !!this.selectedFiles['barangayClearance']
    );
  }

  hasAnyFileErrors(): boolean {
    return Object.values(this.fileErrors).some(error => error !== '');
  }
}
