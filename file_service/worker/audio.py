# AI code
#!/usr/bin/env python3
import yt_dlp
import ffmpeg
import os
import sys
import shutil
import tempfile
import time  # Import the time module
import random
from fastapi import HTTPException
from utils.image_module import upload_audio
from yt_dlp.utils import DownloadError
from base.database.redis import queue
import beanie
from models import document_models
from base.database.mongodb import client
from models.audios import Audios


# --- Main Download Function ---
def download_audio(url, output_path=".cache/audios") -> str:
    """
    Downloads audio from a supported URL (YouTube, SoundCloud, etc.) using yt-dlp
    and converts it to Opus using ffmpeg.

    Args:
        url (str): The URL of the audio/video to download.
        output_path (str): The directory to save the final Opus file.
                           Defaults to the current directory.
    """
    # Use a temporary directory for the initial download to avoid filename conflicts
    # and make cleanup easier, especially if yt-dlp modifies the filename.
    temp_dir = tempfile.mkdtemp(prefix="audio_dl_")

    downloaded_file_path = None
    final_opus_path = None
    original_filename_base = "unknown_audio"  # Default base name

    # --- yt-dlp options ---
    ydl_opts = {
        "format": "bestaudio/best",
        "extractaudio": True,
        "audioformat": "opus",  # Changed to opus
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

        # Update base name in case it was sanitized differently than expected
        downloaded_filename = downloaded_files[0]
        original_filename_base, original_ext = os.path.splitext(downloaded_filename)

        final_opus_filename = f"{original_filename_base}.opus"
        final_opus_path = os.path.join(output_path, final_opus_filename)

        # --- Step 2: Check if conversion is needed ---
        if original_ext.lower() == ".opus":
            print(
                f"Downloaded file {downloaded_filename} is already in Opus format. Skipping conversion."
            )
            # Ensure output directory exists
            os.makedirs(output_path, exist_ok=True)
            # Copy the file directly
            shutil.copy2(os.path.join(temp_dir, downloaded_filename), final_opus_path)
        else:
            print(
                f"Downloaded file {downloaded_filename} is in {original_ext} format. Converting to Opus."
            )
            # Convert using ffmpeg-python
            (
                ffmpeg.input(os.path.join(temp_dir, downloaded_filename))
                .output(
                    final_opus_path,
                    audio_bitrate="128k",  # Opus is efficient, 128k is good quality
                    **{"acodec": "libopus"},  # Specify Opus codec
                )
                .overwrite_output()  # Overwrite if Opus exists
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

    if final_opus_path and os.path.exists(final_opus_path):
        return final_opus_filename
    else:
        raise RuntimeError("Audio download and conversion failed for an unknown reason.")


async def process_audio(audio_url: str):
    """
    Processes the audio from the given URL.
    """
    print(len(queue), "lenth")
    if len(queue) > 0:
        print("Worker is sleeping...")
        sleep_time = random.randint(10, 25)
        time.sleep(sleep_time)
    start_time = time.time()

    audio_name = download_audio(audio_url)
    try:
        storage_url = upload_audio(audio_name)
    except DownloadError as e1:
        print(e1)
        raise HTTPException(status_code=400, detail="Invalid audio source")
    except RuntimeError as e2:
        print(e2)
        raise HTTPException(status_code=400, detail="Server error in when processing")
    await beanie.init_beanie(
        database=client.file_service,
        document_models=document_models,
    )
    await Audios(
        audio_url=audio_url,
        storage_url=storage_url,
    ).insert()
    print("--- Took %s seconds ---" % (time.time() - start_time))
    time.sleep(10)  # Sleep for 10 seconds after processing
