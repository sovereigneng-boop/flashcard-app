import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy singleton — createClient is NOT called at module evaluation time.
// This prevents build-time errors when NEXT_PUBLIC_* env vars are absent
// during SSR prerendering of static pages.
let _instance: SupabaseClient | undefined

function getInstance(): SupabaseClient {
  if (!_instance) {
    _instance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _instance
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop: string | symbol) {
    const instance = getInstance()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (instance as any)[prop]
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    return typeof value === 'function' ? (value as Function).bind(instance) : value
  },
})
