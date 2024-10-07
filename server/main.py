# default
import uvicorn

# custom
from all_env import environ
from base.routers import app

if __name__ == '__main__':
  uvicorn.run("main:app",host='0.0.0.0', port=8080, reload=True, workers=8)