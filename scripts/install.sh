#!/bin/sh
# Install the standalone bb binary from a GitHub Release on Linux or macOS.
#
#   curl -fsSL https://github.com/0pilatos0/bitbucket-cli/releases/latest/download/install.sh | sh
#
# Environment:
#   BB_VERSION       Version to install, e.g. 2.2.0 (default: the latest release)
#   BB_INSTALL_DIR   Directory to install bb into (default: $HOME/.local/bin)
#   BB_RELEASES_URL  Releases base URL, for mirrors
#                    (default: https://github.com/0pilatos0/bitbucket-cli/releases)

set -eu

fail() {
  echo "install.sh: $*" >&2
  exit 1
}

detect_os() {
  case "$(uname -s)" in
    Linux)
      if ldd --version 2>&1 | grep -qi musl; then
        fail "the Linux binaries need glibc; on musl (e.g. Alpine) install the npm package with Bun instead"
      fi
      echo linux
      ;;
    Darwin) echo darwin ;;
    *) fail "unsupported OS $(uname -s); on Windows use install.ps1" ;;
  esac
}

detect_arch() {
  case "$(uname -m)" in
    x86_64 | amd64)
      # A shell running under Rosetta 2 reports x86_64 on Apple silicon.
      if [ "$(sysctl -n sysctl.proc_translated 2>/dev/null || true)" = 1 ]; then
        echo arm64
      else
        echo x64
      fi
      ;;
    arm64 | aarch64) echo arm64 ;;
    *) fail "unsupported architecture $(uname -m)" ;;
  esac
}

download() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL -o "$2" "$1" || fail "download failed: $1"
  elif command -v wget >/dev/null 2>&1; then
    wget -q -O "$2" "$1" || fail "download failed: $1"
  else
    fail "need curl or wget to download bb"
  fi
}

# Prints the SHA256SUMS entry for a file, or nothing if it is not listed.
expected_sha256() {
  awk -v f="$2" '$2 == f || $2 == "*" f { print $1; exit }' "$1"
}

sha256_of() {
  if command -v sha256sum >/dev/null 2>&1; then
    sum=$(sha256sum "$1")
  elif command -v shasum >/dev/null 2>&1; then
    sum=$(shasum -a 256 "$1")
  else
    fail "need sha256sum or shasum to verify the download"
  fi
  echo "${sum%% *}"
}

main() {
  releases=${BB_RELEASES_URL:-https://github.com/0pilatos0/bitbucket-cli/releases}
  install_dir=${BB_INSTALL_DIR:-$HOME/.local/bin}
  if [ -n "${BB_VERSION:-}" ]; then
    base="$releases/download/v${BB_VERSION#v}"
  else
    base="$releases/latest/download"
  fi

  os=$(detect_os)
  arch=$(detect_arch)
  asset="bb-$os-$arch"

  tmp=$(mktemp -d)
  trap 'rm -rf "$tmp"' EXIT
  # dash skips the EXIT trap when killed by a signal.
  trap 'exit 130' INT TERM HUP

  download "$base/SHA256SUMS" "$tmp/SHA256SUMS"
  # Releases before the archives were added only ship the raw binary.
  file="$asset.tar.gz"
  expected=$(expected_sha256 "$tmp/SHA256SUMS" "$file")
  if [ -z "$expected" ]; then
    file=$asset
    expected=$(expected_sha256 "$tmp/SHA256SUMS" "$file")
  fi
  [ -n "$expected" ] || fail "$asset is not listed in $base/SHA256SUMS"

  download "$base/$file" "$tmp/$file"
  actual=$(sha256_of "$tmp/$file")
  [ "$actual" = "$expected" ] || fail "checksum mismatch for $file"

  if [ "$file" = "$asset" ]; then
    binary="$tmp/$file"
  else
    tar -xzf "$tmp/$file" -C "$tmp" bb || fail "could not extract $file"
    binary="$tmp/bb"
  fi

  mkdir -p "$install_dir" || fail "cannot create $install_dir; set BB_INSTALL_DIR to a writable directory"
  # Copy next to the target and rename, so a running bb is replaced atomically.
  staged="$install_dir/.bb.$$"
  if ! { cp "$binary" "$staged" && chmod 755 "$staged" && mv -f "$staged" "$install_dir/bb"; }; then
    rm -f "$staged"
    fail "cannot write to $install_dir; set BB_INSTALL_DIR to a writable directory"
  fi

  echo "Installed bb to $install_dir/bb"
  case ":$PATH:" in
    *":$install_dir:"*)
      found=$(command -v bb || true)
      if [ "$found" != "$install_dir/bb" ]; then
        echo "Another bb comes first on your PATH: $found"
      fi
      ;;
    *) echo "Add $install_dir to your PATH to run bb." ;;
  esac
}

main "$@"
