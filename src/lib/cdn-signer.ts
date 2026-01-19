import crypto from 'crypto';

export class CdnSigner {
  private signToken: string;
  private cdnDomain: string;

  constructor(signToken: string, cdnDomain: string) {
    this.signToken = signToken;
    this.cdnDomain = cdnDomain;
  }

  /**
   * Generates a Type-A signed URL
   * Format: http://DomainName/Filename?key=timestamp-rand-uid-md5hash
   * Hash: md5(URI-timestamp-rand-uid-PrivateKey)
   * 
   * @param path Relative path (e.g. /filename.png)
   * @param expiresInSeconds Duration in seconds. Note: This parameter is NOT used in the signature calculation for Type A as per standard, 
   *                         but the provided verification logic checks: now > timestamp + TTL.
   *                         So 'timestamp' in the signature must be the creation time, not expiration time.
   *                         Wait, looking at the provided verification code:
   *                         "if (now > (Number(ts) + TTL))"
   *                         This confirms 'ts' is Creation Time.
   *                         And the check is: Is Current Time > Creation Time + Fixed TTL?
   *                         So we should use current time as timestamp.
   * @param uid User ID (optional, default 0)
   * @returns Signed URL
   */
  generateSignedUrl(path: string, expiresInSeconds: number = 300, uid: string = '0'): string {
    // Hash construction: URI-timestamp-rand-uid-PrivateKey
    // NOTE: If using CDN, sometimes they expect encoded URI or decoded URI. 
    // Standard Type A usually uses raw URI path.
    // However, crypto.randomUUID() generates a UUID like '123e4567-e89b...'.
    // The previous implementation replaced '-' with '', but standard UUIDs have hyphens.
    // Let's check the verification code provided:
    // "const elements = sign.split('-');" 
    // "const [ts, rand, uid, md5hash] = elements;"
    // 
    // If 'rand' contains hyphens (from UUID), split('-') will BREAK the parsing!
    // Example: sign = "1700000000-123e4567-e89b-12d3-a456-426614174000-0-hash"
    // split('-') -> ["1700000000", "123e4567", "e89b", "12d3", ...] -> This is WRONG.
    // So 'rand' MUST NOT contain hyphens. 
    // My previous code: "const rand = crypto.randomUUID().replace(/-/g, '');" removed hyphens.
    // So 'rand' is safe (hex string).
    
    // BUT, let's look at the Hash Construction in verification:
    // "const hashText = [urlInfo.pathname, ts, rand, uid, PK].join('-');"
    // "const expectedHash = await md5(hashText);"
    
    // Issue might be 'urlInfo.pathname'.
    // If my 'uri' has different encoding than 'urlInfo.pathname' on server.
    // Node.js 'path' usually is decoded or partially encoded.
    // Browsers/Servers might normalize it.
    
    // Another possibility: The server 'TTL' constant is 300.
    // If I generate a link, and it takes > 300s to verify, it fails.
    // But you tested it immediately.
    
    // Let's re-read the verification code carefully:
    // "const hashText = [urlInfo.pathname, ts, rand, uid, PK].join('-');"
    
    // My code:
    // const rawString = `${uri}-${timestamp}-${rand}-${uid}-${this.signToken}`;
    
    // Are 'uri' and 'urlInfo.pathname' identical?
    // If I request "/file/test.png", uri is "/file/test.png".
    // urlInfo.pathname is "/file/test.png".
    
    // Wait, is 'PK' (PrivateKey) the same as 'this.signToken'? Yes.
    
    // Is 'rand' generation correct?
    // User code: "const elements = sign.split('-');"
    // If I generate rand without hyphens, it's one element. Correct.
    
    // Is 'uid' correct? Default '0'. Correct.
    
    // Is 'md5hash' calculation correct?
    // "const hashArray = Array.from(new Uint8Array(hashBuffer));"
    // "return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');"
    // This is standard Hex MD5. Node's crypto digest('hex') matches this.
    
    // What if 'rand' is too long or something? No restriction seen.
    
    // Let's look at the failure message: "Verify Sign Failed"
    // This specifically means: expectedHash !== md5hash.
    // So format is correct, timestamp is valid, but Hash mismatch.
    
    // This implies 'rawString' is different on client vs server.
    // The only variable parts are 'uri', 'timestamp', 'rand', 'uid', 'signToken'.
    // timestamp, rand, uid, signToken are likely identical if passed correctly in 'key' param.
    // So 'uri' (pathname) is the most likely culprit.
    
    // If I pass 'path' as "folder/file.png", I prepend "/".
    // If 'path' is "/folder/file.png", I keep it.
    // In S3 upload, we generated key like "2024-01-01/uuid-filename".
    // So path is "/2024-01-01/uuid-filename".
    
    // Is it possible the server sees URL decoded or encoded?
    // "const urlInfo = new URL(request.url);"
    // "urlInfo.pathname" in standard URL API is usually URL-encoded? 
    // No, URL.pathname is usually percent-decoded in some environments but encoded in others?
    // In Node.js: new URL('http://e.com/foo%20bar').pathname === '/foo%20bar' (It keeps encoding!)
    // But wait, actually it depends.
    // Chrome: new URL('http://e.com/foo%20bar').pathname -> "/foo%20bar"
    // Chrome: new URL('http://e.com/foo bar').pathname -> "/foo%20bar" (Auto encodes)
    
    // If my 'uri' string is NOT encoded, but server 'urlInfo.pathname' IS encoded (or vice versa).
    // Let's ensure 'uri' is encoded properly if it contains special chars?
    // But our keys are usually simple: date + uuid + filename.
    // Filename might have spaces or special chars!
    
    // If filename has space: "2024/uuid-foo bar.png"
    // Browser requests: ".../2024/uuid-foo%20bar.png"
    // Server 'urlInfo.pathname': "/2024/uuid-foo%20bar.png"
    // My 'uri' variable used for hash: "/2024/uuid-foo bar.png" (if not encoded)
    // MISMATCH!
    
    // Fix: We should probably encode the URI path before hashing, OR assume the input 'path' is already safe.
    // BUT, S3 keys often are raw strings.
    // Let's try to encode the URI to match standard URL behavior.
    
    // However, if I encode it, the URL I return is: `https://domain/encoded_path?key=...`
    // If I use encoded path in Hash, and server sees encoded path, it matches.
    
    // Let's try to encodeURI on the path.
    // BUT 'path' passed to function might already be encoded?
    // The input 'path' comes from database 'key' column. 
    // In 'confirm' route, we saved: `const uniqueFilename = `${date}/${uuid}-${filename}`;`
    // If filename has space, uniqueFilename has space.
    // S3 keys support spaces.
    
    // So 'key' in DB has spaces.
    // `generateSignedUrl` receives raw string with spaces.
    // `uri` has spaces.
    // `rawString` (Hash input) has spaces.
    // `return ... ${uri} ...` -> Browser will encode `uri` when making request.
    // Server receives encoded URL. `urlInfo.pathname` will be encoded (e.g. %20).
    // Server hashes encoded path.
    // Server Hash Input: "/...%20..."
    // My Hash Input: "/... ..."
    // MISMATCH.
    
    // SOLUTION: We must encode the URI before hashing and before returning.
    
    // Ensure path starts with /
    let uri = path.startsWith('/') ? path : `/${path}`;
    
    // Encode URI path (excluding slashes? No, encodeURI encodes spaces etc but keeps slashes)
    // But we need to be careful. `encodeURI` might not be enough if it's strict.
    // Usually `encodeURI` is correct for full paths.
    // Let's use `encodeURI(uri)`. 
    // If path contains `/`, encodeURI keeps it. Good.
    // If path contains space, it becomes `%20`. Good.
    
    uri = encodeURI(uri);

    const timestamp = Math.floor(Date.now() / 1000);
    const rand = crypto.randomUUID().replace(/-/g, '');
    
    // Hash construction: URI-timestamp-rand-uid-PrivateKey
    const rawString = `${uri}-${timestamp}-${rand}-${uid}-${this.signToken}`;
    const md5hash = crypto.createHash('md5').update(rawString).digest('hex');
    
    // Parameter name in verification code is 'key' (const KEY_NAME = 'key';)
    const authKey = `${timestamp}-${rand}-${uid}-${md5hash}`;
    
    // Remove trailing slash from domain if exists
    const domain = this.cdnDomain.endsWith('/') ? this.cdnDomain.slice(0, -1) : this.cdnDomain;
    
    return `https://${domain}${uri}?key=${authKey}`;
  }
}

// Singleton instance if env vars are present
export const cdnSigner = new CdnSigner(
  process.env.TYPEA_SIGN_TOKEN || '',
  process.env.CDN_DOMAIN || ''
);
