import { Component, OnInit } from '@angular/core';
import { DataService } from '../services/data.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-applications',
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.css']
})
export class ApplicationsComponent implements OnInit {
  applications: any[] = [];
  loading: boolean = true;
  errorMessage: string = '';
  isDocumentsModalOpen: boolean = false;
  selectedApplication: any = null;
  
  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.dataService.getRunnerApplications().subscribe(
      (data) => {
        this.applications = data;
        this.loading = false;
      },
      (error) => {
        console.error('Error fetching applications:', error);
        this.errorMessage = 'Failed to load applications. Please try again later.';
        this.loading = false;
      }
    );
  }

  viewApplication(application: any): void {
    Swal.fire({
      title: 'Application Details',
      html: `
        <p><strong>User ID:</strong> ${application.userid}</p>
        <p><strong>Mode of Transport:</strong> ${application.mode_of_transport}</p>
        <p><strong>Emergency Contact:</strong> ${application.emergency_contact_person}</p>
        <p><strong>Emergency Number:</strong> ${application.emergency_contact_number}</p>
        <p><strong>Status:</strong> ${application.status}</p>
      `,
      icon: 'info'
    });
  }
  
  approveApplication(applicationId: number, userId: number): void {
    this.dataService.approveApplication({ application_id: applicationId, userid: userId }).subscribe(
      (response) => {
        Swal.fire('Approved!', 'The application has been approved, and the user is now a runner.', 'success');
        // Update the application status in the table
        const application = this.applications.find((app) => app.application_id === applicationId);
        if (application) {
          application.status = 'approved';
        }
      },
      (error) => {
        Swal.fire('Error!', 'Failed to approve the application. Please try again.', 'error');
      }
    );
  }
  
  rejectApplication(applicationId: number): void {
    this.dataService.rejectApplication(applicationId).subscribe(
      (response) => {
        Swal.fire('Rejected!', 'The application has been rejected.', 'success');
        // Update the application status in the table
        const application = this.applications.find((app) => app.application_id === applicationId);
        if (application) {
          application.status = 'rejected';
        }
      },
      (error) => {
        Swal.fire('Error!', 'Failed to reject the application. Please try again.', 'error');
      }
    );
  }
  viewDocuments(application: any): void {
    this.selectedApplication = application;
    this.isDocumentsModalOpen = true;
  }
  
  // Close the Documents Modal
  closeDocumentsModal(): void {
    this.isDocumentsModalOpen = false;
    this.selectedApplication = null;
  }





}