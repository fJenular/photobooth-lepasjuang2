import { createClient } from '@supabase/supabase-js';

// Configuration interface
export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// Retrieve current Supabase settings (priority: localStorage -> process.env)
export function getSupabaseConfig(): SupabaseConfig {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  let anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (typeof window !== 'undefined') {
    const savedUrl = localStorage.getItem('supabase_url');
    const savedKey = localStorage.getItem('supabase_anon_key');
    if (savedUrl) url = savedUrl;
    if (savedKey) anonKey = savedKey;
  }

  // Sanitize defaults (if the placeholder values are present)
  if (url === 'your_supabase_url') url = '';
  if (anonKey === 'your_supabase_anon_key') anonKey = '';

  return { url, anonKey };
}

// Save Supabase credentials to localStorage
export function saveSupabaseConfig(url: string, anonKey: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('supabase_url', url);
    localStorage.setItem('supabase_anon_key', anonKey);
  }
}

// Clear custom Supabase config from localStorage
export function clearSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('supabase_url');
    localStorage.removeItem('supabase_anon_key');
  }
}

// Dynamically create a Supabase client
export function getSupabaseClient() {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    return null;
  }
  try {
    return createClient(url, anonKey, {
      auth: {
        persistSession: false,
      }
    });
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
}

// Check connection and check if table & bucket exist
export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const client = createClient(url, anonKey);
    
    // 1. Test query (captures table)
    const { data, error } = await client
      .from('captures')
      .select('id')
      .limit(1);

    if (error) {
      // If table doesn't exist, check error message
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        return { 
          success: false, 
          message: `Koneksi berhasil, tetapi tabel 'captures' tidak ditemukan. Silakan jalankan query SQL untuk membuat tabel tersebut.`
        };
      }
      return { success: false, message: `Error database: ${error.message}` };
    }

    // 2. Test storage upload/access check by listing bucket
    const { data: buckets, error: storageError } = await client
      .storage
      .listBuckets();

    if (storageError) {
      return { 
        success: true, 
        message: `Koneksi database sukses! Tetapi ada masalah mengakses storage: ${storageError.message}. Pastikan bucket bernama 'photos' sudah dibuat dengan akses Publik.`
      };
    }

    const hasPhotosBucket = buckets.some(b => b.name === 'photos');
    if (!hasPhotosBucket) {
      return { 
        success: true, 
        message: `Koneksi database sukses! Namun, storage bucket 'photos' belum dibuat. Silakan buat bucket bernama 'photos' dan atur menjadi Publik agar QR code berfungsi.`
      };
    }

    return { success: true, message: 'Koneksi database dan storage bucket online 100%!' };
  } catch (err: any) {
    return { success: false, message: `Gagal menghubungkan: ${err?.message || err}` };
  }
}

// Upload base64 image data to Supabase Storage
export async function uploadCaptureToSupabase(id: string, base64Image: string): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  try {
    // Convert base64 data to blob
    const base64Data = base64Image.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    const fileName = `${id}.png`;

    // Upload to 'photos' bucket
    const { data, error } = await client.storage
      .from('photos')
      .upload(fileName, blob, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      // Only log non-bucket-related errors to reduce console noise
      const isBucketError = error.message.includes('Bucket not found') || 
                           error.message.includes('not found') ||
                           error.message.includes('bucket');
      
      if (!isBucketError) {
        console.error('Storage upload error:', error.message);
      }
      
      return null;
    }

    // Get public URL
    const { data: publicUrlData } = client.storage
      .from('photos')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (error: any) {
    // Suppress bucket-related errors
    const errorMsg = error?.message || String(error);
    const isBucketError = errorMsg.includes('Bucket') || 
                          errorMsg.includes('not found') ||
                          errorMsg.includes('bucket');
    
    if (!isBucketError) {
      console.error('Upload exception:', errorMsg);
    }
    
    return null;
  }
}

// Insert capture record in DB
export async function insertCaptureRecord(record: {
  id: string;
  image_url: string;
  layout_type: string;
  frame_id: string;
}): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('captures')
      .insert([record]);

    if (error) {
      // Only log non-table-not-found errors
      const isTableError = error.message?.includes('does not exist') || 
                          error.message?.includes('captures');
      if (!isTableError) {
        console.error('Database insert error:', error.message);
      }
      return false;
    }
    return true;
  } catch (error) {
    // Silently handle - expected when table doesn't exist
    return false;
  }
}
