import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import {
  User,
  Project,
  Permission,
  ProjectStatus,
  ProjectPortfolioSummary,
} from '../types';
import { api } from '../services/mockApi';
import { hasPermission } from '../services/auth';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { ProjectModal } from './CreateProjectModal';
import { ViewHeader } from './layout/ViewHeader';
import { Tag } from './ui/Tag';
import { computeProjectPortfolioSummary, PROJECT_STATUS_ORDER } from '../utils/projectPortfolio';

interface ProjectsViewProps {
  user: User;
  addToast: (message: string, type: 'success' | 'error') => void;
  onSelectProject: (project: Project) => void;
}

const statusAccent: Record<ProjectStatus, { bg: string; text: string }> = {
  PLANNING: { bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-300' },
  ACTIVE: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-300' },
  ON_HOLD: { bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-300' },
  COMPLETED: { bg: 'bg-primary/10', text: 'text-primary dark:text-primary-200' },
  CANCELLED: { bg: 'bg-slate-500/10', text: 'text-slate-500 dark:text-slate-300' },
};

const statusBarColor: Record<ProjectStatus, string> = {
  PLANNING: 'bg-sky-500',
  ACTIVE: 'bg-emerald-500',
  ON_HOLD: 'bg-amber-500',
  COMPLETED: 'bg-primary',
  CANCELLED: 'bg-rose-500',
};

const statusTagColor: Record<ProjectStatus, 'green' | 'blue' | 'red' | 'gray' | 'yellow'> = {
  PLANNING: 'blue',
  ACTIVE: 'green',
  ON_HOLD: 'yellow',
  COMPLETED: 'green',
  CANCELLED: 'red',
};

type SortKey = 'startDate' | 'endDate' | 'name' | 'budget' | 'progress';

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'startDate', label: 'Start date' },
  { value: 'endDate', label: 'End date' },
  { value: 'name', label: 'Name' },
  { value: 'budget', label: 'Budget' },
  { value: 'progress', label: 'Progress' },
];

const PROJECT_FILTERS: Array<{ label: string; value: 'ALL' | ProjectStatus }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Planning', value: 'PLANNING' },
  { label: 'On Hold', value: 'ON_HOLD' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value || 0);

const toTitleCase = (value: string): string => value.replace(/\b\w/g, (char) => char.toUpperCase());

const formatStatusLabel = (status: ProjectStatus): string =>
  toTitleCase(status.replace(/_/g, ' ').toLowerCase());

const formatDeadlineLabel = (daysRemaining: number, isOverdue: boolean): string => {
  if (daysRemaining === 0) {
    return 'Due today';
  }

  const absolute = Math.abs(daysRemaining);
  const suffix = absolute === 1 ? 'day' : 'days';

  return isOverdue ? `${absolute} ${suffix} overdue` : `In ${absolute} ${suffix}`;
};

const ProjectCard: React.FC<{ project: Project; onSelect: () => void }> = ({ project, onSelect }) => {
  const budgetUtilization = project.budget > 0 ? (project.actualCost / project.budget) * 100 : 0;
  const statusStyles = statusAccent[project.status] ?? statusAccent.PLANNING;
  const overBudget = budgetUtilization > 100;

  return (
    <Card onClick={onSelect} className="group cursor-pointer space-y-4 transition-all hover:-translate-y-1 hover:shadow-lg animate-card-enter">
      <div className="relative h-40 overflow-hidden rounded-lg bg-muted">
        {project.imageUrl ? (
          <img
            src={project.imageUrl}
            alt={project.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            No cover image
          </div>
        )}
        <div className="absolute left-3 top-3 flex items-center gap-2 text-xs font-semibold">
          <Tag label={project.projectType} color="blue" />
          <Tag label={project.workClassification} color="gray" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground line-clamp-2">{project.name}</h3>
            <p className="text-xs text-muted-foreground">{project.location.address}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles.bg} ${statusStyles.text}`}>
            {formatStatusLabel(project.status)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Budget {formatCurrency(project.budget)}</span>
          <span className={overBudget ? 'font-semibold text-rose-500 dark:text-rose-300' : 'text-emerald-600 dark:text-emerald-300'}>
            {overBudget ? `+${Math.round(budgetUtilization - 100)}%` : `${Math.round(budgetUtilization)}% used`}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`${overBudget ? 'bg-rose-500' : 'bg-emerald-500'} h-full rounded-full transition-all`}
            style={{ width: `${Math.min(100, Math.max(0, budgetUtilization))}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Start {new Date(project.startDate).toLocaleDateString()}</span>
          <span>Due {new Date(project.endDate).toLocaleDateString()}</span>
        </div>
      </div>
    </Card>
  );
};

export const ProjectsView: React.FC<ProjectsViewProps> = ({ user, addToast, onSelectProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ProjectPortfolioSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | ProjectStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('startDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const canCreate = hasPermission(user, Permission.CREATE_PROJECT);
  const hasCompanyWideAccess = useMemo(
    () => hasPermission(user, Permission.VIEW_ALL_PROJECTS),
    [user]
  );

  const fetchProjects = useCallback(async () => {
    if (!user.companyId) {
      setProjects([]);
      setSummary(null);
      setSummaryError(null);
      setLoading(false);
      setSummaryLoading(false);
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current?.abort();
    abortControllerRef.current = controller;

    setLoading(true);
    setSummaryLoading(true);
    setSummary(null);
    setSummaryError(null);

    try {
      const projectsData = hasCompanyWideAccess
        ? await api.getProjectsByCompany(user.companyId, { signal: controller.signal })
        : await api.getProjectsByUser(user.id, { signal: controller.signal });

      if (controller.signal.aborted) {
        return;
      }

      setProjects(projectsData);

      if (!projectsData.length) {
        return;
      }

      try {
        const summaryData = await api.getProjectPortfolioSummary(user.companyId, {
          signal: controller.signal,
          projectIds: hasCompanyWideAccess ? undefined : projectsData.map((project) => project.id),
        });

        if (!controller.signal.aborted) {
          setSummary(summaryData);
        }
      } catch (summaryErr) {
        if (!controller.signal.aborted) {
          console.error('Failed to load project portfolio summary', summaryErr);
          setSummary(null);
          setSummaryError('Portfolio insights are currently unavailable.');
        }
      }
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      console.error('Failed to load projects', error);
      addToast('Failed to load projects.', 'error');
      setProjects([]);
      setSummary(null);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setSummaryLoading(false);
      }
    }
  }, [user, addToast, hasCompanyWideAccess]);

  useEffect(() => {
    fetchProjects();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchProjects]);

  const filteredProjects = useMemo(() => {
    const baseProjects = filter === 'ALL' ? projects : projects.filter((project) => project.status === filter);


    const query = searchQuery.trim().toLowerCase();

    const searchedProjects = query
      ? baseProjects.filter((project) => {
          const fields = [
            project.name,
            project.location?.address,
            project.projectType,
            project.workClassification,
          ].filter(Boolean) as string[];

          return fields.some((field) => field.toLowerCase().includes(query));
        })
      : baseProjects;

    const direction = sortDirection === 'asc' ? 1 : -1;

    const sortedProjects = [...searchedProjects].sort((a, b) => {
      let comparison = 0;

      switch (sortKey) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'startDate':
          comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
          break;
        case 'endDate':
          comparison = new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
          break;
        case 'budget':
          comparison = (a.budget ?? 0) - (b.budget ?? 0);
          break;
        case 'progress':
          comparison = (a.progress ?? 0) - (b.progress ?? 0);
          break;
        default:
          comparison = 0;
      }

      if (Number.isNaN(comparison)) {
        comparison = 0;
      }

      if (comparison === 0 && sortKey !== 'name') {
        comparison = a.name.localeCompare(b.name);
      }

      return comparison * direction;
    });

    return sortedProjects;
  }, [projects, filter, searchQuery, sortDirection, sortKey]);

  const hasActiveFilters =
    filter !== 'ALL' || searchQuery.trim() !== '' || sortKey !== 'startDate' || sortDirection !== 'asc';

  const handleResetFilters = useCallback(() => {
    setFilter('ALL');
    setSearchQuery('');
    setSortKey('startDate');
    setSortDirection('asc');
  }, []);

  const fallbackSummary = useMemo(() => computeProjectPortfolioSummary(projects), [projects]);
  const summaryForDisplay = summary ?? fallbackSummary;
  const activeShare = summaryForDisplay.totalProjects
    ? Math.round((summaryForDisplay.activeProjects / summaryForDisplay.totalProjects) * 100)
    : 0;

  const statusBreakdownEntries = useMemo(
    () =>
      PROJECT_STATUS_ORDER.map((status) => ({
        status,
        count: summaryForDisplay.statusBreakdown[status] ?? 0,
      })),
    [summaryForDisplay]
  );

  const portfolioSummary = useMemo(() => {
    if (projects.length === 0) {
      return {
        total: 0,
        active: 0,
        atRisk: 0,
        pipelineValue: 0,
      };
    }

    const active = projects.filter(p => p.status === 'ACTIVE').length;
    const atRisk = projects.filter(p => p.actualCost > p.budget).length;
    const pipelineValue = projects.reduce((acc, project) => acc + project.budget, 0);

    return {
      total: projects.length,
      active,
      atRisk,
      pipelineValue,
    };
  }, [projects]);

  const upcomingDeadlines = summaryForDisplay.upcomingDeadlines;

  const handleSuccess = useCallback(
    (newProject: Project) => {
      onSelectProject(newProject);
      fetchProjects();
    },
    [fetchProjects, onSelectProject]
  );

  return (
    <div className="space-y-6">
      {isCreateModalOpen && (
        <ProjectModal
          user={user}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleSuccess}
          addToast={addToast}
        />
      )}

      <ViewHeader
        view="projects"
        actions={
          canCreate ? (
            <Button onClick={() => setIsCreateModalOpen(true)}>Create Project</Button>
          ) : undefined
        }
        meta={[
          {
            label: 'Portfolio value',
            value: formatCurrency(summaryForDisplay.pipelineValue),
            helper: 'Budgeted across tracked projects',
          },
          {
            label: 'Active projects',
            value: `${summaryForDisplay.activeProjects}`,
            helper: summaryForDisplay.totalProjects
              ? `${activeShare}% of portfolio`
              : 'No projects yet',
            indicator: summaryForDisplay.activeProjects > 0 ? 'positive' : 'neutral',
          },
          {
            label: 'At risk',
            value: `${summaryForDisplay.atRiskProjects}`,
            helper: summaryForDisplay.overdueProjects
              ? `${summaryForDisplay.overdueProjects} overdue deliverable${
                  summaryForDisplay.overdueProjects === 1 ? '' : 's'
                }`
              : 'Budget and schedule on track',
            indicator:
              summaryForDisplay.atRiskProjects > 0 || summaryForDisplay.overdueProjects > 0
                ? 'negative'
                : 'positive',
          },
        ]}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Portfolio health</h2>
          {summaryLoading && !projects.length ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading insights...</p>
          ) : summaryForDisplay.totalProjects === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Create your first project to see portfolio insights.
            </p>
          ) : (
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Tracked budget</dt>
                <dd className="font-semibold text-foreground">{formatCurrency(summaryForDisplay.pipelineValue)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Actual cost to date</dt>
                <dd className="font-semibold text-foreground">{formatCurrency(summaryForDisplay.totalActualCost)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Budget variance</dt>
                <dd
                  className={`font-semibold ${
                    summaryForDisplay.budgetVariance < 0
                      ? 'text-rose-500 dark:text-rose-300'
                      : 'text-emerald-600 dark:text-emerald-300'
                  }`}
                >
                  {formatCurrency(summaryForDisplay.budgetVariance)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Average progress</dt>
                <dd className="font-semibold text-foreground">{Math.round(summaryForDisplay.averageProgress)}%</dd>
              </div>
            </dl>
          )}
          {summaryError ? (
            <p className="mt-4 text-xs text-destructive">{summaryError}</p>
          ) : null}
          {!hasCompanyWideAccess && summaryForDisplay.totalProjects > 0 ? (
            <p className="mt-4 text-xs text-muted-foreground">
              Insights reflect only the projects assigned to you.
            </p>
          ) : null}
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Status distribution</h2>
          {summaryForDisplay.totalProjects === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Once projects are underway, their status mix will appear here.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {statusBreakdownEntries.map(({ status, count }) => {
                const share = summaryForDisplay.totalProjects
                  ? Math.round((count / summaryForDisplay.totalProjects) * 100)
                  : 0;

                return (
                  <li key={status} className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide">
                      <span className={statusAccent[status].text}>{formatStatusLabel(status)}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`${statusBarColor[status]} h-full rounded-full transition-all`}
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Upcoming deadlines</h2>
          {summaryLoading && !upcomingDeadlines.length ? (
            <p className="mt-4 text-sm text-muted-foreground">Checking schedules...</p>
          ) : upcomingDeadlines.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No upcoming deadlines detected for your tracked projects.
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {upcomingDeadlines.map((deadline) => {
                const dueDate = new Date(deadline.endDate);
                const formattedDate = dueDate.toLocaleDateString();

                return (
                  <li key={deadline.id} className="rounded-lg border border-border/60 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{deadline.name}</p>
                        <p
                          className={`text-xs ${
                            deadline.isOverdue ? 'text-rose-500 dark:text-rose-300' : 'text-muted-foreground'
                          }`}
                        >
                          {formatDeadlineLabel(deadline.daysRemaining, deadline.isOverdue)} • {formattedDate}
                        </p>
                      </div>
                      <Tag
                        label={formatStatusLabel(deadline.status)}
                        color={statusTagColor[deadline.status]}
                        statusIndicator={deadline.isOverdue ? 'red' : 'green'}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </section>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by name, location, or type..."
            className="w-full rounded-md border border-border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="project-sort" className="text-sm font-medium text-muted-foreground">
            Sort by
          </label>
          <select
            id="project-sort"
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as SortKey)}
            className="rounded-md border border-border bg-background py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label={`Sort ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className={`h-4 w-4 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7l4-4 4 4M8 17l4 4 4-4" />
            </svg>
          </button>
          <Button type="button" variant="ghost" size="sm" onClick={handleResetFilters} disabled={!hasActiveFilters}>
            Reset
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {PROJECT_FILTERS.map((filterOption) => (
          <button
            key={filterOption.value}
            onClick={() => setFilter(filterOption.value)}
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              filter === filterOption.value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
            aria-pressed={filter === filterOption.value}
          >
            {filterOption.label}
          </button>
        ))}
      </div>

      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} onSelect={() => onSelectProject(project)} />
          ))}
        </div>
      ) : loading ? (
        <Card className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          Loading projects...
        </Card>
      ) : (
        <Card className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {projects.length === 0
              ? 'No projects have been created yet. Create your first project to get started.'
              : 'No projects match your current filters.'}
          </p>
          {projects.length > 0 && (
            <Button type="button" variant="secondary" size="sm" onClick={handleResetFilters}>
              Clear filters
            </Button>
          )}
        </Card>
      )}

      {projects.length > 0 && !loading ? (
        <p className="text-xs text-muted-foreground">
          {filteredProjects.length === projects.length
            ? `Showing all ${projects.length} project${projects.length === 1 ? '' : 's'}.`
            : `Showing ${filteredProjects.length} of ${projects.length} projects.`}
        </p>
      ) : null}
    </div>
  );
}

// export { ProjectsView };
