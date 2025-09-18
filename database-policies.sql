-- Row Level Security Policies for Construction Management System
-- These policies ensure users can only access data from their own company

-- Helper function to get current user's company_id
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT company_id 
    FROM users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has specific role
CREATE OR REPLACE FUNCTION user_has_role(required_role user_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = required_role
    FROM users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Companies policies
CREATE POLICY "Users can view their own company" ON companies
  FOR SELECT USING (id = get_user_company_id());

CREATE POLICY "Company admins can update their company" ON companies
  FOR UPDATE USING (
    id = get_user_company_id() AND 
    (user_has_role('OWNER') OR user_has_role('PRINCIPAL_ADMIN') OR user_has_role('ADMIN'))
  );

-- Users policies
CREATE POLICY "Users can view users in their company" ON users
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can manage users in their company" ON users
  FOR ALL USING (
    company_id = get_user_company_id() AND 
    (user_has_role('OWNER') OR user_has_role('PRINCIPAL_ADMIN') OR user_has_role('ADMIN'))
  );

-- Projects policies
CREATE POLICY "Users can view projects in their company" ON projects
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Project managers can manage projects" ON projects
  FOR ALL USING (
    company_id = get_user_company_id() AND 
    (user_has_role('OWNER') OR user_has_role('PRINCIPAL_ADMIN') OR 
     user_has_role('ADMIN') OR user_has_role('PROJECT_MANAGER'))
  );

-- Todos policies
CREATE POLICY "Users can view todos in their company projects" ON todos
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id = get_user_company_id()
    )
  );

CREATE POLICY "Users can manage their assigned todos" ON todos
  FOR ALL USING (
    assigned_to = auth.uid() OR
    project_id IN (
      SELECT id FROM projects 
      WHERE company_id = get_user_company_id() AND 
      (user_has_role('OWNER') OR user_has_role('PRINCIPAL_ADMIN') OR 
       user_has_role('ADMIN') OR user_has_role('PROJECT_MANAGER') OR 
       user_has_role('FOREMAN'))
    )
  );

-- Time entries policies
CREATE POLICY "Users can view time entries in their company" ON time_entries
  FOR SELECT USING (
    user_id = auth.uid() OR
    project_id IN (
      SELECT id FROM projects WHERE company_id = get_user_company_id()
    )
  );

CREATE POLICY "Users can manage their own time entries" ON time_entries
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own time entries" ON time_entries
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Managers can approve time entries" ON time_entries
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE company_id = get_user_company_id() AND 
      (user_has_role('OWNER') OR user_has_role('PRINCIPAL_ADMIN') OR 
       user_has_role('ADMIN') OR user_has_role('PROJECT_MANAGER') OR 
       user_has_role('FOREMAN'))
    )
  );

-- Safety incidents policies
CREATE POLICY "Users can view incidents in their company projects" ON safety_incidents
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id = get_user_company_id()
    )
  );

CREATE POLICY "Users can report safety incidents" ON safety_incidents
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE company_id = get_user_company_id()
    )
  );

CREATE POLICY "Managers can manage safety incidents" ON safety_incidents
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE company_id = get_user_company_id() AND 
      (user_has_role('OWNER') OR user_has_role('PRINCIPAL_ADMIN') OR 
       user_has_role('ADMIN') OR user_has_role('PROJECT_MANAGER') OR 
       user_has_role('FOREMAN'))
    )
  );

-- Expenses policies
CREATE POLICY "Users can view expenses in their company projects" ON expenses
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE company_id = get_user_company_id()
    )
  );

CREATE POLICY "Users can create their own expenses" ON expenses
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    project_id IN (
      SELECT id FROM projects WHERE company_id = get_user_company_id()
    )
  );

CREATE POLICY "Users can update their own pending expenses" ON expenses
  FOR UPDATE USING (
    user_id = auth.uid() AND status = 'PENDING'
  );

CREATE POLICY "Managers can approve expenses" ON expenses
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE company_id = get_user_company_id() AND 
      (user_has_role('OWNER') OR user_has_role('PRINCIPAL_ADMIN') OR 
       user_has_role('ADMIN') OR user_has_role('PROJECT_MANAGER'))
    )
  );
