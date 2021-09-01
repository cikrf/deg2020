export class EnvService<T = any> {

  constructor(
    private env: T,
  ) {
  }

  get<K extends keyof T>(variable: K, defaults?: T[K]): T[K] {
    return this.env[variable] || defaults;
  }
}
