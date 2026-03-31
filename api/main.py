from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI()

@app.get("/api")
def api():
    return {"message": "MediTrack AI API running"}

# Serve frontend
app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="frontend")
