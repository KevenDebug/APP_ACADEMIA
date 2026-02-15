from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class Exercise(BaseModel):
    name: str
    sets: int
    reps: str
    weight: Optional[str] = ""
    notes: Optional[str] = ""

class WorkoutSplit(BaseModel):
    day: str
    exercises: List[Exercise] = []

class Workout(BaseModel):
    id: Optional[str] = None
    name: str
    type: Literal["predefined", "custom"]
    splits: List[WorkoutSplit]
    createdAt: Optional[datetime] = None

class WorkoutCreate(BaseModel):
    name: str
    type: Literal["predefined", "custom"]
    splits: List[WorkoutSplit]

class WorkoutUpdate(BaseModel):
    name: Optional[str] = None
    splits: Optional[List[WorkoutSplit]] = None

# Helper function to serialize MongoDB documents
def serialize_workout(workout) -> dict:
    if workout:
        workout["id"] = str(workout["_id"])
        del workout["_id"]
    return workout

# Initialize predefined workouts
async def initialize_predefined_workouts():
    count = await db.workouts.count_documents({"type": "predefined"})
    if count == 0:
        predefined_workouts = [
            {
                "name": "ABC - Clássico",
                "type": "predefined",
                "splits": [
                    {
                        "day": "A - Peito e Tríceps",
                        "exercises": [
                            {"name": "Supino Reto", "sets": 4, "reps": "8-12", "weight": "", "notes": ""},
                            {"name": "Supino Inclinado", "sets": 3, "reps": "10-12", "weight": "", "notes": ""},
                            {"name": "Crucifixo", "sets": 3, "reps": "12-15", "weight": "", "notes": ""},
                            {"name": "Tríceps Testa", "sets": 3, "reps": "10-12", "weight": "", "notes": ""},
                            {"name": "Tríceps Corda", "sets": 3, "reps": "12-15", "weight": "", "notes": ""}
                        ]
                    },
                    {
                        "day": "B - Costas e Bíceps",
                        "exercises": [
                            {"name": "Barra Fixa", "sets": 4, "reps": "8-10", "weight": "", "notes": ""},
                            {"name": "Remada Curvada", "sets": 4, "reps": "8-12", "weight": "", "notes": ""},
                            {"name": "Puxada Frontal", "sets": 3, "reps": "10-12", "weight": "", "notes": ""},
                            {"name": "Rosca Direta", "sets": 3, "reps": "10-12", "weight": "", "notes": ""},
                            {"name": "Rosca Martelo", "sets": 3, "reps": "12-15", "weight": "", "notes": ""}
                        ]
                    },
                    {
                        "day": "C - Pernas e Ombros",
                        "exercises": [
                            {"name": "Agachamento Livre", "sets": 4, "reps": "8-12", "weight": "", "notes": ""},
                            {"name": "Leg Press", "sets": 4, "reps": "10-12", "weight": "", "notes": ""},
                            {"name": "Cadeira Extensora", "sets": 3, "reps": "12-15", "weight": "", "notes": ""},
                            {"name": "Desenvolvimento", "sets": 4, "reps": "8-12", "weight": "", "notes": ""},
                            {"name": "Elevação Lateral", "sets": 3, "reps": "12-15", "weight": "", "notes": ""}
                        ]
                    }
                ],
                "createdAt": datetime.utcnow()
            },
            {
                "name": "ABCDE - Avançado",
                "type": "predefined",
                "splits": [
                    {
                        "day": "A - Peito",
                        "exercises": [
                            {"name": "Supino Reto", "sets": 4, "reps": "8-10", "weight": "", "notes": ""},
                            {"name": "Supino Inclinado", "sets": 4, "reps": "8-10", "weight": "", "notes": ""},
                            {"name": "Crucifixo Inclinado", "sets": 3, "reps": "10-12", "weight": "", "notes": ""},
                            {"name": "Crossover", "sets": 3, "reps": "12-15", "weight": "", "notes": ""}
                        ]
                    },
                    {
                        "day": "B - Costas",
                        "exercises": [
                            {"name": "Barra Fixa", "sets": 4, "reps": "8-10", "weight": "", "notes": ""},
                            {"name": "Remada Curvada", "sets": 4, "reps": "8-10", "weight": "", "notes": ""},
                            {"name": "Puxada Frontal", "sets": 3, "reps": "10-12", "weight": "", "notes": ""},
                            {"name": "Remada Baixa", "sets": 3, "reps": "10-12", "weight": "", "notes": ""}
                        ]
                    },
                    {
                        "day": "C - Pernas",
                        "exercises": [
                            {"name": "Agachamento Livre", "sets": 4, "reps": "8-10", "weight": "", "notes": ""},
                            {"name": "Leg Press", "sets": 4, "reps": "10-12", "weight": "", "notes": ""},
                            {"name": "Cadeira Extensora", "sets": 3, "reps": "12-15", "weight": "", "notes": ""},
                            {"name": "Mesa Flexora", "sets": 3, "reps": "12-15", "weight": "", "notes": ""},
                            {"name": "Panturrilha em Pé", "sets": 4, "reps": "15-20", "weight": "", "notes": ""}
                        ]
                    },
                    {
                        "day": "D - Ombros",
                        "exercises": [
                            {"name": "Desenvolvimento", "sets": 4, "reps": "8-10", "weight": "", "notes": ""},
                            {"name": "Elevação Lateral", "sets": 4, "reps": "12-15", "weight": "", "notes": ""},
                            {"name": "Elevação Frontal", "sets": 3, "reps": "12-15", "weight": "", "notes": ""},
                            {"name": "Crucifixo Inverso", "sets": 3, "reps": "12-15", "weight": "", "notes": ""}
                        ]
                    },
                    {
                        "day": "E - Braços",
                        "exercises": [
                            {"name": "Rosca Direta", "sets": 4, "reps": "8-12", "weight": "", "notes": ""},
                            {"name": "Rosca Alternada", "sets": 3, "reps": "10-12", "weight": "", "notes": ""},
                            {"name": "Tríceps Testa", "sets": 4, "reps": "8-12", "weight": "", "notes": ""},
                            {"name": "Tríceps Corda", "sets": 3, "reps": "12-15", "weight": "", "notes": ""}
                        ]
                    }
                ],
                "createdAt": datetime.utcnow()
            },
            {
                "name": "Push/Pull/Legs",
                "type": "predefined",
                "splits": [
                    {
                        "day": "Push - Empurrar",
                        "exercises": [
                            {"name": "Supino Reto", "sets": 4, "reps": "8-10", "weight": "", "notes": ""},
                            {"name": "Desenvolvimento", "sets": 4, "reps": "8-10", "weight": "", "notes": ""},
                            {"name": "Supino Inclinado", "sets": 3, "reps": "10-12", "weight": "", "notes": ""},
                            {"name": "Elevação Lateral", "sets": 3, "reps": "12-15", "weight": "", "notes": ""},
                            {"name": "Tríceps Corda", "sets": 3, "reps": "12-15", "weight": "", "notes": ""}
                        ]
                    },
                    {
                        "day": "Pull - Puxar",
                        "exercises": [
                            {"name": "Barra Fixa", "sets": 4, "reps": "8-10", "weight": "", "notes": ""},
                            {"name": "Remada Curvada", "sets": 4, "reps": "8-10", "weight": "", "notes": ""},
                            {"name": "Puxada Frontal", "sets": 3, "reps": "10-12", "weight": "", "notes": ""},
                            {"name": "Rosca Direta", "sets": 3, "reps": "10-12", "weight": "", "notes": ""},
                            {"name": "Rosca Martelo", "sets": 3, "reps": "12-15", "weight": "", "notes": ""}
                        ]
                    },
                    {
                        "day": "Legs - Pernas",
                        "exercises": [
                            {"name": "Agachamento Livre", "sets": 4, "reps": "8-10", "weight": "", "notes": ""},
                            {"name": "Leg Press", "sets": 4, "reps": "10-12", "weight": "", "notes": ""},
                            {"name": "Cadeira Extensora", "sets": 3, "reps": "12-15", "weight": "", "notes": ""},
                            {"name": "Mesa Flexora", "sets": 3, "reps": "12-15", "weight": "", "notes": ""},
                            {"name": "Panturrilha", "sets": 4, "reps": "15-20", "weight": "", "notes": ""}
                        ]
                    }
                ],
                "createdAt": datetime.utcnow()
            },
            {
                "name": "Upper/Lower",
                "type": "predefined",
                "splits": [
                    {
                        "day": "Upper - Parte Superior",
                        "exercises": [
                            {"name": "Supino Reto", "sets": 4, "reps": "8-10", "weight": "", "notes": ""},
                            {"name": "Remada Curvada", "sets": 4, "reps": "8-10", "weight": "", "notes": ""},
                            {"name": "Desenvolvimento", "sets": 3, "reps": "10-12", "weight": "", "notes": ""},
                            {"name": "Puxada Frontal", "sets": 3, "reps": "10-12", "weight": "", "notes": ""},
                            {"name": "Rosca Direta", "sets": 3, "reps": "10-12", "weight": "", "notes": ""},
                            {"name": "Tríceps Corda", "sets": 3, "reps": "12-15", "weight": "", "notes": ""}
                        ]
                    },
                    {
                        "day": "Lower - Parte Inferior",
                        "exercises": [
                            {"name": "Agachamento Livre", "sets": 4, "reps": "8-10", "weight": "", "notes": ""},
                            {"name": "Leg Press", "sets": 4, "reps": "10-12", "weight": "", "notes": ""},
                            {"name": "Stiff", "sets": 3, "reps": "10-12", "weight": "", "notes": ""},
                            {"name": "Cadeira Extensora", "sets": 3, "reps": "12-15", "weight": "", "notes": ""},
                            {"name": "Mesa Flexora", "sets": 3, "reps": "12-15", "weight": "", "notes": ""},
                            {"name": "Panturrilha", "sets": 4, "reps": "15-20", "weight": "", "notes": ""}
                        ]
                    }
                ],
                "createdAt": datetime.utcnow()
            }
        ]
        await db.workouts.insert_many(predefined_workouts)
        logger.info("Treinos pré-definidos inicializados")

# API Routes
@api_router.get("/workouts", response_model=List[Workout])
async def get_workouts():
    """Get all workouts"""
    workouts = await db.workouts.find().sort("createdAt", -1).to_list(100)
    return [serialize_workout(w) for w in workouts]

@api_router.get("/workouts/predefined", response_model=List[Workout])
async def get_predefined_workouts():
    """Get predefined workouts"""
    workouts = await db.workouts.find({"type": "predefined"}).to_list(100)
    return [serialize_workout(w) for w in workouts]

@api_router.get("/workouts/custom", response_model=List[Workout])
async def get_custom_workouts():
    """Get custom workouts"""
    workouts = await db.workouts.find({"type": "custom"}).sort("createdAt", -1).to_list(100)
    return [serialize_workout(w) for w in workouts]

@api_router.get("/workouts/{workout_id}", response_model=Workout)
async def get_workout(workout_id: str):
    """Get a specific workout by ID"""
    try:
        workout = await db.workouts.find_one({"_id": ObjectId(workout_id)})
        if not workout:
            raise HTTPException(status_code=404, detail="Treino não encontrado")
        return serialize_workout(workout)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/workouts", response_model=Workout)
async def create_workout(workout: WorkoutCreate):
    """Create a new workout"""
    workout_dict = workout.dict()
    workout_dict["createdAt"] = datetime.utcnow()
    result = await db.workouts.insert_one(workout_dict)
    created_workout = await db.workouts.find_one({"_id": result.inserted_id})
    return serialize_workout(created_workout)

@api_router.put("/workouts/{workout_id}", response_model=Workout)
async def update_workout(workout_id: str, workout_update: WorkoutUpdate):
    """Update a workout"""
    try:
        update_data = {k: v for k, v in workout_update.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="Nenhum dado para atualizar")
        
        result = await db.workouts.update_one(
            {"_id": ObjectId(workout_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Treino não encontrado")
        
        updated_workout = await db.workouts.find_one({"_id": ObjectId(workout_id)})
        return serialize_workout(updated_workout)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/workouts/{workout_id}")
async def delete_workout(workout_id: str):
    """Delete a workout"""
    try:
        result = await db.workouts.delete_one({"_id": ObjectId(workout_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Treino não encontrado")
        return {"message": "Treino deletado com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/workouts/{workout_id}/copy", response_model=Workout)
async def copy_workout(workout_id: str, new_name: str):
    """Copy a predefined workout to create a custom one"""
    try:
        original = await db.workouts.find_one({"_id": ObjectId(workout_id)})
        if not original:
            raise HTTPException(status_code=404, detail="Treino não encontrado")
        
        new_workout = {
            "name": new_name,
            "type": "custom",
            "splits": original["splits"],
            "createdAt": datetime.utcnow()
        }
        
        result = await db.workouts.insert_one(new_workout)
        created_workout = await db.workouts.find_one({"_id": result.inserted_id})
        return serialize_workout(created_workout)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_db():
    await initialize_predefined_workouts()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
