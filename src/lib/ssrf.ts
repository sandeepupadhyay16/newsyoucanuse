import dns from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(dns.lookup);

export async function validateUrlForSSRF(urlStr: string): Promise<boolean> {
  try {
    const url = new URL(urlStr);
    
    // 1. Enforce safe HTTP/HTTPS protocol limits
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }

    const hostname = url.hostname;
    
    // 2. Perform DNS resolution to check actual target IP address
    const { address } = await dnsLookup(hostname);
    
    return isPublicIp(address);
  } catch (e) {
    return false;
  }
}

function isPublicIp(ip: string): boolean {
  // Check IPv4 loopbacks and private subnet constraints:
  // - 127.0.0.0/8 (Loopback)
  // - 10.0.0.0/8 (Private Class A)
  // - 172.16.0.0/12 (Private Class B)
  // - 192.168.0.0/16 (Private Class C)
  // - 169.254.0.0/16 (Link Local)
  // - 0.0.0.0 (Unspecified / Any)
  const parts = ip.split('.').map(Number);
  
  if (parts.length !== 4 || parts.some(isNaN)) {
    // Basic IPv6 validations (Loopback ::1 and link-local/site-local prefixes)
    if (ip === '::1' || ip === '0:0:0:0:0:0:0:1') return false;
    if (ip.toLowerCase().startsWith('fe80:') || ip.toLowerCase().startsWith('fc00:') || ip.toLowerCase().startsWith('fd00:')) {
      return false;
    }
    return true;
  }

  const [first, second] = parts;

  if (first === 127 || first === 10 || first === 0) return false;
  if (first === 172 && second >= 16 && second <= 31) return false;
  if (first === 192 && second === 168) return false;
  if (first === 169 && second === 254) return false;

  return true;
}
