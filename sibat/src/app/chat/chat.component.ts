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
import Swal from 'sweetalert2';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class ChatComponent implements OnInit, OnDestroy {
  selectedPhotoUrl: string | null = null;
  isPhotoModalOpen: boolean = false;

  chatHistory: { id: number; name: string; errand_id?: number; status?: string; runner_id?: number; user_id?: number }[] = [];
  selectedChat: { id: number; name: string; errand_id?: number; status?: string; runner_id?: number; user_id?: number } | null = null;
  selectedErrandId: number | null = null;
  messages: {
    created_at: string | number | Date;
    sender: string;
    senderId: number;
    content: string;
    type: string;
    filename?: string;
  }[] = [];
  newMessage: string = '';
  currentUser: string = '';
  currentUserId: number | null = null;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  errandIsDone = false;
  isRunner: boolean = false;
  isUserRole: boolean = false; // For user role check
  isRateModalOpen = false;

  private socket: any;

  @ViewChild('chatContainer') chatContainer!: ElementRef;
  window: any;

  constructor(private dataService: DataService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.initializeSocketConnection();
    this.fetchChatHistory();

    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken: any = jwtDecode(token);
      this.currentUser = decodedToken.name || decodedToken.username || '';
      this.currentUserId = decodedToken.uid || decodedToken.userid || null;
    }

    // Check if current user is a runner
    this.dataService.isRunner().subscribe({
      next: (res) => { this.isRunner = res.isRunner; },
      error: () => { this.isRunner = false; }
    });

    // Check if current user is a user (customer)
    this.dataService.getIsUser().subscribe({
      next: (res) => { this.isUserRole = res.isUser; },
      error: () => { this.isUserRole = false; }
    });

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

  viewPhoto(photoUrl: string) {
    this.selectedPhotoUrl = photoUrl;
    this.isPhotoModalOpen = true;
  }

  closePhotoModal() {
    this.selectedPhotoUrl = null;
    this.isPhotoModalOpen = false;
  }

  initializeSocketConnection() {
    this.socket = io('http://localhost:3000');

    this.socket.on('receiveMessage', (data: any) => {
      if (this.selectedChat && data.chatId === this.selectedChat.id) {
        const isDuplicate = this.messages.some(msg => {
          return (
            msg.created_at === data.created_at &&
            msg.senderId === data.senderId &&
            msg.content === data.content &&
            msg.filename === data.filename
          );
        });

        if (!isDuplicate) {
          this.messages.push({
            sender: data.sender,
            senderId: data.senderId,
            content: data.content,
            type: data.type,
            filename: data.filename,
            created_at: data.created_at,
          });

          this.scrollToLatestMessage();
        }
      }
    });
  }

  fetchChatHistory() {
    this.dataService.fetchChatHistory().subscribe(
      (response) => {
        this.chatHistory = response.map((chat: { chat_id: number; name: string; errand_id?: number; status?: string; runner_id?: number; user_id?: number }) => ({
          id: chat.chat_id,
          name: chat.name,
          errand_id: chat.errand_id,
          status: chat.status,
          runner_id: chat.runner_id,
          user_id: chat.user_id // Make sure this is included!
        }));
      },
      (error) => {
        console.error('Error fetching chat history:', error);
      }
    );
  }

  selectChat(chat: { id: number; name: string; errand_id?: number; status?: string; runner_id?: number; user_id?: number }) {
    this.selectedChat = chat;
    this.selectedErrandId = chat.errand_id || null;
    this.errandIsDone = chat.status === 'done';
    this.fetchMessages(chat.id);
    this.socket.emit('joinChat', chat.id);
  }

  fetchMessages(chatId: number) {
    this.dataService.fetchMessages(chatId).subscribe(
      (response) => {
        this.messages = response.map((msg: any) => ({
          message_id: msg.message_id,
          senderId: msg.sender_id,
          sender: msg.sender,
          content: msg.content,
          type: msg.type,
          filename: msg.filename,
          created_at: msg.created_at,
        }));
        this.scrollToLatestMessage();
      },
      (error) => {
        console.error('Error fetching messages:', error);
      }
    );
  }

  get isUser(): boolean {
    // selectedChat?.user_id must be available in your chat object!
    return this.selectedChat != null && this.selectedChat['user_id'] === this.currentUserId;
  }

markChatAsDone() {
  if (this.selectedChat) {
    // Provide default values for rating and rateNotes if not available
    this.dataService.markChatAsDone(this.selectedChat.id, 0, '').subscribe(() => {
      this.selectedChat!.status = 'done';
      this.errandIsDone = true;
      this.dataService.errandDone(this.selectedChat!.id).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Errand marked as done!',
            confirmButtonText: 'OK'
          });
        },
        error: (err) => {
          console.error('Error archiving chat:', err);
        }
      });
    });
  }
}

  sendMessage() {
    if (this.newMessage.trim() && this.selectedChat && this.currentUserId !== null) {
      const messageData = {
        chatId: this.selectedChat?.id ?? 0,
        senderId: this.currentUserId,
        content: this.newMessage,
      };

      this.socket.emit('sendTextMessage', messageData);
      this.newMessage = '';
    }
  }
onRateSubmit(event: { rating: number, notes: string }) {
  if (!this.selectedChat) return;

  // 1. First, rate the chat (update rating and notes)
  this.dataService.rateChat(this.selectedChat.id, event.rating, event.notes).subscribe({
    next: () => {
      // 2. Then, mark the chat as done (move to history)
      this.markChatAsDone();
      this.isRateModalOpen = false;
    },
    error: (err) => {
      // Handle error (optional: show error message)
      console.error('Failed to rate chat:', err);
    }
  });
}
  sendImage() {
    if (this.selectedFile && this.selectedChat && this.currentUserId !== null) {
      const formData = new FormData();
      formData.append('image', this.selectedFile);
      formData.append('chatId', this.selectedChat.id.toString());
      formData.append('senderId', this.currentUserId.toString());
      formData.append('type', 'image');

      this.dataService.uploadImage(formData).subscribe(
        (response: any) => {
          const messageData = {
            chatId: this.selectedChat?.id ?? 0,
            senderId: this.currentUserId,
            filename: response.filename,
          };

          this.socket.emit('sendPhotoMessage', messageData);

          this.selectedFile = null;
          this.previewUrl = null;
        },
        (error) => {
          console.error('Error uploading image:', error);
        }
      );
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

  isSender(senderId: number): boolean {
    return senderId === this.currentUserId;
  }

  sendMessageOrImage() {
    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('image', this.selectedFile);
      formData.append('chatId', this.selectedChat?.id.toString() ?? '');
      formData.append('senderId', this.currentUserId?.toString() ?? '');
      formData.append('type', 'image');

      this.dataService.uploadImage(formData).subscribe(
        (response: any) => {
          const messageData = {
            chatId: this.selectedChat?.id ?? 0,
            senderId: this.currentUserId,
            filename: response.filename,
            type: 'image',
            created_at: new Date().toISOString(),
          };

          this.socket.emit('sendPhotoMessage', messageData);

          this.selectedFile = null;
          this.previewUrl = null;
        },
        (error) => {
          console.error('Error uploading image:', error);
        }
      );
    } else if (this.newMessage.trim()) {
      const messageData = {
        chatId: this.selectedChat?.id ?? 0,
        senderId: this.currentUserId,
        content: this.newMessage,
        type: 'text',
        created_at: new Date().toISOString(),
      };

      this.socket.emit('sendTextMessage', messageData);
      this.newMessage = '';
    }
  }

  onEnterPress(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    keyboardEvent.preventDefault();
    this.sendMessageOrImage();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeSelectedFile() {
    this.selectedFile = null;
    this.previewUrl = null;
  }
}