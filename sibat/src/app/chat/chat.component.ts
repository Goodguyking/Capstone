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
  selectedPhotoUrl: string | null = null;
  isPhotoModalOpen: boolean = false;


  chatHistory: { id: number; name: string }[] = [];
  selectedChat: { id: number; name: string } | null = null;
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

  private socket: any;

  @ViewChild('chatContainer') chatContainer!: ElementRef;

  constructor(private dataService: DataService, private route: ActivatedRoute) {}

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

    // Open the photo modal and set the selected photo URL
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
          senderId: msg.sender_id,
          sender: msg.sender,
          content: msg.content,
          type: msg.type,
          filename: msg.filename,
          created_at: msg.created_at, // Map the created_at field
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
        chatId: this.selectedChat?.id ?? 0,
        senderId: this.currentUserId,
        content: this.newMessage,
      };
  
      // Emit the text message to the server
      this.socket.emit('sendTextMessage', messageData);
  
      // Clear the input field
      this.newMessage = '';
    }
  }



  sendImage() {
    if (this.selectedFile && this.selectedChat && this.currentUserId !== null) {
      const formData = new FormData();
      formData.append('image', this.selectedFile);
      formData.append('chatId', this.selectedChat.id.toString());
      formData.append('senderId', this.currentUserId.toString());
      formData.append('type', 'image');
  
      console.log('Uploading image:', this.selectedFile.name);
  
      this.dataService.uploadImage(formData).subscribe(
        (response: any) => {
          const messageData = {
            chatId: this.selectedChat?.id ?? 0,
            senderId: this.currentUserId,
            filename: response.filename,
          };
  
          console.log('Emitting sendPhotoMessage event:', messageData);
  
          // Emit the photo message to the server
          this.socket.emit('sendPhotoMessage', messageData);
  
          // Clear the selected file
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
      // Handle image upload
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
            created_at: new Date().toISOString(), // Add the current timestamp
          };
  
          // Emit the photo message to the server
          this.socket.emit('sendPhotoMessage', messageData);
  
          // Clear selected file and preview
          this.selectedFile = null;
          this.previewUrl = null;
        },
        (error) => {
          console.error('Error uploading image:', error);
        }
      );
    } else if (this.newMessage.trim()) {
      // Handle text message
      const messageData = {
        chatId: this.selectedChat?.id ?? 0,
        senderId: this.currentUserId,
        content: this.newMessage,
        type: 'text',
        created_at: new Date().toISOString(), // Add the current timestamp
      };
  
      // Emit the text message to the server
      this.socket.emit('sendTextMessage', messageData);
  
      // Clear input
      this.newMessage = '';
    }
  }
  
  
  
  
  onEnterPress(event: Event) {
    // Cast the event to a KeyboardEvent
    const keyboardEvent = event as KeyboardEvent;
  
    // Prevent default Enter behavior
    keyboardEvent.preventDefault();
  
    // Call sendMessageOrImage() when Enter is pressed
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