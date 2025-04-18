import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { io } from 'socket.io-client';
import { DataService } from '../services/data.service';
import { ActivatedRoute } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit, OnDestroy {
  chatHistory: { id: number; name: string }[] = [];
  selectedChat: { id: number; name: string } | null = null;
  messages: { sender: string; content: string; type: string }[] = [];
  newMessage: string = '';
  private socket: any;

  @ViewChild('chatContainer') chatContainer!: ElementRef;

  constructor(private dataService: DataService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.initializeSocketConnection();

    // Fetch chat history
    this.fetchChatHistory();

    // Get the chatId from the route and fetch messages
    this.route.params.subscribe((params) => {
      const chatId = +params['chatId'];
      if (chatId) {
        this.selectChat({ id: chatId, name: '' });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  initializeSocketConnection() {
    this.socket = io('http://localhost:3000'); // Connect to the WebSocket server

    // Listen for real-time messages
    this.socket.on('receiveMessage', (data: any) => {
      if (this.selectedChat && data.chatId === this.selectedChat.id) {
        this.messages.push({
          sender: data.sender,
          content: data.content,
          type: data.type,
        });
        this.scrollToLatestMessage(); // Scroll to the latest message
      }
    });
  }

  fetchChatHistory() {
    this.dataService.fetchChatHistory().subscribe(
      (response) => {
        this.chatHistory = response.map((chat: { chat_id: number; name: string }) => ({
          id: chat.chat_id,
          name: chat.name,
        }));
      },
      (error) => {
        console.error('Error fetching chat history:', error);
      }
    );
  }

  selectChat(chat: { id: number; name: string }) {
    this.selectedChat = chat;
    this.fetchMessages(chat.id);

    // Join the chat room
    this.socket.emit('joinChat', chat.id);
  }

  fetchMessages(chatId: number) {
    this.dataService.fetchMessages(chatId).subscribe(
      (response) => {
        this.messages = response;
        this.scrollToLatestMessage();
      },
      (error) => {
        console.error('Error fetching messages:', error);
      }
    );
  }

  sendMessage() {
    if (this.newMessage.trim() && this.selectedChat) {
      const token = localStorage.getItem('token');
      let senderId = null;
      let senderName = 'You';
  
      if (token) {
        const decodedToken: any = jwtDecode(token);
        senderId = decodedToken.uid || decodedToken.userid;
        senderName = decodedToken.name || decodedToken.username || 'You';
      }
  
      const messageData = {
        chatId: this.selectedChat.id,
        senderId: senderId,
        sender: senderName,
        content: this.newMessage,
        type: 'text',
      };
  
      // Emit the message to the server
      this.socket.emit('sendMessage', messageData);
  
      // Clear the input field
      this.newMessage = '';
    }
  }

  scrollToLatestMessage() {
    setTimeout(() => {
      if (this.chatContainer) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }
}