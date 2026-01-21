
import { calculateSubnetIPv6, expandIPv6, compressIPv6, isValidIPv6 } from './ipv6';

describe('IPv6 Subnet Calculator', () => {
  describe('isValidIPv6', () => {
    it('should validate correct IPv6 addresses', () => {
      expect(isValidIPv6('2001:db8::1')).toBe(true);
      expect(isValidIPv6('::1')).toBe(true);
      expect(isValidIPv6('2001:0db8:0000:0000:0000:0000:0000:0001')).toBe(true);
      expect(isValidIPv6('fe80::')).toBe(true);
    });

    it('should invalidate incorrect IPv6 addresses', () => {
      expect(isValidIPv6('2001:db8::1::1')).toBe(false); // Double ::
      expect(isValidIPv6('2001:db8:g::1')).toBe(false); // Invalid char
      expect(isValidIPv6('192.168.1.1')).toBe(false); // IPv4
      expect(isValidIPv6('')).toBe(false);
    });
  });

  describe('Expansion/Compression', () => {
    it('should expand correctly', () => {
      expect(expandIPv6('2001:db8::1')).toBe('2001:0db8:0000:0000:0000:0000:0000:0001');
      expect(expandIPv6('::1')).toBe('0000:0000:0000:0000:0000:0000:0000:0001');
    });

    it('should compress correctly', () => {
      expect(compressIPv6('2001:0db8:0000:0000:0000:0000:0000:0001')).toBe('2001:db8::1');
      // Should find longest sequence of zeros
      expect(compressIPv6('2001:0:0:1:0:0:0:1')).toBe('2001:0:0:1::1'); 
      expect(compressIPv6('0000:0000:0000:0000:0000:0000:0000:0001')).toBe('::1');
      expect(compressIPv6('0000:0000:0000:0000:0000:0000:0000:0000')).toBe('::');
    });
  });

  describe('calculateSubnetIPv6', () => {
    it('should calculate /64 subnet', () => {
      const result = calculateSubnetIPv6('2001:db8::1', 64);
      expect(result.networkAddress).toBe('2001:db8::');
      expect(result.prefixLength).toBe(64);
      // Last address should end in all Fs
      // 2001:db8:0:0:ffff:ffff:ffff:ffff
      expect(result.lastAddress).toBe('2001:db8::ffff:ffff:ffff:ffff');
      // Total hosts 2^64 = 18446744073709551616
      expect(result.totalHosts).toBe('18446744073709551616');
    });

    it('should calculate /128 subnet', () => {
        const result = calculateSubnetIPv6('2001:db8::1', 128);
        expect(result.networkAddress).toBe('2001:db8::1');
        expect(result.lastAddress).toBe('2001:db8::1');
        expect(result.totalHosts).toBe('1');
    });

    it('should calculate /48 subnet', () => {
        const result = calculateSubnetIPv6('2001:db8:1234::1', 48);
        expect(result.networkAddress).toBe('2001:db8:1234::');
        expect(result.lastAddress).toBe('2001:db8:1234:ffff:ffff:ffff:ffff:ffff');
    });

    it('should handle invalid input', () => {
        const result = calculateSubnetIPv6('invalid', 64);
        expect(result.error).toBeDefined();
    });
  });
});
