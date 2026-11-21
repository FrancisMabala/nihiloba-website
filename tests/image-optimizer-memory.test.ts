import {describe, expect, it} from 'vitest';
import {configSchema} from 'next/dist/server/config-schema';
import {defaultConfig} from 'next/dist/server/config-shared';
import config from '../next.config';

describe('image optimizer resource settings', () => {
  it('is accepted by the installed Next schema and preserves image eligibility', () => {
    expect(configSchema.safeParse(config).success).toBe(true);
    expect(config.experimental?.imgOptConcurrency).toBe(1);
    expect(config.experimental?.imgOptOperationCache).toBe(false);
    const effective = {...defaultConfig.images, ...config.images};
    expect(effective.remotePatterns).toEqual([{
      protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/dbrxpvmzp/image/upload/**',
    }]);
    expect(effective.dangerouslyAllowSVG).toBe(false);
    expect(effective.dangerouslyAllowLocalIP).toBe(false);
    expect(effective.unoptimized).toBe(false);
    expect(effective.deviceSizes).toEqual(defaultConfig.images.deviceSizes);
    expect(effective.qualities).toEqual(defaultConfig.images.qualities);
    expect(config.experimental?.imgOptMaxInputPixels).toBeUndefined();
    expect(config.experimental?.imgOptTimeoutInSeconds).toBeUndefined();
  });

  it('keeps protected pages private and preserves the public security headers', async () => {
    const headers = await config.headers!();
    const privateRoutes = ['/shida/space/:path*', '/shida/register/:path*', '/:lang(en|fr|ln|sw)/shida/space/:path*'];
    for (const source of privateRoutes) {
      const route = headers.find(item => item.source === source);
      expect(route?.headers).toContainEqual({key:'Cache-Control', value:'private, no-store, max-age=0'});
      expect(route?.headers).toContainEqual({key:'X-Robots-Tag', value:'noindex, nofollow, noarchive'});
    }
    const publicHeaders = headers.find(item => item.source === '/:path*')!.headers;
    expect(publicHeaders).toContainEqual({key:'X-Content-Type-Options', value:'nosniff'});
    expect(publicHeaders.find(item => item.key === 'Content-Security-Policy')?.value).toContain("connect-src 'self'");
    expect(publicHeaders.find(item => item.key === 'Content-Security-Policy')?.value).toContain("frame-ancestors 'none'");
  });
});
