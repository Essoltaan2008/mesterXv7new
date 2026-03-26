import { useState } from 'react';
import { Plus, Search, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/store/auth';
import { formatCurrency, formatDate } from '@/lib/utils';

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'secondary'> = {
  draft: 'secondary',
  sent: 'info',
  paid: 'success',
  overdue: 'destructive',
  cancelled: 'secondary',
};

export default function Invoices() {
  const { user } = useAuthStore();
  const companyId = user?.companyId ?? 0;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: invoices, isLoading } = trpc.invoice.list.useQuery(
    { companyId, limit: 100 },
    { enabled: companyId > 0 }
  );

  const filtered = invoices?.filter(inv => {
    const matchesSearch = !search || inv.invoiceNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPaid = invoices?.filter(i => i.status === 'paid').reduce((s, i) => s + parseFloat(i.amount ?? '0'), 0) ?? 0;
  const totalOverdue = invoices?.filter(i => i.status === 'overdue').reduce((s, i) => s + parseFloat(i.amount ?? '0'), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Invoices</h2>
          <p className="text-muted-foreground mt-1">{invoices?.length ?? 0} invoices</p>
        </div>
        <Button className="gap-2">
          <Plus size={16} />
          New Invoice
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <p className="text-xs text-green-600 dark:text-green-400 font-medium">Paid</p>
          <p className="text-xl font-bold text-green-700 dark:text-green-300 mt-1">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">Overdue</p>
          <p className="text-xl font-bold text-red-700 dark:text-red-300 mt-1">{formatCurrency(totalOverdue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-64"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['', 'draft', 'sent', 'paid', 'overdue', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {status === '' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : filtered?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileText size={40} className="mb-3 opacity-30" />
              <p className="font-medium">No invoices found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Invoice #</th>
                    <th className="text-center px-6 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-6 py-3 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Due Date</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered?.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium">{invoice.invoiceNumber}</td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant={STATUS_VARIANTS[invoice.status ?? 'draft'] ?? 'secondary'}>
                          {invoice.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold">{formatCurrency(invoice.amount)}</td>
                      <td className="px-6 py-4 text-muted-foreground">{formatDate(invoice.dueDate)}</td>
                      <td className="px-6 py-4 text-muted-foreground">{formatDate(invoice.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
