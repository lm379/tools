
import { calculateSubnet, isValidIPv4, isValidSubnetMask, maskToCIDR, cidrToMask } from './subnet';

describe('IP Subnet Calculator', () => {
  describe('isValidIPv4', () => {
    it('should validate correct IPv4 addresses', () => {
      expect(isValidIPv4('192.168.1.1')).toBe(true);
      expect(isValidIPv4('0.0.0.0')).toBe(true);
      expect(isValidIPv4('255.255.255.255')).toBe(true);
    });

    it('should invalidate incorrect IPv4 addresses', () => {
      expect(isValidIPv4('192.168.1')).toBe(false); // Too short
      expect(isValidIPv4('192.168.1.1.1')).toBe(false); // Too long
      expect(isValidIPv4('256.0.0.0')).toBe(false); // Out of range
      expect(isValidIPv4('192.168.1.a')).toBe(false); // Non-numeric
      expect(isValidIPv4('')).toBe(false);
      expect(isValidIPv4('...')).toBe(false);
    });
  });

  describe('isValidSubnetMask', () => {
    it('should validate correct subnet masks', () => {
      expect(isValidSubnetMask('255.255.255.0')).toBe(true); // /24
      expect(isValidSubnetMask('255.255.0.0')).toBe(true); // /16
      expect(isValidSubnetMask('255.0.0.0')).toBe(true); // /8
      expect(isValidSubnetMask('255.255.255.252')).toBe(true); // /30
      expect(isValidSubnetMask('0.0.0.0')).toBe(true); // /0
      expect(isValidSubnetMask('255.255.255.255')).toBe(true); // /32
    });

    it('should invalidate incorrect subnet masks', () => {
      expect(isValidSubnetMask('255.255.255.1')).toBe(false);
      expect(isValidSubnetMask('192.168.1.1')).toBe(false);
      expect(isValidSubnetMask('255.0.255.0')).toBe(false); // Discontinuous
    });
  });

  describe('Conversions', () => {
    it('should convert Mask to CIDR', () => {
      expect(maskToCIDR('255.255.255.0')).toBe(24);
      expect(maskToCIDR('255.255.0.0')).toBe(16);
      expect(maskToCIDR('255.255.255.255')).toBe(32);
      expect(maskToCIDR('0.0.0.0')).toBe(0);
    });

    it('should convert CIDR to Mask', () => {
      expect(cidrToMask(24)).toBe('255.255.255.0');
      expect(cidrToMask(16)).toBe('255.255.0.0');
      expect(cidrToMask(32)).toBe('255.255.255.255');
      expect(cidrToMask(0)).toBe('0.0.0.0');
    });
  });

  describe('calculateSubnet', () => {
    it('should calculate standard /24 subnet', () => {
      const result = calculateSubnet('192.168.1.10', 24);
      expect(result.networkAddress).toBe('192.168.1.0');
      expect(result.broadcastAddress).toBe('192.168.1.255');
      expect(result.firstUsable).toBe('192.168.1.1');
      expect(result.lastUsable).toBe('192.168.1.254');
      expect(result.totalHosts).toBe(254);
      expect(result.subnetMask).toBe('255.255.255.0');
      expect(result.cidr).toBe(24);
    });

    it('should calculate standard /16 subnet', () => {
      const result = calculateSubnet('10.0.5.5', 16);
      expect(result.networkAddress).toBe('10.0.0.0');
      expect(result.broadcastAddress).toBe('10.0.255.255');
      expect(result.firstUsable).toBe('10.0.0.1');
      expect(result.lastUsable).toBe('10.0.255.254');
      expect(result.totalHosts).toBe(65534);
    });

    it('should handle /32 (Single Host)', () => {
      const result = calculateSubnet('192.168.1.10', 32);
      expect(result.networkAddress).toBe('192.168.1.10');
      expect(result.broadcastAddress).toBe('192.168.1.10');
      expect(result.firstUsable).toBe('192.168.1.10');
      expect(result.lastUsable).toBe('192.168.1.10');
      expect(result.totalHosts).toBe(1);
    });

    it('should handle /31 (Point-to-Point)', () => {
      const result = calculateSubnet('192.168.1.0', 31);
      expect(result.networkAddress).toBe('192.168.1.0');
      expect(result.broadcastAddress).toBe('192.168.1.1');
      expect(result.firstUsable).toBe('192.168.1.0');
      expect(result.lastUsable).toBe('192.168.1.1');
      expect(result.totalHosts).toBe(2);
    });

    it('should accept subnet mask string as input', () => {
      const result = calculateSubnet('192.168.1.10', '255.255.255.0');
      expect(result.cidr).toBe(24);
      expect(result.networkAddress).toBe('192.168.1.0');
    });

    it('should return error for invalid IP', () => {
      const result = calculateSubnet('999.999.999.999', 24);
      expect(result.error).toBe('Invalid IP Address');
    });

    it('should return error for invalid Mask', () => {
      const result = calculateSubnet('192.168.1.1', '255.255.255.1');
      expect(result.error).toBe('Invalid Subnet Mask');
    });
  });
});
