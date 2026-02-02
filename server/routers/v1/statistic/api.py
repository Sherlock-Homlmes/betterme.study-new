# default
import datetime
from typing import Optional
from collections import defaultdict

# libraries
from fastapi import APIRouter, HTTPException, Depends, Query

# local
from routers.authentication import auth_handler
from models import Users

from models.discord.user_daily_study_time import UserDailyStudyTimes
from schemas.user_daily_study_time import StatisticsResponse, StatisticDataItem

router = APIRouter(
    tags=["Statistics"],
    responses={404: {"description": "Not found"}},
)


@router.get(
    "/statistics",
    description="Get user statistics with optional date filtering",
)
async def get_user_statistics(
    start_date: Optional[str] = Query(None, description="Start date in YYYY-MM-DD format"),
    end_date: Optional[str] = Query(None, description="End date in YYYY-MM-DD format"),
    user: Users = Depends(auth_handler.auth_wrapper),
) -> StatisticsResponse:
    """
    Get user statistics using existing function and combining with pomodoro data.
    Optionally filter by date range.
    """

    # Parse date parameters
    start_datetime = None
    end_datetime = None

    if start_date:
        try:
            start_datetime = datetime.datetime.strptime(start_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")

    if end_date:
        try:
            end_datetime = datetime.datetime.strptime(end_date, "%Y-%m-%d")
            # Set to end of day
            end_datetime = end_datetime.replace(hour=23, minute=59, second=59)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")

    # Use your existing function to get study time stats
    if user.get("discord_id"):
        study_stats = await UserDailyStudyTimes.get_user_study_time_stats(
            user_discord_id=user["discord_id"], from_date=start_datetime, to_date=end_datetime
        )
    else:
        # Fallback if no discord_id
        study_stats = None

    # Process data by date
    data_by_date = defaultdict(lambda: {"total": 0, "sessions": 0})

    # Process study time data from your function
    if study_stats and study_stats.daily_study_time:
        for daily_data in study_stats.daily_study_time:
            date_key = daily_data.date.strftime("%Y-%m-%d")
            daily_total = sum(daily_data.study_time)  # Sum of all 24 hours
            data_by_date[date_key]["total"] = daily_total
            data_by_date[date_key]["sessions"] = 1  # Count as one session per day

    # Fill in missing dates in the range with 0 values
    if start_datetime and end_datetime:
        current_date = start_datetime
        while current_date <= end_datetime:
            date_key = current_date.strftime("%Y-%m-%d")
            if date_key not in data_by_date:
                data_by_date[date_key] = {"total": 0, "sessions": 0}
            current_date += datetime.timedelta(days=1)
    elif data_by_date:
        # If no date range specified, just use the existing data
        pass
    else:
        # If no data and no date range, create some default range (last 7 days)
        end_date_default = datetime.datetime.now()
        start_date_default = end_date_default - datetime.timedelta(days=6)
        current_date = start_date_default
        while current_date <= end_date_default:
            date_key = current_date.strftime("%Y-%m-%d")
            data_by_date[date_key] = {"total": 0, "sessions": 0}
            current_date += datetime.timedelta(days=1)

    # Convert to response format - return all data including empty days
    sorted_dates = sorted(data_by_date.keys())
    data_items = []

    # Check if data spans multiple years
    if sorted_dates:
        years = set(
            datetime.datetime.strptime(date_str, "%Y-%m-%d").year for date_str in sorted_dates
        )
        has_multiple_years = len(years) > 1
    else:
        has_multiple_years = False

    for date_str in sorted_dates:
        date_obj = datetime.datetime.strptime(date_str, "%Y-%m-%d")
        # Show year only if data spans multiple years
        name_format = "%d/%m/%Y" if has_multiple_years else "%d/%m"
        data_items.append(
            StatisticDataItem(
                name=date_obj.strftime(name_format),
                total=int(data_by_date[date_str]["total"]),
                date=date_str,
            )
        )

    return StatisticsResponse(daily_study_time_data=data_items)


# Removed _group_data_by_period function - grouping will be handled in frontend
