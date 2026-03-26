import { router } from '../trpc.js';
import { authRouter } from './auth.js';
import { companyRouter } from './company.js';
import { productRouter } from './product.js';
import { orderRouter } from './order.js';
import { employeeRouter } from './employee.js';
import { customerRouter } from './customer.js';
import { featureFlagRouter } from './featureFlag.js';
import { inventoryRouter } from './inventory.js';
import { invoiceRouter } from './invoice.js';

export const appRouter = router({
  auth: authRouter,
  company: companyRouter,
  product: productRouter,
  order: orderRouter,
  employee: employeeRouter,
  customer: customerRouter,
  featureFlag: featureFlagRouter,
  inventory: inventoryRouter,
  invoice: invoiceRouter,
});

export type AppRouter = typeof appRouter;
