import { Component, OnInit } from '@angular/core';
import { DataService } from '../services/data.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-all-reports',
  templateUrl: './all-reports.component.html',
  styleUrls: ['./all-reports.component.css']
})
export class AllReportsComponent implements OnInit {

  reportsList: any[] = [];

  constructor(private dataService: DataService) { }

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports() {
    const userid = localStorage.getItem('userid') || '';
    this.dataService.getReports(userid).subscribe((res: any) => {
      if (res.success) {
        this.reportsList = res.reports;
      }
    }, err => console.error(err));
  }

  // ✅ This function opens the SweetAlert modal for updating a report
  openUpdateModal(report: any) {
    Swal.fire({
      title: 'Update Report',
      html: `
        <label>Status</label>
        <select id="status" class="swal2-input">
          <option value="pending" ${report.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="under_review" ${report.status === 'under_review' ? 'selected' : ''}>Under Review</option>
          <option value="resolved" ${report.status === 'resolved' ? 'selected' : ''}>Resolved</option>
          <option value="dismissed" ${report.status === 'dismissed' ? 'selected' : ''}>Dismissed</option>
        </select>
        <label>Remarks</label>
        <textarea id="remarks" class="swal2-textarea" placeholder="Enter remarks">${report.remarks || ''}</textarea>
      `,
      focusConfirm: false,
      preConfirm: () => {
        const status = (document.getElementById('status') as HTMLSelectElement).value;
        const remarks = (document.getElementById('remarks') as HTMLTextAreaElement).value;
        return { status, remarks };
      },
      showCancelButton: true,
    }).then(result => {
      if (result.isConfirmed) {
        this.updateReport(report.report_id, result.value.status, result.value.remarks);
      }
    });
  }

  // Function to call the backend to update
  updateReport(reportId: number, status: string, remarks: string) {
    this.dataService.updateReport(reportId, status, remarks).subscribe((res: any) => {
      if (res.success) {
        Swal.fire('Updated!', 'Report has been updated.', 'success');
        this.loadReports(); // Refresh table
      } else {
        Swal.fire('Error', res.message || 'Failed to update report', 'error');
      }
    }, err => {
      console.error(err);
      Swal.fire('Error', 'Server error while updating report', 'error');
    });
  }
}
