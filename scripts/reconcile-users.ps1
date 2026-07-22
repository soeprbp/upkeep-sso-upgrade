$ErrorActionPreference = "Stop"

if (Test-Path -LiteralPath ".env.local") {
    Get-Content -LiteralPath ".env.local" |
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

function Invoke-NpmStep {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Label,

        [Parameter(Mandatory = $true)]
        [string[]] $Arguments
    )

    Write-Host $Label
    & npm @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Step failed: $Label"
    }
}

Invoke-NpmStep "Fetching UpKeep users..." @("run", "upkeep:users")

Invoke-NpmStep "Looking up UpKeep user emails in local AD..." @("run", "ad:users")

Invoke-NpmStep "Comparing UpKeep users with local AD lookup results..." @("run", "users:diff", "--", "--entra-csv", "data\generated\ad-users.csv")

if (-not [string]::IsNullOrWhiteSpace($env:PAYROLL_SQL_DATABASE)) {
    Invoke-NpmStep "Looking up UpKeep users in payroll SQL read-only..." @("run", "payroll:upkeep-users")
    Invoke-NpmStep "Adding payroll matches to the user diff..." @("run", "users:diff", "--", "--entra-csv", "data\generated\ad-users.csv", "--payroll-csv", "data\generated\payroll-users.csv")
} else {
    Write-Host "Skipping payroll SQL lookup because PAYROLL_SQL_DATABASE is not set."
}

Invoke-NpmStep "Writing sanitized dashboard summary..." @("run", "users:summary")

Write-Host "User reconciliation complete. Detailed user files are under data\generated and are git-ignored."
