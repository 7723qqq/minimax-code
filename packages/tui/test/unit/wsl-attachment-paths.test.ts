import { mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { afterAll, afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { resolveTuiExecInvocation } from "../../src/headless/invocation.js";
import { resolveWslPath } from "../../src/host/wsl-path.js";
import { resolveTuiAttachment } from "../../src/tui/features/composer/attachments.js";
import { TuiComposerDraft } from "../../src/tui/features/composer/draft.js";
import { isTuiTerminalImagePaste } from "../../src/tui/features/composer/terminal-image-paste.js";
import { stubEnv, unstubAllEnvs } from "../../../../test/bun-test-setup.js";

// `bun test` runs every file of a suite in one process, and `mock.module()`
// replaces the module for that whole process. Snapshot the real modules before
// replacing them and put them back in `afterAll`, so a replacement never leaks
// into the files that run after this one.
// `require` inside the factory reads the real module: a static namespace
// import would already be replaced by the mock and would resolve to itself.
const require = createRequire(import.meta.url);
const realOs = require("node:os");
const realChildProcess = require("node:child_process");

const host = {
  platform: mock(() => "linux"),
  release: mock(() => "6.18.33.2-microsoft-standard-WSL2"),
  executeFile: mock(),
};

mock.module("node:os", () => ({
  ...realOs,
  platform: host.platform,
  release: host.release,
  default: { ...realOs, platform: host.platform, release: host.release },
}));

mock.module("node:child_process", () => {
  // `wsl-path.ts` promisifies `execFile`, so the mock carries the custom
  // promisify symbol and the converter call lands on `host.executeFile`.
  const execFile = Object.assign(mock(), {
    [Symbol.for("nodejs.util.promisify.custom")]: host.executeFile,
  });
  return {
    ...realChildProcess,
    execFile,
    default: { ...realChildProcess, execFile },
  };
});

// `wsl-path.ts` derives its converter call at module scope
// (`promisify(execFile)`), so the module has to be evaluated *after* the
// `node:child_process` mock is registered. The query suffix gives Bun a
// distinct module id, which re-evaluates the module, and the plain path is
// then re-registered with that instance.
//
// The attachment resolver imports `wsl-path.ts` itself, so it captured the
// pre-mock module the first time it was loaded. It is re-evaluated the same
// way, otherwise the resolver would keep calling the real `wslpath`.
const actualWslPath = { ...(await import("../../src/host/wsl-path.js")) };
const mockedWslPath = { ...(await import("../../src/host/wsl-path.js?mocked")) };
mock.module("../../src/host/wsl-path.js", () => mockedWslPath);

const actualAttachments = {
  ...(await import("../../src/tui/features/composer/attachments.js")),
};
const mockedAttachments = {
  ...(await import("../../src/tui/features/composer/attachments.js?mocked")),
};
mock.module("../../src/tui/features/composer/attachments.js", () => mockedAttachments);

afterAll(() => {
  mock.module("../../src/host/wsl-path.js", () => actualWslPath);
  mock.module("../../src/tui/features/composer/attachments.js", () => actualAttachments);
  mock.module("node:os", () => ({ ...realOs, default: realOs }));
  mock.module("node:child_process", () => ({
    ...realChildProcess,
    default: realChildProcess,
  }));
});

let workspaceDir: string;
let imagePath: string;
const windowsPath = String.raw`D:\Users\demo\Documents\Screen shots\截图.png`;
const skipWslConversion = process.platform === "win32";

beforeEach(async () => {
  host.platform.mockReturnValue("linux");
  host.release.mockReturnValue("6.18.33.2-microsoft-standard-WSL2");
  host.executeFile.mockReset();
  stubEnv("WSL_DISTRO_NAME", "");
  stubEnv("WSL_INTEROP", "");
  stubEnv("WSLENV", "");
  workspaceDir = await mkdtemp(join(tmpdir(), "mcode-wsl-path-"));
  imagePath = join(workspaceDir, "截图.png");
  await writeFile(imagePath, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  host.executeFile.mockResolvedValue({ stdout: `${imagePath}\n`, stderr: "" });
});

afterEach(async () => {
  unstubAllEnvs();
  await rm(workspaceDir, { recursive: true, force: true });
});

// The mocked wslpath output is the host temp path. Native Windows correctly
// rejects that as a Linux absolute path, so only WSL conversion cases skip there;
// native path handling remains covered.
describe("WSL attachment paths", () => {
  it.skipIf(process.platform === "win32").each([
    windowsPath,
    `"${windowsPath}"`,
    `'${windowsPath}'`,
    windowsPath.replaceAll("\\", "/"),
  ])(
    "queues a Windows image path as an image placeholder: %s",
    async (reference) => {
      const placeholders = mock();
      const draft = new TuiComposerDraft({
        workspaceDir,
        resolveAttachment: resolveTuiAttachment,
        append: mock(),
        onChanged: mock(),
        onAttachmentPlaceholdersChanged: placeholders,
      });
      expect(isTuiTerminalImagePaste(reference)).toBe(true);
      await draft.queueAttachment(reference, { source: "terminal-paste" });
      expect(draft.snapshot().attachments).toEqual([
        {
          type: "image",
          filePath: imagePath,
          fileName: "截图.png",
          mimeType: "image/png",
          sizeBytes: 4,
        },
      ]);
      expect(placeholders).toHaveBeenLastCalledWith([
        { id: imagePath, label: "[Image #1]" },
      ]);
      expect(host.executeFile).toHaveBeenCalledWith(
        "wslpath",
        ["-a", "-u", reference.replace(/^['"]|['"]$/gu, "")],
        expect.objectContaining({
          encoding: "utf8",
          timeout: 1_000,
          maxBuffer: 64 * 1024,
        }),
      );
    },
  );

  it.skipIf(skipWslConversion)("resolves headless --file through the same conversion before realpath", async () => {
    const invocation = await resolveTuiExecInvocation(
      "describe",
      { cwd: workspaceDir, file: [windowsPath] },
      async () => "",
    );
    expect(invocation.attachments).toEqual([
      {
        type: "image",
        filePath: await realpath(imagePath),
        fileName: "截图.png",
        mimeType: "image/png",
        sizeBytes: 4,
      },
    ]);
    expect(host.executeFile).toHaveBeenCalledOnce();
  });

  it.skipIf(skipWslConversion).each(["WSL_DISTRO_NAME", "WSL_INTEROP", "WSLENV"])(
    "detects WSL via %s even without a Microsoft kernel name",
    async (name) => {
      host.release.mockReturnValue("custom-kernel");
      stubEnv(name, "synthetic-wsl");
      await expect(resolveWslPath(windowsPath)).resolves.toBe(imagePath);
    },
  );

  it.each(["darwin", "win32", "linux"])(
    "preserves Windows path syntax on a non-WSL %s host",
    async (platform) => {
      host.platform.mockReturnValue(platform);
      host.release.mockReturnValue("generic-kernel");
      await expect(resolveWslPath(windowsPath)).resolves.toBe(windowsPath);
      expect(host.executeFile).not.toHaveBeenCalled();
    },
  );

  it.each([
    "/mnt/d/Screen shots/截图.png",
    "/tmp/literal\\name.png",
    "//tmp/image.png",
    "image.png",
    "~/image.png",
    "D:relative.png",
  ])(
    "leaves native and relative paths unchanged in WSL: %s",
    async (reference) => {
      await expect(resolveWslPath(reference)).resolves.toBe(reference);
      expect(host.executeFile).not.toHaveBeenCalled();
    },
  );

  it("keeps native attachment resolution working in WSL without a subprocess", async () => {
    await expect(
      resolveTuiAttachment("截图.png", { workspaceDir }),
    ).resolves.toMatchObject({ filePath: imagePath });
    await expect(
      resolveTuiAttachment("~/截图.png", {
        workspaceDir,
        homeDir: workspaceDir,
      }),
    ).resolves.toMatchObject({ filePath: imagePath });
    expect(host.executeFile).not.toHaveBeenCalled();
  });

  it.skipIf(skipWslConversion).each([
    String.raw`d:\Screen shots\$(touch marker);'截图'.png`,
    String.raw`\\server\share\截图.png`,
  ])("passes Windows paths as a literal argument: %s", async (reference) => {
    await expect(resolveWslPath(reference)).resolves.toBe(imagePath);
    expect(host.executeFile.mock.calls[0]?.slice(0, 2)).toEqual([
      "wslpath",
      ["-a", "-u", reference],
    ]);
    expect(host.executeFile.mock.calls[0]?.[2]).not.toHaveProperty("shell");
  });

  it("honors the converter output for custom mount roots and preserves trailing spaces", async () => {
    host.executeFile.mockResolvedValue({
      stdout: "/custom/windows/d/Screen shots/image.png \n",
    });
    await expect(resolveWslPath(windowsPath)).resolves.toBe(
      "/custom/windows/d/Screen shots/image.png ",
    );
  });

  it.each([
    "",
    "\n",
    "relative/image.png\n",
    "D:\\image.png\n",
    "/tmp/image.png\nextra\n",
    "/tmp/image\0.png\n",
  ])(
    "rejects invalid converter output instead of treating it as a local path: %j",
    async (stdout) => {
      host.executeFile.mockResolvedValue({ stdout });
      await expect(
        resolveTuiAttachment(windowsPath, { workspaceDir }),
      ).rejects.toThrow("Could not convert the Windows path with wslpath");
    },
  );

  it.each(["ENOENT", "EACCES", "ETIMEDOUT"])(
    "reports converter failure %s without falling back to a workspace filename",
    async (code) => {
      if (process.platform !== "win32")
        await writeFile(join(workspaceDir, windowsPath), "wrong image");
      host.executeFile.mockRejectedValue(
        Object.assign(new Error("converter failed"), { code }),
      );
      await expect(
        resolveTuiAttachment(windowsPath, {
          workspaceDir,
          source: "terminal-paste",
        }),
      ).rejects.toThrow("Use an accessible Linux path instead");
      await expect(
        resolveTuiExecInvocation(
          "describe",
          { cwd: workspaceDir, file: [windowsPath] },
          async () => "",
        ),
      ).rejects.toMatchObject({
        kind: "invocation",
        message: expect.stringContaining("wslpath"),
      });
    },
  );

  it.skipIf(skipWslConversion)("still rejects missing files and directories after conversion", async () => {
    host.executeFile.mockResolvedValue({
      stdout: `${join(workspaceDir, "missing.png")}\n`,
    });
    await expect(
      resolveTuiAttachment(windowsPath, { workspaceDir }),
    ).rejects.toThrow("ENOENT");
    host.executeFile.mockResolvedValue({ stdout: `${workspaceDir}\n` });
    await expect(
      resolveTuiAttachment(windowsPath, { workspaceDir }),
    ).rejects.toThrow("not a file");
  });

  it("preserves headless cancellation while converting a path", async () => {
    const controller = new AbortController();
    host.executeFile.mockImplementation(async (_file, _args, options) => {
      expect(options.signal).toBe(controller.signal);
      controller.abort();
      throw new Error("aborted");
    });
    await expect(
      resolveTuiExecInvocation(
        "describe",
        { cwd: workspaceDir, file: [windowsPath] },
        async () => "",
        controller.signal,
      ),
    ).rejects.toMatchObject({ kind: "cancelled" });
  });
});
