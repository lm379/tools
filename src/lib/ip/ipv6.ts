
/**
 * IPv6 Subnet Calculator Utilities
 */

export interface IPv6SubnetResult {
  networkAddress: string;
  lastAddress: string; // IPv6 doesn't have a standard "broadcast", usually just range
  totalHosts: string; // Using string because BigInt can be huge
  prefixLength: number;
  compressed: string;
  expanded: string;
  error?: string;
}

/**
 * Validates if a string is a valid IPv6 address
 */
export function isValidIPv6(ip: string): boolean {
  // Basic regex for IPv6 (supports compressed ::)
  // This is a simplified regex, but covers most cases including ::
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
  return ipv6Regex.test(ip);
}

/**
 * Expands an IPv6 address to full 8-group notation
 */
export function expandIPv6(ip: string): string {
  if (!isValidIPv6(ip)) return '';

  let fullAddress = ip;
  const parts = ip.split('::');

  if (parts.length === 2) {
    const left = parts[0].split(':').filter(Boolean);
    const right = parts[1].split(':').filter(Boolean);
    const missing = 8 - (left.length + right.length);
    const zeros = Array(missing).fill('0000');
    
    // Handle empty left or right (e.g. ::1 or 2001::)
    const newParts = [];
    if (parts[0].length > 0) newParts.push(...left);
    else if (parts[0] === '' && left.length === 0) { /* :: at start */ }
    
    newParts.push(...zeros);
    
    if (parts[1].length > 0) newParts.push(...right);
    
    // Reconstruct with padding
    fullAddress = newParts.map(part => part.padStart(4, '0')).join(':');
  } else if (parts.length === 1) {
    fullAddress = parts[0].split(':').map(part => part.padStart(4, '0')).join(':');
  }

  // Ensure 8 groups (safety check)
  const finalParts = fullAddress.split(':');
  if (finalParts.length !== 8) {
      // Fallback for edge cases not covered above perfectly
      // Ideally logic above should be correct for valid IPs
      return ip; 
  }

  return finalParts.map(p => p.padStart(4, '0')).join(':');
}

/**
 * Compresses an IPv6 address
 */
export function compressIPv6(ip: string): string {
  if (!isValidIPv6(ip)) return '';
  
  // First expand to normalize
  const expanded = expandIPv6(ip);
  const parts = expanded.split(':').map(p => p.replace(/^0+/, '') || '0'); // remove leading zeros

  // Find longest sequence of zeros
  let bestStart = -1;
  let bestLen = 0;
  let currentStart = -1;
  let currentLen = 0;

  for (let i = 0; i < 8; i++) {
    if (parts[i] === '0') {
      if (currentStart === -1) {
        currentStart = i;
      }
      currentLen++;
    } else {
      if (currentLen > bestLen) {
        bestLen = currentLen;
        bestStart = currentStart;
      }
      currentStart = -1;
      currentLen = 0;
    }
  }
  // Check end
  if (currentLen > bestLen) {
    bestLen = currentLen;
    bestStart = currentStart;
  }

  if (bestLen > 1) {
    // Replace best sequence with empty string (will become ::)
    parts.splice(bestStart, bestLen, '');
    if (parts.length === 1 && parts[0] === '') {
        return '::'; // All zeros
    }
    // Join logic needs to handle the empty string correctly for ::
    let res = parts.join(':');
    // Fix double colons if at start or end or middle
    // If splice removed items and inserted '', join gives 'a::b' or '::b' or 'a::'
    // But join(':') on ['a', '', 'b'] gives 'a::b'
    // on ['', 'b'] gives ':b', need '::b'
    // on ['a', ''] gives 'a:', need 'a::'
    
    if (bestStart === 0) res = ':' + res;
    if (bestStart + bestLen === 8) res = res + ':';
    
    return res;
  }

  return parts.join(':');
}

/**
 * Converts IPv6 string to BigInt
 */
function ipv6ToBigInt(ip: string): bigint {
  const expanded = expandIPv6(ip);
  const hex = expanded.replace(/:/g, '');
  return BigInt('0x' + hex);
}

/**
 * Converts BigInt to IPv6 string (expanded)
 */
function bigIntToIPv6(num: bigint): string {
  const hex = num.toString(16).padStart(32, '0');
  const parts = [];
  for (let i = 0; i < 32; i += 4) {
    parts.push(hex.substring(i, i + 4));
  }
  return parts.join(':');
}

/**
 * Formats hosts count nicely
 */
function formatHosts(count: bigint): string {
  if (count <= BigInt(Number.MAX_SAFE_INTEGER)) {
    return count.toString();
  }
  return count.toString() + " (approx. 2^" + Math.floor(Math.log2(Number(count.toString().substring(0, 10))) + (count.toString().length - 10) * 3.32) + ")"; 
  // Simplified scientific notation logic or just return the full string if user wants precision
  // But for 2^128 it's too long.
  // Actually, standard subnet calculators usually just show "2^X" or a scientific notation for large subnets.
  // Let's just return the number string for now, UI can truncate if needed.
}

export function calculateSubnetIPv6(ip: string, prefixLength: number): IPv6SubnetResult {
  if (!isValidIPv6(ip)) {
    return {
      networkAddress: '',
      lastAddress: '',
      totalHosts: '0',
      prefixLength: 0,
      compressed: '',
      expanded: '',
      error: 'Invalid IPv6 Address'
    };
  }

  if (prefixLength < 0 || prefixLength > 128) {
    return {
      networkAddress: '',
      lastAddress: '',
      totalHosts: '0',
      prefixLength: 0,
      compressed: '',
      expanded: '',
      error: 'Invalid Prefix Length'
    };
  }

  const ipBigInt = ipv6ToBigInt(ip);
  
  // Mask: 1s for prefix, 0s for host
  // e.g. /64 -> 111... (64) ...000
  const mask = (BigInt(1) << BigInt(128)) - (BigInt(1) << BigInt(128 - prefixLength));
  
  const networkBigInt = ipBigInt & mask;
  
  // Last address: Network | (NOT Mask)
  // NOT Mask in 128 bit = (1<<128 - 1) XOR Mask
  const allOnes = (BigInt(1) << BigInt(128)) - BigInt(1);
  const hostMask = allOnes ^ mask;
  
  const lastAddressBigInt = networkBigInt | hostMask;
  
  // Total hosts = 2^(128-prefix)
  // For standard subnets /64, /128 etc.
  // /128 = 1 host
  // /127 = 2 hosts
  // IPv6 usually doesn't subtract network/broadcast for interface addresses in the same way, 
  // but for "subnet size" it's just the count.
  let totalHostsVal = BigInt(1) << BigInt(128 - prefixLength);
  
  // Format results
  const networkAddress = bigIntToIPv6(networkBigInt);
  const lastAddress = bigIntToIPv6(lastAddressBigInt);
  
  return {
    networkAddress: compressIPv6(networkAddress),
    lastAddress: compressIPv6(lastAddress),
    totalHosts: totalHostsVal.toString(),
    prefixLength,
    compressed: compressIPv6(ip),
    expanded: expandIPv6(ip)
  };
}
