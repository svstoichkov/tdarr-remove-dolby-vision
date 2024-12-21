param([string]$inputFile = $args[0])

# If no input file provided, show file picker
if (-not $args[0]) {
    Add-Type -AssemblyName System.Windows.Forms
    $FileBrowser = New-Object System.Windows.Forms.OpenFileDialog
    $FileBrowser.Filter = "MKV files (*.mkv)|*.mkv|All files (*.*)|*.*"
    $FileBrowser.Title = "Select an MKV file"
    
    if ($FileBrowser.ShowDialog() -eq "OK") {
        $inputFile = $FileBrowser.FileName
    } else {
        Write-Host "No file selected. Exiting..."
        exit 1
    }
} else {
    $inputFile = $args[0]
}

# Get the directory and filename without extension
$directory = Split-Path -Parent $inputFile
$filename = [System.IO.Path]::GetFileNameWithoutExtension($inputFile)
$tempOutputFile = Join-Path $directory "$filename-no-dv.mkv"

# Create temporary file paths
$tempVideo = Join-Path $directory "temp_video.hevc"
$tempVideoNoDV = Join-Path $directory "temp_video_nodv.hevc"

try {
    # Extract HEVC stream
    ffmpeg -i $inputFile -c:v copy -bsf:v hevc_mp4toannexb $tempVideo
    
    # Remove Dolby Vision
    dovi_tool remove -i $tempVideo -o $tempVideoNoDV
    
    # Remux with original audio/subtitle streams
    mkvmerge -o $tempOutputFile $tempVideoNoDV --no-video $inputFile

    # If processing completed successfully, ask for confirmation to replace the original file
    if (Test-Path $tempOutputFile) {
        $response = Read-Host "Do you want to overwrite the original file? (y/n)"
        if ($response -eq 'y') {
            Remove-Item $inputFile
            Rename-Item $tempOutputFile $inputFile
            Write-Host "Successfully processed and replaced original file"
        } else {
            Write-Host "Original file not replaced. Processed file saved as $tempOutputFile"
        }
    }
} finally {
    # Cleanup temporary files
    if (Test-Path $tempVideo) { Remove-Item $tempVideo }
    if (Test-Path $tempVideoNoDV) { Remove-Item $tempVideoNoDV }
    # Clean up temp output file if something went wrong
    if ((Test-Path $tempOutputFile) -and (Test-Path $inputFile)) { 
        Remove-Item $tempOutputFile 
    }
}