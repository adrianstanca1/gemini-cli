// Type definitions for the construction management system

export type View =
  | 'dashboard'
  | 'my-day'
  | 'foreman-dashboard'
  | 'principal-dashboard'
  | 'projects'
  | 'all-tasks'
  | 'map'
  | 'time'
  | 'timesheets'
  | 'documents'
  | 'safety'
  | 'financials'
  | 'users'
  | 'equipment'
  | 'templates'
  | 'tools'
  | 'audit-log'
  | 'settings'
  | 'chat'
  | 'clients'
  | 'invoices';

export enum Role {
  PRINCIPAL_ADMIN = 'Principal Admin',
  ADMIN = 'Admin',
  PM = 'Project Manager',
  FOREMAN = 'Foreman',
  OPERATIVE = 'Operative',
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  companyId: number | null; // null for PRINCIPAL_ADMIN
  avatarUrl?: string;
}

export interface Company {
  id: number;
  name: string;
  status: 'Active' | 'Suspended';
  subscriptionPlan: 'Basic' | 'Pro' | 'Enterprise';
  storageUsageGB: number;
}

export interface Location {
  address: string;
  lat: number;
  lng: number;
}

export interface Project {
  id: number | string;
  companyId: number;
  name: string;
  location: Location;
  budget: number;
  actualCost: number;
  startDate: Date;
  status: 'Planning' | 'Active' | 'Completed' | 'On Hold';
  imageUrl: string;
  projectType: string;
  workClassification: string;
  geofenceRadius?: number; // in meters
}

export enum TodoStatus {
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  DONE = 'Done',
}

export enum TodoPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  URGENT = 'Urgent',
}

export interface Task {
  id: number | string;
  projectId: number | string;
  title: string;
  description: string;
  status: TodoStatus;
  priority: TodoPriority;
  assigneeId: number | null;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  dependencies?: number[];
  location?: Location;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  companyName?: string;
  role?: Role;
}

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  company: Company | null;
  loading: boolean;
  error: string | null;
}

export enum Permission {
  // Projects
  VIEW_ALL_PROJECTS = 'VIEW_ALL_PROJECTS',
  VIEW_ASSIGNED_PROJECTS = 'VIEW_ASSIGNED_PROJECTS',
  CREATE_PROJECT = 'CREATE_PROJECT',
  MANAGE_PROJECT_DETAILS = 'MANAGE_PROJECT_DETAILS',
  MANAGE_PROJECT_TEMPLATES = 'MANAGE_PROJECT_TEMPLATES',

  // Tasks
  VIEW_ALL_TASKS = 'VIEW_ALL_TASKS',
  MANAGE_ALL_TASKS = 'MANAGE_ALL_TASKS',
  ASSIGN_TASKS = 'ASSIGN_TASKS',

  // Timesheets
  SUBMIT_TIMESHEET = 'SUBMIT_TIMESHEET',
  VIEW_ALL_TIMESHEETS = 'VIEW_ALL_TIMESHEETS',
  MANAGE_TIMESHEETS = 'MANAGE_TIMESHEETS',

  // Safety
  SUBMIT_SAFETY_REPORT = 'SUBMIT_SAFETY_REPORT',
  VIEW_SAFETY_REPORTS = 'VIEW_SAFETY_REPORTS',
  MANAGE_SAFETY_REPORTS = 'MANAGE_SAFETY_REPORTS',

  // Finances
  VIEW_FINANCES = 'VIEW_FINANCES',
  MANAGE_FINANCES = 'MANAGE_FINANCES',
  SUBMIT_EXPENSE = 'SUBMIT_EXPENSE',
  MANAGE_EXPENSES = 'MANAGE_EXPENSES',

  // Team
  VIEW_TEAM = 'VIEW_TEAM',
  MANAGE_TEAM = 'MANAGE_TEAM',

  // Documents
  VIEW_DOCUMENTS = 'VIEW_DOCUMENTS',
  MANAGE_DOCUMENTS = 'MANAGE_DOCUMENTS',
  UPLOAD_DOCUMENTS = 'UPLOAD_DOCUMENTS',

  // Equipment
  MANAGE_EQUIPMENT = 'MANAGE_EQUIPMENT',

  // Tools
  ACCESS_ALL_TOOLS = 'ACCESS_ALL_TOOLS',

  // Audit
  VIEW_AUDIT_LOG = 'VIEW_AUDIT_LOG',

  // Communication
  SEND_DIRECT_MESSAGE = 'SEND_DIRECT_MESSAGE',
}

export interface TimeEntry {
  id: number | string;
  userId: number;
  projectId: number | string;
  taskId?: number | string;
  startTime: Date;
  endTime: Date | null;
  description: string;
  isRunning: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SafetyIncident {
  id: number | string;
  projectId: number | string;
  reporterId: number;
  title: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'Investigating' | 'Resolved' | 'Closed';
  location?: Location;
  dateOccurred: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Equipment {
  id: number | string;
  name: string;
  type: string;
  status: 'Available' | 'In Use' | 'Maintenance' | 'Out of Service';
  location?: string;
  assignedProjectId?: number | string;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
}

export interface Client {
  id: number | string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  companyId: number;
}

export interface Invoice {
  id: number | string;
  clientId: number | string;
  projectId: number | string;
  amount: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Expense {
  id: number | string;
  projectId: number | string;
  userId: number;
  amount: number;
  description: string;
  category: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Paid';
  receiptUrl?: string;
  dateIncurred: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: number | string;
  userId: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: Date;
}

// Additional types for enhanced features
export interface ProjectPortfolioSummary {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalBudget: number;
  totalActualCost: number;
}

export interface TaskStatus {
  TODO: 'To Do';
  IN_PROGRESS: 'In Progress';
  DONE: 'Done';
}

export interface TaskPriority {
  LOW: 'Low';
  MEDIUM: 'Medium';
  HIGH: 'High';
  URGENT: 'Urgent';
}

export interface TimeEntryStatus {
  RUNNING: 'Running';
  STOPPED: 'Stopped';
}

export interface IncidentSeverity {
  LOW: 'Low';
  MEDIUM: 'Medium';
  HIGH: 'High';
  CRITICAL: 'Critical';
}

export interface SiteUpdate {
  id: number | string;
  projectId: number | string;
  userId: number;
  title: string;
  description: string;
  imageUrls?: string[];
  location?: Location;
  createdAt: Date;
}

export interface ProjectMessage {
  id: number | string;
  projectId: number | string;
  userId: number;
  message: string;
  createdAt: Date;
}

export interface Weather {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
}

export interface InvoiceStatus {
  DRAFT: 'Draft';
  SENT: 'Sent';
  PAID: 'Paid';
  OVERDUE: 'Overdue';
  CANCELLED: 'Cancelled';
}

export interface Quote {
  id: number | string;
  clientId: number | string;
  projectId?: number | string;
  amount: number;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';
  validUntil: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialKPIs {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
}

export interface MonthlyFinancials {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface CostBreakdown {
  labor: number;
  materials: number;
  equipment: number;
  overhead: number;
}

export interface TimesheetStatus {
  DRAFT: 'Draft';
  SUBMITTED: 'Submitted';
  APPROVED: 'Approved';
  REJECTED: 'Rejected';
}

export interface IncidentStatus {
  OPEN: 'Open';
  INVESTIGATING: 'Investigating';
  RESOLVED: 'Resolved';
  CLOSED: 'Closed';
}

export interface AuditLog {
  id: number | string;
  userId: number;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, any>;
  timestamp: Date;
}

export interface ResourceAssignment {
  id: number | string;
  projectId: number | string;
  userId: number;
  role: string;
  startDate: Date;
  endDate?: Date;
}

export interface Conversation {
  id: number | string;
  participants: number[];
  title?: string;
  lastMessageAt: Date;
  createdAt: Date;
}

export interface Message {
  id: number | string;
  conversationId: number | string;
  senderId: number;
  content: string;
  timestamp: Date;
  read: boolean;
}

export interface CompanySettings {
  id: number;
  companyId: number;
  workingHours: {
    start: string;
    end: string;
  };
  timezone: string;
  currency: string;
  dateFormat: string;
}

export interface ProjectAssignment {
  id: number | string;
  projectId: number | string;
  userId: number;
  role: string;
  assignedAt: Date;
}

export interface ProjectTemplate {
  id: number | string;
  name: string;
  description: string;
  tasks: Partial<Task>[];
  estimatedDuration: number;
  createdBy: number;
  createdAt: Date;
}

export interface ProjectInsight {
  id: number | string;
  projectId: number | string;
  type: string;
  title: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High';
  createdAt: Date;
}

export interface FinancialForecast {
  id: number | string;
  projectId: number | string;
  month: string;
  projectedRevenue: number;
  projectedExpenses: number;
  confidence: number;
}

export interface WhiteboardNote {
  id: number | string;
  projectId: number | string;
  userId: number;
  content: string;
  position: { x: number; y: number };
  color: string;
  createdAt: Date;
}

export interface BidPackage {
  id: number | string;
  projectId: number | string;
  title: string;
  description: string;
  estimatedCost: number;
  deadline: Date;
  status: 'Draft' | 'Published' | 'Closed';
  createdAt: Date;
}

export interface RiskAnalysis {
  id: number | string;
  projectId: number | string;
  riskType: string;
  description: string;
  probability: number;
  impact: number;
  mitigation: string;
  status: 'Open' | 'Mitigated' | 'Closed';
}

export interface Grant {
  id: number | string;
  title: string;
  description: string;
  amount: number;
  deadline: Date;
  eligibility: string[];
  status: 'Available' | 'Applied' | 'Awarded' | 'Rejected';
}

export interface Timesheet {
  id: number | string;
  userId: number;
  weekStarting: Date;
  entries: TimeEntry[];
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
  totalHours: number;
  submittedAt?: Date;
  approvedAt?: Date;
}

export interface Todo {
  id: number | string;
  userId: number;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: Date;
  priority: TodoPriority;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceLineItem {
  id: number | string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Document {
  id: number | string;
  projectId?: number | string;
  name: string;
  type: string;
  url: string;
  size: number;
  uploadedBy: number;
  uploadedAt: Date;
  status: 'Active' | 'Archived' | 'Deleted';
}

export interface UsageMetric {
  id: number | string;
  companyId: number;
  metric: string;
  value: number;
  date: Date;
}

export interface CompanyType {
  GENERAL_CONTRACTOR: 'General Contractor';
  SUBCONTRACTOR: 'Subcontractor';
  SUPPLIER: 'Supplier';
  CONSULTANT: 'Consultant';
  CLIENT: 'Client';
}

export interface ExpenseStatus {
  PENDING: 'Pending';
  APPROVED: 'Approved';
  REJECTED: 'Rejected';
  PAID: 'Paid';
}

export interface OperationalAlert {
  id: number | string;
  type: 'System' | 'Security' | 'Performance' | 'Maintenance';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  title: string;
  description: string;
  resolved: boolean;
  createdAt: Date;
  resolvedAt?: Date;
}

export const RolePermissions: Record<Role, Set<Permission>> = {
  [Role.PRINCIPAL_ADMIN]: new Set<Permission>(), // Special case, has all permissions
  [Role.ADMIN]: new Set<Permission>([
    Permission.VIEW_ALL_PROJECTS,
    Permission.CREATE_PROJECT,
    Permission.MANAGE_PROJECT_DETAILS,
    Permission.MANAGE_PROJECT_TEMPLATES,
    Permission.VIEW_ALL_TASKS,
    Permission.MANAGE_ALL_TASKS,
    Permission.ASSIGN_TASKS,
    Permission.VIEW_ALL_TIMESHEETS,
    Permission.MANAGE_TIMESHEETS,
    Permission.VIEW_SAFETY_REPORTS,
    Permission.MANAGE_SAFETY_REPORTS,
    Permission.VIEW_FINANCES,
    Permission.MANAGE_FINANCES,
    Permission.MANAGE_EXPENSES,
    Permission.VIEW_TEAM,
    Permission.MANAGE_TEAM,
    Permission.VIEW_DOCUMENTS,
    Permission.MANAGE_DOCUMENTS,
    Permission.UPLOAD_DOCUMENTS,
    Permission.MANAGE_EQUIPMENT,
    Permission.ACCESS_ALL_TOOLS,
    Permission.VIEW_AUDIT_LOG,
    Permission.SEND_DIRECT_MESSAGE,
  ]),
  [Role.PM]: new Set<Permission>([
    Permission.VIEW_ALL_PROJECTS,
    Permission.CREATE_PROJECT,
    Permission.MANAGE_PROJECT_DETAILS,
    Permission.VIEW_ALL_TASKS,
    Permission.MANAGE_ALL_TASKS,
    Permission.ASSIGN_TASKS,
    Permission.VIEW_ALL_TIMESHEETS,
    Permission.MANAGE_TIMESHEETS,
    Permission.VIEW_SAFETY_REPORTS,
    Permission.MANAGE_SAFETY_REPORTS,
    Permission.VIEW_FINANCES,
    Permission.SUBMIT_EXPENSE,
    Permission.VIEW_TEAM,
    Permission.VIEW_DOCUMENTS,
    Permission.UPLOAD_DOCUMENTS,
    Permission.MANAGE_EQUIPMENT,
    Permission.ACCESS_ALL_TOOLS,
    Permission.SEND_DIRECT_MESSAGE,
  ]),
  [Role.FOREMAN]: new Set<Permission>([
    Permission.VIEW_ASSIGNED_PROJECTS,
    Permission.ASSIGN_TASKS,
    Permission.MANAGE_TIMESHEETS,
    Permission.SUBMIT_TIMESHEET,
    Permission.VIEW_SAFETY_REPORTS,
    Permission.SUBMIT_SAFETY_REPORT,
    Permission.SUBMIT_EXPENSE,
    Permission.VIEW_TEAM,
    Permission.VIEW_DOCUMENTS,
    Permission.SEND_DIRECT_MESSAGE,
  ]),
  [Role.OPERATIVE]: new Set<Permission>([
    Permission.VIEW_ASSIGNED_PROJECTS,
    Permission.SUBMIT_TIMESHEET,
    Permission.SUBMIT_SAFETY_REPORT,
    Permission.VIEW_DOCUMENTS,
    Permission.SEND_DIRECT_MESSAGE,
  ]),
};
