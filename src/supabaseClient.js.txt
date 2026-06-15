import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nkykpxwejbzyeslncoky.supabase.co'
const supabaseAnonKey = 'sb_publishable_2PbbEeVbOoPDaSd-PM0PRQ_YAd9Khrw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)