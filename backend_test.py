
"""
Comprehensive backend test suite for the gym workout app
Tests all API endpoints with real-world data scenarios
"""

import requests
import json
import sys
from datetime import datetime

BACKEND_URL = "https://training-tracker-pro.preview.emergentagent.com/api"

def test_api_endpoint(method, endpoint, data=None, params=None):
    """Helper function to test API endpoints with error handling"""
    url = f"{BACKEND_URL}{endpoint}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, params=params, timeout=10)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, params=params, timeout=10)
        elif method.upper() == "PUT":
            response = requests.put(url, json=data, timeout=10)
        elif method.upper() == "DELETE":
            response = requests.delete(url, timeout=10)
        else:
            return {"success": False, "error": f"Unsupported method: {method}"}
        
        return {
            "success": response.status_code < 400,
            "status_code": response.status_code,
            "data": response.json() if response.content else None,
            "error": None
        }
    except requests.exceptions.RequestException as e:
        return {"success": False, "error": f"Request failed: {str(e)}"}
    except json.JSONDecodeError:
        return {"success": False, "error": "Invalid JSON response"}
    except Exception as e:
        return {"success": False, "error": f"Unexpected error: {str(e)}"}

def test_get_all_workouts():
    """Test GET /api/workouts - List all workouts"""
    print("🔍 Testing GET /api/workouts (all workouts)...")
    result = test_api_endpoint("GET", "/workouts")
    
    if not result["success"]:
        print(f" FAILED: {result['error']}")
        return False
    
    workouts = result["data"]
    if not isinstance(workouts, list):
        print(f" FAILED: Expected list, got {type(workouts)}")
        return False
    
    print(f" SUCCESS: Retrieved {len(workouts)} workouts")
    
    if workouts:
        workout = workouts[0]
        required_fields = ["id", "name", "type", "splits"]
        missing_fields = [f for f in required_fields if f not in workout]
        if missing_fields:
            print(f" FAILED: Missing fields in workout: {missing_fields}")
            return False
    
    return True

def test_get_predefined_workouts():
    """Test GET /api/workouts/predefined - List predefined workouts"""
    print("🔍 Testing GET /api/workouts/predefined...")
    result = test_api_endpoint("GET", "/workouts/predefined")
    
    if not result["success"]:
        print(f" FAILED: {result['error']}")
        return False
    
    workouts = result["data"]
    if not isinstance(workouts, list):
        print(f" FAILED: Expected list, got {type(workouts)}")
        return False
    
    expected_names = ["ABC - Clássico", "ABCDE - Avançado", "Push/Pull/Legs", "Upper/Lower"]
    if len(workouts) != 4:
        print(f" FAILED: Expected 4 predefined workouts, got {len(workouts)}")
        return False
    
    for workout in workouts:
        if workout.get("type") != "predefined":
            print(f" FAILED: Workout {workout.get('name')} is not type 'predefined'")
            return False
    
    actual_names = [w.get("name") for w in workouts]
    for expected_name in expected_names:
        if expected_name not in actual_names:
            print(f" FAILED: Missing expected predefined workout: {expected_name}")
            return False
    
    print(f" SUCCESS: All 4 predefined workouts found with correct types")
    return True

def test_get_custom_workouts():
    """Test GET /api/workouts/custom - List custom workouts"""
    print("🔍 Testing GET /api/workouts/custom...")
    result = test_api_endpoint("GET", "/workouts/custom")
    
    if not result["success"]:
        print(f" FAILED: {result['error']}")
        return False
    
    workouts = result["data"]
    if not isinstance(workouts, list):
        print(f" FAILED: Expected list, got {type(workouts)}")
        return False
    
    for workout in workouts:
        if workout.get("type") != "custom":
            print(f" FAILED: Workout {workout.get('name')} is not type 'custom'")
            return False
    
    print(f" SUCCESS: Retrieved {len(workouts)} custom workouts")
    return True

def test_create_custom_workout():
    """Test POST /api/workouts - Create new custom workout"""
    print("🔍 Testing POST /api/workouts (create custom workout)...")
    
    workout_data = {
        "name": "Meu Treino Personalizado - Hipertrofia",
        "type": "custom",
        "splits": [
            {
                "day": "Segunda - Peito e Tríceps",
                "exercises": [
                    {
                        "name": "Supino Reto com Barra",
                        "sets": 4,
                        "reps": "8-10",
                        "weight": "80kg",
                        "notes": "Foco na fase negativa"
                    },
                    {
                        "name": "Supino Inclinado com Halteres",
                        "sets": 3,
                        "reps": "10-12",
                        "weight": "32kg cada",
                        "notes": "Amplitude completa"
                    },
                    {
                        "name": "Tríceps Testa",
                        "sets": 3,
                        "reps": "12-15",
                        "weight": "40kg",
                        "notes": "Movimento controlado"
                    }
                ]
            },
            {
                "day": "Terça - Costas e Bíceps",
                "exercises": [
                    {
                        "name": "Barra Fixa Supinada",
                        "sets": 4,
                        "reps": "6-8",
                        "weight": "Peso corporal",
                        "notes": "Se necessário usar elástico"
                    },
                    {
                        "name": "Remada Curvada",
                        "sets": 4,
                        "reps": "8-10",
                        "weight": "70kg",
                        "notes": "Pegada pronada"
                    },
                    {
                        "name": "Rosca Direta",
                        "sets": 3,
                        "reps": "10-12",
                        "weight": "30kg",
                        "notes": "Sem balanceio"
                    }
                ]
            }
        ]
    }
    
    result = test_api_endpoint("POST", "/workouts", data=workout_data)
    
    if not result["success"]:
        print(f" FAILED: {result['error']}")
        return False, None
    
    created_workout = result["data"]
    if not created_workout.get("id"):
        print(" FAILED: Created workout has no ID")
        return False, None
    
    if created_workout.get("type") != "custom":
        print(f" FAILED: Created workout type is {created_workout.get('type')}, expected 'custom'")
        return False, None
    
    print(f" SUCCESS: Created custom workout with ID: {created_workout['id']}")
    return True, created_workout["id"]

def test_get_workout_by_id(workout_id):
    """Test GET /api/workouts/:id - Get specific workout"""
    print(f"🔍 Testing GET /api/workouts/{workout_id} (get specific workout)...")
    result = test_api_endpoint("GET", f"/workouts/{workout_id}")
    
    if not result["success"]:
        print(f" FAILED: {result['error']}")
        return False
    
    workout = result["data"]
    if workout.get("id") != workout_id:
        print(f" FAILED: Expected ID {workout_id}, got {workout.get('id')}")
        return False
    
    required_fields = ["id", "name", "type", "splits", "createdAt"]
    missing_fields = [f for f in required_fields if f not in workout]
    if missing_fields:
        print(f" FAILED: Missing fields: {missing_fields}")
        return False

    if not workout.get("splits") or len(workout["splits"]) == 0:
        print(" FAILED: Workout has no splits")
        return False
    
    for split in workout["splits"]:
        if "day" not in split or "exercises" not in split:
            print(" FAILED: Invalid split structure")
            return False
    
    print(f" SUCCESS: Retrieved workout details for {workout.get('name')}")
    return True

def test_update_workout(workout_id):
    """Test PUT /api/workouts/:id - Update workout"""
    print(f"🔍 Testing PUT /api/workouts/{workout_id} (update workout)...")
    
    update_data = {
        "name": "Meu Treino Atualizado - Nova Versão",
        "splits": [
            {
                "day": "Segunda - Peito Completo",
                "exercises": [
                    {
                        "name": "Supino Reto",
                        "sets": 5,
                        "reps": "6-8",
                        "weight": "85kg",
                        "notes": "Aumentei a carga"
                    },
                    {
                        "name": "Crossover Alto",
                        "sets": 3,
                        "reps": "15-20",
                        "weight": "25kg cada lado",
                        "notes": "Exercício adicionado"
                    }
                ]
            }
        ]
    }
    
    result = test_api_endpoint("PUT", f"/workouts/{workout_id}", data=update_data)
    
    if not result["success"]:
        print(f" FAILED: {result['error']}")
        return False
    
    updated_workout = result["data"]
    if updated_workout.get("name") != update_data["name"]:
        print(f" FAILED: Name not updated. Expected: {update_data['name']}, Got: {updated_workout.get('name')}")
        return False
    
    print(f" SUCCESS: Updated workout name and splits")
    return True

def test_copy_predefined_workout():
    """Test POST /api/workouts/:id/copy - Copy predefined workout"""
    print("🔍 Testing POST /api/workouts/:id/copy (copy predefined workout)...")
    

    result = test_api_endpoint("GET", "/workouts/predefined")
    if not result["success"] or not result["data"]:
        print(" FAILED: Could not get predefined workouts for copying")
        return False, None
    
    predefined_workout = result["data"][0] 
    predefined_id = predefined_workout["id"]
    
    new_name = "Cópia do ABC - Personalizado para João"
    result = test_api_endpoint("POST", f"/workouts/{predefined_id}/copy", params={"new_name": new_name})
    
    if not result["success"]:
        print(f" FAILED: {result['error']}")
        return False, None
    
    copied_workout = result["data"]
    
    # Verify it's a custom type
    if copied_workout.get("type") != "custom":
        print(f" FAILED: Copied workout type is {copied_workout.get('type')}, expected 'custom'")
        return False, None
    
    # Verify name changed
    if copied_workout.get("name") != new_name:
        print(f" FAILED: Expected name '{new_name}', got '{copied_workout.get('name')}'")
        return False, None
    
    # Verify it has same splits as original
    if len(copied_workout.get("splits", [])) != len(predefined_workout.get("splits", [])):
        print(" FAILED: Copied workout has different number of splits")
        return False, None
    
    print(f" SUCCESS: Copied predefined workout '{predefined_workout['name']}' to custom workout")
    return True, copied_workout["id"]

def test_delete_workout(workout_id):
    """Test DELETE /api/workouts/:id - Delete workout"""
    print(f"🔍 Testing DELETE /api/workouts/{workout_id} (delete workout)...")
    result = test_api_endpoint("DELETE", f"/workouts/{workout_id}")
    
    if not result["success"]:
        print(f" FAILED: {result['error']}")
        return False
    
    get_result = test_api_endpoint("GET", f"/workouts/{workout_id}")
    if get_result["success"]:
        print(" FAILED: Workout still exists after deletion")
        return False
    
    print(f" SUCCESS: Workout deleted successfully")
    return True

def test_error_cases():
    """Test various error scenarios"""
    print("🔍 Testing error cases...")
    
    # Test invalid workout ID
    result = test_api_endpoint("GET", "/workouts/invalid_id_format")
    if result["success"] or result["status_code"] not in [400, 404]:
        print(f" FAILED: Should return 400/404 for invalid ID, got {result['status_code']}")
        return False
    
    result = test_api_endpoint("GET", "/workouts/507f1f77bcf86cd799439011")
    if result["success"] or result["status_code"] != 404:
        print(f" FAILED: Should return 404 for non-existent ID, got {result['status_code']}")
        return False
    
    invalid_workout = {
        "name": "", 
        "type": "invalid_type", 
        "splits": []
    }
    result = test_api_endpoint("POST", "/workouts", data=invalid_workout)
    if result["success"]:
        print(" FAILED: Should reject workout with invalid data")
        return False
    
    print(" SUCCESS: All error cases handled correctly")
    return True

def main():
    """Run all backend tests"""
    print(" Starting comprehensive backend tests for gym workout app...")
    print("=" * 60)
    
    results = {}
    
    results["get_all_workouts"] = test_get_all_workouts()
    print()
    
    results["get_predefined_workouts"] = test_get_predefined_workouts()
    print()
    
    results["get_custom_workouts"] = test_get_custom_workouts()
    print()
    
    create_success, created_id = test_create_custom_workout()
    results["create_workout"] = create_success
    print()
    
    if created_id:
        results["get_workout_by_id"] = test_get_workout_by_id(created_id)
        print()
        
        results["update_workout"] = test_update_workout(created_id)
        print()
    else:
        results["get_workout_by_id"] = False
        results["update_workout"] = False
    
    copy_success, copied_id = test_copy_predefined_workout()
    results["copy_workout"] = copy_success
    print()
    
    delete_results = []
    if created_id:
        delete_results.append(test_delete_workout(created_id))
        print()
    if copied_id:
        delete_results.append(test_delete_workout(copied_id))
        print()
    
    results["delete_workout"] = all(delete_results) if delete_results else True
    
    results["error_handling"] = test_error_cases()
    print()
    
    print("=" * 60)
    print(" TEST SUMMARY:")
    print("=" * 60)
    
    passed = sum(1 for success in results.values() if success)
    total = len(results)
    
    for test_name, success in results.items():
        status = " PASS" if success else " FAIL"
        print(f"{status} - {test_name.replace('_', ' ').title()}")
    
    print(f"\n Results: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("\n All backend tests passed! The API is working correctly.")
        return True
    else:
        print(f"\n  {total - passed} test(s) failed. Backend needs attention.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
