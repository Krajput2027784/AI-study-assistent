from fastapi import FastAPI

# Initialize the FastAPI application
app = FastAPI()

# GET endpoint - Health check route
@app.get("/")
def health_check():
    """Health check endpoint to verify the backend is running"""
    return {"message": "AI Study Assistant backend is running"}
