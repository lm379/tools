
/**
 * IP Subnet Calculator Utilities
 */

export interface SubnetResult {
  networkAddress: string;
  broadcastAddress: string;
  firstUsable: string;
  lastUsable: string;
  totalHosts: number;
  subnetMask: string;
  cidr: number;
  error?: string;
}

/**
 * Validates if a string is a valid IPv4 address
 */
export function isValidIPv4(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  
  return parts.every(part => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255 && part === num.toString();
  });
}

/**
 * Validates if a string is a valid Subnet Mask
 */
export function isValidSubnetMask(mask: string): boolean {
  if (!isValidIPv4(mask)) return false;
  const num = ipToInt(mask);
  // A valid subnet mask in binary is a sequence of 1s followed by a sequence of 0s
  // e.g. 11111111.11111111.11111111.00000000
  // ~(num & ~num) doesn't work simply because of JS bitwise behavior on signed 32-bit integers
  
  // Alternative check: Convert to binary string and check pattern
  const binary = numToBinary(num);
  const firstZero = binary.indexOf('0');
  const lastOne = binary.lastIndexOf('1');
  
  if (firstZero === -1) return true; // 255.255.255.255 (/32)
  if (lastOne === -1) return true; // 0.0.0.0 (/0)
  
  return lastOne < firstZero;
}

/**
 * Converts IP string to 32-bit integer (signed in JS)
 */
function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => {
    return (acc << 8) + parseInt(octet, 10);
  }, 0) >>> 0; // unsigned shift to ensure positive result
}

/**
 * Converts 32-bit integer to IP string
 */
function intToIp(int: number): string {
  return [
    (int >>> 24) & 255,
    (int >>> 16) & 255,
    (int >>> 8) & 255,
    int & 255
  ].join('.');
}

function numToBinary(num: number): string {
  return (num >>> 0).toString(2).padStart(32, '0');
}

/**
 * Converts Subnet Mask to CIDR
 */
export function maskToCIDR(mask: string): number {
  if (!isValidSubnetMask(mask)) return -1;
  const num = ipToInt(mask);
  // Count set bits
  let count = 0;
  let temp = num;
  // Since it's a valid mask, we can just count the 1s
  // But we need to be careful about the sign bit in JS
  // Using binary string is safer and easier
  const binary = numToBinary(num);
  for(const char of binary) {
    if (char === '1') count++;
    else break;
  }
  return count;
}

/**
 * Converts CIDR to Subnet Mask
 */
export function cidrToMask(cidr: number): string {
  if (cidr < 0 || cidr > 32) return '';
  if (cidr === 0) return '0.0.0.0';
  // Create a number with `cidr` number of 1s from the left
  // e.g. /24 -> 11111111... (24 times) ...00000000
  const mask = ~((1 << (32 - cidr)) - 1);
  return intToIp(mask);
}

/**
 * Calculates subnet information
 */
export function calculateSubnet(ip: string, maskOrCidr: string | number): SubnetResult {
  if (!isValidIPv4(ip)) {
    return {
      networkAddress: '',
      broadcastAddress: '',
      firstUsable: '',
      lastUsable: '',
      totalHosts: 0,
      subnetMask: '',
      cidr: 0,
      error: 'Invalid IP Address'
    };
  }

  let cidr: number;
  let subnetMask: string;

  if (typeof maskOrCidr === 'number') {
    if (maskOrCidr < 0 || maskOrCidr > 32) {
      return {
        networkAddress: '',
        broadcastAddress: '',
        firstUsable: '',
        lastUsable: '',
        totalHosts: 0,
        subnetMask: '',
        cidr: 0,
        error: 'Invalid CIDR'
      };
    }
    cidr = maskOrCidr;
    subnetMask = cidrToMask(cidr);
  } else {
    if (!isValidSubnetMask(maskOrCidr)) {
      return {
        networkAddress: '',
        broadcastAddress: '',
        firstUsable: '',
        lastUsable: '',
        totalHosts: 0,
        subnetMask: '',
        cidr: 0,
        error: 'Invalid Subnet Mask'
      };
    }
    subnetMask = maskOrCidr;
    cidr = maskToCIDR(subnetMask);
  }

  const ipInt = ipToInt(ip);
  const maskInt = ipToInt(subnetMask);
  
  const networkInt = ipInt & maskInt;
  // Broadcast: Network OR (NOT Mask)
  // In JS, ~maskInt is signed, so we use >>> 0 to treat as unsigned where needed, 
  // but bitwise operators work on 32-bit signed ints anyway.
  // We need to be careful with the ~ operator.
  const broadcastInt = (networkInt | (~maskInt & 0xFFFFFFFF)) >>> 0;

  const networkAddress = intToIp(networkInt);
  const broadcastAddress = intToIp(broadcastInt);

  let firstUsableInt = networkInt + 1;
  let lastUsableInt = broadcastInt - 1;
  let totalHosts = 0;

  // Special cases
  if (cidr === 32) {
    // Single host
    firstUsableInt = networkInt;
    lastUsableInt = networkInt;
    totalHosts = 1;
  } else if (cidr === 31) {
    // Point-to-point links (RFC 3021) usually treated as 2 hosts, 
    // but in standard subnet calculators often shown as 0 usable or strictly defined.
    // However, strictly speaking for general subnetting:
    // Network = first, Broadcast = second.
    // Often calculators show total hosts = 2, range = network to broadcast.
    firstUsableInt = networkInt;
    lastUsableInt = broadcastInt;
    totalHosts = 2;
  } else {
    // Standard case
    totalHosts = Math.pow(2, 32 - cidr) - 2;
    if (totalHosts < 0) totalHosts = 0; // Should not happen given logic above
  }

  return {
    networkAddress,
    broadcastAddress,
    firstUsable: intToIp(firstUsableInt),
    lastUsable: intToIp(lastUsableInt),
    totalHosts,
    subnetMask,
    cidr
  };
}
