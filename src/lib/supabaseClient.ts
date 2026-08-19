import { createClient } from '@supabase/supabase-js'

/**
 * publishable/anon key 设计上就是给浏览器用的，打进客户端 bundle 里公开可见没问题——
 * 真正的访问控制靠 Postgres 的 RLS 规则（见 supabase/schema.sql），不是靠隐藏这把 key。
 */
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)
