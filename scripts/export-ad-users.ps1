param(
  [string[]]$Email,
  [string]$InputCsv,
  [string]$UpKeepUsersJson = "data/generated/upkeep-users.json",
  [string]$OutputDir = "data/generated",
  [switch]$AllUpKeepUsers,
  [switch]$Probe
)

$ErrorActionPreference = "Stop"

function Normalize-Email {
  param([string]$Value)
  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $null
  }
  return $Value.Trim().ToLowerInvariant()
}

function First-Value {
  param([object[]]$Values)
  foreach ($value in $Values) {
    if ($null -ne $value -and -not [string]::IsNullOrWhiteSpace([string]$value)) {
      return $value
    }
  }
  return $null
}

function First-PropertyValue {
  param(
    [object]$Object,
    [string[]]$Names
  )
  foreach ($name in $Names) {
    if ($null -ne $Object.PSObject.Properties[$name]) {
      $value = $Object.PSObject.Properties[$name].Value
      if ($null -ne $value -and -not [string]::IsNullOrWhiteSpace([string]$value)) {
        return $value
      }
    }
  }
  return $null
}

function Escape-LdapFilterValue {
  param([string]$Value)
  $escaped = $Value.Replace("\", "\5c")
  $escaped = $escaped.Replace("*", "\2a")
  $escaped = $escaped.Replace("(", "\28")
  $escaped = $escaped.Replace(")", "\29")
  $escaped = $escaped.Replace([string][char]0, "\00")
  return $escaped
}

function Get-EmailsFromCsv {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Input CSV not found: $Path"
  }

  Import-Csv -LiteralPath $Path |
    ForEach-Object {
      Normalize-Email (First-PropertyValue -Object $_ -Names @(
        "email",
        "Email",
        "upkeepEmail",
        "UpKeepEmail",
        "mail",
        "Mail",
        "userPrincipalName",
        "UserPrincipalName"
      ))
    } |
    Where-Object { $_ } |
    Sort-Object -Unique
}

function Get-EmailsFromUpKeepJson {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "UpKeep users JSON not found: $Path. Run npm run upkeep:users first, or pass -InputCsv/-Email."
  }

  $payload = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json
  $users = if ($payload.users) { $payload.users } else { $payload }
  $users |
    ForEach-Object { Normalize-Email (First-PropertyValue -Object $_ -Names @("email", "Email")) } |
    Where-Object { $_ } |
    Sort-Object -Unique
}

function ConvertTo-AdRecord {
  param(
    [object]$User,
    [string]$LookupEmail,
    [string]$Source
  )

  if (-not $User) {
    return [pscustomobject]@{
      id = ""
      displayName = ""
      mail = ""
      userPrincipalName = ""
      accountEnabled = ""
      samAccountName = ""
      distinguishedName = ""
      lookupEmail = $LookupEmail
      adLookupStatus = "not_found"
      adLookupSource = $Source
    }
  }

  $enabled = $true
  $userAccountControl = First-PropertyValue -Object $User -Names @("userAccountControl")
  $userEnabled = First-PropertyValue -Object $User -Names @("Enabled")
  if ($null -ne $userAccountControl) {
    $enabled = -not (([int]$userAccountControl -band 2) -eq 2)
  } elseif ($null -ne $userEnabled) {
    $enabled = [bool]$userEnabled
  }

  $objectGuid = First-PropertyValue -Object $User -Names @("objectGUID", "ObjectGUID")
  $displayName = First-PropertyValue -Object $User -Names @("displayName", "Name")
  $mail = Normalize-Email (First-PropertyValue -Object $User -Names @("mail", "EmailAddress"))
  $userPrincipalName = First-PropertyValue -Object $User -Names @("userPrincipalName", "UserPrincipalName")
  $samAccountName = First-PropertyValue -Object $User -Names @("sAMAccountName", "SamAccountName")
  $distinguishedName = First-PropertyValue -Object $User -Names @("distinguishedName", "DistinguishedName")

  [pscustomobject]@{
    id = [string](First-Value @($objectGuid, ""))
    displayName = [string](First-Value @($displayName, ""))
    mail = [string](First-Value @($mail, $LookupEmail))
    userPrincipalName = [string](First-Value @($userPrincipalName, ""))
    accountEnabled = [string]$enabled
    samAccountName = [string](First-Value @($samAccountName, ""))
    distinguishedName = [string](First-Value @($distinguishedName, ""))
    lookupEmail = $LookupEmail
    adLookupStatus = "matched"
    adLookupSource = $Source
  }
}

function Find-WithActiveDirectoryModule {
  param([string]$LookupEmail)
  $escaped = $LookupEmail.Replace("'", "''")
  Get-ADUser -Filter "mail -eq '$escaped' -or userPrincipalName -eq '$escaped'" -Properties mail,userPrincipalName,displayName,Enabled |
    Select-Object -First 1
}

function Find-WithDirectorySearcher {
  param([string]$LookupEmail)
  $root = New-Object System.DirectoryServices.DirectoryEntry
  $searcher = New-Object System.DirectoryServices.DirectorySearcher($root)
  $escaped = Escape-LdapFilterValue $LookupEmail
  $searcher.Filter = "(&(objectCategory=person)(objectClass=user)(|(mail=$escaped)(userPrincipalName=$escaped)))"
  $searcher.SearchScope = "Subtree"
  $searcher.PageSize = 100

  @(
    "objectGUID",
    "displayName",
    "mail",
    "userPrincipalName",
    "sAMAccountName",
    "distinguishedName",
    "userAccountControl"
  ) | ForEach-Object { [void]$searcher.PropertiesToLoad.Add($_) }

  $result = $searcher.FindOne()
  if (-not $result) {
    return $null
  }

  $properties = $result.Properties
  $guid = ""
  if ($properties["objectguid"] -and $properties["objectguid"].Count -gt 0) {
    $guid = ([guid][byte[]]$properties["objectguid"][0]).Guid
  }

  [pscustomobject]@{
    objectGUID = $guid
    displayName = if ($properties["displayname"].Count -gt 0) { [string]$properties["displayname"][0] } else { "" }
    mail = if ($properties["mail"].Count -gt 0) { [string]$properties["mail"][0] } else { "" }
    userPrincipalName = if ($properties["userprincipalname"].Count -gt 0) { [string]$properties["userprincipalname"][0] } else { "" }
    sAMAccountName = if ($properties["samaccountname"].Count -gt 0) { [string]$properties["samaccountname"][0] } else { "" }
    distinguishedName = if ($properties["distinguishedname"].Count -gt 0) { [string]$properties["distinguishedname"][0] } else { "" }
    userAccountControl = if ($properties["useraccountcontrol"].Count -gt 0) { [int]$properties["useraccountcontrol"][0] } else { $null }
  }
}

function Get-AdLookupMethod {
  if (Get-Module -ListAvailable ActiveDirectory) {
    Import-Module ActiveDirectory
    return "ActiveDirectoryModule"
  }

  [System.DirectoryServices.DirectorySearcher] | Out-Null
  return "DirectorySearcher"
}

$method = Get-AdLookupMethod
$domain = try { [System.DirectoryServices.ActiveDirectory.Domain]::GetCurrentDomain().Name } catch { "" }

if ($Probe) {
  [pscustomobject]@{
    domain = $domain
    lookupMethod = $method
    activeDirectoryModuleAvailable = [bool](Get-Module -ListAvailable ActiveDirectory)
    directorySearcherAvailable = $true
  } | ConvertTo-Json -Depth 3
  exit 0
}

$emails = @()
if ($Email) {
  $emails += $Email | ForEach-Object { Normalize-Email $_ }
}
if ($InputCsv) {
  $emails += Get-EmailsFromCsv -Path $InputCsv
}
if ($AllUpKeepUsers) {
  $emails += Get-EmailsFromUpKeepJson -Path $UpKeepUsersJson
}

$emails = $emails | Where-Object { $_ } | Sort-Object -Unique
if ($emails.Count -eq 0) {
  throw "No emails provided. Use -Email, -InputCsv, or -AllUpKeepUsers."
}

$records = @(foreach ($lookupEmail in $emails) {
  $user = if ($method -eq "ActiveDirectoryModule") {
    Find-WithActiveDirectoryModule -LookupEmail $lookupEmail
  } else {
    Find-WithDirectorySearcher -LookupEmail $lookupEmail
  }
  ConvertTo-AdRecord -User $user -LookupEmail $lookupEmail -Source $method
})

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$jsonPath = Join-Path $OutputDir "ad-users.json"
$csvPath = Join-Path $OutputDir "ad-users.csv"
$payload = [pscustomobject]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  domain = $domain
  lookupMethod = $method
  users = $records
}

$payload | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $jsonPath -Encoding UTF8
$records | Export-Csv -LiteralPath $csvPath -NoTypeInformation -Encoding UTF8

$summary = $records | Group-Object adLookupStatus | ForEach-Object {
  [pscustomobject]@{ status = $_.Name; count = $_.Count }
}

[pscustomobject]@{
  domain = $domain
  lookupMethod = $method
  total = $records.Count
  summary = $summary
  json = $jsonPath
  csv = $csvPath
} | ConvertTo-Json -Depth 5
