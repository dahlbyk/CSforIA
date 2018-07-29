param($Path)
$csv = Get-Content $Path | ConvertFrom-Csv -Delimiter "`t" | ConvertTo-Csv -NoTypeInformation
$csvPath = Join-Path (Resolve-Path .) 'gradeLevelData.csv'

# Out-File -Encoding UTF8 .\gradeLevelData.csv # Adds BOM :(
[System.IO.File]::WriteAllLines($csvPath, $csv)
