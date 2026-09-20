// Shared API types mirroring the C++ backend responses.

export type Role = 'citizen' | 'investigator' | 'admin';

export type ComplaintStatus =
  | 'submitted'
  | 'pending_review'
  | 'in_review'
  | 'assigned'
  | 'investigating'
  | 'additional_info_required'
  | 'resolved'
  | 'rejected';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface Verification {
  phone: boolean;
  email: boolean;
  nid: boolean;
  selfie: boolean;
  overall: 'unverified' | 'basic' | 'verified';
}

export interface User {
  _id: string;
  role: Role;
  name: string;
  email: string;
  phone: string;
  district?: string;
  verification: Verification;
  accountStatus: 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  district: string;
  upazila: string;
  area?: string;
  latitude?: number;
  longitude?: number;
}

export interface TimelineEvent {
  _id?: string;
  fromStatus: string;
  toStatus: string;
  reason?: string;
  createdAt: string;
  // public timeline variant
  status?: string;
  at?: string;
}

export interface Evidence {
  _id: string;
  complaintPublicId?: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  type: 'image' | 'video' | 'document';
  uploadedByRole?: string;
  createdAt: string;
}

export interface InfoRequest {
  _id: string;
  question: string;
  status: 'open' | 'answered';
  response?: string;
  createdAt: string;
  answeredAt?: string;
}

export interface InvestigationNote {
  _id: string;
  note: string;
  visibility: 'internal' | 'citizen_visible';
  createdAt: string;
}

export interface Complaint {
  _id: string;
  publicId: string;
  title: string;
  description: string;
  categoryId: string;
  category?: string;
  location?: Location;
  district: string;
  upazila: string;
  address?: string;
  incidentDate: string;
  incidentTime?: string;
  status: ComplaintStatus;
  priority: Priority;
  flagged?: boolean;
  flagReason?: string;
  assignedInvestigatorId?: string | null;
  createdAt: string;
  updatedAt: string;
  resolutionSummary?: string;
  submittedAt?: string;
  lastUpdatedAt?: string;
  timeline?: TimelineEvent[];
  infoRequests?: InfoRequest[];
  evidence?: Evidence[];
  notes?: InvestigationNote[];
  investigationNotes?: InvestigationNote[];
  reporter?: { name?: string; verificationOverall?: string };
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  complaintPublicId?: string;
  read: boolean;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiEnvelope<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: { code: string; fields?: Record<string, string> };
  pagination?: Pagination;
}

export interface DashboardStats {
  totalUsers: number;
  verifiedCitizens: number;
  pendingVerification: number;
  totalComplaints: number;
  pendingComplaints: number;
  activeInvestigations: number;
  resolvedComplaints: number;
  rejectedComplaints: number;
  complaintsByCategory: { category: string; count: number }[];
  complaintsByDistrict: { district: string; count: number }[];
  complaintsByStatus: Record<string, number>;
  monthlyTrend: { year: number; month: number; count: number }[];
  resolutionRate: number;
}

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  submitted: 'Submitted',
  pending_review: 'Pending Review',
  in_review: 'In Review',
  assigned: 'Assigned',
  investigating: 'Investigating',
  additional_info_required: 'Additional Info Required',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const REJECTION_REASONS = [
  { value: 'duplicate', label: 'Duplicate complaint' },
  { value: 'insufficient_evidence', label: 'Insufficient evidence' },
  { value: 'invalid_information', label: 'Invalid information' },
  { value: 'false_report', label: 'False report' },
  { value: 'outside_jurisdiction', label: 'Outside jurisdiction' },
  { value: 'policy_violation', label: 'Policy violation' },
  { value: 'unable_to_verify', label: 'Unable to verify' },
  { value: 'other', label: 'Other' },
];
