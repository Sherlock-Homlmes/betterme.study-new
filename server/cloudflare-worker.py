from workers import WorkerEntrypoint
from .main import app


class Default(WorkerEntrypoint):
    async def fetch(self, request):
        import asgi

        return await asgi.fetch(app, request, self.env)
