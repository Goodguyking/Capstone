import { Component, OnInit } from '@angular/core';
import { DataService } from '../services/data.service';
import { MatDialog } from '@angular/material/dialog';
import { PaymentDialogComponent } from '../payment-dialog/payment-dialog.component';

interface Errand {
  history_id: number;
  chat_id: number;
  runner_id: number;
  user_id: number;
  status: string;
  rating?: number;
  created_at: string;
  updated_at?: string;
  errand_id: number;
  rate_notes?: string;
  tip: number;
  service_charge: number;
  base_price: number;
  delivery_charge: number;
  total_price: number;
  customer_first_name: string;
  customer_last_name: string;
 remitted: 'Not Yet' | 'Pending' | 'Remitted';
  proof?: string;  
}

@Component({
  selector: 'app-remitance',
  templateUrl: './remitance.component.html',
  styleUrls: ['./remitance.component.css']
})
export class RemitanceComponent implements OnInit {

  errands: Errand[] = [];
  filteredErrands: Errand[] = [];
  dailyRemittance: number = 0;
  dailyEarnings: number = 0;
  selectedDate: Date = new Date();

  constructor(private dataService: DataService, private dialog: MatDialog) { }

  ngOnInit(): void {
    this.fetchErrands();
  }

  fetchErrands() {
    this.dataService.getErrandsHistory().subscribe(
      (res: any) => {
        // Ensure numeric fields are numbers (API may return strings)
        this.errands = (res.chat_history || []).map((r: any) => ({
          ...r,
          tip: Number(r.tip) || 0,
          service_charge: Number(r.service_charge) || 0,
          base_price: Number(r.base_price) || 0,
          delivery_charge: Number(r.delivery_charge) || 0,
          total_price: Number(r.total_price) || 0
        }));
        // Filter for today by default
        this.onDateSelected();
      },
      err => console.error('Error fetching errands', err)
    );
  }

  onDateSelected() {
    if (!this.selectedDate) {
      this.filteredErrands = [];
      this.calculateDailyStats();
      return;
    }

    const selectedDateOnly = new Date(this.selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);

    this.filteredErrands = this.errands.filter(e => {
      const errandDate = new Date(e.created_at);
      errandDate.setHours(0, 0, 0, 0);
      return errandDate.getTime() === selectedDateOnly.getTime();
    });

    this.calculateDailyStats();
  }

  calculateDailyStats() {
    // Only include items that are NOT remitted
    const nonRemittedErrands = this.filteredErrands.filter(e => e.remitted !== 'Remitted');

    const earnings = nonRemittedErrands.reduce((sum, e) => {
      const v = Number(e.base_price) || 0;
      return sum + v;
    }, 0);

    const remittance = nonRemittedErrands.reduce((sum, e) => {
      const v = Number(e.service_charge) || 0;
      return sum + v;
    }, 0);

    this.dailyEarnings = Number(earnings.toFixed(2));
    this.dailyRemittance = Number(remittance.toFixed(2));
  }

  formatDate(date: string): string {
    const d = new Date(date);
    return d.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour:'2-digit', minute:'2-digit', hour12: true });
  }



openPaymentDialog() {
  if (!this.selectedDate) {
    alert('Please select a date first');
    return;
  }

  const runnerId = Number(localStorage.getItem('userid')); // get logged-in runner ID
  const selectedDateStr = this.selectedDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD

  const dialogRef = this.dialog.open(PaymentDialogComponent, {
    width: '400px',
    data: {
      amount: this.dailyRemittance,
      date: selectedDateStr,
      runnerId: runnerId
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.fetchErrands(); // reload the errands table after uploading proof
    }
  });
}


}
