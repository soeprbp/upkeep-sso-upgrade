$ErrorActionPreference = "Stop"

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

Invoke-NpmStep "Writing sanitized dashboard summary..." @("run", "users:summary")

Write-Host "User reconciliation complete. Detailed user files are under data\generated and are git-ignored."
