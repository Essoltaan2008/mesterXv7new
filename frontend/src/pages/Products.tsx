import { useState } from 'react';
import { Plus, Search, Package, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/store/auth';
import { formatCurrency } from '@/lib/utils';

export default function Products() {
  const { user } = useAuthStore();
  const companyId = user?.companyId ?? 0;
  const [search, setSearch] = useState('');

  const { data: products, isLoading, refetch } = trpc.product.list.useQuery(
    { companyId, search: search || undefined },
    { enabled: companyId > 0 }
  );

  const filtered = products?.filter(p =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Products</h2>
          <p className="text-muted-foreground mt-1">{products?.length ?? 0} products in catalog</p>
        </div>
        <Button className="gap-2">
          <Plus size={16} />
          Add Product
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products..."
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
              <Package size={40} className="mb-3 opacity-30" />
              <p className="font-medium">No products found</p>
              <p className="text-sm mt-1">Add your first product to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Product</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">SKU</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Category</th>
                    <th className="text-right px-6 py-3 font-medium text-muted-foreground">Price</th>
                    <th className="text-right px-6 py-3 font-medium text-muted-foreground">Cost</th>
                    <th className="text-center px-6 py-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered?.map((product) => (
                    <tr key={product.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                            <Package size={14} className="text-primary" />
                          </div>
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{product.sku}</td>
                      <td className="px-6 py-4 text-muted-foreground">{product.category ?? '—'}</td>
                      <td className="px-6 py-4 text-right font-semibold">{formatCurrency(product.price)}</td>
                      <td className="px-6 py-4 text-right text-muted-foreground">{formatCurrency(product.cost)}</td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant={product.status === 'active' ? 'success' : 'secondary'}>
                          {product.status}
                        </Badge>
                      </td>
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
