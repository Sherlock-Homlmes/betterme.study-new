from fastapi.responses import FileResponse
from os.path import exists
from . import router

@router.get("/certificate/{cert_id}")
async def certificate(cert_id: int):
    if cert_id == 0:
        return FileResponse('static/images/certificate/exam-cert.png')

    path_to_file = f'static/images/certificate/cert-{cert_id}.png'
    if exists(path_to_file):
        return FileResponse(path_to_file)
    return "Invalid certificate id"