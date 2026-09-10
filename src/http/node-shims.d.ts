declare module "node:http" {
  export interface IncomingMessage {
    method?: string;
    url?: string;
    headers: Record<string, string | string[] | undefined>;
    on(event: "data", listener: (chunk: unknown) => void): this;
    on(event: "end", listener: () => void): this;
    on(event: "error", listener: (error: Error) => void): this;
    destroy(error?: Error): void;
  }

  export interface ServerResponse {
    statusCode: number;
    setHeader(name: string, value: string | number | readonly string[]): this;
    end(data?: string): void;
  }

  export interface AddressInfo {
    address: string;
    family: string;
    port: number;
  }

  export interface Server {
    listen(port: number, host: string, callback?: () => void): this;
    close(callback?: (error?: Error) => void): this;
    address(): AddressInfo | string | null;
  }

  export function createServer(
    listener: (request: IncomingMessage, response: ServerResponse) => void | Promise<void>,
  ): Server;
}

declare const process: {
  env: Record<string, string | undefined>;
  exitCode?: number;
  on(event: "SIGINT" | "SIGTERM", listener: () => void): void;
  cwd(): string;
};


declare module "node:fs" {
  export function readFileSync(path: string, encoding: "utf8"): string;
}

declare module "node:path" {
  export function resolve(...parts: string[]): string;
}

declare const __dirname: string;
