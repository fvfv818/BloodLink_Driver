import { createClient } from '@supabase/supabase-js'

// انسخي الرابط والمفتاح من الصورة اللي عندك والصقيهم هنا
const supabaseUrl = 'https://fbhjmddtvzkucudgmvyy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiaGptZGR0dnprdWN1ZGdtdnl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzczMTYsImV4cCI6MjA4OTk1MzMxNn0.pAqgIN7c6QZwPReLa_uM293u_KVMUkdceQ_il_1H6D4' // كملي بقية الرمز الطويل هنا

export const supabase = createClient(supabaseUrl, supabaseKey)