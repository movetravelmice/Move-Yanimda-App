$dict = @{
    "ÅŸ" = "ş"
    "Ä±" = "ı"
    "Ã¼" = "ü"
    "âœ…" = "✅"
    "ÄŸ" = "ğ"
    "Ã§" = "ç"
    "Ã–" = "Ö"
    "Ä°" = "İ"
    "Åž" = "Ş"
    "Ã‡" = "Ç"
    "Ã¶" = "ö"
    "ğŸ“§" = "📧"
    "ğŸ‡¹ğŸ‡·" = "🇹🇷"
}

$files = Get-ChildItem -Path "C:\Users\otina\.gemini\antigravity\scratch\travel-app\src" -Filter *.jsx -Recurse
foreach ($f in $files) {
    # Read bytes instead of depending on Get-Content
    $bytes = [System.IO.File]::ReadAllBytes($f.FullName)
    $content = [System.Text.Encoding]::UTF8.GetString($bytes)
    
    $modified = $false
    foreach ($k in $dict.Keys) {
        if ($content.Contains($k)) {
            $content = $content.Replace($k, $dict[$k])
            $modified = $true
        }
    }
    if ($modified) {
        [System.IO.File]::WriteAllText($f.FullName, $content, [System.Text.Encoding]::UTF8)
    }
}
echo "Encoding restored!"
