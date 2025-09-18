import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  User,
  FinancialKPIs,
  MonthlyFinancials,
  CostBreakdown,
  Invoice,
  Quote,
  Client,
  Project,
  Permission,
  Expense,
  ExpenseStatus,
  InvoiceStatus,
  QuoteStatus,
  FinancialForecast,
} from '../types';
import { api } from '../services/mockApi';
import { generateFinancialForecast } from '../services/ai';
import { getDerivedStatus, getInvoiceFinancials, formatCurrency } from '../utils/finance';
import { hasPermission } from '../services/auth';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { InvoiceStatusBadge } from './ui/StatusBadge';
import { Tag } from './ui/Tag';
import { ExpenseModal } from './ExpenseModal';
import ClientModal from './financials/ClientModal';
import InvoiceModal from './financials/InvoiceModal';
import PaymentModal from './financials/PaymentModal';

type FinancialsTab = 'dashboard' | 'invoices' | 'expenses' | 'clients';

type ModalType = 'client' | 'invoice' | 'payment' | 'expense' | null;

interface FinancialDataState {
  kpis: FinancialKPIs | null;
  monthly: MonthlyFinancials[];
  costs: CostBreakdown[];
  invoices: Invoice[];
  quotes: Quote[];
  expenses: Expense[];
  clients: Client[];
  projects: Project[];
  users: User[];
  forecasts: FinancialForecast[];
  companyName: string | null;
}

const BarChart: React.FC<{ data: { label: string; value: number }[]; barColor: string }> = ({ data, barColor }) => {
  const maxValue = Math.max(...data.map(entry => entry.value), 0);

  return (
    <div className="w-full h-64 flex items-end justify-around gap-2 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/40">
      {data.map(entry => (
        <div key={entry.label} className="flex flex-col items-center justify-end h-full w-full">
          <div
            className={`w-3/4 rounded-t-md transition-all ${barColor}`}
            style={{ height: `${maxValue > 0 ? Math.round((entry.value / maxValue) * 100) : 0}%` }}
            title={formatCurrency(entry.value)}
          />
          <span className="text-xs mt-2 text-slate-600 dark:text-slate-300">{entry.label}</span>
        </div>
      ))}
    </div>
  );
};

const forecastSummaryToElements = (summary: string) =>
  summary
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map((line, index) => (
      <p key={`${line}-${index}`} className="text-sm whitespace-pre-wrap leading-relaxed">
        {line}
      </p>
    ));

const expenseStatusColour = (status: ExpenseStatus): 'green' | 'blue' | 'red' | 'gray' | 'yellow' => {
  switch (status) {
    case ExpenseStatus.APPROVED:
      return 'green';
    case ExpenseStatus.PAID:
      return 'blue';
    case ExpenseStatus.REJECTED:
      return 'red';
    default:
      return 'yellow';
  }
};

export const FinancialsView: React.FC<{ user: User; addToast: (message: string, type: 'success' | 'error') => void }> = ({
  user,
  addToast,
}) => {
  const [activeTab, setActiveTab] = useState<FinancialsTab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FinancialDataState>({
    kpis: null,
    monthly: [],
    costs: [],
    invoices: [],
    quotes: [],
    expenses: [],
    clients: [],
    projects: [],
    users: [],
    forecasts: [],
    companyName: null,
  });
  const [modal, setModal] = useState<ModalType>(null);
  const [selectedItem, setSelectedItem] = useState<Client | Invoice | Expense | null>(null);
  const [isGeneratingForecast, setIsGeneratingForecast] = useState(false);
  const [forecastError, setForecastError] = useState<string | null>(null);
  const [forecastHorizon, setForecastHorizon] = useState(3);
  const abortControllerRef = useRef<AbortController | null>(null);

  const canManageFinances = hasPermission(user, Permission.MANAGE_FINANCES);
  const currency = data.kpis?.currency ?? 'GBP';

  const fetchData = useCallback(async () => {
    const controller = new AbortController();
    abortControllerRef.current?.abort();
    abortControllerRef.current = controller;

    if (!user.companyId) {
      setData(prev => ({ ...prev, invoices: [], expenses: [], clients: [], projects: [], forecasts: [] }));
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [
        kpiData,
        monthlyData,
        costsData,
        invoiceData,
        quoteData,
        expenseData,
        clientData,
        projectData,
        usersData,
        forecastData,
        companyData,
      ] = await Promise.all([
        api.getFinancialKPIsForCompany(user.companyId, { signal: controller.signal }),
        api.getMonthlyFinancials(user.companyId, { signal: controller.signal }),
        api.getCostBreakdown(user.companyId, { signal: controller.signal }),
        api.getInvoicesByCompany(user.companyId, { signal: controller.signal }),
        api.getQuotesByCompany(user.companyId, { signal: controller.signal }),
        api.getExpensesByCompany(user.companyId, { signal: controller.signal }),
        api.getClientsByCompany(user.companyId, { signal: controller.signal }),
        api.getProjectsByCompany(user.companyId, { signal: controller.signal }),
        api.getUsersByCompany(user.companyId, { signal: controller.signal }),
        api.getFinancialForecasts(user.companyId, { signal: controller.signal }),
        api.getCompanies({ signal: controller.signal }),
      ]);

      if (controller.signal.aborted) return;

      const companyRecord = companyData.find(entry => entry.id === user.companyId) as { name?: string } | undefined;

      setData({
        kpis: kpiData,
        monthly: monthlyData,
        costs: costsData,
        invoices: invoiceData,
        quotes: quoteData,
        expenses: expenseData,
        clients: clientData,
        projects: projectData,
        users: usersData,
        forecasts: forecastData,
        companyName: companyRecord?.name ?? null,
      });
      setForecastError(null);
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error('Failed to load financial data', error);
      addToast('Failed to load financial data', 'error');
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [addToast, user.companyId]);

  useEffect(() => {
    fetchData();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchData]);

  const projectMap = useMemo(() => new Map(data.projects.map(project => [project.id, project.name])), [data.projects]);
  const clientMap = useMemo(() => new Map(data.clients.map(client => [client.id, client.name])), [data.clients]);

  const approvedExpenses = useMemo(
    () => data.expenses.filter(expense => expense.status === ExpenseStatus.APPROVED || expense.status === ExpenseStatus.PAID),
    [data.expenses],
  );
  const approvedExpenseTotal = useMemo(
    () => approvedExpenses.reduce((sum, expense) => sum + (expense.amount ?? 0), 0),
    [approvedExpenses],
  );

  const invoiceMetrics = useMemo(() => {
    return data.invoices.reduce(
      (
        acc,
        invoice,
      ) => {
        const financials = getInvoiceFinancials(invoice);
        const derivedStatus = getDerivedStatus(invoice);
        acc.pipeline += financials.total;
        if (derivedStatus !== InvoiceStatus.PAID && derivedStatus !== InvoiceStatus.CANCELLED) {
          acc.outstanding += financials.balance;
        }
        if (derivedStatus === InvoiceStatus.OVERDUE) {
          acc.overdue += financials.balance;
        }
        return acc;
      },
      { pipeline: 0, outstanding: 0, overdue: 0 },
    );
  }, [data.invoices]);

  const latestForecast = data.forecasts[0] ?? null;
  const previousForecasts = data.forecasts.slice(1, 4);

  const revenueTrend = useMemo(() => data.monthly.map(entry => ({ label: entry.month, value: entry.revenue })), [data.monthly]);
  const profitTrend = useMemo(() => data.monthly.map(entry => ({ label: entry.month, value: entry.profit })), [data.monthly]);
  const costBreakdown = useMemo(() => data.costs.map(entry => ({ label: entry.category, value: entry.amount })), [data.costs]);

  const quoteSummary = useMemo(() => {
    return data.quotes.reduce(
      (acc, quote) => {
        acc.total += 1;
        acc[quote.status] = (acc[quote.status] ?? 0) + 1;
        return acc;
      },
      { total: 0 } as Record<'total' | QuoteStatus, number>,
    );
  }, [data.quotes]);

  const handleGenerateForecast = useCallback(
    async (horizonMonths: number) => {
      if (!user.companyId) {
        addToast('A company is required to generate forecasts.', 'error');
        return;
      }

      setIsGeneratingForecast(true);
      setForecastError(null);
      try {
        const result = await generateFinancialForecast({
          companyName: data.companyName ?? 'Your company',
          currency,
          horizonMonths,
          kpis: data.kpis,
          monthly: data.monthly,
          costs: data.costs,
          invoices: data.invoices,
          expenses: data.expenses,
        });

        const storedForecast = await api.createFinancialForecast(
          {
            companyId: user.companyId,
            summary: result.summary,
            horizonMonths,
            metadata: result.metadata,
            model: result.model,
          },
          user.id,
        );

        setData(prev => ({ ...prev, forecasts: [storedForecast, ...prev.forecasts] }));
        addToast(result.isFallback ? 'Generated offline financial forecast.' : 'Financial forecast updated.', 'success');
      } catch (error) {
        console.error('Failed to generate financial forecast', error);
        const message = error instanceof Error ? error.message : 'Unable to generate financial forecast.';
        setForecastError(message);
        addToast('Failed to generate financial forecast.', 'error');
      } finally {
        setIsGeneratingForecast(false);
      }
    },
    [addToast, currency, data.companyName, data.costs, data.expenses, data.invoices, data.kpis, data.monthly, user.companyId, user.id],
  );

  const handleCreateInvoice = useCallback(() => {
    setSelectedItem(null);
    setModal('invoice');
  }, []);

  const handleOpenInvoice = useCallback((invoice: Invoice) => {
    setSelectedItem(invoice);
    setModal('invoice');
  }, []);

  const handleRecordPayment = useCallback((invoice: Invoice) => {
    setSelectedItem(invoice);
    setModal('payment');
  }, []);

  const handleCreateExpense = useCallback(() => {
    setSelectedItem(null);
    setModal('expense');
  }, []);

  const handleEditExpense = useCallback((expense: Expense) => {
    setSelectedItem(expense);
    setModal('expense');
  }, []);

  const handleAddClient = useCallback(() => {
    setSelectedItem(null);
    setModal('client');
  }, []);

  const handleEditClient = useCallback((client: Client) => {
    setSelectedItem(client);
    setModal('client');
  }, []);

  const handleModalClose = () => {
    setModal(null);
    setSelectedItem(null);
  };

  const handleModalSuccess = () => {
    fetchData();
  };

  const selectedInvoice = modal === 'invoice' || modal === 'payment' ? (selectedItem as Invoice | null) : null;
  const selectedExpense = modal === 'expense' ? (selectedItem as Expense | null) : null;
  const selectedClient = modal === 'client' ? (selectedItem as Client | null) : null;
  const invoiceFinancials = selectedInvoice ? getInvoiceFinancials(selectedInvoice) : null;
  const isInvoiceReadOnly = !canManageFinances || (!!selectedInvoice && selectedInvoice.status === InvoiceStatus.PAID);

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="space-y-1 p-4">
          <p className="text-sm text-muted-foreground">Profitability</p>
          <p className="text-3xl font-semibold">
            {typeof data.kpis?.profitability === 'number' ? `${data.kpis.profitability.toFixed(1)}%` : '—'}
          </p>
        </Card>
        <Card className="space-y-1 p-4">
          <p className="text-sm text-muted-foreground">Project margin</p>
          <p className="text-3xl font-semibold">
            {typeof data.kpis?.projectMargin === 'number' ? `${data.kpis.projectMargin.toFixed(1)}%` : '—'}
          </p>
        </Card>
        <Card className="space-y-1 p-4">
          <p className="text-sm text-muted-foreground">Cash flow</p>
          <p className="text-3xl font-semibold">{formatCurrency(data.kpis?.cashFlow ?? 0, currency)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="space-y-4 p-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Revenue momentum</h2>
            <p className="text-sm text-muted-foreground">Trailing performance for the last reporting periods.</p>
          </div>
          {revenueTrend.length > 0 ? (
            <BarChart data={revenueTrend} barColor="bg-blue-500" />
          ) : (
            <p className="text-sm text-muted-foreground">No revenue history captured yet.</p>
          )}
        </Card>
        <Card className="space-y-4 p-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Profit trend</h2>
            <p className="text-sm text-muted-foreground">Observed profit trajectory across the same period.</p>
          </div>
          {profitTrend.length > 0 ? (
            <BarChart data={profitTrend} barColor="bg-emerald-500" />
          ) : (
            <p className="text-sm text-muted-foreground">No profit figures recorded.</p>
          )}
        </Card>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold">Cash outlook</h2>
            <p className="text-sm text-muted-foreground">Generate and review medium-term forecasts.</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground" htmlFor="forecast-horizon">
              Horizon (months)
            </label>
            <select
              id="forecast-horizon"
              className="border rounded px-2 py-1 text-sm bg-white dark:bg-slate-900"
              value={forecastHorizon}
              onChange={event => setForecastHorizon(Number(event.target.value))}
            >
              {[3, 6, 9, 12].map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <Button onClick={() => handleGenerateForecast(forecastHorizon)} isLoading={isGeneratingForecast}>
              Generate forecast
            </Button>
          </div>
        </div>
        {forecastError && <p className="text-sm text-destructive">{forecastError}</p>}
        {latestForecast ? (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-base font-semibold">Latest forecast</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(latestForecast.createdAt).toLocaleString()} • {latestForecast.horizonMonths}-month outlook
                </p>
              </div>
              {latestForecast.model && (
                <Tag label={latestForecast.model} color="blue" statusIndicator="blue" />
              )}
            </div>
            <div className="space-y-2">{forecastSummaryToElements(latestForecast.summary)}</div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Generate your first forecast to project runway and cash position.</p>
        )}
        {previousForecasts.length > 0 && (
          <details className="pt-2">
            <summary className="cursor-pointer text-sm text-muted-foreground">Previous runs</summary>
            <div className="mt-3 space-y-3 max-h-48 overflow-y-auto pr-2">
              {previousForecasts.map(entry => (
                <Card key={entry.id} className="p-3 space-y-1 bg-muted">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {new Date(entry.createdAt).toLocaleString()} • {entry.horizonMonths}-month horizon
                    </span>
                    {entry.model && <span>{entry.model}</span>}
                  </div>
                  <div className="space-y-1">{forecastSummaryToElements(entry.summary)}</div>
                </Card>
              ))}
            </div>
          </details>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 space-y-2">
          <h3 className="text-lg font-semibold">Invoice pipeline</h3>
          <p className="text-3xl font-semibold">{formatCurrency(invoiceMetrics.pipeline, currency)}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(invoiceMetrics.outstanding, currency)} outstanding • {formatCurrency(invoiceMetrics.overdue, currency)}
            {' '}overdue
          </p>
        </Card>
        <Card className="p-6 space-y-2">
          <h3 className="text-lg font-semibold">Approved expenses</h3>
          <p className="text-3xl font-semibold">{formatCurrency(approvedExpenseTotal, currency)}</p>
          <p className="text-sm text-muted-foreground">{approvedExpenses.length} approved or paid expenses</p>
        </Card>
        <Card className="p-6 space-y-2">
          <h3 className="text-lg font-semibold">Quote status</h3>
          <p className="text-sm text-muted-foreground">{quoteSummary.total} quotes tracked</p>
          <div className="flex flex-wrap gap-2 text-xs">
            {([QuoteStatus.DRAFT, QuoteStatus.SENT, QuoteStatus.ACCEPTED, QuoteStatus.REJECTED] as QuoteStatus[]).map(status => (
              <Tag key={status} label={`${status.toLowerCase()}: ${quoteSummary[status] ?? 0}`} />
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6 space-y-3">
        <h3 className="text-lg font-semibold">Cost allocation</h3>
        {costBreakdown.length > 0 ? (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
            {costBreakdown.map(entry => (
              <li key={entry.label} className="flex items-center justify-between bg-muted rounded px-3 py-2">
                <span>{entry.label}</span>
                <span className="font-medium">{formatCurrency(entry.value, currency)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No cost breakdown recorded.</p>
        )}
      </Card>
    </div>
  );

  const renderInvoices = () => (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Invoices</h2>
          <p className="text-sm text-muted-foreground">Raise, track and reconcile client invoices.</p>
        </div>
        {canManageFinances && <Button onClick={handleCreateInvoice}>Create invoice</Button>}
      </div>
      {data.invoices.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">No invoices recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Invoice</th>
                <th className="px-4 py-2 text-left font-medium">Client</th>
                <th className="px-4 py-2 text-left font-medium">Project</th>
                <th className="px-4 py-2 text-left font-medium">Issued</th>
                <th className="px-4 py-2 text-right font-medium">Total</th>
                <th className="px-4 py-2 text-right font-medium">Balance</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.invoices.map(invoice => {
                const financials = getInvoiceFinancials(invoice);
                const derivedStatus = getDerivedStatus(invoice);
                const clientName = clientMap.get(invoice.clientId) ?? 'Unknown client';
                const projectName = projectMap.get(invoice.projectId) ?? 'Unassigned project';
                return (
                  <tr key={invoice.id} className="bg-card">
                    <td className="px-4 py-3 font-medium">{invoice.invoiceNumber}</td>
                    <td className="px-4 py-3">{clientName}</td>
                    <td className="px-4 py-3">{projectName}</td>
                    <td className="px-4 py-3">{new Date(invoice.issueDate || invoice.issuedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(financials.total, currency)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(financials.balance, currency)}</td>
                    <td className="px-4 py-3">
                      <InvoiceStatusBadge status={derivedStatus} />
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenInvoice(invoice)}>
                        {canManageFinances ? 'Edit' : 'View'}
                      </Button>
                      {canManageFinances && financials.balance > 0 && (
                        <Button variant="secondary" size="sm" onClick={() => handleRecordPayment(invoice)}>
                          Record payment
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );

  const renderExpenses = () => (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Expenses</h2>
          <p className="text-sm text-muted-foreground">Monitor approved and pending project expenses.</p>
        </div>
        <Button onClick={handleCreateExpense}>Submit expense</Button>
      </div>
      {data.expenses.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">No expenses have been submitted.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Description</th>
                <th className="px-4 py-2 text-left font-medium">Project</th>
                <th className="px-4 py-2 text-right font-medium">Amount</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.expenses.map(expense => {
                const projectName = projectMap.get(expense.projectId) ?? 'Unassigned project';
                return (
                  <tr key={expense.id} className="bg-card">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium">{expense.description}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(expense.date || expense.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{projectName}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(expense.amount, currency)}</td>
                    <td className="px-4 py-3">
                      <Tag label={expense.status} color={expenseStatusColour(expense.status)} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEditExpense(expense)}>
                        View
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );

  const renderClients = () => (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Clients</h2>
          <p className="text-sm text-muted-foreground">Customer directory and billing preferences.</p>
        </div>
        <Button onClick={handleAddClient}>Add client</Button>
      </div>
      {data.clients.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">No clients added yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.clients.map(client => (
            <Card key={client.id} className="p-4 space-y-2 border border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">{client.name}</h3>
                <Button variant="ghost" size="sm" onClick={() => handleEditClient(client)}>
                  Edit
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{client.contactEmail}</p>
              <p className="text-sm text-muted-foreground">{client.contactPhone}</p>
              <p className="text-sm">{client.billingAddress}</p>
              <Tag label={client.paymentTerms ?? 'Net 30'} />
            </Card>
          ))}
        </div>
      )}
    </Card>
  );

  const renderContent = () => {
    if (loading) {
      return <Card>Loading financials...</Card>;
    }

    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'invoices':
        return renderInvoices();
      case 'expenses':
        return renderExpenses();
      case 'clients':
        return renderClients();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial command</h1>
          <p className="text-muted-foreground">
            Live cash position, billing pipeline and spend controls for {data.companyName ?? 'your organisation'}.
          </p>
        </div>
      </div>

      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {(['dashboard', 'invoices', 'expenses', 'clients'] as FinancialsTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`capitalize whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {renderContent()}

      {modal === 'invoice' && (
        <InvoiceModal
          invoiceToEdit={selectedInvoice ?? undefined}
          isReadOnly={isInvoiceReadOnly && !!selectedInvoice}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          user={user}
          clients={data.clients}
          projects={data.projects}
          addToast={addToast}
        />
      )}

      {modal === 'payment' && selectedInvoice && invoiceFinancials && (
        <PaymentModal
          invoice={selectedInvoice}
          balance={invoiceFinancials.balance}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          user={user}
          addToast={addToast}
        />
      )}

      {modal === 'expense' && (
        <ExpenseModal
          expenseToEdit={selectedExpense ?? null}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          user={user}
          projects={data.projects}
          addToast={addToast}
        />
      )}

      {modal === 'client' && (
        <ClientModal
          clientToEdit={selectedClient ?? undefined}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          user={user}
          addToast={addToast}
        />
      )}
    </div>
  );
};
