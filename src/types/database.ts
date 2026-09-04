export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type UserRole = 'customer' | 'support_agent' | 'finance' | 'partnership_manager' | 'admin';
export type TicketStatus = 'open' | 'in_progress' | 'waiting_for_customer' | 'waiting_for_staff' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type NotificationType = 'new_ticket' | 'ticket_reply' | 'status_change' | 'assigned' | 'resolved' | 'closed';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  discord_id: string | null;
  discord_username: string | null;
  discord_avatar: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  ticket_number: string;
  customer_id: string;
  subject: string;
  description: string | null;
  category: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigned_to: string | null;
  account_id: string | null;
  order_id: string | null;
  transaction_id: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  // joined
  customer?: Profile;
  assignee?: Profile;
}

export interface TicketStatusHistory {
  id: string;
  ticket_id: string;
  previous_status: TicketStatus | null;
  new_status: TicketStatus;
  changed_by: string | null;
  note: string | null;
  created_at: string;
  // joined
  changer?: Profile;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
  // joined
  sender?: Profile;
  attachments?: TicketAttachment[];
}

export interface TicketAttachment {
  id: string;
  ticket_id: string;
  message_id: string | null;
  uploaded_by: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  ticket_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface SavedReply {
  id: string;
  staff_id: string;
  title: string;
  content: string;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketTag {
  id: string;
  name: string;
  color: string | null;
}

export interface CustomerRating {
  id: string;
  ticket_id: string;
  customer_id: string;
  rating: number;
  feedback: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles:               { Row: Profile;             Insert: Partial<Profile>;             Update: Partial<Profile> };
      tickets:                { Row: Ticket;              Insert: Partial<Ticket>;              Update: Partial<Ticket> };
      ticket_messages:        { Row: TicketMessage;       Insert: Partial<TicketMessage>;       Update: Partial<TicketMessage> };
      ticket_attachments:     { Row: TicketAttachment;    Insert: Partial<TicketAttachment>;    Update: Partial<TicketAttachment> };
      ticket_status_history:  { Row: TicketStatusHistory; Insert: Partial<TicketStatusHistory>; Update: Partial<TicketStatusHistory> };
      notifications:          { Row: Notification;        Insert: Partial<Notification>;        Update: Partial<Notification> };
      saved_replies:          { Row: SavedReply;          Insert: Partial<SavedReply>;          Update: Partial<SavedReply> };
      ticket_tags:            { Row: TicketTag;           Insert: Partial<TicketTag>;           Update: Partial<TicketTag> };
      ticket_tag_assignments: { Row: { id: string; ticket_id: string; tag_id: string }; Insert: any; Update: any };
      customer_ratings:       { Row: CustomerRating;      Insert: Partial<CustomerRating>;      Update: Partial<CustomerRating> };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

export type UserRole = 'customer' | 'support_agent' | 'finance' | 'partnership_manager' | 'admin';
export type TicketStatus = 'open' | 'in_progress' | 'waiting_for_customer' | 'waiting_for_staff' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type NotificationType = 'new_ticket' | 'ticket_reply' | 'status_change' | 'assigned' | 'resolved' | 'closed';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  discord_id: string | null;
  discord_username: string | null;
  discord_avatar: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  ticket_number: string;
  customer_id: string;
  subject: string;
  description: string | null;
  category: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigned_to: string | null;
  account_id: string | null;
  order_id: string | null;
  transaction_id: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  // joined
  customer?: Profile;
  assignee?: Profile;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
  // joined
  sender?: Profile;
  attachments?: TicketAttachment[];
}

export interface TicketAttachment {
  id: string;
  ticket_id: string;
  message_id: string | null;
  uploaded_by: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  ticket_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface SavedReply {
  id: string;
  staff_id: string;
  title: string;
  content: string;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketTag {
  id: string;
  name: string;
  color: string | null;
}

export interface CustomerRating {
  id: string;
  ticket_id: string;
  customer_id: string;
  rating: number;
  feedback: string | null;
  created_at: string;
}

// Supabase Database type map for the typed client
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      tickets: { Row: Ticket; Insert: Partial<Ticket>; Update: Partial<Ticket> };
      ticket_messages: { Row: TicketMessage; Insert: Partial<TicketMessage>; Update: Partial<TicketMessage> };
      ticket_attachments: { Row: TicketAttachment; Insert: Partial<TicketAttachment>; Update: Partial<TicketAttachment> };
      notifications: { Row: Notification; Insert: Partial<Notification>; Update: Partial<Notification> };
      saved_replies: { Row: SavedReply; Insert: Partial<SavedReply>; Update: Partial<SavedReply> };
      ticket_tags: { Row: TicketTag; Insert: Partial<TicketTag>; Update: Partial<TicketTag> };
      ticket_tag_assignments: { Row: { id: string; ticket_id: string; tag_id: string }; Insert: any; Update: any };
      customer_ratings: { Row: CustomerRating; Insert: Partial<CustomerRating>; Update: Partial<CustomerRating> };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
