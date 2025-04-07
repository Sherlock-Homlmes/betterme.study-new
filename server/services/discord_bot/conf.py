# default
import asyncio
from dataclasses import dataclass

# library
import discord
from discord.ext import commands

# local
from base.settings import is_dev_env
from services.discord_bot.func import get_channel

is_app_running = True


####### BOT #######
class Bot(commands.Bot):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    async def on_ready(self):
        global is_app_running, server_info
        await get_server_info()

        #         channel = await server_info.guild.fetch_channel(1081937675151482945 if is_dev_env else 891909866355048548)
        #         message = await channel.send("""
        # **Reaction để nhận thông tin mới nhất về các tin tức của news.betterme.study**
        # 💛: CLB-Tình nguyện
        # 💚: Khóa học-Kĩ năng
        # 💙: Học bổng
        # 💜: Sự kiện-Cuộc thi
        #         """)
        #         await message.add_reaction("💛")
        #         await message.add_reaction("💚")
        #         await message.add_reaction("💙")
        #         await message.add_reaction("💜")

        print(f"We have logged in as {self.user} news bot")

        if is_dev_env:
            # Stop bot when reload
            while is_app_running:
                from core.event_handler import running

                if running:
                    await asyncio.sleep(1)
                else:
                    await self.close()
                    is_app_running = False

    async def on_command_error(self, ctx, error):
        await ctx.reply(error, ephemeral=True)


@dataclass
class ServerInfo:
    # ids
    guild_id: int = 1081937673033351218 if is_dev_env else 880360143768924210
    admin_role_id: int = 0 if is_dev_env else 0
    # guild
    guild: discord.Guild = None
    # role
    admin_role: discord.Role = None
    # news channels
    test_news_channel: discord.ForumChannel = None
    news_channel: discord.ForumChannel = None


async def get_server_info():
    global bot, server_info

    ### Get server info
    server_info_data = {
        "news_channel": 1211687517829472266 if is_dev_env else 1094468765527330918,
        "test_news_channel": 1211687587924672563 if is_dev_env else 1195438410807120022,
    }

    # get guild
    server_info.guild = await bot.fetch_guild(server_info.guild_id)

    # get roles
    server_info.admin_role = server_info.guild.get_role(server_info.admin_role_id)

    channels = (
        "test_news_channel",
        "news_channel",
    )
    (
        server_info.test_news_channel,
        server_info.news_channel,
    ) = await asyncio.gather(
        *[get_channel(server_info.guild, server_info_data[channel]) for channel in channels]
    )


### START
prefix = "news!"
bot = Bot(command_prefix=prefix, intents=discord.Intents.all())
server_info = ServerInfo()
