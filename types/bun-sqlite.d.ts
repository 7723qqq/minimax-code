// Minimal Bun declarations for the standalone type check.
//
// `@types/bun` is not a dependency of this distribution, so the surfaces the
// sources actually call are declared here.
// Extend this file when another Bun-native API is adopted; keep each entry
// limited to what the sources use, so the declaration cannot drift into
// promising behaviour nothing exercises.
declare module 'bun:sqlite' {
  export interface DatabaseOptions {
    readonly?: boolean;
    create?: boolean;
    readwrite?: boolean;
    fileMustExist?: boolean;
    safeIntegers?: boolean;
    strict?: boolean;
  }

  export interface Changes {
    changes: number;
    lastInsertRowid: number | bigint;
  }

  export interface Statement<Params extends unknown[] = unknown[], Row = unknown> {
    all(...params: Params): Row[];
    get(...params: Params): Row | undefined;
    run(...params: Params): Changes;
    values(...params: Params): unknown[][];
    iterate(...params: Params): IterableIterator<Row>;
    finalize(): void;
    readonly isFinalized: boolean;
    readonly reader: boolean;
    readonly readonly: boolean;
    readonly columnNames: string[];
    readonly native: unknown;
  }

  export interface Transaction<Args extends unknown[], Result> {
    (...args: Args): Result;
    immediate(...args: Args): Result;
    deferred(...args: Args): Result;
    exclusive(...args: Args): Result;
  }

  export class Database {
    constructor(filename?: string, options?: DatabaseOptions);
    constructor(data: Uint8Array, options?: DatabaseOptions);
    exec(sql: string): void;
    prepare<Params extends unknown[] = unknown[], Row = unknown>(
      sql: string,
    ): Statement<Params, Row>;
    query<Params extends unknown[] = unknown[], Row = unknown>(
      sql: string,
    ): Statement<Params, Row>;
    transaction<Args extends unknown[], Result>(
      fn: (...args: Args) => Result,
    ): Transaction<Args, Result>;
    close(): void;
    serialize(): Uint8Array;
    loadExtension(path: string): void;
    function(name: string, ...args: unknown[]): void;
    aggregate(name: string, options: unknown): void;
    readonly inTransaction: boolean;
    readonly readonly: boolean;
  }
}

/**
 * Subprocess handles returned by `Bun.spawn`.
 *
 * The three generic parameters mirror Bun's own stdio typing: each is `'ignore'`
 * or `'pipe'`, and a `'pipe'` slot yields a `ReadableStream`. Only the members
 * the sources read are declared.
 */
declare namespace Bun {
  type StdioKind = 'ignore' | 'pipe' | 'inherit';
  type StdioStream<Kind> = Kind extends 'pipe' ? ReadableStream<Uint8Array> : null;
  /**
   * Writable end of a `stdin: 'pipe'` handle.
   *
   * Writing accepts a string or bytes; `end()` closes the pipe so the child
   * sees EOF. `flush()` waits until the buffered bytes are handed to the OS.
   */
  interface StdinStream extends WritableStream<Uint8Array> {
    write(chunk: string | Uint8Array | ArrayBufferView): number;
    end(): void;
    flush(): number | Promise<number>;
  }
  type StdioInput<Kind> = Kind extends 'pipe' ? StdinStream : null;

  interface Subprocess<
    Stdin extends StdioKind = StdioKind,
    Stdout extends StdioKind = StdioKind,
    Stderr extends StdioKind = StdioKind,
  > {
    readonly pid: number;
    /** Settles when the process exits with the exit code, or a signal-derived code. */
    readonly exited: Promise<number>;
    /** Exit code once the process has exited; `null` while running. */
    readonly exitCode: number | null;
    /** Signal that terminated the process, if any. */
    readonly signalCode: NodeJS.Signals | null;
    readonly stdin: StdioInput<Stdin>;
    readonly stdout: StdioStream<Stdout>;
    readonly stderr: StdioStream<Stderr>;
    /** Sends a signal, or terminates the process when none is given. */
    kill(signal?: number | NodeJS.Signals): void;
    ref(): void;
    unref(): void;
  }

  interface SpawnOptions {
    cmd: readonly string[];
    cwd?: string;
    env?: Record<string, string | undefined>;
    stdin?: StdioKind;
    stdout?: StdioKind;
    stderr?: StdioKind;
    /** Runs the command through the platform shell. */
    shell?: boolean | string;
    windowsHide?: boolean;
    windowsVerbatimArguments?: boolean;
    detached?: boolean;
    timeout?: number;
    killSignal?: number | NodeJS.Signals;
    signal?: AbortSignal;
    onExit?(
      subprocess: Subprocess,
      exitCode: number | null,
      signalCode: NodeJS.Signals | null,
      error?: Error,
    ): void;
  }

  /**
   * Starts a process.
   *
   * Throws synchronously when the executable cannot be started (for example
   * `ENOENT`), unlike `child_process.spawn`, which reports that through an
   * `error` event.
   */
  function spawn<
    Stdin extends StdioKind = 'ignore',
    Stdout extends StdioKind = 'ignore',
    Stderr extends StdioKind = 'ignore',
  >(options: SpawnOptions & {
    stdin?: Stdin;
    stdout?: Stdout;
    stderr?: Stderr;
  }): Subprocess<Stdin, Stdout, Stderr>;

  interface BunFile {
    /**
     * Whether the path exists.
     *
     * False for a directory: use `stat().isDirectory()` when the entry type
     * matters.
     */
    exists(): Promise<boolean>;
    stat(): Promise<import('node:fs').Stats>;
    arrayBuffer(): Promise<ArrayBuffer>;
    text(): Promise<string>;
    json<T = unknown>(): Promise<T>;
    bytes(): Promise<Uint8Array>;
  }

  /** A file handle for reading. Directories report `exists() === false`. */
  function file(path: string | URL): BunFile;
}

interface ImportMeta {
  readonly dir: string;
  readonly file: string;
  readonly path: string;
  readonly main: boolean;
}
