"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  CheckCircle2, 
  Circle, 
  AlertTriangle, 
  ArrowUp, 
  ArrowDown, 
  Minus, 
  Database, 
  Sparkles, 
  Plus, 
  Clock, 
  ExternalLink,
  CheckSquare,
  Shield,
  Layers,
  Settings,
  Users,
  Search,
  Filter,
  BarChart3,
  HelpCircle,
  FolderKanban,
  X,
  Trash2,
  Globe,
  Bell,
  Mail,
  Loader2,
  LogOut,
  MessageSquare,
  Paperclip,
  Calendar,
  UserCheck,
  ChevronDown
} from "lucide-react";

interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  creator_id: string;
  created_at: string;
  creator_name?: string;
  attachment_url?: string;
  attachment_name?: string;
}

interface Profile {
  id: string;
  name: string;
  email: string;
  role: "customer" | "agent";
  created_at: string;
}

interface Comment {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  created_at: string;
  user_name?: string;
}

interface CustomSelectProps<T> {
  value: T;
  onChange: (val: T) => void;
  options: { value: T; label: string }[];
  className?: string;
  disabled?: boolean;
  alignRight?: boolean;
}

function BorderlessSelect<T extends string>({ 
  value, 
  onChange, 
  options, 
  className = "", 
  disabled = false,
  alignRight = false
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`relative inline-flex items-center text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 bg-transparent text-text-primary border-none outline-none font-semibold cursor-pointer select-none"
      >
        <span>{selectedOption ? selectedOption.label : value}</span>
        <ChevronDown className={`h-3 w-3 text-text-secondary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className={`absolute ${alignRight ? "right-0" : "left-0"} top-full mt-1.5 w-40 rounded-lg border border-border-strong bg-bg-elevated py-1 shadow-lg z-50 animate-in fade-in slide-in-from-top-1 duration-100`}>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-bg-hover ${
                opt.value === value ? "text-primary font-bold bg-bg-selected" : "text-text-primary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BlockSelect<T extends string>({ 
  value, 
  onChange, 
  options, 
  className = "", 
  disabled = false 
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between rounded-lg border border-border-subtle bg-bg-base px-3 py-2 text-xs text-text-primary outline-none hover:border-border-strong cursor-pointer font-semibold text-left select-none transition-colors"
      >
        <span>{selectedOption ? selectedOption.label : value}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-text-secondary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 rounded-lg border border-border-strong bg-bg-elevated py-1 shadow-lg z-50 animate-in fade-in slide-in-from-top-1 duration-100">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-bg-hover ${
                opt.value === value ? "text-primary font-bold bg-bg-selected" : "text-text-primary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface DashboardShellProps {
  initialTickets: Ticket[];
  userProfile: Profile | null;
  allProfiles: Profile[];
}

export default function DashboardShell({ 
  initialTickets, 
  userProfile, 
  allProfiles
}: DashboardShellProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "tickets" | "team" | "settings">("tickets");
  
  // Stateful listings
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  
  // Modals & status load
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // New ticket form
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // User management states
  const [roster, setRoster] = useState<Profile[]>([]);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addRole, setAddRole] = useState<"customer" | "agent">("customer");
  const [addError, setAddError] = useState("");
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [deletingUserIds, setDeletingUserIds] = useState<Record<string, boolean>>({});
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);

  useEffect(() => {
    setRoster(allProfiles);
  }, [allProfiles]);

  // Load tickets on start
  useEffect(() => {
    setTickets(initialTickets);
  }, [initialTickets]);

  // Load comments when a ticket is selected
  useEffect(() => {
    if (!selectedTicketId) return;

    const loadComments = async () => {
      setIsLoadingComments(true);
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          ticket_id,
          user_id,
          message,
          created_at,
          profiles(name)
        `)
        .eq('ticket_id', selectedTicketId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setComments(
          (data as any[]).map(c => ({
            id: c.id,
            ticket_id: c.ticket_id,
            user_id: c.user_id,
            message: c.message,
            created_at: c.created_at,
            user_name: (Array.isArray(c.profiles) ? c.profiles[0]?.name : (c.profiles as any)?.name) || "User"
          }))
        );
      }
      setIsLoadingComments(false);
    };

    loadComments();
  }, [selectedTicketId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  // Submit new Ticket (Customer only)
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim() || !userProfile) return;

    setIsUploading(true);
    let attachment_url = "";
    let attachment_name = "";

    const tempId = `tkt-${Date.now()}`;

    // Handle File upload
    if (selectedFile) {
      attachment_name = selectedFile.name;
      
      // Upload to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(fileName, selectedFile);

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('attachments')
          .getPublicUrl(fileName);
        attachment_url = urlData.publicUrl;
      } else {
        console.error("Storage upload failed:", uploadError.message);
      }
    }

    const newTicket: Ticket = {
      id: tempId,
      title: newTitle.trim(),
      description: newDescription.trim(),
      priority: newPriority,
      status: "OPEN",
      creator_id: userProfile.id,
      created_at: new Date().toISOString(),
      creator_name: userProfile.name,
      attachment_url: attachment_url || undefined,
      attachment_name: attachment_name || undefined
    };

    // Optimistically prepend
    setTickets(prev => [newTicket, ...prev]);
    setIsCreateModalOpen(false);

    const { data, error } = await supabase
      .from('tickets')
      .insert({
        title: newTicket.title,
        description: newTicket.description,
        priority: newTicket.priority,
        creator_id: newTicket.creator_id,
        status: 'OPEN',
        attachment_url: newTicket.attachment_url,
        attachment_name: newTicket.attachment_name
      })
      .select(`
        id,
        title,
        description,
        priority,
        status,
        creator_id,
        created_at,
        attachment_url,
        attachment_name,
        profiles!tickets_creator_id_fkey(name)
      `)
      .single();

    if (error) {
      console.error("Error creating ticket:", error.message);
      setTickets(prev => prev.filter(t => t.id !== tempId));
    } else if (data) {
      const dbTicket: Ticket = {
        id: data.id,
        title: data.title,
        description: data.description,
        priority: data.priority as any,
        status: data.status as any,
        creator_id: data.creator_id,
        created_at: data.created_at,
        creator_name: (Array.isArray(data.profiles) ? data.profiles[0]?.name : (data.profiles as any)?.name) || userProfile.name,
        attachment_url: data.attachment_url || undefined,
        attachment_name: data.attachment_name || undefined
      };
      setTickets(prev => prev.map(t => t.id === tempId ? dbTicket : t));
    }

    // Reset Form
    setNewTitle("");
    setNewDescription("");
    setNewPriority("MEDIUM");
    setSelectedFile(null);
    setIsUploading(false);
  };

  // Submit new Comment (All roles)
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedTicketId || !userProfile) return;

    setIsSubmittingComment(true);

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      ticket_id: selectedTicketId,
      user_id: userProfile.id,
      message: newCommentText.trim(),
      created_at: new Date().toISOString(),
      user_name: userProfile.name
    };

    const { data, error } = await supabase
      .from('comments')
      .insert({
        ticket_id: selectedTicketId,
        user_id: userProfile.id,
        message: newComment.message
      })
      .select(`
        id,
        message,
        created_at,
        user_id,
        profiles(name)
      `)
      .single();

    if (!error && data) {
      const dbComment: Comment = {
        id: data.id,
        ticket_id: selectedTicketId,
        user_id: data.user_id,
        message: data.message,
        created_at: data.created_at,
        user_name: (Array.isArray(data.profiles) ? data.profiles[0]?.name : (data.profiles as any)?.name) || userProfile.name
      };
      setComments(prev => [...prev, dbComment]);
    } else if (error) {
      console.error("Error creating comment:", error.message);
    }

    setNewCommentText("");
    setIsSubmittingComment(false);
  };

  // Close Ticket (Customer or Agent)
  const handleCloseTicket = async (ticketId: string) => {
    setIsActionLoading(true);

    const updated = tickets.map(t => t.id === ticketId ? { ...t, status: "CLOSED" as const } : t);
    setTickets(updated);

    const { error } = await supabase
      .from('tickets')
      .update({ status: 'CLOSED' })
      .eq('id', ticketId);

    if (error) {
      console.error("Error closing ticket:", error.message);
      setTickets(tickets);
    }
    setIsActionLoading(false);
  };

  // Change Status (Agent only)
  const handleStatusChange = async (ticketId: string, nextStatus: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED") => {
    setIsActionLoading(true);
    const updated = tickets.map(t => t.id === ticketId ? { ...t, status: nextStatus } : t);
    setTickets(updated);

    const { error } = await supabase
      .from('tickets')
      .update({ status: nextStatus })
      .eq('id', ticketId);

    if (error) {
      console.error("Error updating status:", error.message);
      setTickets(tickets);
    }
    setIsActionLoading(false);
  };

  // Logout trigger
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // Add new User (Agent only)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addEmail.trim() || !addPassword.trim()) {
      setAddError("Lütfen tüm alanları doldurun.");
      return;
    }
    if (addPassword.length < 6) {
      setAddError("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    setIsAddingUser(true);
    setAddError("");

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: addName.trim(),
          email: addEmail.trim(),
          password: addPassword,
          role: addRole
        })
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setAddError(data.error || "Kullanıcı oluşturulurken bir hata oluştu.");
      } else if (data.profile) {
        // Prepend to roster state
        setRoster(prev => [data.profile, ...prev]);
        // Reset and close modal
        setIsAddUserModalOpen(false);
        setAddName("");
        setAddEmail("");
        setAddPassword("");
        setAddRole("customer");
      }
    } catch (err) {
      console.error(err);
      setAddError("Kullanıcı oluşturulurken bir hata oluştu.");
    } finally {
      setIsAddingUser(false);
    }
  };

  // Delete User (Agent only)
  const handleDeleteUser = async (userId: string) => {
    setDeletingUserIds(prev => ({ ...prev, [userId]: true }));
    setUserToDelete(null);
  
    try {
      const res = await fetch(`/api/users?id=${userId}`, {
        method: "DELETE"
      });
      const data = await res.json();
  
      if (!res.ok || data.error) {
        alert(data.error || "Kullanıcı silinemedi.");
      } else {
        // Remove from roster state
        setRoster(prev => prev.filter(u => u.id !== userId));
      }
    } catch (err) {
      console.error(err);
      alert("Kullanıcı silinirken bir hata oluştu.");
    } finally {
      setDeletingUserIds(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    }
  };

  // Filter application
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "ALL" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "ALL" || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Calculate Priority indicator badges
  const getPriorityConfig = (priority?: string) => {
    switch (priority) {
      case "HIGH":
        return { label: "High", color: "text-orange-400 bg-orange-500/10 border-orange-500/20", icon: ArrowUp };
      case "MEDIUM":
        return { label: "Medium", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", icon: Minus };
      case "LOW":
      default:
        return { label: "Low", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: ArrowDown };
    }
  };

  // Status visual configurations
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return { label: "Open", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" };
      case "IN_PROGRESS":
        return { label: "In Progress", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" };
      case "RESOLVED":
        return { label: "Resolved", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
      case "CLOSED":
      default:
        return { label: "Closed", color: "text-slate-400 bg-slate-500/10 border-slate-500/20" };
    }
  };

  // Visual Ticket Age status
  const getTicketAge = (createdAtString: string) => {
    const createdAt = new Date(createdAtString);
    const days = Math.floor((Date.now() - createdAt.getTime()) / 86400000);
    if (days < 3) return { label: "Healthy", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-500" };
    if (days <= 7) return { label: "Warning", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", dot: "bg-yellow-500" };
    return { label: "Overdue", color: "text-red-400 bg-red-500/10 border-red-500/20", dot: "bg-red-500" };
  };

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  return (
    <div className="flex min-h-screen bg-bg-base text-text-primary">
      {/* Sidebar - Desktop */}
      <aside className="hidden w-64 border-r border-border-subtle bg-bg-surface p-6 md:flex flex-col justify-between shrink-0 select-none">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-glow">
              <FolderKanban className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-semibold text-lg tracking-tight block">NexDesk</span>
              <span className="text-text-muted text-[10px] uppercase font-mono tracking-wider">Help Desk</span>
            </div>
          </div>

          {/* User profile capsule */}
          {userProfile && (
            <div className="rounded-xl border border-border-subtle bg-bg-elevated p-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-primary to-violet-500 flex items-center justify-center font-bold text-xs text-white uppercase">
                {userProfile.name.slice(0, 2)}
              </div>
              <div className="overflow-hidden">
                <span className="font-semibold text-xs text-text-primary block truncate">{userProfile.name}</span>
                <span className="text-[10px] text-primary uppercase font-mono font-bold tracking-wider">
                  {userProfile.role}
                </span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="space-y-1">
            <button 
              onClick={() => { setActiveTab("dashboard"); setSelectedTicketId(null); }}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                activeTab === "dashboard" 
                  ? "bg-bg-selected text-primary font-semibold" 
                  : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
              }`}
            >
              <BarChart3 className="h-4.5 w-4.5" />
              <span>Dashboard</span>
            </button>
            <button 
              onClick={() => setActiveTab("tickets")}
              className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                activeTab === "tickets" 
                  ? "bg-bg-selected text-primary font-semibold" 
                  : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
              }`}
            >
              <div className="flex items-center gap-3">
                <CheckSquare className="h-4.5 w-4.5" />
                <span>Support Tickets</span>
              </div>
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">{tickets.length}</span>
            </button>
            {userProfile?.role === "agent" && (
              <button 
                onClick={() => { setActiveTab("team"); setSelectedTicketId(null); }}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === "team" 
                    ? "bg-bg-selected text-primary font-semibold" 
                    : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                }`}
              >
                <Users className="h-4.5 w-4.5" />
                <span>Agents & Users</span>
              </button>
            )}
            <button 
              onClick={() => { setActiveTab("settings"); setSelectedTicketId(null); }}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                activeTab === "settings" 
                  ? "bg-bg-selected text-primary font-semibold" 
                  : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
              }`}
            >
              <Settings className="h-4.5 w-4.5" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Sidebar Separator */}
          <div className="h-[1px] bg-border-subtle" />

          {/* Priorities list mock */}
          <div className="space-y-3">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-text-muted">Tickets priorities</span>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center justify-between text-text-secondary">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  High Priority
                </span>
                <span className="font-semibold">{tickets.filter(t => t.priority === "HIGH").length}</span>
              </li>
              <li className="flex items-center justify-between text-text-secondary">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-yellow-500" />
                  Medium Priority
                </span>
                <span className="font-semibold">{tickets.filter(t => t.priority === "MEDIUM").length}</span>
              </li>
              <li className="flex items-center justify-between text-text-secondary">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Low Priority
                </span>
                <span className="font-semibold">{tickets.filter(t => t.priority === "LOW").length}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer actions */}
        <div className="space-y-4">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Container */}
      <div className="flex flex-1 flex-col overflow-x-hidden">
        {/* Topbar */}
        <header className="flex h-16 items-center justify-between border-b border-border-subtle bg-bg-surface/50 px-6 backdrop-blur-md sticky top-0 z-40 select-none">
          <div className="flex items-center gap-4 w-1/3">
            {activeTab === "tickets" && (
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input 
                  type="text" 
                  placeholder="Search tickets by title..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-border-subtle bg-bg-base py-1.5 pl-9 pr-4 text-xs text-text-primary placeholder-text-muted outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </div>
            )}
          </div>

          {/* Database connection indicator */}
          <div className="flex items-center gap-4">
          </div>
        </header>

        {/* Dynamic Panels */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">

          {/* 1. Dashboard View */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-text-primary via-slate-100 to-text-secondary bg-clip-text text-transparent">
                  Backlog Overview
                </h1>
                <p className="mt-1 text-sm text-text-secondary">
                  High-level ticketing performance indicators and volume distribution.
                </p>
              </div>

              {/* Metrics card row */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border-subtle bg-bg-surface p-5 shadow-sm">
                  <span className="text-xs font-mono tracking-wider uppercase text-text-secondary font-bold">Open Tickets</span>
                  <div className="mt-2 text-3xl font-semibold text-indigo-400">
                    {tickets.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS").length}
                  </div>
                </div>
                <div className="rounded-xl border border-border-subtle bg-bg-surface p-5 shadow-sm">
                  <span className="text-xs font-mono tracking-wider uppercase text-text-secondary font-bold">Resolved / Closed</span>
                  <div className="mt-2 text-3xl font-semibold text-emerald-400">
                    {tickets.filter(t => t.status === "RESOLVED" || t.status === "CLOSED").length}
                  </div>
                </div>
                <div className="rounded-xl border border-border-subtle bg-bg-surface p-5 shadow-sm">
                  <span className="text-xs font-mono tracking-wider uppercase text-text-secondary font-bold">High/Critical Priority</span>
                  <div className="mt-2 text-3xl font-semibold text-orange-400">
                    {tickets.filter(t => t.priority === "HIGH").length}
                  </div>
                </div>
              </div>

              {/* Charts grid mock */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-border-subtle bg-bg-surface p-6">
                  <h3 className="text-xs font-mono tracking-wider uppercase text-text-secondary font-bold mb-4">Ticket Volume progression</h3>
                  <div className="relative h-48 w-full flex items-end">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="dbAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366F1" stopOpacity="0.3"/>
                          <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0"/>
                        </linearGradient>
                      </defs>
                      <path d="M0,85 Q20,50 40,75 T80,25 T100,10 L100,100 L0,100 Z" fill="url(#dbAreaGrad)" />
                      <path d="M0,85 Q20,50 40,75 T80,25 T100,10" fill="none" stroke="#6366F1" strokeWidth="2.5" />
                    </svg>
                    <div className="absolute inset-x-0 bottom-0 flex justify-between items-end text-[9px] font-mono text-text-muted px-1">
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat</span>
                      <span>Sun</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border-subtle bg-bg-surface p-6 flex flex-col justify-between">
                  <h3 className="text-xs font-mono tracking-wider uppercase text-text-secondary font-bold mb-4">Priority Breakdowns</h3>
                  <div className="flex items-center justify-around flex-1">
                    <div className="relative h-28 w-28 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#1E2230" strokeWidth="4" />
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#EF4444" strokeWidth="4.2" strokeDasharray="30 70" strokeDashoffset="0" />
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F59E0B" strokeWidth="4.2" strokeDasharray="40 60" strokeDashoffset="-30" />
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10B981" strokeWidth="4.2" strokeDasharray="30 70" strokeDashoffset="-70" />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-xl font-bold">{tickets.length}</span>
                        <span className="text-[8px] text-text-secondary uppercase font-mono tracking-wider">Tickets</span>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-[11px] font-medium">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded bg-red-500 block" />
                        <span>High Priority</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded bg-yellow-500 block" />
                        <span>Medium Priority</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded bg-emerald-50 block" style={{backgroundColor: "#10B981"}} />
                        <span>Low Priority</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Tickets View (Split List-Detail Layout) */}
          {activeTab === "tickets" && (
            <div className="space-y-6">
              {/* Header and Add Task */}
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between select-none">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-text-primary via-slate-100 to-text-secondary bg-clip-text text-transparent">
                    Support Requests
                  </h1>
                  <p className="mt-1 text-sm text-text-secondary">
                    {userProfile?.role === "agent" 
                      ? "Viewing all tickets registered across the platform."
                      : "Manage your submitted support requests and tracking."}
                  </p>
                </div>
                
                {/* Create ticket button (only customers can submit) */}
                {userProfile?.role === "customer" && (
                  <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 rounded-lg bg-primary hover:bg-primary-hover px-4 py-2.5 text-xs font-semibold text-white transition-all shadow-glow hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Ticket</span>
                  </button>
                )}
              </div>

              {/* Main Workspace split */}
              <div className="grid gap-6 lg:grid-cols-12">
                
                {/* Ticket list panel */}
                <div className={`${selectedTicketId ? "lg:col-span-7" : "lg:col-span-12"} transition-all space-y-4`}>
                  {/* Filters Bar */}
                  <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border-subtle bg-bg-surface p-3 text-xs select-none">
                    <span className="text-text-secondary font-semibold font-mono uppercase tracking-wider flex items-center gap-1.5 pr-2">
                      <Filter className="h-3.5 w-3.5" />
                      Filters
                    </span>

                    {/* Status filter */}
                    <div className="flex items-center gap-1.5 rounded-lg border border-border-subtle bg-bg-base px-2.5 py-1 text-text-secondary">
                      <span className="opacity-80">Status:</span>
                      <BorderlessSelect 
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={[
                          { value: "ALL", label: "All Statuses" },
                          { value: "OPEN", label: "Open" },
                          { value: "IN_PROGRESS", label: "In Progress" },
                          { value: "RESOLVED", label: "Resolved" },
                          { value: "CLOSED", label: "Closed" }
                        ]}
                      />
                    </div>

                    {/* Priority filter */}
                    <div className="flex items-center gap-1.5 rounded-lg border border-border-subtle bg-bg-base px-2.5 py-1 text-text-secondary">
                      <span className="opacity-80">Priority:</span>
                      <BorderlessSelect 
                        value={priorityFilter}
                        onChange={setPriorityFilter}
                        options={[
                          { value: "ALL", label: "All Priorities" },
                          { value: "HIGH", label: "High" },
                          { value: "MEDIUM", label: "Medium" },
                          { value: "LOW", label: "Low" }
                        ]}
                      />
                    </div>
                  </div>

                  {/* List container */}
                  <div className="rounded-xl border border-border-subtle bg-bg-surface overflow-hidden">
                    {filteredTickets.length === 0 ? (
                      <div className="py-12 text-center flex flex-col items-center justify-center">
                        <HelpCircle className="h-8 w-8 text-text-muted mb-3" />
                        <p className="text-xs text-text-secondary font-semibold">No tickets found</p>
                        <p className="text-[11px] text-text-muted mt-1">
                          Create a ticket to get started, or check your active search query/filters.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border-subtle">
                        {filteredTickets.map((ticket) => {
                          const priority = getPriorityConfig(ticket.priority);
                          const PriorityIcon = priority.icon;
                          const status = getStatusBadge(ticket.status);
                          const age = getTicketAge(ticket.created_at);

                          return (
                            <div 
                              key={ticket.id}
                              onClick={() => setSelectedTicketId(ticket.id)}
                              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4.5 hover:bg-bg-hover/40 transition-all cursor-pointer border-l-2 ${
                                selectedTicketId === ticket.id ? "border-primary bg-bg-hover/20" : "border-transparent"
                              }`}
                            >
                              {/* Left column info */}
                              <div className="space-y-2 flex-1">
                                <h4 className="text-sm font-semibold text-text-primary leading-tight group-hover:text-primary">
                                  {ticket.title}
                                </h4>
                                <div className="flex flex-wrap items-center gap-2.5 text-[10px] text-text-secondary font-semibold">
                                  <span className="font-mono text-text-muted">By {ticket.creator_name || "Customer"}</span>
                                  <span className="h-1 w-1 rounded-full bg-text-disabled" />
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(ticket.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>

                              {/* Right column status values */}
                              <div className="flex items-center gap-2.5 justify-end shrink-0 select-none">
                                {/* Priority badge */}
                                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${priority.color}`}>
                                  <PriorityIcon className="h-3 w-3" />
                                  {priority.label}
                                </span>

                                {/* Status badge */}
                                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${status.color}`}>
                                  {status.label}
                                </span>

                                {/* Age Indicator dot & label */}
                                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${age.color}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${age.dot}`} />
                                  {age.label}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Ticket detail drawer panel */}
                {selectedTicketId && selectedTicket && (
                  <div className="lg:col-span-5 rounded-xl border border-border-subtle bg-bg-surface p-6 flex flex-col h-[600px] sticky top-20 overflow-y-auto">
                    
                    {/* Drawer header */}
                    <div className="flex justify-between items-start border-b border-border-subtle pb-4 mb-4">
                      <div className="space-y-1 max-w-[85%]">
                        <span className="text-[10px] font-mono text-text-muted block uppercase tracking-wider font-bold">Support Request Details</span>
                        <h3 className="text-base font-bold text-text-primary leading-snug">{selectedTicket.title}</h3>
                      </div>
                      <button 
                        onClick={() => setSelectedTicketId(null)}
                        className="rounded-lg p-1.5 hover:bg-bg-hover text-text-secondary hover:text-text-primary"
                      >
                        <X className="h-4.5 w-4.5" />
                      </button>
                    </div>

                    {/* Metadata boxes */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider font-bold">Created By</span>
                          <span className="block text-text-primary">{selectedTicket.creator_name || "Customer"}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider font-bold">Date Submitted</span>
                          <span className="block text-text-primary">{new Date(selectedTicket.created_at).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Status select/close trigger */}
                      <div className="flex items-center gap-4 py-2 px-3 rounded-lg border border-border-subtle bg-bg-elevated text-xs font-semibold">
                        <div className="flex-1 space-y-1">
                          <span className="text-[9px] font-mono text-text-muted uppercase tracking-wider block font-bold">Current Status</span>
                          <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${getStatusBadge(selectedTicket.status).color}`}>
                            {selectedTicket.status}
                          </span>
                        </div>

                        {/* Status controls depending on role */}
                        {userProfile?.role === "agent" ? (
                          <div className="flex items-center gap-1.5 border border-border-subtle bg-bg-base rounded px-2 py-1">
                            <span className="text-[10px] text-text-secondary">Update:</span>
                            <BorderlessSelect 
                              disabled={isActionLoading}
                              value={selectedTicket.status}
                              onChange={(val) => handleStatusChange(selectedTicket.id, val as any)}
                              options={[
                                { value: "OPEN", label: "Open" },
                                { value: "IN_PROGRESS", label: "In Progress" },
                                { value: "RESOLVED", label: "Resolved" },
                                { value: "CLOSED", label: "Closed" }
                              ]}
                              alignRight
                            />
                          </div>
                        ) : (
                          // Customer can close their own ticket
                          selectedTicket.status !== "CLOSED" && (
                            <button
                              disabled={isActionLoading}
                              onClick={() => handleCloseTicket(selectedTicket.id)}
                              className="rounded bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 px-2.5 py-1 text-[10px] text-red-400 font-bold transition-all"
                            >
                              Close Ticket
                            </button>
                          )
                        )}
                      </div>

                      {/* Ticket Description */}
                      <div className="space-y-1 border-t border-border-subtle pt-4">
                        <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider font-bold block">Description</span>
                        <p className="text-xs leading-relaxed text-text-secondary whitespace-pre-wrap">
                          {selectedTicket.description}
                        </p>
                      </div>

                      {/* Attachment file section */}
                      {selectedTicket.attachment_url && (
                        <div className="space-y-2 border-t border-border-subtle pt-4">
                          <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider font-bold block">Attachments</span>
                          <a 
                            href={selectedTicket.attachment_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 rounded-lg border border-border-subtle bg-bg-base text-[11px] font-semibold text-text-secondary hover:text-primary transition-all cursor-pointer"
                          >
                            <Paperclip className="h-3.5 w-3.5 text-text-muted shrink-0" />
                            <span className="truncate flex-1 hover:underline">{selectedTicket.attachment_name || "attachment"}</span>
                            <ExternalLink className="h-3 w-3 text-text-muted" />
                          </a>
                        </div>
                      )}

                      {/* Comments & history section */}
                      <div className="border-t border-border-subtle pt-4 space-y-3 flex-1 flex flex-col">
                        <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider font-bold block">Ticket History & Comments</span>
                        
                        {isLoadingComments ? (
                          <div className="py-6 flex justify-center">
                            <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                            {comments.length === 0 ? (
                              <p className="text-[10px] text-text-muted text-center py-4">No comments posted yet.</p>
                            ) : (
                              comments.map((comment) => (
                                <div key={comment.id} className="p-3 rounded-lg bg-bg-elevated border border-border-subtle space-y-1.5">
                                  <div className="flex justify-between items-center text-[9px] font-mono font-bold tracking-wide uppercase">
                                    <span className="text-primary">{comment.user_name || "User"}</span>
                                    <span className="text-text-muted">{new Date(comment.created_at).toLocaleString()}</span>
                                  </div>
                                  <p className="text-[11px] leading-relaxed text-text-secondary">{comment.message}</p>
                                </div>
                              ))
                            )}
                          </div>
                        )}

                        {/* Add comment form */}
                        <form onSubmit={handleAddComment} className="pt-2 border-t border-border-subtle">
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              required
                              placeholder="Write a response..."
                              value={newCommentText}
                              onChange={(e) => setNewCommentText(e.target.value)}
                              className="flex-1 rounded-lg border border-border-subtle bg-bg-base px-3 py-1.5 text-xs text-text-primary outline-none focus:border-primary placeholder-text-muted"
                            />
                            <button
                              type="submit"
                              disabled={isSubmittingComment}
                              className="rounded-lg bg-primary hover:bg-primary-hover px-3 py-1.5 text-xs font-semibold text-white transition-all disabled:opacity-50"
                            >
                              {isSubmittingComment ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                "Reply"
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Team Members View */}
          {activeTab === "team" && userProfile?.role === "agent" && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between select-none">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-text-primary via-slate-100 to-text-secondary bg-clip-text text-transparent">
                    Agents & Workspace Users
                  </h1>
                  <p className="mt-1 text-sm text-text-secondary">
                    Review names, emails, and permissions for users on the platform.
                  </p>
                </div>
                <button 
                  onClick={() => setIsAddUserModalOpen(true)}
                  className="flex items-center gap-2 rounded-lg bg-primary hover:bg-primary-hover px-4 py-2.5 text-xs font-semibold text-white transition-all shadow-glow hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add User</span>
                </button>
              </div>

              <div className="rounded-xl border border-border-subtle bg-bg-surface overflow-hidden">
                <div className="px-6 py-4.5 border-b border-border-subtle select-none">
                  <span className="text-sm font-semibold">Workspace Roster ({roster.length} members)</span>
                </div>

                <div className="divide-y divide-border-subtle">
                  {roster.length === 0 ? (
                    <div className="py-12 text-center flex flex-col items-center justify-center">
                      <Users className="h-8 w-8 text-text-muted mb-3" />
                      <p className="text-xs text-text-secondary font-semibold">Kullanıcı bulunamadı</p>
                    </div>
                  ) : (
                    roster.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-6 hover:bg-bg-hover/20 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-violet-500 flex items-center justify-center font-bold text-sm text-white uppercase select-none">
                            {p.name.slice(0, 2)}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-text-primary">{p.name}</div>
                            <div className="text-xs text-text-muted flex items-center gap-1.5 mt-0.5">
                              <Mail className="h-3 w-3" />
                              <span>{p.email}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 select-none">
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase ${
                            p.role === "agent"
                              ? "bg-primary/10 border border-primary/20 text-primary"
                              : "bg-bg-hover border border-border-subtle text-text-secondary"
                          }`}>
                            {p.role === "agent" ? "Support Agent" : "Customer"}
                          </span>
                          {p.id !== userProfile?.id && (
                            <button
                              disabled={deletingUserIds[p.id]}
                              onClick={() => setUserToDelete(p)}
                              className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                              title="Sil"
                            >
                              {deletingUserIds[p.id] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 4. Settings View */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-text-primary via-slate-100 to-text-secondary bg-clip-text text-transparent">
                  Settings
                </h1>
                <p className="mt-1 text-sm text-text-secondary">
                  Manage database configs, seedings, and local settings.
                </p>
              </div>

              <div className="max-w-xl">
                <div className="rounded-xl border border-border-subtle bg-bg-surface p-6 space-y-6">
                  <div className="flex items-center gap-3 text-primary">
                    <Globe className="h-5 w-5" />
                    <h3 className="text-sm font-semibold text-text-primary">Workspace Profile</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-secondary">Full Name</label>
                      <input 
                        type="text" 
                        disabled
                        value={userProfile?.name || "John Doe"} 
                        className="w-full rounded-lg border border-border-subtle bg-bg-base px-3 py-2 text-xs text-text-primary outline-none cursor-not-allowed opacity-75"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-secondary">Permission Role</label>
                      <input 
                        type="text" 
                        disabled
                        value={userProfile?.role.toUpperCase() || "CUSTOMER"} 
                        className="w-full rounded-lg border border-border-subtle bg-bg-base px-3 py-2 text-xs text-text-primary outline-none cursor-not-allowed opacity-75 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Stateful Modal Component for Ticket Creation (Customer only) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setIsCreateModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
          />

          <div className="relative w-full max-w-md rounded-xl border border-border-default bg-bg-surface p-6 shadow-lg animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-all"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-base font-semibold mb-4 bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent">
              Submit Support Request
            </h3>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-text-secondary font-bold">Ticket Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Login page crashes on mobile Safari"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-lg border border-border-subtle bg-bg-base px-3 py-2 text-xs text-text-primary placeholder-text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-text-secondary font-bold">Issue Description</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Provide detailed steps to reproduce the issue..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full rounded-lg border border-border-subtle bg-bg-base px-3 py-2 text-xs text-text-primary placeholder-text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none"
                />
              </div>

              <div className="space-y-1.5 font-sans">
                <label className="text-[10px] font-mono uppercase tracking-wider text-text-secondary font-bold block">Priority Level</label>
                <BlockSelect
                  value={newPriority}
                  onChange={setNewPriority}
                  options={[
                    { value: "LOW", label: "Low" },
                    { value: "MEDIUM", label: "Medium" },
                    { value: "HIGH", label: "High" }
                  ]}
                />
              </div>

              {/* Interactive File input select (Optional feature 1) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-text-secondary font-bold block">Attachments (Optional)</label>
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden" 
                />

                {selectedFile ? (
                  <div className="flex items-center gap-2 p-2 rounded-lg border border-primary/20 bg-primary/5 text-[11px] font-semibold text-text-primary">
                    <Paperclip className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate flex-1">{selectedFile.name}</span>
                    <button 
                      type="button" 
                      onClick={handleRemoveFile}
                      className="p-1 rounded hover:bg-bg-hover text-text-secondary hover:text-text-primary"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border border-dashed rounded-lg p-4 text-center cursor-pointer transition-all select-none flex flex-col items-center justify-center gap-1 bg-bg-base ${
                      isDragging 
                        ? "border-primary bg-primary/10 scale-[1.01] shadow-glow" 
                        : "border-border-subtle hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    <Paperclip className={`h-4.5 w-4.5 mb-1 transition-all ${isDragging ? "text-primary scale-110" : "text-text-muted hover:scale-105"}`} />
                    <span className={`text-[10px] font-bold block ${isDragging ? "text-primary" : "text-text-muted"}`}>
                      {isDragging ? "Drop your file here!" : "Drag & drop files here"}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => { setIsCreateModalOpen(false); handleRemoveFile(); }}
                  className="rounded-lg hover:bg-bg-hover border border-border-subtle px-4 py-2 text-xs font-semibold text-text-secondary transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isUploading}
                  className="rounded-lg bg-primary hover:bg-primary-hover px-4 py-2 text-xs font-semibold text-white transition-all shadow-glow disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isUploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Submit Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stateful Modal Component for User Creation (Agent only) */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => { setIsAddUserModalOpen(false); setAddError(""); }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
          />

          <div className="relative w-full max-w-md rounded-xl border border-border-default bg-bg-surface p-6 shadow-lg animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => { setIsAddUserModalOpen(false); setAddError(""); }}
              className="absolute right-4 top-4 rounded-lg p-1.5 hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-all"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-base font-semibold mb-4 bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent">
              Yeni Kullanıcı Ekle
            </h3>

            {addError && (
              <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-center text-xs text-red-400 font-semibold leading-relaxed">
                {addError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-text-secondary font-bold">Ad Soyad</label>
                <input 
                  type="text" 
                  required
                  placeholder="John Doe"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full rounded-lg border border-border-subtle bg-bg-base px-3 py-2 text-xs text-text-primary placeholder-text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-text-secondary font-bold">E-posta Adresi</label>
                <input 
                  type="email" 
                  required
                  placeholder="user@example.com"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="w-full rounded-lg border border-border-subtle bg-bg-base px-3 py-2 text-xs text-text-primary placeholder-text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-text-secondary font-bold">Şifre</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  className="w-full rounded-lg border border-border-subtle bg-bg-base px-3 py-2 text-xs text-text-primary placeholder-text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-text-secondary font-bold block">Kullanıcı Rolü</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAddRole("customer")}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                      addRole === "customer"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border-subtle bg-bg-base text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <span>Müşteri</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddRole("agent")}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                      addRole === "agent"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border-subtle bg-bg-base text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <span>Destek Temsilcisi</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => { setIsAddUserModalOpen(false); setAddError(""); }}
                  className="rounded-lg hover:bg-bg-hover border border-border-subtle px-4 py-2 text-xs font-semibold text-text-secondary transition-all"
                >
                  İptal
                </button>
                <button 
                  type="submit"
                  disabled={isAddingUser}
                  className="rounded-lg bg-primary hover:bg-primary-hover px-4 py-2 text-xs font-semibold text-white transition-all shadow-glow disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isAddingUser && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Kullanıcı Ekle</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stateful Modal Component for User Deletion Confirmation (Agent only) */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setUserToDelete(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
          />

          <div className="relative w-full max-w-sm rounded-xl border border-border-default bg-bg-surface p-6 shadow-lg animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setUserToDelete(null)}
              className="absolute right-4 top-4 rounded-lg p-1.5 hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-all"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-base font-semibold mb-2 text-red-400 font-sans">
              Kullanıcıyı Sil
            </h3>

            <p className="text-xs text-text-secondary leading-relaxed mb-6">
              <span className="font-semibold text-text-primary">{userToDelete.name}</span> (<span className="font-mono text-text-muted">{userToDelete.email}</span>) isimli kullanıcıyı kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>

            <div className="flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setUserToDelete(null)}
                className="rounded-lg hover:bg-bg-hover border border-border-subtle px-4 py-2 text-xs font-semibold text-text-secondary transition-all"
              >
                İptal
              </button>
              <button 
                type="button"
                onClick={() => handleDeleteUser(userToDelete.id)}
                className="rounded-lg bg-red-500 hover:bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-all shadow-glow"
              >
                Kullanıcıyı Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
