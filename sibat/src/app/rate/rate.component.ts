import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-rate',
  templateUrl: './rate.component.html',
  styleUrls: ['./rate.component.css']
})
export class RateComponent {
  @Input() visible: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<number>();

  rating: number = 0;

  setRating(value: number) {
    this.rating = value;
  }

  onSubmit() {
    this.submit.emit(this.rating);
    this.onClose();
  }

  onClose() {
    this.close.emit();
  }
}