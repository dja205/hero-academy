/**
 * ISS-023: Subscription Gating
 *
 * MVP stub — all content is accessible under the free plan.
 * The infrastructure exists so that future gating logic can be
 * added without changing call-sites.
 */

export function checkSubscription(
  _parentId: string,
): { allowed: boolean; plan: string } {
  return { allowed: true, plan: 'free' };
}
