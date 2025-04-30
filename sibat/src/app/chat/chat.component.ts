import {
  Component,
  ViewEncapsulation,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { io } from 'socket.io-client';
import { DataService } from '../services/data.service';
import { ActivatedRoute } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  encapsulation: ViewEncapsulation.None, // Disable encapsulation
})
export class ChatComponent implements OnInit, OnDestroy {
  chatHistory: { id: number; name: string }[] = [];
  selectedChat: { id: number; name: string } | null = null;
  messages: { sender: string; senderId: number; content: string; type: string }[] = [];
  newMessage: string = '';
  currentUser: string = '';
  currentUserId: number | null = null;

  private socket: any;

  @ViewChild('chatContainer') chatContainer!: ElementRef;

  constructor(private dataService: DataService, private route: ActivatedRoute) {}



  isSender(senderId: number): boolean {
    return senderId === this.currentUserId;
  }
  ngOnInit(): void {
    this.initializeSocketConnection();
    this.fetchChatHistory();

    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken: any = jwtDecode(token);
      this.currentUser = decodedToken.name || decodedToken.username || '';
      this.currentUserId = decodedToken.uid || decodedToken.userid || null;
      console.log('Current user:', this.currentUser, 'ID:', this.currentUserId);
    }

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
    this.socket = io('http://localhost:3000');
  
    this.socket.on('receiveMessage', (data: any) => {
      if (this.selectedChat && data.chatId === this.selectedChat.id) {
        this.messages.push({
          sender: data.sender,
          senderId: data.senderId,
          content: data.content,
          type: data.type,
        });
        this.scrollToLatestMessage();
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
    this.socket.emit('joinChat', chat.id);
  }

  fetchMessages(chatId: number) {
    this.dataService.fetchMessages(chatId).subscribe(
      (response) => {
        this.messages = response.map((msg: any) => ({
          message_id: msg.message_id,
          senderId: msg.sender_id, // Map senderId from the backend
          sender: msg.sender, // Map sender's first name
          content: msg.content,
          type: msg.type,
          created_at: msg.created_at,
        }));
        this.scrollToLatestMessage();
      },
      (error) => {
        console.error('Error fetching messages:', error);
      }
    );
  }

  sendMessage() {
    if (this.newMessage.trim() && this.selectedChat && this.currentUserId !== null) {
      const messageData = {
        chatId: this.selectedChat.id,
        senderId: this.currentUserId,
        sender: this.currentUser,
        content: this.newMessage,
        type: 'text',
      };
  
      // Emit the message to the server via the socket
      this.socket.emit('sendMessage', messageData);
  
      // Clear the input field
      this.newMessage = '';
  
      // Scroll to the latest message
      this.scrollToLatestMessage();
  
      // Fetch messages immediately after sending
      this.fetchMessages(this.selectedChat.id);
    }
  }

  scrollToLatestMessage() {
    setTimeout(() => {
      if (this.chatContainer) {
        this.chatContainer.nativeElement.scrollTop =
          this.chatContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }
}
