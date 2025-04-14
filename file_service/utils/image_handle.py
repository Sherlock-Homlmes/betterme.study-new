import os
from typing import Optional, Union
from pathlib import Path
from datetime import datetime, timedelta, timezone  # Added for cache timing

# lib
import aiohttp
import aiofiles
import aiofiles.os


async def path_exists(path: Union[Path, str]) -> bool:
    try:
        await aiofiles.os.stat(str(path))
    except OSError:
        # except OSError as e:
        # from pathlib import _ignore_error as pathlib_ignore_error
        # if not pathlib_ignore_error(e):
        #     raise
        return False
    except ValueError:
        return False
    return True


async def save_image(
    url: str, target_path: Optional[str] = None, use_cache: Optional[bool] = False
) -> str:
    """Saves an image from a URL, optionally using a time-based cache."""
    cache_duration = timedelta(hours=24)  # Cache validity period (Corrected back to 24 hours)

    if use_cache and target_path:
        try:
            stats = await aiofiles.os.stat(target_path)
            modification_time = datetime.fromtimestamp(stats.st_mtime, tz=timezone.utc)
            if datetime.now(timezone.utc) - modification_time < cache_duration:
                return target_path
        except FileNotFoundError:
            pass
        except Exception as e:
            print(f"Error checking cache file stats: {e}")

    # If cache is not used, invalid, or file doesn't exist, download it
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            if resp.status == 200:
                img_name = target_path if target_path else url.split("/")[6].split("?")[0]
                f = await aiofiles.open(img_name, mode="wb")
                await f.write(await resp.read())
                await f.close()
                return img_name


async def delete_image(image):
    """Asynchronously deletes an image file."""
    try:
        await aiofiles.os.remove(image)
    except FileNotFoundError:
        print(f"Warning: File not found for deletion: {image}")
    except Exception as e:
        print(f"Error deleting file {image}: {e}")
