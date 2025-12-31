// Class Resources Helper Functions
import type { ClassResource } from '@/types/database'

/**
 * Use one charge of a resource
 */
export function useResource(resources: ClassResource[], resourceId: string): ClassResource[] {
  return resources.map(r => {
    if (r.id === resourceId && r.current > 0) {
      return { ...r, current: r.current - 1 }
    }
    return r
  })
}

/**
 * Restore one charge of a resource
 */
export function restoreResource(resources: ClassResource[], resourceId: string): ClassResource[] {
  return resources.map(r => {
    if (r.id === resourceId && r.current < r.max) {
      return { ...r, current: r.current + 1 }
    }
    return r
  })
}

/**
 * Set a specific amount for a resource (e.g., for Lay on Hands HP pool)
 */
export function setResourceAmount(resources: ClassResource[], resourceId: string, amount: number): ClassResource[] {
  return resources.map(r => {
    if (r.id === resourceId) {
      return { ...r, current: Math.max(0, Math.min(amount, r.max)) }
    }
    return r
  })
}

/**
 * Short rest - restore all resources that recharge on short rest
 */
export function shortRest(resources: ClassResource[]): ClassResource[] {
  return resources.map(r => {
    if (r.recharge === 'short') {
      return { ...r, current: r.max }
    }
    return r
  })
}

/**
 * Long rest - restore all resources (both short and long rest)
 */
export function longRest(resources: ClassResource[]): ClassResource[] {
  return resources.map(r => ({ ...r, current: r.max }))
}

/**
 * Check if any resources need recharging
 */
export function hasDepletedResources(resources: ClassResource[]): boolean {
  return resources.some(r => r.current < r.max)
}

/**
 * Check if any short-rest resources are depleted
 */
export function needsShortRest(resources: ClassResource[]): boolean {
  return resources.some(r => r.recharge === 'short' && r.current < r.max)
}

/**
 * Check if any long-rest resources are depleted
 */
export function needsLongRest(resources: ClassResource[]): boolean {
  return resources.some(r => r.recharge === 'long' && r.current < r.max)
}

/**
 * Get display color based on recharge type
 */
export function getRechargeColor(recharge: 'short' | 'long' | 'passive'): string {
  if (recharge === 'short') return '#f59e0b' // amber
  if (recharge === 'passive') return '#6b7280' // gray
  return '#3b82f6' // blue for long
}

/**
 * Get Italian label for recharge type
 */
export function getRechargeLabel(recharge: 'short' | 'long' | 'passive'): string {
  if (recharge === 'short') return 'Riposo Breve'
  if (recharge === 'passive') return 'Sempre'
  return 'Riposo Lungo'
}
