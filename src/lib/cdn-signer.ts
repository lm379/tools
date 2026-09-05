import crypto from 'crypto';

/**
 * Query-parameter name that carries the Type-A auth token in the signed URL.
 *
 * Historically this was `key` (which clashed conceptually with the S3 object
 * key). It now defaults to `sign`, and can be overridden with the
 * TYPEA_SIGN_PARAM env var if your CDN / origin expects a different name.
 */
const DEFAULT_SIGN_PARAM = 'sign';

export class CdnSigner {
  private signToken: string;
  private cdnDomain: string;
  private signParam: string;

  constructor(
    signToken: string,
    cdnDomain: string,
    signParam: string = DEFAULT_SIGN_PARAM
  ) {
    this.signToken = signToken;
    this.cdnDomain = cdnDomain;
    this.signParam = signParam;
  }

  /**
   * Generates a Type-A signed URL.
   *
   * Format: https://<DomainName>/<Filename>?sign=timestamp-rand-uid-md5hash
   * Hash:   md5(URI-timestamp-rand-uid-PrivateKey)
   *
   * Two implementation details that matter for signature verification:
   *
   * 1. `rand` must NOT contain hyphens — the verifier splits the auth token
   *    on '-' into [ts, rand, uid, md5hash], so a hyphenated UUID would break
   *    parsing. Hence we strip hyphens from crypto.randomUUID().
   *
   * 2. The URI must be percent-encoded BEFORE hashing. The S3 object key may
   *    contain spaces or other characters; the browser encodes them when
   *    making the request, and the verifier hashes `urlInfo.pathname` (which
   *    is encoded). Hashing the raw path would produce a mismatch.
   *
   * @param path Relative path (e.g. /filename.png)
   * @param expiresInSeconds Duration in seconds. Not part of the Type-A hash —
   *                         the verifier checks `now > timestamp + TTL`, so
   *                         `timestamp` is the CREATION time, not expiry.
   * @param uid User ID (optional, default 0)
   * @returns Signed URL
   */
  generateSignedUrl(path: string, expiresInSeconds: number = 300, uid: string = '0'): string {
    // Ensure path starts with /
    let uri = path.startsWith('/') ? path : `/${path}`;

    // Encode URI path. encodeURI keeps '/' intact and converts spaces to %20.
    uri = encodeURI(uri);

    const timestamp = Math.floor(Date.now() / 1000);
    const rand = crypto.randomUUID().replace(/-/g, '');

    // Hash construction: URI-timestamp-rand-uid-PrivateKey
    const rawString = `${uri}-${timestamp}-${rand}-${uid}-${this.signToken}`;
    const md5hash = crypto.createHash('md5').update(rawString).digest('hex');

    const authKey = `${timestamp}-${rand}-${uid}-${md5hash}`;

    // Remove trailing slash from domain if exists
    const domain = this.cdnDomain.endsWith('/') ? this.cdnDomain.slice(0, -1) : this.cdnDomain;

    return `https://${domain}${uri}?${this.signParam}=${authKey}`;
  }
}

// Singleton instance if env vars are present
export const cdnSigner = new CdnSigner(
  process.env.TYPEA_SIGN_TOKEN || '',
  process.env.CDN_DOMAIN || '',
  process.env.TYPEA_SIGN_PARAM || DEFAULT_SIGN_PARAM
);
