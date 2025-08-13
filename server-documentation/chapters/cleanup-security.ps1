$files = Get-ChildItem *.md
foreach($file in $files) {
    Write-Host "Processing: $($file.Name)"
    $content = Get-Content $file.Name -Raw
    
    # Reemplazar información sensible
    $content = $content -replace 'casa74b', '[USERNAME]'
    $content = $content -replace '192\.168\.1\.', '192.168.0.'
    $content = $content -replace '210719', '[SECURE_PASSWORD]'
    $content = $content -replace 'ecom\.jct@gmail\.com', '[EMAIL@DOMAIN.COM]'
    $content = $content -replace 'X\+M8NG49_y3Wfav', '[NORDVPN_PASSWORD]'
    $content = $content -replace '\$@msunG--2025', '[MYSQL_PASSWORD_EXAMPLE]'
    $content = $content -replace 'msunG--2025', '[MYSQL_PASSWORD_EXAMPLE]'
    $content = $content -replace '8888', '8080'
    $content = $content -replace '2222', '[SSH_CUSTOM_PORT]'
    $content = $content -replace 'duckdns\.org', '[YOUR_DOMAIN].duckdns.org'
    
    Set-Content $file.Name -Value $content
    Write-Host "Cleaned: $($file.Name)"
}
Write-Host "Security cleanup completed!"
