import sys
from pathlib import Path
import importlib.util
from dotenv import load_dotenv

# Dodaj katalog backend/ do sys.path oraz wczytaj backend/.env
backend_dir = Path(__file__).resolve().parent / "backend"
_backend_env = backend_dir / ".env"
if _backend_env.exists():
    load_dotenv(dotenv_path=_backend_env)
load_dotenv()

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
