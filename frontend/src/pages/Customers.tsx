import { useState } from 'react';
import { Plus, Search, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/store/auth';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function Customers() {
  const { user } = useAuthStore();
  const companyId = user?.companyId ?? 0;
  const [search, setSearch] = useState('');

  const { data: customers, isLoading } = trpc.customer.list.useQuery(
    { companyId, search: search || undefined, limit: 100 },
    { enabled: companyId > 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customers</h2>
          <p className="text-muted-foreground mt-1">{customers?.length ?? 0} customers</p>
        </div>
        <Button className="gap-2">
          <Plus size={16} />
          Add Customer
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : customers?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users size={40} className="mb-3 opacity-30" />
              <p className="font-medium">No customers yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Email</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Phone</th>
                    <th className="text-right px-6 py-3 font-medium text-muted-foreground">Total Spent</th>
                    <th className="text-center px-6 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {customers?.map((customer) => (
                    <tr key={customer.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium">{customer.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{customer.email ?? '—'}</td>
                      <td className="px-6 py-4 text-muted-foreground">{customer.phone ?? '—'}</td>
                      <td className="px-6 py-4 text-right font-semibold">{formatCurrency(customer.totalSpent)}</td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant={customer.status === 'active' ? 'success' : 'secondary'}>
                          {customer.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{formatDate(customer.createdAt)}</td>
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
