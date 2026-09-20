import { api, request, fetchFileBlob } from './api';
export { fetchFileBlob };
import type {
  ApiEnvelope,
  Category,
  Complaint,
  ComplaintStatus,
  DashboardStats,
  Evidence,
  Notification,
  Pagination,
  User,
} from '../types';

const unwrapList = <T,>(d: ApiEnvelope<T[]>): T[] => d.data ?? [];
const unwrapPaged = <T,>(d: ApiEnvelope<T[]>): (T[] & { pagination?: Pagination }) => {
  const arr = d.data ?? [] as T[];
  return Object.assign(arr, { pagination: d.pagination });
};
const unwrapOne = <T,>(d: ApiEnvelope<T>): T => {
  if (!d.data) throw new Error(d.message || 'Not found');
  return d.data;
};

// ---------- public ----------
export const getCategories = () => request<Category[]>(api.get('/api/v1/categories')).then(unwrapList);
export const trackComplaint = (publicId: string) =>
  request<Complaint>(api.get(`/api/v1/public/complaints/${publicId}`)).then(unwrapOne);

// ---------- citizen ----------
export interface ComplaintInput {
  title: string;
  description: string;
  categoryId: string;
  district: string;
  upazila: string;
  area?: string;
  address?: string;
  incidentDate: string;
  incidentTime?: string;
  latitude?: number;
  longitude?: number;
}

export const createComplaint = (body: ComplaintInput) =>
  request<{ complaint: Complaint; notice?: string }>(api.post('/api/v1/complaints', body)).then(unwrapOne);
export const getMyComplaints = (params?: { page?: number; limit?: number; status?: string }) =>
  request<Complaint[]>(api.get('/api/v1/complaints/my', { params })).then(unwrapPaged);
export const getComplaint = (publicId: string) =>
  request<Complaint>(api.get(`/api/v1/complaints/${publicId}`)).then(unwrapOne);
export const updateComplaint = (publicId: string, body: Partial<ComplaintInput>) =>
  request<Complaint>(api.patch(`/api/v1/complaints/${publicId}`, body)).then(unwrapOne);
export const respondInfoRequest = (publicId: string, response: string) =>
  request<void>(api.post(`/api/v1/complaints/${publicId}/additional-info`, { response }));

export const uploadEvidence = (publicId: string, files: File[], type: string) => {
  const fd = new FormData();
  files.forEach((f) => fd.append('file', f));
  fd.append('type', type);
  return request<{ saved: Evidence[] }>(
    api.post(`/api/v1/complaints/${publicId}/evidence`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  );
};
export const getEvidence = (publicId: string) =>
  request<Evidence[]>(api.get(`/api/v1/complaints/${publicId}/evidence`)).then(unwrapList);
export const deleteEvidence = (publicId: string, evidenceId: string) =>
  request<void>(api.delete(`/api/v1/complaints/${publicId}/evidence/${evidenceId}`));

export const submitNid = (nidNumber: string, name: string, file: File) => {
  const fd = new FormData();
  fd.append('nidNumber', nidNumber);
  fd.append('name', name);
  fd.append('file', file);
  return request<{ status: string; message: string }>(
    api.post('/api/v1/verification/nid', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  );
};
export const submitSelfie = (file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return request<{ status: string; message: string }>(
    api.post('/api/v1/verification/selfie', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  );
};

export const getNotifications = (params?: { page?: number }) =>
  request<Notification[]>(api.get('/api/v1/users/me/notifications', { params })).then(unwrapPaged);
export const markNotificationRead = (id: string) =>
  request<void>(api.patch(`/api/v1/users/me/notifications/${id}/read`));
export const getUnreadCount = () =>
  request<{ unread: number }>(api.get('/api/v1/users/me/notifications/unread-count')).then((d) => d.data ?? { unread: 0 });

export const updateProfile = (body: { name?: string; phone?: string; district?: string }) =>
  request<User>(api.patch('/api/v1/users/me', body)).then(unwrapOne);

// ---------- investigator ----------
export const getAssignedComplaints = (params?: { page?: number; limit?: number; status?: string }) =>
  request<Complaint[]>(api.get('/api/v1/investigator/complaints', { params })).then(unwrapPaged);
export const getInvestigatorCase = (publicId: string) =>
  request<Complaint>(api.get(`/api/v1/investigator/complaints/${publicId}`)).then(unwrapOne);
export const startInvestigation = (publicId: string) =>
  request<void>(api.post(`/api/v1/investigator/complaints/${publicId}/start`));
export const addNote = (publicId: string, note: string, visibility = 'internal') =>
  request<void>(api.post(`/api/v1/investigator/complaints/${publicId}/notes`, { note, visibility }));
export const requestInfo = (publicId: string, question: string) =>
  request<void>(api.post(`/api/v1/investigator/complaints/${publicId}/request-info`, { question }));
export const completeInvestigation = (publicId: string, finding: string, recommendation: string) =>
  request<void>(api.post(`/api/v1/investigator/complaints/${publicId}/complete`, { finding, recommendation }));

// ---------- admin ----------
export interface AdminComplaintFilters {
  page?: number;
  limit?: number;
  status?: ComplaintStatus | '';
  district?: string;
  priority?: string;
  search?: string;
  investigatorId?: string;
  flagged?: boolean;
}
export const getAdminComplaints = (params?: AdminComplaintFilters) =>
  request<Complaint[]>(api.get('/api/v1/admin/complaints', { params })).then(unwrapPaged);
export const getAdminComplaint = (publicId: string) =>
  request<Complaint>(api.get(`/api/v1/admin/complaints/${publicId}`)).then(unwrapOne);
export const setComplaintStatus = (publicId: string, status: string, reason?: string) =>
  request<void>(api.patch(`/api/v1/admin/complaints/${publicId}/status`, { status, reason }));
export const setComplaintPriority = (publicId: string, priority: string) =>
  request<void>(api.patch(`/api/v1/admin/complaints/${publicId}/priority`, { priority }));
export const assignInvestigator = (publicId: string, investigatorId: string) =>
  request<void>(api.post(`/api/v1/admin/complaints/${publicId}/assign`, { investigatorId }));
export const rejectComplaint = (publicId: string, reason: string, detail: string) =>
  request<void>(api.post(`/api/v1/admin/complaints/${publicId}/reject`, { reason, detail }));
export const confirmResolution = (publicId: string) =>
  request<void>(api.post(`/api/v1/admin/complaints/${publicId}/confirm`));

export const getAdminUsers = (params?: { page?: number; limit?: number; role?: string; accountStatus?: string; search?: string }) =>
  request<User[]>(api.get('/api/v1/admin/users', { params })).then(unwrapPaged);
export const setUserStatus = (id: string, accountStatus: 'active' | 'suspended') =>
  request<void>(api.patch(`/api/v1/admin/users/${id}/status`, { accountStatus }));
export const getInvestigators = () => request<User[]>(api.get('/api/v1/admin/investigators')).then(unwrapList);
export const createInvestigator = (body: { name: string; email: string }) =>
  request<void>(api.post('/api/v1/admin/investigators', body));

export const createCategory = (body: { name: string; description?: string }) =>
  request<Category>(api.post('/api/v1/admin/categories', body));
export const updateCategory = (id: string, body: { name?: string; description?: string; active?: boolean }) =>
  request<void>(api.patch(`/api/v1/admin/categories/${id}`, body));
export const deleteCategory = (id: string) => request<void>(api.delete(`/api/v1/admin/categories/${id}`));

export const getDashboard = () => request<DashboardStats>(api.get('/api/v1/admin/dashboard')).then(unwrapOne);

export interface AuditLog {
  _id: string;
  actorId?: string;
  actorName?: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceKey?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}
export const getAuditLogs = (params?: { page?: number; limit?: number; action?: string }) =>
  request<AuditLog[]>(api.get('/api/v1/admin/audit-logs', { params })).then(unwrapPaged);

export type { Pagination };
