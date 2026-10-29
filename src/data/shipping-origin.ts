import { checkoutBranches } from './checkout-branches';
// Initial map centre only. Rates and bookings always resolve an active branch ID.
export const shippingOrigin = checkoutBranches[0];
