Add-Type -AssemblyName System.Drawing
[Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime] | Out-Null

$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
if (-not $engine) {
    Write-Output "OCR Engine failed to initialize."
    exit
}

function Get-OcrText($imagePath) {
    $absPath = (Resolve-Path $imagePath).Path
    $fileTask = [Windows.Storage.StorageFile]::GetFileFromPathAsync($absPath)
    $file = $fileTask.GetAwaiter().GetResult()
    $streamTask = $file.OpenAsync([Windows.Storage.FileAccessMode]::Read)
    $stream = $streamTask.GetAwaiter().GetResult()
    $decoderTask = [Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)
    $decoder = $decoderTask.GetAwaiter().GetResult()
    $softwareBitmapTask = $decoder.GetSoftwareBitmapAsync()
    $softwareBitmap = $softwareBitmapTask.GetAwaiter().GetResult()
    
    $ocrResultTask = $engine.RecognizeAsync($softwareBitmap)
    $ocrResult = $ocrResultTask.GetAwaiter().GetResult()
    return $ocrResult.Text
}

Get-ChildItem scratch/ch1_frames/*.png | Select-Object -First 30 | ForEach-Object {
    $text = Get-OcrText $_.FullName
    if ($text -match '\S') {
        Write-Output "$($_.Name): $text"
    }
}
