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
  selectedReport: any = null;
  isLoading: boolean = false;

  constructor(private dataService: DataService) { }

  ngOnInit(): void {
    this.loadReports();
  }

  // Preview modal trigger (for custom HTML modal)
  previewReport(report: any) {
    this.selectedReport = report;
  }

  // Close preview modal
  closePreview() {
    this.selectedReport = null;
  }

  // Load reports from backend
  loadReports() {
    this.isLoading = true;

    const userid = localStorage.getItem('userid') || '';

    this.dataService.getReports(userid).subscribe((res: any) => {
      this.isLoading = false;
      if (res.success) {
        this.reportsList = res.reports;
      } else {
        Swal.fire('Error', 'Failed to load reports', 'error');
      }
    }, err => {
      this.isLoading = false;
      console.error(err);
      Swal.fire('Error', 'Server error while loading reports', 'error');
    });
  }

  // Open SweetAlert modal to update report
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
      showCancelButton: true,
      confirmButtonText: 'Update',
      preConfirm: () => {
        const status = (document.getElementById('status') as HTMLSelectElement).value;
        const remarks = (document.getElementById('remarks') as HTMLTextAreaElement).value;

        if (!status) {
          Swal.showValidationMessage('Status is required');
          return;
        }
        return { status, remarks };
      }
    }).then(result => {
      if (result.isConfirmed && result.value) {
        this.updateReport(report.report_id, result.value.status, result.value.remarks);
      }
    });
  }

  // Check if file is image
  isImage(fileName: string): boolean {
    if (!fileName) return false;
    return /\.(jpg|jpeg|png)$/i.test(fileName);
  }

  // Check if file is PDF
  isPDF(fileName: string): boolean {
    return /\.pdf$/i.test(fileName || '');
  }

  // Update report backend call
  updateReport(reportId: string | number, status: string, remarks: string) {
    Swal.fire({
      title: 'Updating...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.dataService.updateReport(Number(reportId), status, remarks).subscribe((res: any) => {
      if (res.success) {
        // instant UI update instead of reload
        const r = this.reportsList.find(x => x.report_id === reportId);
        if (r) {
          r.status = status;
          r.remarks = remarks;
        }

        Swal.fire('Updated!', 'Report has been updated.', 'success');
      } else {
        Swal.fire('Error', res.message || 'Failed to update report', 'error');
      }
    }, err => {
      console.error(err);
      Swal.fire('Error', 'Server error while updating report', 'error');
    });
  }

}
