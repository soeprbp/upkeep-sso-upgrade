param(
  [string]$Server = $env:PAYROLL_SQL_SERVER,
  [string]$Database = $env:PAYROLL_SQL_DATABASE,
  [string]$Table = $env:PAYROLL_SQL_TABLE,
  [string]$OutputDir = "data/generated",
  [string]$InputDiff = "data/generated/user-diff.json",
  [string]$UpKeepUsersJson = "data/generated/upkeep-users.json",
  [string[]]$LastName,
  [switch]$FromMissingAdUsers,
  [switch]$FromAllUpKeepUsers,
  [int]$Top = 50
)

$ErrorActionPreference = "Stop"

function Import-DotEnv {
  param([string]$Path = ".env.local")
  if (-not (Test-Path -LiteralPath $Path)) {
    return
  }

  Get-Content -LiteralPath $Path |
    Where-Object { $_ -match '^\s*[^#][^=]+=' } |
    ForEach-Object {
      $index = $_.IndexOf("=")
      $key = $_.Substring(0, $index).Trim()
      $value = $_.Substring($index + 1).Trim().Trim('"').Trim("'")
      if (-not [Environment]::GetEnvironmentVariable($key, "Process")) {
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
      }
    }
}

Import-DotEnv

$trustServerCertificate = $false
$trustServerCertificateSetting = $env:PAYROLL_SQL_TRUST_SERVER_CERTIFICATE
if (-not [string]::IsNullOrWhiteSpace($trustServerCertificateSetting)) {
  if (-not [bool]::TryParse($trustServerCertificateSetting, [ref]$trustServerCertificate)) {
    throw "PAYROLL_SQL_TRUST_SERVER_CERTIFICATE must be true or false."
  }
}

if ([string]::IsNullOrWhiteSpace($Server)) {
  $Server = $env:PAYROLL_SQL_SERVER
}
if ([string]::IsNullOrWhiteSpace($Database)) {
  $Database = $env:PAYROLL_SQL_DATABASE
}
if ([string]::IsNullOrWhiteSpace($Table)) {
  $Table = $env:PAYROLL_SQL_TABLE
}

if ([string]::IsNullOrWhiteSpace($Server)) {
  $Server = "SVWPDBS04"
}
if ([string]::IsNullOrWhiteSpace($Table)) {
  $Table = "EMP_INFO"
}
if ([string]::IsNullOrWhiteSpace($Database)) {
  throw "PAYROLL_SQL_DATABASE is required. Payroll lookups are read-only against $Server."
}
if ($Top -lt 1 -or $Top -gt 200) {
  throw "-Top must be between 1 and 200."
}
if ($Table -notmatch '^[A-Za-z0-9_\.\[\]]+$') {
  throw "Unsafe table name: $Table"
}

function Normalize-LastName {
  param([string]$Value)
  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $null
  }
  return $Value.Trim()
}

function Get-LastNamesFromDiff {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Diff file not found: $Path. Run npm run users:diff first."
  }

  $payload = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json
  @($payload.rows) |
    Where-Object { $_.status -eq "missing_entra_user" } |
    ForEach-Object {
      $last = Normalize-LastName $_.upkeepLastName
      if ($last) {
        return $last
      }

      $displayName = [string]$_.upkeepDisplayName
      if ($displayName -match '\S+\s+(\S+)$') {
        return $Matches[1]
      }
    } |
    Where-Object { $_ } |
    Sort-Object -Unique
}

function Get-LastNamesFromUpKeepUsers {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "UpKeep users JSON not found: $Path. Run npm run upkeep:users first."
  }

  $payload = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json
  @($payload.users) |
    Where-Object { [string]$_.email -notmatch '\+' } |
    ForEach-Object {
      $last = Normalize-LastName $_.lastName
      if ($last) {
        return $last
      }

      $displayName = [string]$_.displayName
      if ($displayName -match '\S+\s+(\S+)$') {
        return $Matches[1]
      }
    } |
    Where-Object { $_ } |
    Sort-Object -Unique
}

function New-ReadOnlyConnection {
  $builder = New-Object System.Data.SqlClient.SqlConnectionStringBuilder
  $builder["Data Source"] = $Server
  $builder["Initial Catalog"] = $Database
  $builder["Integrated Security"] = $true
  $builder["Application Name"] = "UpKeep SSO Payroll Read Only"
  $builder["ApplicationIntent"] = "ReadOnly"
  $builder["Encrypt"] = $true
  $builder["TrustServerCertificate"] = $trustServerCertificate
  $builder["Connect Timeout"] = 15
  New-Object System.Data.SqlClient.SqlConnection $builder.ConnectionString
}

function Invoke-ReadOnlyLastNameLookup {
  param(
    [System.Data.SqlClient.SqlConnection]$Connection,
    [string]$Name
  )

  $command = $Connection.CreateCommand()
  $command.CommandType = [System.Data.CommandType]::Text
  $command.CommandText = "SELECT TOP ($Top) * FROM $Table WHERE last_name = @lastName"
  if ($command.CommandText -notmatch '^\s*SELECT\s+TOP\s+\(\d+\)\s+\*\s+FROM\s+[A-Za-z0-9_\.\[\]]+\s+WHERE\s+last_name\s+=\s+@lastName\s*$') {
    throw "Blocked non-approved payroll query shape."
  }

  [void]$command.Parameters.Add("@lastName", [System.Data.SqlDbType]::NVarChar, 100)
  $command.Parameters["@lastName"].Value = $Name

  $adapter = New-Object System.Data.SqlClient.SqlDataAdapter $command
  $table = New-Object System.Data.DataTable
  [void]$adapter.Fill($table)
  return ,$table
}

$names = @()
if ($LastName) {
  $names += $LastName | ForEach-Object { Normalize-LastName $_ }
}
if ($FromMissingAdUsers) {
  $names += Get-LastNamesFromDiff -Path $InputDiff
}
if ($FromAllUpKeepUsers) {
  $names += Get-LastNamesFromUpKeepUsers -Path $UpKeepUsersJson
}
$names = $names | Where-Object { $_ } | Sort-Object -Unique
if ($names.Count -eq 0) {
  throw "No last names provided. Use -LastName, -FromMissingAdUsers, or -FromAllUpKeepUsers."
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$connection = New-ReadOnlyConnection
$records = New-Object System.Collections.Generic.List[object]

try {
  $connection.Open()
  foreach ($name in $names) {
    $result = Invoke-ReadOnlyLastNameLookup -Connection $connection -Name $name
    for ($rowIndex = 0; $rowIndex -lt $result.Rows.Count; $rowIndex += 1) {
      $row = $result.Rows.Item($rowIndex)
      $record = [ordered]@{
        payrollLookupLastName = $name
      }
      for ($columnIndex = 0; $columnIndex -lt $result.Columns.Count; $columnIndex += 1) {
        $column = $result.Columns.Item($columnIndex)
        $value = $row.ItemArray[$columnIndex]
        if ($value -eq [DBNull]::Value) {
          $value = $null
        }
        $record[$column.ColumnName] = $value
      }
      $records.Add([pscustomobject]$record)
    }
  }
} finally {
  $connection.Close()
}

$jsonPath = Join-Path $OutputDir "payroll-users.json"
$csvPath = Join-Path $OutputDir "payroll-users.csv"
$payload = [pscustomobject]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  server = $Server
  database = $Database
  table = $Table
  queryMode = "READ_ONLY_LAST_NAME_SELECT"
  lookupCount = $names.Count
  resultCount = $records.Count
  users = $records
}

$payload | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $jsonPath -Encoding UTF8
$records | Export-Csv -LiteralPath $csvPath -NoTypeInformation -Encoding UTF8

[pscustomobject]@{
  server = $Server
  database = $Database
  table = $Table
  queryMode = "READ_ONLY_LAST_NAME_SELECT"
  lookupCount = $names.Count
  resultCount = $records.Count
  json = $jsonPath
  csv = $csvPath
} | ConvertTo-Json -Depth 4
