# 以管理员身份运行：把 Node.js 的入站 Block 规则改成 Allow（Public 网络下手机才能访问 3000/8081）
$log = 'C:\ct\.firewall.log'
$rules = @(Get-NetFirewallRule -Direction Inbound -ErrorAction SilentlyContinue |
    Where-Object { $_.DisplayName -like 'Node.js*' -and $_.Action -eq 'Block' })

try {
    foreach ($rule in $rules) {
        Set-NetFirewallRule -Name $rule.Name -Action Allow -ErrorAction Stop
    }
    $result = "converted=$($rules.Count)"
} catch {
    $result = "error=$($_.Exception.Message)"
}

$remaining = @(Get-NetFirewallRule -Direction Inbound -ErrorAction SilentlyContinue |
    Where-Object { $_.DisplayName -like 'Node.js*' })
$summary = @(
    "result=$result"
    "node rules now: " + (($remaining | ForEach-Object { "$($_.DisplayName):$($_.Action):$($_.Profile)" }) -join ' | ')
    "api rule: " + ((Get-NetFirewallRule -DisplayName 'campus-team api' -ErrorAction SilentlyContinue | ForEach-Object { "$($_.Action)/$($_.Profile)" }) -join ',')
    "profile: " + ((Get-NetConnectionProfile -ErrorAction SilentlyContinue | ForEach-Object { "$($_.Name)=$($_.NetworkCategory)" }) -join ',')
)
$summary | Out-File -FilePath $log -Encoding utf8
