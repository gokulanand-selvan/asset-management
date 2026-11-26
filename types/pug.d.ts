declare module 'pug' {
  export function __express(
    path: string,
    options: object,
    callback: (e: unknown, rendered?: string) => void
  ): void;
}
