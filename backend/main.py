from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import io
from model_utils import load_dermavision_model, predict_image

# Global variables for model
model = None
device = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the ML model
    global model, device
    try:
        model, device = load_dermavision_model()
    except Exception as e:
        print(f"Failed to load model: {e}")
    yield
    # Clean up resources if needed
    model = None

app = FastAPI(lifespan=lifespan)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "DermaVision API is running"}

@app.post("/predict")
async def predict_endpoint(file: UploadFile = File(...)):
    if not model:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        contents = await file.read()
        image_stream = io.BytesIO(contents)
        result = predict_image(image_stream, model, device)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("Starting DermaVision Backend...")
    try:
        import uvicorn
        print("Uvicorn imported successfully. Starting server on http://localhost:8000")
        # Run properly
        uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    except ImportError:
        print("ERROR: 'uvicorn' module not found. Please run 'pip install uvicorn' or 'pip install -r requirements.txt'")
        input("Press Enter to exit...")
    except Exception as e:
        print(f"ERROR: An unexpected error occurred: {e}")
        import traceback
        traceback.print_exc()
        input("Press Enter to exit...")
