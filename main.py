from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
import json
import os
from typing import Dict

app = FastAPI()

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Templates
templates = Jinja2Templates(directory="templates")

DATA_FILE = "data.json"

def load_data() -> Dict[str, int]:
    if not os.path.exists(DATA_FILE):
        return {}
    try:
        with open(DATA_FILE, "r") as f:
            return json.load(f)
    except json.JSONDecodeError:
        return {}

def save_data(data: Dict[str, int]):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)

class FlowerRequest(BaseModel):
    date: str
    count: int

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/api/flowers")
async def get_flowers():
    return load_data()

@app.post("/api/flowers")
async def update_flower(flower_req: FlowerRequest):
    data = load_data()
    # Simple toggle logic: if count > 0, set to count. If 0, remove or set to 0.
    # For now, we trust the frontend to send the desired state.
    # Or strict toggle logic: if exists, remove. If not, add.
    # Let's support setting the specific count as requested.
    
    if flower_req.count > 0:
        data[flower_req.date] = flower_req.count
    else:
        if flower_req.date in data:
            del data[flower_req.date]
            
    save_data(data)
    return {"status": "success", "data": data}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
