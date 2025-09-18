-- Seed data for Construction Management System
-- This populates the database with sample data for testing

-- Insert sample companies
INSERT INTO companies (id, name, status, subscription_plan, settings, contact_email, contact_phone, address) VALUES
('comp-1', 'ConstructCo Ltd', 'Active', 'PROFESSIONAL', '{"timezone": "UTC", "currency": "GBP"}', 'admin@constructco.com', '+44 20 1234 5678', '123 Construction Ave, London'),
('comp-2', 'Renovate Ltd', 'Active', 'STARTER', '{"timezone": "UTC", "currency": "GBP"}', 'info@renovate.com', '+44 161 987 6543', '456 Renovation St, Manchester'),
('comp-3', 'As Cladding and Roofing Ltd', 'Active', 'ENTERPRISE', '{"timezone": "UTC", "currency": "GBP"}', 'contact@ascladding.com', '+44 117 555 0123', '789 Cladding Road, Bristol')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  contact_email = EXCLUDED.contact_email,
  contact_phone = EXCLUDED.contact_phone,
  address = EXCLUDED.address;

-- Insert sample users
INSERT INTO construction_users (id, company_id, first_name, last_name, email, role, phone, avatar, is_active) VALUES
('user-1', 'comp-1', 'Samantha', 'Lee', 'sam@constructco.com', 'ADMIN', '07123456781', 'https://i.pravatar.cc/150?u=1', true),
('user-2', 'comp-1', 'David', 'Chen', 'david@constructco.com', 'PROJECT_MANAGER', '07123456782', 'https://i.pravatar.cc/150?u=2', true),
('user-3', 'comp-1', 'Maria', 'Garcia', 'maria@constructco.com', 'FOREMAN', '07123456783', 'https://i.pravatar.cc/150?u=3', true),
('user-4', 'comp-1', 'Bob', 'Williams', 'bob@constructco.com', 'OPERATIVE', '07123456784', 'https://i.pravatar.cc/150?u=4', true),
('user-5', 'comp-2', 'John', 'Smith', 'john@renovate.com', 'ADMIN', '07123456785', 'https://i.pravatar.cc/150?u=5', true),
('user-6', 'comp-2', 'Emily', 'White', 'emily@renovate.com', 'PROJECT_MANAGER', '07123456786', 'https://i.pravatar.cc/150?u=6', true),
('user-7', 'comp-1', 'Carlos', 'Diaz', 'carlos@constructco.com', 'OPERATIVE', '07123456787', 'https://i.pravatar.cc/150?u=7', true),
('user-8', 'comp-3', 'Adrian', 'Admin', 'admin@ascladding.com', 'OWNER', '07123456788', 'https://i.pravatar.cc/150?u=8', true),
('user-9', 'comp-3', 'Adrian', 'Stanca', 'adrian@ascladdingltd.co.uk', 'PRINCIPAL_ADMIN', '07123456789', 'https://i.pravatar.cc/150?u=9', true)
ON CONFLICT (email) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  phone = EXCLUDED.phone,
  avatar = EXCLUDED.avatar;

-- Insert sample projects
INSERT INTO construction_projects (id, company_id, name, description, status, budget, actual_cost, progress, start_date, location, image, project_manager_id) VALUES
('proj-101', 'comp-1', 'Downtown Tower', 'Modern office tower construction in city center', 'ACTIVE', 5000000.00, 3250000.00, 65, '2023-01-15', '{"address": "123 Main St, London", "lat": 51.5074, "lng": -0.1278}', 'https://picsum.photos/seed/tower/800/400', 'user-2'),
('proj-102', 'comp-1', 'North Bridge Retrofit', 'Infrastructure upgrade and modernization', 'COMPLETED', 1200000.00, 1350000.00, 100, '2022-11-01', '{"address": "456 Oak Ave, Manchester", "lat": 53.4808, "lng": -2.2426}', 'https://picsum.photos/seed/bridge/800/400', 'user-2'),
('proj-201', 'comp-2', 'Victorian House Renovation', 'Complete restoration of historic property', 'ACTIVE', 250000.00, 180000.00, 72, '2023-03-10', '{"address": "789 Pine Ln, Bristol", "lat": 51.4545, "lng": -2.5879}', 'https://picsum.photos/seed/house/800/400', 'user-6'),
('proj-301', 'comp-3', 'Commercial Cladding Project', 'External cladding installation for office complex', 'PLANNING', 800000.00, 50000.00, 5, '2024-01-01', '{"address": "321 Business Park, Birmingham", "lat": 52.4862, "lng": -1.8904}', 'https://picsum.photos/seed/cladding/800/400', 'user-9')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  budget = EXCLUDED.budget,
  actual_cost = EXCLUDED.actual_cost,
  progress = EXCLUDED.progress;

-- Insert sample todos/tasks
INSERT INTO construction_todos (id, project_id, title, description, status, priority, progress, assigned_to, due_date) VALUES
('task-1', 'proj-101', 'Finalize foundation pouring', 'Complete concrete foundation work for basement level', 'IN_PROGRESS', 'HIGH', 75, 'user-3', '2024-01-15 17:00:00+00'),
('task-2', 'proj-101', 'Install HVAC system on floor 5', 'Mount and connect heating/cooling units', 'TODO', 'MEDIUM', 0, 'user-4', '2024-01-20 17:00:00+00'),
('task-3', 'proj-101', 'Source interior fixtures', 'Procurement of lighting and electrical fixtures', 'TODO', 'LOW', 0, 'user-2', '2024-01-25 17:00:00+00'),
('task-4', 'proj-201', 'Restore original windows', 'Refurbish Victorian-era window frames', 'IN_PROGRESS', 'HIGH', 60, 'user-6', '2024-01-18 17:00:00+00'),
('task-5', 'proj-201', 'Update electrical wiring', 'Replace old wiring with modern standards', 'DONE', 'HIGH', 100, 'user-5', '2023-12-15 17:00:00+00'),
('task-6', 'proj-301', 'Site survey and measurements', 'Detailed measurements for cladding installation', 'TODO', 'URGENT', 0, 'user-9', '2024-01-10 17:00:00+00')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  priority = EXCLUDED.priority,
  progress = EXCLUDED.progress;

-- Insert sample time entries
INSERT INTO construction_time_entries (id, user_id, project_id, task_id, start_time, end_time, duration_minutes, description, status) VALUES
('time-1', 'user-3', 'proj-101', 'task-1', '2024-01-08 08:00:00+00', '2024-01-08 16:00:00+00', 480, 'Foundation concrete work', 'APPROVED'),
('time-2', 'user-4', 'proj-101', 'task-2', '2024-01-08 09:00:00+00', '2024-01-08 17:00:00+00', 480, 'HVAC preparation work', 'SUBMITTED'),
('time-3', 'user-6', 'proj-201', 'task-4', '2024-01-08 08:30:00+00', '2024-01-08 16:30:00+00', 480, 'Window restoration', 'APPROVED'),
('time-4', 'user-9', 'proj-301', 'task-6', '2024-01-08 10:00:00+00', '2024-01-08 14:00:00+00', 240, 'Initial site survey', 'DRAFT')
ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  status = EXCLUDED.status;

-- Insert sample safety incidents
INSERT INTO construction_safety_incidents (id, project_id, reported_by, title, description, severity, status, incident_date) VALUES
('incident-1', 'proj-101', 'user-3', 'Minor slip on wet surface', 'Worker slipped on wet concrete but no injury occurred', 'LOW', 'RESOLVED', '2024-01-07 14:30:00+00'),
('incident-2', 'proj-201', 'user-6', 'Electrical safety concern', 'Old wiring exposed during renovation work', 'MEDIUM', 'INVESTIGATING', '2024-01-08 11:15:00+00'),
('incident-3', 'proj-101', 'user-4', 'Equipment malfunction', 'Crane hydraulic system showing warning signs', 'HIGH', 'OPEN', '2024-01-08 15:45:00+00')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  severity = EXCLUDED.severity,
  status = EXCLUDED.status;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_construction_users_company_id ON construction_users(company_id);
CREATE INDEX IF NOT EXISTS idx_construction_users_email ON construction_users(email);
CREATE INDEX IF NOT EXISTS idx_construction_projects_company_id ON construction_projects(company_id);
CREATE INDEX IF NOT EXISTS idx_construction_projects_status ON construction_projects(status);
CREATE INDEX IF NOT EXISTS idx_construction_todos_project_id ON construction_todos(project_id);
CREATE INDEX IF NOT EXISTS idx_construction_todos_assigned_to ON construction_todos(assigned_to);
CREATE INDEX IF NOT EXISTS idx_construction_time_entries_user_id ON construction_time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_construction_time_entries_project_id ON construction_time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_construction_safety_incidents_project_id ON construction_safety_incidents(project_id);
