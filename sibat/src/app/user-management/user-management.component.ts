import { Component, OnInit } from '@angular/core';
import { DataService } from '../services/data.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  users: any[] = [];
  loading: boolean = true;
  errorMessage: string = '';
  isEditModalOpen: boolean = false; // Track modal state
  selectedUser: any = null; // Store the user being edited
  isChangePasswordModalOpen: boolean = false; // Track password modal state
  passwordData: { userid: number; new_password: string; confirm_password: string } = { userid: 0, new_password: '', confirm_password: '' };
  
  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.dataService.getAllUsers().subscribe(
      (data) => {
        this.users = data;
        this.loading = false;
      },
      (error) => {
        console.error('Error fetching users:', error);
        this.errorMessage = 'Failed to load users. Please try again later.';
        this.loading = false;
      }
    );
  }

  // Open the Edit Modal
  openEditModal(user: any): void {
    this.selectedUser = { ...user }; // Clone the user object
    this.isEditModalOpen = true;
  }

  // Close the Edit Modal
  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.selectedUser = null;
  }

  // Save the Edited User
  saveUser(): void {
    this.dataService.editUser(this.selectedUser).subscribe(
      (response) => {
        Swal.fire('Success', 'User updated successfully', 'success');
        // Update the user in the table
        const index = this.users.findIndex((u) => u.userid === this.selectedUser.userid);
        if (index !== -1) {
          this.users[index] = { ...this.selectedUser };
        }
        this.closeEditModal();
      },
      (error) => {
        Swal.fire('Error', 'Failed to update user', 'error');
      }
    );
  }

  // Delete User
  deleteUser(userId: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You won’t be able to revert this!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.dataService.deleteUser(userId).subscribe(
          (response) => {
            Swal.fire('Deleted!', 'The user has been deleted.', 'success');
            this.users = this.users.filter((user) => user.userid !== userId);
          },
          (error) => {
            Swal.fire('Error!', 'Failed to delete the user. Please try again.', 'error');
          }
        );
      }
    });
  }




// Open the Change Password Modal
openChangePasswordModal(user: any): void {
  this.passwordData.userid = user.userid; // Set the user ID
  this.passwordData.new_password = '';
  this.passwordData.confirm_password = '';
  this.isChangePasswordModalOpen = true;
}

// Close the Change Password Modal
closeChangePasswordModal(): void {
  this.isChangePasswordModalOpen = false;
  this.passwordData = { userid: 0, new_password: '', confirm_password: '' };
}

// Change Password
changePassword(): void {
  if (this.passwordData.new_password !== this.passwordData.confirm_password) {
    Swal.fire('Error', 'Passwords do not match', 'error');
    return;
  }

  this.dataService.changePassword(this.passwordData).subscribe(
    (response) => {
      Swal.fire('Success', 'Password updated successfully', 'success');
      this.closeChangePasswordModal();
    },
    (error) => {
      Swal.fire('Error', 'Failed to update password', 'error');
    }
  );
}





}