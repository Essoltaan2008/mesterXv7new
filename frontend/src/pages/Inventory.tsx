import { Search, Warehouse, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/store/auth';
import { useState } from 'react';

export default function Inventory() {
  const { user } = useAuthStore();
  const companyId = user?.companyId ?? 0;
  const [search, setSearch] = useState('');

  const { data: items, isLoading } = trpc.inventory.list.useQuery(
    { companyId },
    { enabled: companyId > 0 }
  );

  const filtered = items?.filter(item =>
    !search ||
    item.productName?.toLowerCase().includes(search.toLowerCase()) ||
    item.productSku?.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = items?.filter(i => i.quantity <= (i.reorderLevel ?? 10)).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inventory</h2>
          <p className="text-muted-foreground mt-1">{items?.length ?? 0} products tracked</p>
        </div>
        {lowStockCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <AlertTriangle size={16} className="text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
              {lowStockCount} items low on stock
            </span>
          </div>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search inventory..."
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
          ) : filtered?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Warehouse size={40} className="mb-3 opacity-30" />
              <p className="font-medium">No inventory records</p>
              <p className="text-sm mt-1">Add products and track their stock levels</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Product</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">SKU</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Category</th>
                    <th className="text-right px-6 py-3 font-medium text-muted-foreground">Quantity</th>
                    <th className="text-right px-6 py-3 font-medium text-muted-foreground">Reorder Level</th>
                    <th className="text-center px-6 py-3 font-medium text-muted-foreground">Stock Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered?.map((item) => {
                    const isLow = item.quantity <= (item.reorderLevel ?? 10);
                    const isOut = item.quantity === 0;
                    return (
                      <tr key={item.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-medium">{item.productName ?? '—'}</td>
                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{item.productSku ?? '—'}</td>
                        <td className="px-6 py-4 text-muted-foreground">{item.productCategory ?? '—'}</td>
                        <td className={`px-6 py-4 text-right font-bold ${isOut ? 'text-destructive' : isLow ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 text-right text-muted-foreground">{item.reorderLevel ?? 10}</td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant={isOut ? 'destructive' : isLow ? 'warning' : 'success'}>
                            {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
