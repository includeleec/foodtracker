declare module 'next-pwa' {
  interface PWAOptions {
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    runtimeCaching?: any[];
  }

  function withPWA(options: PWAOptions): (config: any) => any;
  export default withPWA;
}