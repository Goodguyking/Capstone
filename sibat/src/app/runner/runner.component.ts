import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../services/data.service';

@Component({
    selector: 'app-runner',
    templateUrl: './runner.component.html',
    styleUrls: ['./runner.component.css']
})
export class RunnerComponent {
    constructor(private dataService: DataService, private router: Router) {}
    navigateToFirstChat() {
        this.dataService.fetchChatHistory().subscribe(
          (chatHistory) => {
            if (chatHistory.length > 0) {
              const firstChat = chatHistory[0]; // Get the first chat
              this.router.navigate(['/runner/chat', firstChat.chat_id]); // Navigate to the first chat
            } else {
              alert('No chats available.');
            }
          },
          (error) => {
            console.error('Error fetching chat history:', error);
            alert('Failed to load chats.');
          }
        );
      }
    logout() {
        // Add your logout logic here
        console.log('Logging out...');
        this.router.navigate(['/login']);
    }
}