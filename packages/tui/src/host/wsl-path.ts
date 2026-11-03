import { platform, release } from "node:os";
import { posix } from "node:path";

/** Translate Windows absolute paths before the host's POSIX resolver sees them. */
export async function resolveWslPath(
  reference: string,
  signal?: AbortSignal,
): Promise<string> {
  if (
    !/^(?:[a-z]:[\\/]|\\\\)/iu.test(reference) ||
    platform() !== "linux" ||
    !(
      process.env.WSL_DISTRO_NAME ||
      process.env.WSL_INTEROP ||
      process.env.WSLENV ||
      /microsoft/iu.test(release())
    )
  ) {
    return reference;
  }

  // Use the distro's converter so custom automount roots and mounted drives work.
  // `Bun.spawn` keeps spaces, backslashes and shell metacharacters in one literal
  // argument, as the wrapped `execFile` did, and its `signal`/`timeout` options
  // replace the wrapper's. A non-zero exit is rejected like `execFile`, which the
  // catch below turns into the public conversion error.
  try {
    const child = Bun.spawn({
      cmd: ["wslpath", "-a", "-u", reference],
      stdin: "ignore",
      stdout: "pipe",
      stderr: "pipe",
      timeout: 1_000,
      ...(signal ? { signal } : {}),
    });
    const [stdout, code] = await Promise.all([
      new Response(child.stdout).text(),
      child.exited,
    ]);
    if (code !== 0) throw new Error(`wslpath exited with code ${code}`);
    const mapped = stdout.replace(/\r?\n$/u, "");
    if (!posix.isAbsolute(mapped) || /[\r\n\0]/u.test(mapped)) {
      throw new Error("wslpath did not return an absolute Linux path.");
    }
    return mapped;
  } catch (error) {
    throw new Error(
      "Could not convert the Windows path with wslpath. Use an accessible Linux path instead.",
      { cause: error },
    );
  }
}
