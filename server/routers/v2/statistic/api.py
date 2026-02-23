import datetime
from typing import Optional

import polars as pl
from fastapi import APIRouter, HTTPException, Depends, Query

from routers.authentication import auth_handler
from models import Users
from models.discord.user_daily_study_time import UserDailyStudyTimes
from models.pomodoro.pomodoros import Pomodoros, PomodoroStatusEnum
from schemas.user_daily_study_time import DataUserDailyStudyTime
from .schemas import StatisticsResponse, StudyTime

router = APIRouter(
    tags=["Statistics"],
    responses={404: {"description": "Not found"}},
)


@router.get(
    "/statistics",
    description="Get user statistics with optional date filtering using Polars",
)
async def get_user_statistics(
    start_date: Optional[str] = Query(None, description="Start date in YYYY-MM-DD format"),
    end_date: Optional[str] = Query(None, description="End date in YYYY-MM-DD format"),
    user: Users = Depends(auth_handler.auth_wrapper),
) -> StatisticsResponse:
    """
    Get user statistics using Polars for data processing.
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

    # Get study time data
    if not user.get("discord_id"):
        raise HTTPException(status_code=400, detail="User discord_id not found")

    study_stats = await UserDailyStudyTimes.get_user_study_time_stats(
        user_discord_id=user["discord_id"], from_date=start_datetime, to_date=end_datetime
    )

    # Get pomodoros data for the same date range
    pomodoros_query = {"user_id": user["id"]}
    if start_datetime or end_datetime:
        date_query = {}
        if start_datetime:
            date_query["$gte"] = start_datetime
        if end_datetime:
            date_query["$lte"] = end_datetime
        if date_query:
            pomodoros_query["start_at"] = date_query

    pomodoros_data = await Pomodoros.find(pomodoros_query).to_list()

    # Convert to Polars DataFrame
    if not study_stats or not study_stats.daily_study_time:
        # Return empty statistics if no data
        pomodoro_count = len(pomodoros_data)
        return StatisticsResponse(
            total_study_time=0,
            study_day_count=0,
            study_time_per_day=0,
            longest_streak=0,
            pomodoro_count=pomodoro_count,
            data=[],
        )

    # Prepare data for Polars
    data_for_polars = []
    for daily_data in study_stats.daily_study_time:
        # Sum all 24 hours to get total study time for the day
        daily_total = sum(daily_data.study_time)
        data_for_polars.append({"date": daily_data.date, "total_study_time": daily_total})

    # Process pomodoros data and calculate time distribution across days
    pomodoro_time_by_date = {}
    for pomodoro in pomodoros_data:
        if (
            pomodoro.status == PomodoroStatusEnum.COMPLETED
            and pomodoro.start_at
            and pomodoro.duration
        ):
            start_time = pomodoro.start_at
            end_time = start_time + datetime.timedelta(seconds=pomodoro.duration)

            # Handle day boundaries
            current_time = start_time
            while current_time < end_time:
                day_start = current_time.replace(hour=0, minute=0, second=0, microsecond=0)
                day_end = day_start + datetime.timedelta(days=1)

                # Calculate how much time falls on this day
                period_end = min(end_time, day_end)
                time_on_day = (period_end - current_time).total_seconds() / 60  # Convert to minutes

                date_key = current_time.date()
                if date_key not in pomodoro_time_by_date:
                    pomodoro_time_by_date[date_key] = 0
                pomodoro_time_by_date[date_key] += time_on_day

                current_time = day_end

    # Merge pomodoro time with study time
    for i, daily_data in enumerate(data_for_polars):
        date_key = daily_data["date"].date()
        if date_key in pomodoro_time_by_date:
            data_for_polars[i]["total_study_time"] += pomodoro_time_by_date[date_key]

    # Create Polars DataFrame
    df = pl.DataFrame(data_for_polars)

    # Sort by date
    df = df.sort("date")

    # Fill in missing dates in the range with 0 study time
    if start_datetime and end_datetime:
        # Create a complete date range
        date_range = []
        current_date = start_datetime.date()
        end_date = end_datetime.date()

        while current_date <= end_date:
            date_range.append(current_date)
            current_date += datetime.timedelta(days=1)

        # Create a complete DataFrame with all dates
        complete_df = pl.DataFrame({"date": date_range, "total_study_time": 0})

        # Convert date column in existing df to date type to match
        df = df.with_columns(pl.col("date").dt.date())

        # Join with existing data to fill in study times
        df = complete_df.join(df, on="date", how="left").fill_null(0)
        df = df.with_columns([pl.col("total_study_time_right").alias("total_study_time")]).drop(
            "total_study_time_right"
        )
    else:
        # If no date range provided, use the existing data as is
        # No need to fill missing dates
        pass

    # Calculate statistics
    total_study_time = df["total_study_time"].sum()
    study_day_count = df.filter(pl.col("total_study_time") > 0).height
    study_time_per_day = int(total_study_time / df.height) if df.height > 0 else 0

    # Calculate longest streak
    df_with_streak = df.with_columns(pl.col("total_study_time") > 0).rename(
        {"total_study_time": "has_study"}
    )

    # Find consecutive days with study time > 0
    longest_streak = 0
    current_streak = 0

    for has_study in df_with_streak["has_study"].to_list():
        if has_study:
            current_streak += 1
            longest_streak = max(longest_streak, current_streak)
        else:
            current_streak = 0

    # Prepare data for response (max 10 items)
    if df.height > 10:
        # Group data into 10 time ranges
        group_size = df.height // 10
        remainder = df.height % 10

        study_times = []
        start_idx = 0

        for i in range(10):
            # Distribute remainder among first groups
            current_group_size = group_size + (1 if i < remainder else 0)
            end_idx = start_idx + current_group_size

            if end_idx > df.height:
                end_idx = df.height

            group_df = df[start_idx:end_idx]

            if group_df.height == 0:
                break

            group_total = group_df["total_study_time"].sum()

            # Format date range
            start_date = group_df["date"][0]
            end_date = group_df["date"][-1]

            # Convert to datetime if it's a date object
            if hasattr(start_date, "strftime"):
                start_dt = start_date
            else:
                start_dt = datetime.datetime.combine(start_date, datetime.time.min)

            if hasattr(end_date, "strftime"):
                end_dt = end_date
            else:
                end_dt = datetime.datetime.combine(end_date, datetime.time.min)

            if start_date == end_date:
                date_range = start_dt.strftime("%d/%m/%Y")
            else:
                date_range = f"{start_dt.strftime('%d/%m/%Y')}-{end_dt.strftime('%d/%m/%Y')}"

            study_times.append(StudyTime(total_study_time=int(group_total), date_range=date_range))

            start_idx = end_idx
    else:
        # Use individual days if 10 or fewer
        study_times = []
        for row in df.iter_rows(named=True):
            date = row["date"]

            # Convert to datetime if it's a date object
            if hasattr(date, "strftime"):
                date_dt = date
            else:
                date_dt = datetime.datetime.combine(date, datetime.time.min)

            date_range = date_dt.strftime("%d/%m/%Y")

            study_times.append(
                StudyTime(total_study_time=int(row["total_study_time"]), date_range=date_range)
            )

    pomodoro_count = len([p for p in pomodoros_data if p.status == PomodoroStatusEnum.COMPLETED])

    return StatisticsResponse(
        total_study_time=int(total_study_time),
        study_day_count=study_day_count,
        study_time_per_day=study_time_per_day,
        longest_streak=longest_streak,
        pomodoro_count=pomodoro_count,
        data=study_times,
    )
