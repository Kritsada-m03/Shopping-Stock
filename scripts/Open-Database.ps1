$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$databasePath = Join-Path $projectRoot 'backend\Shopping.Api\App_Data\shopping.db'
if (-not (Test-Path -LiteralPath $databasePath)) {
    dotnet run --project (Join-Path $projectRoot 'backend\Shopping.Api') -- --init-db
    if ($LASTEXITCODE -ne 0) { throw 'Database initialization failed.' }
}
$dbeaverPath = 'C:\Program Files\DBeaver\dbeaver.exe'
if (-not (Test-Path -LiteralPath $dbeaverPath)) {
    $dbeaverPath = (Get-Command dbeaver.exe -ErrorAction Stop).Source
}
$connectionArgument = '"driver=sqlite|database=' + $databasePath + '|name=Shopping SQLite|connect=true|openConsole=true"'
Start-Process -FilePath $dbeaverPath -ArgumentList @('-con', $connectionArgument)
Write-Output "DBeaver database: $databasePath"

