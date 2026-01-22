
'use client';

import { useState, useEffect, useRef } from 'react';
import { Copy, Calculator, Globe, MapPin, Server, Network, ArrowLeftRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { calculateSubnet, SubnetResult, isValidIPv4, isValidSubnetMask, maskToCIDR, cidrToMask } from '@/lib/ip/subnet';
import { calculateSubnetIPv6, IPv6SubnetResult, isValidIPv6 } from '@/lib/ip/ipv6';
import { cn } from '@/lib/utils';
import { TabGroup } from '@/components/ui/TabGroup';

export function IPToolbox() {
  const t = useTranslations('IP');

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      <div className="grid gap-8 md:grid-cols-2">
        <SubnetCalculator t={t} />
        <IPQuery t={t} />
      </div>
    </div>
  );
}

function SubnetCalculator({ t }: { t: any }) {
  const [protocol, setProtocol] = useState<'IPv4' | 'IPv6'>('IPv4');

  // IPv4 State
  const [ip, setIp] = useState('192.168.1.1');
  const [cidr, setCidr] = useState(24);
  const [mask, setMask] = useState('255.255.255.0');
  const [result, setResult] = useState<SubnetResult | null>(null);

  // IPv6 State
  const [ipv6, setIpv6] = useState('2001:db8::1');
  const [prefix, setPrefix] = useState(64);
  const [resultv6, setResultv6] = useState<IPv6SubnetResult | null>(null);

  useEffect(() => {
    // Initial calculation
    handleCalculate();
  }, []);

  // IPv4 Handlers
  const handleCidrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val >= 0 && val <= 32) {
      setCidr(val);
      setMask(cidrToMask(val));
    }
  };

  const handleMaskChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMask(val);
    if (isValidSubnetMask(val)) {
      setCidr(maskToCIDR(val));
    }
  };

  // IPv6 Handlers
  const handlePrefixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val >= 0 && val <= 128) {
      setPrefix(val);
    }
  };

  const handleCalculate = () => {
    if (protocol === 'IPv4') {
      if (isValidIPv4(ip)) {
        setResult(calculateSubnet(ip, cidr));
      }
    } else {
      if (isValidIPv6(ipv6)) {
        setResultv6(calculateSubnetIPv6(ipv6, prefix));
      }
    }
  };

  const switchProtocol = () => {
    setProtocol(prev => prev === 'IPv4' ? 'IPv6' : 'IPv4');
    // We could clear inputs here but keeping them is often nicer for switching back
    // Or we could try to map ::ffff:192.168.1.1, but let's stick to separate states for clarity
  };

  // Auto-calculate when inputs are valid
  useEffect(() => {
    if (protocol === 'IPv4') {
      if (isValidIPv4(ip) && cidr >= 0 && cidr <= 32) {
        setResult(calculateSubnet(ip, cidr));
      }
    } else {
      if (isValidIPv6(ipv6) && prefix >= 0 && prefix <= 128) {
        setResultv6(calculateSubnetIPv6(ipv6, prefix));
      }
    }
  }, [ip, cidr, ipv6, prefix, protocol]);

  return (
    <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-border/50 bg-muted/30 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">{t('subnet.title')}</h2>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <TabGroup
          value={protocol}
          onChange={setProtocol}
          items={[
            { value: 'IPv4', label: 'IPv4' },
            { value: 'IPv6', label: 'IPv6' },
          ]}
        />

        {protocol === 'IPv4' ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('subnet.ipAddress')}</label>
              <input
                type="text"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-mono"
                placeholder="192.168.1.1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('subnet.cidr')}</label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-mono">/</span>
                  <input
                    type="number"
                    min="0"
                    max="32"
                    value={cidr}
                    onChange={handleCidrChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-mono"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('subnet.subnetMask')}</label>
                <input
                  type="text"
                  value={mask}
                  onChange={handleMaskChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-mono"
                  placeholder="255.255.255.0"
                />
              </div>
            </div>

            {result && !result.error && (
              <div className="space-y-4 pt-4 border-t border-border/50">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('subnet.results')}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ResultItem label={t('subnet.network')} value={result.networkAddress} />
                  <ResultItem label={t('subnet.broadcast')} value={result.broadcastAddress} />
                  <ResultItem label={t('subnet.firstIP')} value={result.firstUsable} />
                  <ResultItem label={t('subnet.lastIP')} value={result.lastUsable} />
                  <ResultItem label={t('subnet.totalHosts')} value={result.totalHosts.toLocaleString()} />
                  <ResultItem label={t('subnet.mask')} value={result.subnetMask} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('subnet.ipv6Address')}</label>
              <input
                type="text"
                value={ipv6}
                onChange={(e) => setIpv6(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-mono"
                placeholder="2001:db8::1"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('subnet.prefixLength')}</label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-mono">/</span>
                <input
                  type="number"
                  min="0"
                  max="128"
                  value={prefix}
                  onChange={handlePrefixChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-mono"
                />
              </div>
              <input
                type="range"
                min="0"
                max="128"
                value={prefix}
                onChange={handlePrefixChange}
                className="w-full mt-2 accent-primary"
              />
            </div>

            {resultv6 && !resultv6.error && (
              <div className="space-y-4 pt-4 border-t border-border/50">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('subnet.results')}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ResultItem label={t('subnet.network')} value={resultv6.networkAddress} />
                  <ResultItem label={t('subnet.lastIP')} value={resultv6.lastAddress} />
                  <ResultItem label={t('subnet.totalHosts')} value={resultv6.totalHosts} />
                  <ResultItem label={t('subnet.compressed')} value={resultv6.compressed} />
                  <div className="sm:col-span-2">
                    <ResultItem label={t('subnet.expanded')} value={resultv6.expanded} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultItem({ label, value }: { label: string, value: string }) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
  };

  return (
    <div className="group relative bg-muted/50 p-3 rounded-lg border border-border/50 hover:bg-muted transition-colors">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="font-mono font-medium truncate pr-6 text-sm">{value}</div>
      <button
        onClick={copyToClipboard}
        className="absolute top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-background rounded-md"
        title="Copy"
      >
        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    </div>
  );
}

interface IPInfo {
  ip: string;
  city?: string;
  region?: string;
  country_name?: string;
  org?: string; // ISP/AS
  asn?: string;
}

function IPQuery({ t }: { t: any }) {
  return (
    <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm h-full flex flex-col">
      <div className="p-6 border-b border-border/50 bg-muted/30 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">{t('myIP.title')}</h2>
        </div>
      </div>

      <div className="p-6 flex-1 space-y-8">
        <IPSection t={t} version="IPv4" url="https://api-ipv4.ip.sb/geoip" />
        <div className="border-t border-border/50"></div>
        <IPSection t={t} version="IPv6" url="https://api-ipv6.ip.sb/geoip" />
      </div>
    </div>
  );
}

function IPSection({ t, version, url }: { t: any, version: 'IPv4' | 'IPv6', url: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<IPInfo | null>(null);

  const fetchIP = async () => {
    // If already loading or has data (prevent double fetch in strict mode), though we handle ignore in useEffect too
    // But direct calls from button should proceed.
    setLoading(true);
    setError('');
    setData(null);
    try {
      // Use ip.sb API for both IP and GeoIP data
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!res.ok) throw new Error('Failed to fetch IP info');

      const json = await res.json();

      // Map ip.sb response to IPInfo interface
      // ip.sb returns: ip, country, region, city, latitude, longitude, isp, organization, asn, etc.
      setData({
        ip: json.ip,
        city: json.city,
        region: json.region,
        country_name: json.country,
        org: json.isp || json.organization, // Use ISP or Organization
        asn: json.asn ? `AS${json.asn} ${json.asn_organization || ''}` : undefined,
      });

    } catch (e) {
      // This usually means the client doesn't support this protocol (e.g. no IPv6)
      // or network error
      console.error(e);
      setError(version === 'IPv6' ? t('myIP.notDetected') : t('myIP.error'));
    } finally {
      setLoading(false);
    }
  };

  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      fetchIP();
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn(
            "px-2 py-0.5 rounded text-xs font-bold",
            version === 'IPv4' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          )}>
            {version}
          </span>
        </div>
        <button
          onClick={fetchIP}
          disabled={loading}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          {loading ? t('myIP.loading') : t('myIP.query')}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          {t('myIP.loading')}
        </div>
      ) : error ? (
        <div className="text-sm text-muted-foreground italic">
          {error}
        </div>
      ) : data ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="text-xl font-mono font-bold tracking-tight">{data.ip}</div>
            <button
              onClick={() => navigator.clipboard.writeText(data.ip)}
              className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground"
              title="Copy"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>

          {(data.city || data.org || data.asn) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm">
              {data.city && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{[data.city, data.region, data.country_name].filter(Boolean).join(', ')}</span>
                </div>
              )}
              {data.org && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Server className="w-3.5 h-3.5" />
                  <span>{data.org}</span>
                </div>
              )}
              {data.asn && (
                <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
                  <Network className="w-3.5 h-3.5" />
                  <span>{data.asn}</span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
