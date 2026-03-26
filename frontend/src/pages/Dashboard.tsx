import { ShoppingCart, Package, Users, UserCheck, FileText, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/store/auth';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';

function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  color = 'blue',
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  trend?: string;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
          </div>
          <div className={`p-3 rounded-full ${colorMap[color] ?? colorMap.blue}`}>
            <Icon size={22} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'info'> = {
    pending: 'warning',
    confirmed: 'info',
    shipped: 'default',
    delivered: 'success',
    cancelled: 'destructive',
  };
  return <Badge variant={variants[status] ?? 'default'}>{status}</Badge>;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const companyId = user?.companyId ?? 0;

  const { data: products, isLoading: loadingProducts } = trpc.product.list.useQuery(
    { companyId },
    { enabled: companyId > 0 }
  );
  const { data: orders, isLoading: loadingOrders } = trpc.order.list.useQuery(
    { companyId, limit: 10 },
    { enabled: companyId > 0 }
  );
  const { data: employees } = trpc.employee.list.useQuery(
    { companyId },
    { enabled: companyId > 0 }
  );
  const { data: customers } = trpc.customer.list.useQuery(
    { companyId },
    { enabled: companyId > 0 }
  );
  const { data: invoices } = trpc.invoice.list.useQuery(
    { companyId },
    { enabled: companyId > 0 }
  );

  const totalRevenue = orders?.reduce((sum, o) => sum + parseFloat(o.totalAmount ?? '0'), 0) ?? 0;
  const pendingOrders = orders?.filter(o => o.status === 'pending').length ?? 0;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}! 👋
        </h2>
        <p className="text-muted-foreground mt-1">Here's what's happening with your business today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={TrendingUp}
          color="green"
          trend={`${orders?.length ?? 0} orders total`}
        />
        <StatCard
          label="Orders"
          value={orders?.length ?? 0}
          icon={ShoppingCart}
          color="blue"
          trend={`${pendingOrders} pending`}
        />
        <StatCard
          label="Products"
          value={products?.length ?? 0}
          icon={Package}
          color="purple"
        />
        <StatCard
          label="Customers"
          value={customers?.length ?? 0}
          icon={Users}
          color="orange"
        />
        <StatCard
          label="Employees"
          value={employees?.length ?? 0}
          icon={UserCheck}
          color="red"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart size={18} />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingOrders ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : orders?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <AlertCircle size={32} className="mb-2 opacity-50" />
                <p className="text-sm">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders?.slice(0, 6).map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeTime(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <OrderStatusBadge status={order.status ?? 'pending'} />
                      <span className="text-sm font-semibold">{formatCurrency(order.totalAmount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package size={18} />
              Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingProducts ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : products?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <AlertCircle size={32} className="mb-2 opacity-50" />
                <p className="text-sm">No products yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {products?.slice(0, 6).map((product) => (
                  <div key={product.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sku} · {product.category ?? 'Uncategorized'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={product.status === 'active' ? 'success' : 'secondary'}>
                        {product.status}
                      </Badge>
                      <span className="text-sm font-semibold">{formatCurrency(product.price)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users size={18} />
              Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customers?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <AlertCircle size={32} className="mb-2 opacity-50" />
                <p className="text-sm">No customers yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {customers?.slice(0, 6).map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">{customer.email ?? customer.phone ?? '—'}</p>
                    </div>
                    <Badge variant={customer.status === 'active' ? 'success' : 'secondary'}>
                      {customer.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText size={18} />
              Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoices?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <AlertCircle size={32} className="mb-2 opacity-50" />
                <p className="text-sm">No invoices yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invoices?.slice(0, 6).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeTime(invoice.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        invoice.status === 'paid' ? 'success' :
                        invoice.status === 'overdue' ? 'destructive' :
                        invoice.status === 'sent' ? 'info' : 'secondary'
                      }>
                        {invoice.status}
                      </Badge>
                      <span className="text-sm font-semibold">{formatCurrency(invoice.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
