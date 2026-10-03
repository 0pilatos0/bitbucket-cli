# Install the standalone bb binary from a GitHub Release on Windows.
#
#   irm https://github.com/0pilatos0/bitbucket-cli/releases/latest/download/install.ps1 | iex
#
# Environment:
#   BB_VERSION       Version to install, e.g. 2.2.0 (default: the latest release)
#   BB_INSTALL_DIR   Directory to install bb.exe into
#                    (default: %LOCALAPPDATA%\Programs\bb, added to the user PATH)
#   BB_RELEASES_URL  Releases base URL, for mirrors
#                    (default: https://github.com/0pilatos0/bitbucket-cli/releases)

# A script block, not a script-level body: under `iex`, `exit` would close the
# caller's shell, so errors are thrown instead.
& {
  $ErrorActionPreference = 'Stop'
  # Windows PowerShell 5.1 renders the progress bar per chunk, which makes
  # large downloads many times slower.
  $ProgressPreference = 'SilentlyContinue'
  [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

  if (-not [Environment]::Is64BitOperatingSystem) {
    throw 'install.ps1: bb needs 64-bit Windows'
  }

  $releases = if ($env:BB_RELEASES_URL) { $env:BB_RELEASES_URL } else { 'https://github.com/0pilatos0/bitbucket-cli/releases' }
  $base = if ($env:BB_VERSION) { "$releases/download/v$($env:BB_VERSION.TrimStart('v'))" } else { "$releases/latest/download" }
  $defaultDir = Join-Path $env:LOCALAPPDATA 'Programs\bb'
  $installDir = if ($env:BB_INSTALL_DIR) { $env:BB_INSTALL_DIR } else { $defaultDir }

  function Save-Url($url, $outFile) {
    try {
      Invoke-WebRequest $url -OutFile $outFile -UseBasicParsing
    } catch {
      throw "install.ps1: download failed: $url ($($_.Exception.Message))"
    }
  }

  $asset = 'bb-windows-x64.exe'
  $archive = 'bb-windows-x64.zip'
  $tmp = Join-Path ([IO.Path]::GetTempPath()) "bb-install-$([Guid]::NewGuid())"
  New-Item -ItemType Directory -Path $tmp | Out-Null

  try {
    $sumsFile = Join-Path $tmp 'SHA256SUMS'
    Save-Url "$base/SHA256SUMS" $sumsFile
    $checksums = @{}
    foreach ($line in Get-Content $sumsFile) {
      $hash, $name = $line -split '\s+\*?', 2
      if ($name) { $checksums[$name] = $hash }
    }

    # Releases before the archives were added only ship the raw binary.
    $file = if ($checksums.ContainsKey($archive)) { $archive } elseif ($checksums.ContainsKey($asset)) { $asset } else {
      throw "install.ps1: $asset is not listed in $base/SHA256SUMS"
    }

    $download = Join-Path $tmp $file
    Save-Url "$base/$file" $download
    if ((Get-FileHash $download -Algorithm SHA256).Hash -ne $checksums[$file]) {
      throw "install.ps1: checksum mismatch for $file"
    }

    if ($file -eq $archive) {
      Expand-Archive $download -DestinationPath $tmp -Force
      $binary = Join-Path $tmp 'bb.exe'
    } else {
      $binary = $download
    }

    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
    $target = Join-Path $installDir 'bb.exe'
    # A running bb.exe cannot be overwritten, but it can be renamed.
    $previous = "$target.old"
    Remove-Item $previous -Force -ErrorAction SilentlyContinue
    if (Test-Path $target) { Move-Item $target $previous -Force }
    Move-Item $binary $target
    Write-Host "Installed bb to $target"
  } finally {
    Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
  }

  if (($env:Path -split ';') -contains $installDir) { return }
  if ($installDir -ne $defaultDir) {
    Write-Host "Add $installDir to your PATH to run bb."
    return
  }
  # Read and write the registry value directly: the [Environment] round trip
  # stores the user Path expanded, so entries like %JAVA_HOME%\bin get frozen.
  $userPath = (Get-Item 'HKCU:\Environment').GetValue('Path', '', 'DoNotExpandEnvironmentNames')
  if (($userPath -split ';') -notcontains $installDir) {
    $newPath = (@($userPath, $installDir) | Where-Object { $_ }) -join ';'
    New-ItemProperty -Path 'HKCU:\Environment' -Name Path -Value $newPath -PropertyType ExpandString -Force | Out-Null
    # Setting any user variable broadcasts the change to new terminals.
    [Environment]::SetEnvironmentVariable('BB_INSTALL_REFRESH', '1', 'User')
    [Environment]::SetEnvironmentVariable('BB_INSTALL_REFRESH', $null, 'User')
  }
  $env:Path = "$env:Path;$installDir"
  Write-Host "Added $installDir to your user PATH, for this terminal and new ones."
}
