import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../services/data.service';

@Component({
    selector: 'app-runner',
    templateUrl: './runner.component.html',
    styleUrls: ['./runner.component.css']
})
export class RunnerComponent implements OnInit {
    isMobile = false;

    constructor(private dataService: DataService, private router: Router) {}

    ngOnInit() {
        this.isMobile = window.innerWidth <= 768;
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth <= 768;
        });
    }

    navigateToFirstChat() {
        this.dataService.fetchChatHistory().subscribe(
            (chatHistory) => {
                if (chatHistory.length > 0) {
                    const firstChat = chatHistory[0];
                    this.router.navigate(['/runner/chat', firstChat.chat_id]);
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