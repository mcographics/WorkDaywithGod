param(
  [switch]$SyncOnly,
  [switch]$Release
)

$ErrorActionPreference = "Stop"
if ($SyncOnly -and $Release) {
  throw "-SyncOnly and -Release cannot be used together."
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$androidRoot = Join-Path $projectRoot "android"
$sdkCandidates = @(
  $env:ANDROID_HOME,
  $env:ANDROID_SDK_ROOT,
  (Join-Path $env:LOCALAPPDATA "Android\Sdk")
) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }
$jdkCandidates = @(
  $env:JAVA_HOME,
  (Join-Path $env:LOCALAPPDATA "Programs\Temurin-21")
) | Where-Object { $_ -and (Test-Path -LiteralPath (Join-Path $_ "bin\java.exe")) }

$androidSdk = $sdkCandidates | Select-Object -First 1
$javaHome = $jdkCandidates | Where-Object {
  $startInfo = New-Object System.Diagnostics.ProcessStartInfo
  $startInfo.FileName = Join-Path $_ "bin\java.exe"
  $startInfo.Arguments = "-version"
  $startInfo.UseShellExecute = $false
  $startInfo.RedirectStandardError = $true
  $startInfo.RedirectStandardOutput = $true
  $process = [System.Diagnostics.Process]::Start($startInfo)
  $versionText = $process.StandardError.ReadToEnd() + $process.StandardOutput.ReadToEnd()
  $process.WaitForExit()
  if ($versionText -notmatch 'version "(?<version>[0-9]+)(?:\.(?<minor>[0-9]+))?') { return $false }
  $major = if ([int]$Matches.version -eq 1) { [int]$Matches.minor } else { [int]$Matches.version }
  $major -ge 17 -and $major -le 24
} | Select-Object -First 1
$node = (Get-Command node -ErrorAction Stop).Source

if (-not $androidSdk) {
  throw "Android SDK not found. Install API 36 and Build-Tools 36.0.0 with Android Studio."
}
if (-not $javaHome) {
  throw "JDK 21 not found. Set JAVA_HOME to a supported JDK 17 through 24."
}

$nodeMajor = [int]((& $node -p "Number(process.versions.node.split('.')[0])").Trim())
if ($nodeMajor -lt 22) {
  throw "Capacitor 8 requires Node.js 22 or newer; found Node.js $nodeMajor at $node."
}

$env:JAVA_HOME = $javaHome
$env:ANDROID_HOME = $androidSdk
$env:ANDROID_SDK_ROOT = $androidSdk

$signingPropertiesPath = if ($env:WORKDAYWITHGOD_ANDROID_SIGNING_PROPERTIES) {
  $env:WORKDAYWITHGOD_ANDROID_SIGNING_PROPERTIES
} else {
  Join-Path $env:USERPROFILE ".android\workdaywithgod-release-signing.properties"
}

if ($Release) {
  if (-not (Test-Path -LiteralPath $signingPropertiesPath)) {
    throw "Android release signing properties were not found at $signingPropertiesPath. See docs/ANDROID.md."
  }
  $env:WORKDAYWITHGOD_ANDROID_SIGNING_PROPERTIES = $signingPropertiesPath
}

Push-Location $projectRoot
try {
  & $node "node_modules\vite\bin\vite.js" build
  if ($LASTEXITCODE -ne 0) { throw "Vite build failed with exit code $LASTEXITCODE." }

  & $node "node_modules\@capacitor\cli\bin\capacitor" sync android
  if ($LASTEXITCODE -ne 0) { throw "Capacitor sync failed with exit code $LASTEXITCODE." }

  if (-not $SyncOnly) {
    Push-Location $androidRoot
    try {
      $gradleTask = if ($Release) { "assembleRelease" } else { "assembleDebug" }
      & ".\gradlew.bat" $gradleTask
      if ($LASTEXITCODE -ne 0) { throw "Android Gradle build failed with exit code $LASTEXITCODE." }
    } finally {
      Pop-Location
    }
  }
} finally {
  Pop-Location
}

if ($SyncOnly) {
  Write-Host "Android project synchronized successfully."
} else {
  $variant = if ($Release) { "release" } else { "debug" }
  $apkName = if ($Release) { "app-release.apk" } else { "app-debug.apk" }
  $apk = Join-Path $androidRoot "app\build\outputs\apk\$variant\$apkName"
  if (-not (Test-Path -LiteralPath $apk)) { throw "Gradle completed without producing $apk." }

  $gradleProperties = Get-Content -LiteralPath (Join-Path $androidRoot "gradle.properties")
  $versionLine = $gradleProperties | Where-Object { $_ -match '^androidVersionName=(.+)$' } | Select-Object -First 1
  if (-not $versionLine) { throw "androidVersionName is missing from android/gradle.properties." }
  $version = ([regex]::Match($versionLine, '^androidVersionName=(.+)$')).Groups[1].Value.Trim()
  $releaseDirectory = Join-Path $projectRoot "release\android"
  $artifactPrefix = if ($Release) { "Work-Day-with-God-Android" } else { "Work-Day-with-God-Android-Debug" }
  $releaseApk = Join-Path $releaseDirectory "$artifactPrefix-$version.apk"
  New-Item -ItemType Directory -Path $releaseDirectory -Force | Out-Null
  Copy-Item -LiteralPath $apk -Destination $releaseApk -Force

  if ($Release) {
    $buildTools = Get-ChildItem -LiteralPath (Join-Path $androidSdk "build-tools") -Directory |
      Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName "apksigner.bat") } |
      Sort-Object { [version]$_.Name } -Descending |
      Select-Object -First 1
    if (-not $buildTools) { throw "Android apksigner was not found below $androidSdk\build-tools." }

    & (Join-Path $buildTools.FullName "zipalign.exe") -c -P 16 4 $releaseApk
    if ($LASTEXITCODE -ne 0) { throw "The release APK is not correctly zip-aligned." }
    & (Join-Path $buildTools.FullName "apksigner.bat") verify --verbose --print-certs $releaseApk
    if ($LASTEXITCODE -ne 0) { throw "The release APK signature could not be verified." }
  }

  $sha256 = [System.Security.Cryptography.SHA256]::Create()
  $stream = [System.IO.File]::OpenRead($releaseApk)
  try {
    $hash = [System.BitConverter]::ToString($sha256.ComputeHash($stream)).Replace("-", "")
  } finally {
    $stream.Dispose()
    $sha256.Dispose()
  }
  $checksumFile = "$releaseApk.sha256"
  [System.IO.File]::WriteAllText($checksumFile, "$hash  $([System.IO.Path]::GetFileName($releaseApk))`n", [System.Text.UTF8Encoding]::new($false))
  $artifactLabel = if ($Release) { "signed release" } else { "debug" }
  Write-Host "Android $artifactLabel APK: $releaseApk"
  Write-Host "Checksum file: $checksumFile"
  Write-Host "SHA-256: $hash"
}
