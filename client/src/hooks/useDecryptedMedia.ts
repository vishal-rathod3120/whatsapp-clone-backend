import { useState, useEffect } from 'react';
import { decryptMediaFile } from '../services/e2ee/crypto';

export function useDecryptedMedia(
  url: string | null | undefined, 
  mediaKeyBase64?: string, 
  mediaIvBase64?: string, 
  mimeType: string = 'image/jpeg'
) {
  const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let isMounted = true;

    async function fetchAndDecrypt() {
      if (!url) {
        setDecryptedUrl(null);
        return;
      }
      
      // If no media keys provided, it's an unencrypted legacy/public file (like Avatars)
      // We can just use the remote URL directly.
      if (!mediaKeyBase64 || !mediaIvBase64) {
        setDecryptedUrl(url);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status} failed to fetch media`);
        
        const encryptedBlob = await response.blob();
        
        // Let crypto.ts decipher the blob securely into plaintext bytes
        const decryptedBlob = await decryptMediaFile(encryptedBlob, mediaKeyBase64, mediaIvBase64, mimeType);
        
        if (isMounted) {
          // Convert plaintext blob into a browser-native DOMString memory reference
          objectUrl = URL.createObjectURL(decryptedBlob);
          setDecryptedUrl(objectUrl);
        }
      } catch (err: any) {
        console.error('Failed to decrypt media:', err);
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchAndDecrypt();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [url, mediaKeyBase64, mediaIvBase64, mimeType]);

  return { decryptedUrl, loading, error };
}
