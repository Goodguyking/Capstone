import { Component, OnInit } from '@angular/core';
import { DataService } from '../services/data.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-runner',
  templateUrl: './runner.component.html',
  styleUrls: ['./runner.component.css']
})
export class RunnerComponent implements OnInit {
  tasks: any[] = [];
  notifications: any[] = [];
  loading: boolean = true;

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.fetchTasks();
    this.fetchNotifications();
  }

  fetchTasks(): void {
    this.dataService.getRunnerTasks().subscribe(
      (data) => {
        this.tasks = data;
        this.loading = false;
      },
      (error) => {
        console.error('Error fetching tasks:', error);
        Swal.fire('Error', 'Failed to load tasks. Please try again later.', 'error');
        this.loading = false;
      }
    );
  }

  fetchNotifications(): void {
    this.dataService.getRunnerNotifications().subscribe(
      (data) => {
        this.notifications = data;
      },
      (error) => {
        console.error('Error fetching notifications:', error);
        Swal.fire('Error', 'Failed to load notifications. Please try again later.', 'error');
      }
    );
  }

  completeTask(taskId: number): void {
    this.dataService.completeTask(taskId).subscribe(
      (response) => {
        Swal.fire('Success', 'Task marked as complete.', 'success');
        this.tasks = this.tasks.filter((task) => task.id !== taskId);
      },
      (error) => {
        Swal.fire('Error', 'Failed to complete the task. Please try again.', 'error');
      }
    );
  }
}