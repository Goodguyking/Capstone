import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-register-runner',
  templateUrl: './register-runner.component.html',
  styleUrls: ['./register-runner.component.css']
})
export class RegisterRunnerComponent {
  firstFormGroup: FormGroup;
  secondFormGroup: FormGroup;
  selectedFiles: { [key: string]: File | null } = {}; // ✅ Fix: Explicitly set type

  constructor(private fb: FormBuilder, private router: Router, private dataService: DataService) {
    this.firstFormGroup = this.fb.group({
      modeOfTransport: ['', Validators.required],
      emergencyContactPerson: ['', Validators.required],
      emergencyContactNumber: ['', Validators.required]
    });

    this.secondFormGroup = this.fb.group({
      agreement: [false, Validators.requiredTrue]
    });
  }

  onFileSelect(event: Event, fieldName: string) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFiles[fieldName] = input.files[0]; // ✅ Fix: Store as File, not boolean
    }
  }

  onSubmit(): void {
    if (this.firstFormGroup.valid && this.secondFormGroup.valid && this.allFilesSelected()) {
      const formData = new FormData();
      formData.append('modeOfTransport', this.firstFormGroup.value.modeOfTransport);
      formData.append('emergencyContactPerson', this.firstFormGroup.value.emergencyContactPerson);
      formData.append('emergencyContactNumber', this.firstFormGroup.value.emergencyContactNumber);

      // Append files
      formData.append('validId1', this.selectedFiles['validId1'] as File);
      formData.append('validId2', this.selectedFiles['validId2'] as File);
      formData.append('policeClearance', this.selectedFiles['policeClearance'] as File);
      formData.append('barangayClearance', this.selectedFiles['barangayClearance'] as File);

      this.dataService.applyAsRunner(formData).subscribe(
        () => {
          Swal.fire({
            icon: 'success',
            title: 'Thank You for Registering!',
            text: 'Please wait for approval of your application.',
            confirmButtonText: 'OK'
          }).then(() => this.router.navigate(['/home']));
        },
        () => {
          Swal.fire({
            icon: 'error',
            title: 'Submission Failed',
            text: 'There was an issue submitting your application. Please try again.',
            confirmButtonText: 'OK'
          });
        }
      );
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Please complete all required fields and upload all documents before submitting.',
        confirmButtonText: 'OK'
      });
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
}
