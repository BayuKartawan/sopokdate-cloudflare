// server/utils/cache.ts

interface CacheEntry {
  data: any;
  timestamp: number;
}

// In-memory cache server-side
export const apiCache = new Map<string, CacheEntry>();

// Expiration/TTL cache: 5 menit (300.000 ms)
export const CACHE_EXPIRATION_MS = 5 * 60 * 1000;

/**
 * Mengosongkan cache untuk tabel tertentu atau seluruh cache jika tidak ditentukan.
 * @param tableName optional nama tabel untuk di-invalidate
 */
export function invalidateCache(tableName?: string) {
  const config = useRuntimeConfig();
  if (!config.enableServerCache) {
    // Jika cache tidak aktif, pastikan map cache kosong untuk menghemat memori
    if (apiCache.size > 0) {
      apiCache.clear();
    }
    return;
  }

  if (!tableName) {
    apiCache.clear();
    console.log("[Cache] Seluruh cache server telah dibersihkan.");
    return;
  }

  let deletedCount = 0;
  for (const key of apiCache.keys()) {
    try {
      const url = new URL(key);
      const tableParam = url.searchParams.get("table");
      if (tableParam === tableName) {
        apiCache.delete(key);
        deletedCount++;
      }
    } catch (e) {
      // Fallback jika key bukan URL valid
      if (
        key.includes(`table=${tableName}`) ||
        key.includes(`table=${encodeURIComponent(tableName)}`)
      ) {
        apiCache.delete(key);
        deletedCount++;
      }
    }
  }
  console.log(
    `[Cache] Invalidated ${deletedCount} server cache entries for table "${tableName}"`,
  );
}
