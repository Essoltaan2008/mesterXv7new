import { useState } from 'react';
import {
  ShoppingCart, Package, Warehouse, Users, FileText, UserCheck, Truck, BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/store/auth';

type Module = 'pos' | 'commerce' | 'inventory' | 'hr' | 'finance' | 'crm' | 'delivery' | 'analytics';

const MODULE_CONFIG: Record<Module, { label: string; description: string; icon: React.ElementType; color: string }> = {
  pos: { label: 'Point of Sale', description: 'In-store sales terminal and receipt management', icon: ShoppingCart, color: 'text-blue-500' },
  commerce: { label: 'Commerce', description: 'Online store, product catalog, and order management', icon: Package, color: 'text-purple-500' },
  inventory: { label: 'Inventory', description: 'Stock tracking, reorder alerts, and warehouse management', icon: Warehouse, color: 'text-orange-500' },
  hr: { label: 'Human Resources', description: 'Employee management, payroll, and attendance', icon: UserCheck, color: 'text-green-500' },
  finance: { label: 'Finance', description: 'Invoicing, expenses, and financial reporting', icon: FileText, color: 'text-yellow-500' },
  crm: { label: 'CRM', description: 'Customer relationships, leads, and sales pipeline', icon: Users, color: 'text-pink-500' },
  delivery: { label: 'Delivery', description: 'Delivery tracking, drivers, and logistics', icon: Truck, color: 'text-cyan-500' },
  analytics: { label: 'Analytics', description: 'Business intelligence, reports, and dashboards', icon: BarChart3, color: 'text-indigo-500' },
};

export default function FeatureFlags() {
  const { user } = useAuthStore();
  const companyId = user?.companyId ?? 0;
  const [toggling, setToggling] = useState<Module | null>(null);

  const { data: flags, refetch } = trpc.featureFlag.list.useQuery(
    { companyId },
    { enabled: companyId > 0 }
  );

  const toggleMutation = trpc.featureFlag.toggle.useMutation({
    onSuccess: () => {
      refetch();
      setToggling(null);
    },
    onError: () => setToggling(null),
  });

  const isEnabled = (module: Module) =>
    flags?.find(f => f.module === module)?.isEnabled ?? false;

  const handleToggle = (module: Module) => {
    setToggling(module);
    toggleMutation.mutate({
      companyId,
      module,
      isEnabled: !isEnabled(module),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Feature Flags</h2>
        <p className="text-muted-foreground mt-1">
          Enable or disable modules for your company. Changes take effect immediately.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(Object.entries(MODULE_CONFIG) as [Module, typeof MODULE_CONFIG[Module]][]).map(([module, config]) => {
          const enabled = isEnabled(module);
          const isToggling = toggling === module;
          const Icon = config.icon;

          return (
            <Card key={module} className={`transition-all ${enabled ? 'ring-1 ring-primary/20' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg bg-muted ${config.color}`}>
                      <Icon size={22} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{config.label}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{config.description}</p>
                    </div>
                  </div>

                  {/* Toggle switch */}
                  <button
                    onClick={() => handleToggle(module)}
                    disabled={isToggling}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 ${
                      enabled ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                    role="switch"
                    aria-checked={enabled}
                    aria-label={`Toggle ${config.label}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${enabled ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${enabled ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                    {enabled ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
