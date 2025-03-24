import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataService } from '../services/data.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-verify-user',
  templateUrl: './verify-user.component.html',
  styleUrls: ['./verify-user.component.css']
})
export class VerifyUserComponent {
  verificationCode: string = '';

  constructor(
    private dialogRef: MatDialogRef<VerifyUserComponent>,
    private dataService: DataService,
    private snackBar: MatSnackBar,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) public data: { email: string }
  ) {}

  verifyCode() {
    const requestData = {
      email: this.data.email,
      verification_code: this.verificationCode
    };

    this.dataService.verifyUser(requestData).subscribe(
      (response: any) => {
        if (response.success) {
          this.snackBar.open('Verification Successful! Redirecting to login...', 'Close', { duration: 3000 });

          this.dialogRef.close(); // Close the modal

          setTimeout(() => {
            this.router.navigate(['/login']); // Redirect to login page
          }, 2000); // Delay redirection for user feedback
        } else {
          this.snackBar.open(response.error || 'Invalid verification code', 'Close', { duration: 3000 });
        }
      },
      (error) => {
        this.snackBar.open('Verification failed. Please try again.', 'Close', { duration: 3000 });
      }
    );
  }
}
