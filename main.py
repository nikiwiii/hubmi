import sys
from pathlib import Path
import importlib.util

# Dodaj katalog backend/ do sys.path, aby wszystkie moduły (login, ideas, matching itp.) były widoczne
backend_dir = Path(__file__).resolve().parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Załaduj aplikację z backend/main.py
backend_main_path = backend_dir / "main.py"
spec = importlib.util.spec_from_file_location("backend_main", str(backend_main_path))
backend_main = importlib.util.module_from_spec(spec)
sys.modules["backend_main"] = backend_main
spec.loader.exec_module(backend_main)

app = backend_main.app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
