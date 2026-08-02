$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$builderImage = "electronuserland/builder:22-05.26"

docker info *> $null
if ($LASTEXITCODE -ne 0) {
  throw "Docker Desktop's Linux engine is not running. Start Docker Desktop and wait until it reports that the engine is ready, then run npm run dist:linux:docker again."
}

$dockerArguments = @(
  "run",
  "--rm",
  "--platform", "linux/amd64",
  "--env", "ELECTRON_CACHE=/root/.cache/electron",
  "--env", "ELECTRON_BUILDER_CACHE=/root/.cache/electron-builder",
  "--volume", "${projectRoot}:/project",
  "--volume", "work-day-with-god-node-modules:/project/node_modules",
  "--volume", "work-day-with-god-electron-cache:/root/.cache/electron",
  "--volume", "work-day-with-god-builder-cache:/root/.cache/electron-builder",
  "--workdir", "/project",
  $builderImage,
  "/bin/bash", "-lc",
  "npm ci && npm run dist:linux"
)

Write-Host "Building Linux x64 packages with $builderImage"
& docker @dockerArguments
if ($LASTEXITCODE -ne 0) {
  throw "The Linux package build failed with exit code $LASTEXITCODE."
}
