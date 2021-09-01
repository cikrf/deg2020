import { EnvService } from './env.service';

export const EnvServiceFactory = (): EnvService => {
  const browserWindow: {__env: any} = typeof window === 'undefined' ? {__env: {}} : window as any;
  const browserWindowEnv = browserWindow.__env || {};
  return new EnvService(browserWindowEnv);
};

export const EnvServiceProvider = {
  provide: EnvService,
  useFactory: EnvServiceFactory,
  deps: [],
};
