import { Component, OnInit } from '@angular/core';
import { DataService } from '../services/data.service';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  user: any = {};
  selectedFile: File | null = null;
  editMode = false; // 🔹 Toggle form visibility
  profileForm: FormGroup;

  constructor(private dataService: DataService, private fb: FormBuilder) {
    this.profileForm = this.fb.group({
      first_name: [''],
      last_name: [''],
      location: [''],
      email: [''],
      contact_number: ['']
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile() {
    this.dataService.getUserProfile().subscribe(
      (data) => {
        this.user = data;

        // 🔹 Populate form only if data exists
        if (data) {
          this.profileForm.patchValue({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            location: data.location || '',
            email: data.email || '',
            contact_number: data.contact_number || ''
          });
        }
      },
      (error) => {
        console.error('Error fetching profile:', error);
      }
    );
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];

    if (file) {
      this.selectedFile = file;
      this.dataService.uploadProfilePicture(file).subscribe(
        (response) => {
          this.user.profilepic = response.profilepic; // Update image URL
        },
        (error) => {
          console.error('Upload error:', error);
        }
      );
    }
  }

  toggleEdit() {
    this.editMode = !this.editMode;

    // 🔹 Reset form with current user data when toggling edit mode
    if (this.editMode) {
      this.profileForm.patchValue({
        first_name: this.user.first_name || '',
        last_name: this.user.last_name || '',
        location: this.user.location || '',
        email: this.user.email || '',
        contact_number: this.user.contact_number || ''
      });
    }
  }

  saveChanges() {
    if (this.profileForm.valid) {
      this.dataService.updateUserProfile(this.profileForm.value).subscribe(
        (response) => {
          // 🔹 Merge updated data with existing user info
          this.user = { ...this.user, ...this.profileForm.value };
          this.editMode = false; // Close form after saving
        },
        (error) => {
          console.error('Update error:', error);
        }
      );
    }
  }
}
