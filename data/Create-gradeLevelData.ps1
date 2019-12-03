param($Path)
$csv = Get-Content $Path | ConvertFrom-Csv -Delimiter "`t" | Sort-Object 'School District Name','School Name','Gradespan' | ConvertTo-Csv -NoTypeInformation
$csvPath = Join-Path (Resolve-Path .) '2018/gradeLevelData.csv'

# Out-File -Encoding UTF8 .\gradeLevelData.csv # Adds BOM :(
[System.IO.File]::WriteAllLines($csvPath, $csv)