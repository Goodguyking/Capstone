import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-rate',
  templateUrl: './rate.component.html',
  styleUrls: ['./rate.component.css']
})
export class RateComponent {
  @Input() visible: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<{ rating: number, notes: string }>();

  rating: number = 0;
  notes: string = '';

  setRating(value: number) {
    this.rating = value;
  }

  onSubmit() {
    this.submit.emit({ rating: this.rating, notes: this.notes });
    this.onClose();
    this.rating = 0;
    this.notes = '';
  }

  onClose() {
    this.close.emit();
    this.rating = 0;
    this.notes = '';
  }
}