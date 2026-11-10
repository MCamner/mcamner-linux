---
name: kernel-update
description: Rebuild the mcamner-linux guest kernel with the kernel workflow and swap it into vendor/v86 with its source, checksums and LICENSES.md kept in step. Use when buildroot/defconfig or buildroot/linux.fragment changes, when the kernel or Buildroot version is bumped, or when the served kernel must be rebuilt from the current tree.
---

# Kernel update

The served kernel must always come from a release in this repository that
carries its complete source. This keeps that true.

Running the workflow publishes a public GitHub release. Confirm with the
user before starting it.

## 1. Build

```bash
gh workflow run kernel.yml --ref main -f defconfig=defconfig
gh run list --workflow kernel.yml --limit 1 --json databaseId,headSha
gh run watch <run-id> --exit-status
```

A build takes 20–30 minutes. The release is tagged
`kernel-<buildroot>-<run number>-<defconfig>`.

## 2. Download and check

In a scratch directory:

```bash
gh release download <tag> -R MCamner/mcamner-linux \
  -p mcamner-bzimage.bin -p SHA256SUMS -p linux.config -p defconfig
grep -v legal-info SHA256SUMS | shasum -a 256 -c
diff defconfig <repo>/buildroot/defconfig
```

To see what changed in the kernel itself, download `linux.config` from the
previous release and diff it. Identical configs still give a different
binary: the build is not reproducible.

## 3. Boot before swapping

Copy the image to `vendor/v86/mcamner-bzimage.bin` and run the
`verify-page` skill, including its check that the new binary is the one
that loaded. If the kernel does not reach the prompt, restore the old image
with `git checkout vendor/v86/mcamner-bzimage.bin` and report the failure;
6.18 has panicked under v86 before (see the stack protector note in
`buildroot/linux.fragment`).

## 4. Update the records

- `vendor/LICENSES.md`: the kernel row's size, release link, run id and
  commit.
- `vendor/SHA256SUMS`:

  ```bash
  cd vendor && shasum -a 256 v86/*.bin v86/*.js v86/*.wasm \
    xterm/*.js xterm/*.css > SHA256SUMS
  ```

## 5. Commit

One commit with the image, `LICENSES.md` and `SHA256SUMS`. Name the release,
run and source commit in the message, and say whether `linux.config`
changed. Ask before pushing.
