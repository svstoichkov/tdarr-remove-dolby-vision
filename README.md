# tdarr-remove-dolby-vision

A Tdarr plugin that removes Dolby Vision from HEVC video files while preserving the base HDR10 layer.

## Description

This plugin is designed to process video files that contain Dolby Vision metadata, stripping out the DV enhancement layer while maintaining the underlying HDR10 content. This is useful when you need to play content on devices that don't support Dolby Vision but do support HDR10.

## Requirements

- Tdarr
- FFmpeg (included with Tdarr)
- dovi_tool
- mkvmerge (included with Tdarr)

## Features

- Automatically detects presence of Dolby Vision metadata
- Preserves original audio and subtitle streams
- Outputs to MKV container
- Maintains HDR10 base layer

## Usage

1. Install the plugin in your Tdarr installation
2. Add it to your processing stack
3. The plugin will automatically skip files that don't contain Dolby Vision

## Notes

- Only processes files that contain Dolby Vision metadata
- Output will always be in MKV container format
- Original file streams (audio, subtitles) are preserved
