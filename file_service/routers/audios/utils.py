# AI code
#!/usr/bin/env python3
import yt_dlp
import ffmpeg
import os
import sys
import shutil
import tempfile


# --- Main Download Function ---
def download_audio(url, output_path="assets/audios") -> str:
    """
    Downloads audio from a supported URL (YouTube, SoundCloud, etc.) using yt-dlp
    and converts it to MP3 using ffmpeg.

    Args:
        url (str): The URL of the audio/video to download.
        output_path (str): The directory to save the final MP3 file.
                           Defaults to the current directory.
    """
    # Use a temporary directory for the initial download to avoid filename conflicts
    # and make cleanup easier, especially if yt-dlp modifies the filename.
    temp_dir = tempfile.mkdtemp(prefix="audio_dl_")

    downloaded_file_path = None
    final_mp3_path = None
    original_filename_base = "unknown_audio"  # Default base name

    # --- yt-dlp options ---
    ydl_opts = {
        "format": "bestaudio/best",
        "extractaudio": True,
        "audioformat": "mp3",
        "outtmpl": {
            "default": os.path.join(temp_dir, "%(title)s.%(ext)s"),
        },
        "restrictfilenames": True,
        "noplaylist": True,
        "nocheckcertificate": True,
        "ignoreerrors": False,
        "logtostderr": False,
        "quiet": True,
        "no_warnings": True,
        "default_search": "ytsearch",
        "source_address": "0.0.0.0",
        "verbose": False,
    }

    try:
        # --- Step 1: Download using yt-dlp ---
        print(f"Attempting to download audio from: {url}")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Extract info first to get an idea of the filename(s)
            info_dict = ydl.extract_info(url, download=False)
            if not info_dict:
                print(f"Could not extract info for URL: {url}", file=sys.stderr)
                raise yt_dlp.utils.DownloadError("Failed to extract video info.")

            # Get a representative filename base (useful for single files or first in playlist)
            first_entry = info_dict.get("entries", [info_dict])[0]
            temp_filename_template = ydl_opts["outtmpl"]["default"]
            # Use prepare_filename to get the expected name *before* download
            # Note: yt-dlp might still change it slightly (e.g., sanitization)
            expected_temp_path = ydl.prepare_filename(first_entry, outtmpl=temp_filename_template)
            original_filename_base = os.path.splitext(os.path.basename(expected_temp_path))[0]

            print(f"Expected temporary file base name: {original_filename_base}")
            print(f"Starting download process into {temp_dir}...")
            ydl.download([url])  # Perform the actual download

        # --- Find the downloaded file(s) ---
        # Since yt-dlp might download multiple files (playlist) or sanitize names,
        # we look for the file(s) in the temp directory.
        # For simplicity, this example processes the *first* successfully downloaded file found.
        # A more robust implementation might loop through all downloaded files.

        downloaded_files = os.listdir(temp_dir)
        if not downloaded_files:
            print(
                f"Error: No files found in temporary directory after download attempt: {temp_dir}",
                file=sys.stderr,
            )
            raise yt_dlp.utils.DownloadError("Download completed, but no output file found.")

        # Take the first file found in the temp directory
        downloaded_file_path = os.path.join(temp_dir, downloaded_files[0])
        # Update base name in case it was sanitized differently than expected
        original_filename_base = os.path.splitext(downloaded_files[0])[0]

        # --- Step 2: Convert using ffmpeg-python ---
        final_mp3_filename = f"{original_filename_base}.mp3"
        final_mp3_path = os.path.join(output_path, final_mp3_filename)

        # Step 3 (Cleanup) is handled in the finally block
        (
            ffmpeg.input(downloaded_file_path)
            .output(
                final_mp3_path,
                audio_bitrate="192k",
                **{"acodec": "libmp3lame"},  # Specify MP3 codec
            )
            .overwrite_output()  # Overwrite if MP3 exists
            .run(
                cmd="ffmpeg", capture_stdout=True, capture_stderr=True
            )  # Use ffmpeg command, capture output
        )

    except yt_dlp.utils.DownloadError as e:
        raise RuntimeError(f"yt-dlp download error: {e}") from e
    except Exception:
        import traceback

        traceback.print_exc()  # Print full traceback for debugging unexpected errors

    finally:
        # --- Step 3: Clean up temporary directory ---
        if os.path.exists(temp_dir):
            try:
                print(f"Cleaning up temporary directory: {temp_dir}")
                shutil.rmtree(temp_dir)
            except OSError as e:
                print(
                    f"Warning: Could not remove temporary directory {temp_dir}: {e}",
                    file=sys.stderr,
                )

    if final_mp3_path and os.path.exists(final_mp3_path):
        return final_mp3_filename
    else:
        raise RuntimeError("Audio download and conversion failed for an unknown reason.")
