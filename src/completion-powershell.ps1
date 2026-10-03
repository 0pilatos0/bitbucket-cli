###-begin-{pkgname}-completion-###
Register-ArgumentCompleter -Native -CommandName '{pkgname}' -ScriptBlock {
  param($wordToComplete, $commandAst, $cursorPosition)

  # Rebuild the line from `bb` so `& bb ...` and `& 'C:\path\bb.exe' ...`
  # parse like `bb ...`: the completer drops only the first word.
  $commandEnd = $commandAst.CommandElements[0].Extent.EndOffset
  $line = '{pkgname}' + $commandAst.Extent.Text.Substring(
    $commandEnd - $commandAst.Extent.StartOffset)
  $point = '{pkgname}'.Length + $cursorPosition - $commandEnd
  if ($point -gt $line.Length) { $line = $line.PadRight($point) }
  # The completer reads the tabtab COMP_* protocol from the environment.
  # PowerShell has no per-command env prefix, so set and restore them.
  $names = 'COMP_LINE', 'COMP_POINT', 'COMP_CWORD', 'BB_COMPLETION_SHELL'
  $saved = @{}
  foreach ($name in $names) {
    $saved[$name] = [Environment]::GetEnvironmentVariable($name)
  }
  try {
    $env:COMP_LINE = $line
    $env:COMP_POINT = "$point"
    $env:COMP_CWORD = "$(($line.Substring(0, $point) -split '\s+').Count - 1)"
    $env:BB_COMPLETION_SHELL = 'powershell'
    $candidates = & '{completer}' completion -- 2>$null
  } finally {
    foreach ($name in $names) {
      [Environment]::SetEnvironmentVariable($name, $saved[$name])
    }
  }

  foreach ($candidate in $candidates) {
    $value, $tooltip = $candidate -split "`t", 2
    if ($value.StartsWith($wordToComplete, [StringComparison]::Ordinal)) {
      if (-not $tooltip) { $tooltip = $value }
      [System.Management.Automation.CompletionResult]::new(
        $value, $value, 'ParameterValue', $tooltip)
    }
  }
}
###-end-{pkgname}-completion-###
