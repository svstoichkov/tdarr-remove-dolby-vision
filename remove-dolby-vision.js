function details() {
  return {
    id: "remove-dolby-vision",
    Stage: "Pre-processing",
    Name: "Remove Dolby Vision",
    Type: "Video",
    Operation: "Transcode",
    Description: "Removes Dolby Vision from HEVC video while preserving HDR10",
    Version: "1.0",
    Link: "",
    Tags: "pre-processing,ffmpeg,video,hevc,dovitools",
  };
}

async function plugin(file, librarySettings, inputs, otherArguments) {
  const spawn = require("child_process").spawnSync;
  const fs = require("fs");
  const path = require("path");

  // Set up response object
  let response = {
    processFile: false,
    preset: "",
    container: ".mkv",
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: false,
    infoLog: "",
    file,
    removeFromDB: false,
    updateDB: false,
    cli: [],
  };

  // Get the cache folder
  const workFolder = path.dirname(otherArguments.cacheFilePath);
  response.infoLog += `Using cache folder: ${workFolder}\n`;

  // Check if file has Dolby Vision
  const hasDV = file?.ffProbeData?.streams?.[0]?.side_data_list?.some(
    (data) => data.side_data_type === "DOVI configuration record"
  );

  if (!hasDV) {
    response.infoLog += "☒ File does not have Dolby Vision, skipping\n";
    return response;
  }

  // Set up file paths
  const origHevc = path.join(workFolder, "original.hevc");
  const procHevc = path.join(workFolder, "processed.hevc");
  const outputPath = otherArguments.cacheFilePath;

  // Extract HEVC
  response.infoLog += "Extracting HEVC stream...\n";
  const extract = spawn("tdarr-ffmpeg", ["-i", file.file, "-c:v", "copy", "-bsf:v", "hevc_mp4toannexb", origHevc]);
  if (extract.error || extract.status !== 0) {
    throw new Error(`FFmpeg extract failed: ${extract.stderr}`);
  }

  // Remove DV
  response.infoLog += "Removing Dolby Vision...\n";
  const dovi = spawn("dovi_tool", ["remove", "-i", origHevc, "-o", procHevc]);
  if (dovi.error || dovi.status !== 0) {
    throw new Error(`dovi_tool failed: ${dovi.stderr}`);
  }

  // Remux with mkvmerge
  response.infoLog += "Remuxing with original streams...\n";
  const mkvmerge = spawn("mkvmerge", ["-o", outputPath, procHevc, "--no-video", file.file]);
  if (mkvmerge.error || mkvmerge.status !== 0) {
    throw new Error(`mkvmerge failed: ${mkvmerge.stderr}`);
  }

  // Add FFmpeg command
  response.FFmpegMode = true;
  response.processFile = true;
  response.cli = [
    "-i",
    outputPath, // Input: output file from mkvmerge
    "-map",
    "0", // Map all streams from input
    "-c",
    "copy", // Copy all streams without re-encoding
  ];

  response.infoLog += "☒ Successfully removed Dolby Vision\n";

  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
