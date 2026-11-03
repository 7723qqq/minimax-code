# @minimax-ai/code-acp

ACP launcher for [MiniMax Code](https://agent.minimax.io). It runs the `mcode`
binary from `@minimax-ai/code`, forwarding all arguments, stdio, signals and the
exit code:

```sh
bunx @minimax-ai/code-acp@<version> acp
```

Why: `@minimax-ai/code` ships two bins (`mcode`, `mcode-tools`), so a runner
executing `@minimax-ai/code acp` cannot decide which to run. This package has a
single bin, which is what the [ACP registry](https://github.com/agentclientprotocol/registry)
launch-command distribution needs.

The launcher runs on the Bun runtime that `@minimax-ai/code` itself requires
(see that package's installation guide); it never starts another runtime.

**Release rule:** publish this package at the same version as `@minimax-ai/code`,
with `dependencies["@minimax-ai/code"]` pinned to that exact version. The ACP
registry auto-update follows this package's version.
