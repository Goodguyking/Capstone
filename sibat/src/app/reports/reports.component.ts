import { Component } from '@angular/core';
import { DataService } from '../services/data.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent {

  report: any = {
    title: '',
    type: '',
    message: ''
  };
  reportsList: any[] = [];


  selectedFile: File | undefined;

  constructor(private dataService: DataService) { }


ngOnInit() {
  this.loadReports();
}

  // Handle file selection
  onFileSelect(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    } else {
      this.selectedFile = undefined;
    }
  }

  // Submit the report
  submitReport() {
    // Get userid from localStorage
    const userid = localStorage.getItem('userid');
    if (!userid) {
      Swal.fire({
        icon: 'error',
        title: 'Not Logged In',
        text: 'You must be logged in to submit a report.',
      });
      return;
    }

    // Validate required fields
    if (!this.report.title || !this.report.type || !this.report.message) {
      Swal.fire({
        icon: 'warning',
        title: 'Incomplete Form',
        text: 'Please fill in all required fields.',
      });
      return;
    }

    // Call DataService to send report
    this.dataService.sendReport(userid, this.report.title, this.report.message, this.report.type, this.selectedFile)
      .subscribe(
        (res: any) => {
          if (res.success) {
            Swal.fire({
              icon: 'success',
              title: 'Report Submitted',
              text: 'Your report has been successfully submitted.',
              timer: 2000,
              showConfirmButton: false
            });

            // Reset form
            this.report = { title: '', type: '', message: '' };
            this.selectedFile = undefined;
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Submission Failed',
              text: res.message || 'Failed to submit report.',
            });
          }
        },
        (err) => {
          console.error(err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred while sending the report.',
          });
        }
      );
  }

loadReports() {
  const userid = localStorage.getItem('userid');
  if (!userid) return;

  this.dataService.getReports(userid).subscribe(
    (res: any) => {
      if (res.success) {
        // Filter only reports for the logged-in user
        this.reportsList = res.reports.filter((r: any) => r.user_id == userid);
      } else {
        console.error(res.error || "Failed to fetch reports");
      }
    },
    (err) => {
      console.error("Error fetching reports:", err);
    }
  );
}






















}
