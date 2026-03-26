import { useState } from 'react';
import { Plus, Search, UserCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/store/auth';
import { formatCurrency, formatDate } from '@/lib/utils';

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'secondary'> = {
  active: 'success',
  on_leave: 'warning',
  inactive: 'secondary',
};

export default function Employees() {
  const { user } = useAuthStore();
  const companyId = user?.companyId ?? 0;
  const [search, setSearch] = useState('');

  const { data: employees, isLoading } = trpc.employee.list.useQuery(
    { companyId, search: search || undefined },
    { enabled: companyId > 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Employees</h2>
          <p className="text-muted-foreground mt-1">{employees?.length ?? 0} employees</p>
        </div>
        <Button className="gap-2">
          <Plus size={16} />
          Add Employee
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search employees..."
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
          ) : employees?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <UserCheck size={40} className="mb-3 opacity-30" />
              <p className="font-medium">No employees yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Position</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Department</th>
                    <th className="text-right px-6 py-3 font-medium text-muted-foreground">Salary</th>
                    <th className="text-center px-6 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Hired</th>
                  </tr>
                </thead>
                <tbody>
                  {employees?.map((emp) => (
                    <tr key={emp.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                          <p className="text-xs text-muted-foreground">{emp.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{emp.position ?? '—'}</td>
                      <td className="px-6 py-4 text-muted-foreground">{emp.department ?? '—'}</td>
                      <td className="px-6 py-4 text-right font-semibold">{formatCurrency(emp.salary)}</td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant={STATUS_VARIANTS[emp.status ?? 'active'] ?? 'secondary'}>
                          {emp.status?.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{formatDate(emp.hireDate)}</td>
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
