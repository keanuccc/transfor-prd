# SessionStart hook - injects superpowers:using-superpowers awareness at session start.
param()

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Resolve-Path "$scriptDir\..\.."
$skillsDir = "$projectDir\.claude\skills"
$usingSuperpowersFile = "$skillsDir\using-superpowers\SKILL.md"

if (-not (Test-Path $usingSuperpowersFile)) {
    exit 0
}

$usingSuperpowersContent = Get-Content -Path $usingSuperpowersFile -Raw -Encoding UTF8

# Escape for JSON string embedding
function Escape-ForJson {
    param([string]$s)
    $s = $s.Replace('\', '\\')
    $s = $s.Replace('"', '\"')
    $s = $s.Replace("`r`n", '\n')
    $s = $s.Replace("`n", '\n')
    $s = $s.Replace("`r", '\r')
    $s = $s.Replace("`t", '\t')
    return $s
}

$escaped = Escape-ForJson $usingSuperpowersContent

$namespaceNote = "`n`n**NAMESPACE NOTE:** Superpowers skills are installed at the project level in .claude/skills/. When the skill content below references `superpowers:skill-name`, invoke the Skill tool with just the skill name (without the `superpowers:` prefix). For example, `superpowers:brainstorming` means invoke `brainstorming`."

$sessionContext = "<EXTREMELY_IMPORTANT>`nYou have superpowers.`n`n**Below is the full content of your 'superpowers:using-superpowers' skill - your introduction to using skills. For all other skills, use the 'Skill' tool:**`n`n$escaped`n$namespaceNote`n</EXTREMELY_IMPORTANT>"

# Manually construct JSON to avoid PowerShell 5.1 ConvertTo-Json unicode-escaping < > '
$json = '{' +
    '"hookSpecificOutput":{' +
        '"hookEventName":"SessionStart",' +
        '"additionalContext":"' + $sessionContext + '"' +
    '}' +
'}'

Write-Output $json
exit 0
