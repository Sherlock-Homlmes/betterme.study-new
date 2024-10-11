from fastapi.responses import RedirectResponse

from base import app

@app.get("/shorten/{shorten_name}")
async def shorten_link(shorten_name: str):
    
    if shorten_name == 'recruit':
        redirect_link = '/'
    else:
        redirect_link = shorten_name
    return RedirectResponse(shorten_name)