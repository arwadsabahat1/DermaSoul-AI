# DermaSoul AI: Setup Guide for a New Computer

This guide takes a computer with nothing installed to a fully working DermaSoul AI (backend, frontend, AI models, database) in about 30 minutes. Most of that time is downloading.

There are two ways to set it up:

- **[A. Automatic setup](#a-automatic-setup-windows-recommended)** (Windows): one script does everything.
- **[B. Manual setup](#b-manual-setup-windows-macos-linux)** (Windows, macOS, Linux): the same steps typed by hand.

Run the [checks](#c-check-that-everything-works) afterwards, and see [Troubleshooting](#e-troubleshooting) if anything goes wrong.

---

## 0. What you need to install first

Install these four programs. Use the versions shown, which are the ones the project is tested with.

| Program | Version | Download | Notes |
|---|---|---|---|
| **Git** | any recent | https://git-scm.com/downloads | Needed to clone the repository. |
| **Python** | **3.12.x** | https://www.python.org/downloads/ | On Windows, tick **"Add python.exe to PATH"**. Python 3.13+ is not supported by every AI package. |
| **Node.js** | **22 LTS** (22.12 or newer) | https://nodejs.org/ | Needed for the React frontend. Vite 8 requires Node 20.19+ or 22.12+. |
| **PostgreSQL** | **16, 17 or 18** | https://www.postgresql.org/download/ | Remember the **password you set for the `postgres` user** during installation. Keep the default port **5432**. |

You also need about **3 GB of free disk space** and an internet connection for the first setup. Afterwards the app runs fully offline.

To check the versions, open a new terminal (PowerShell on Windows, Terminal on macOS/Linux) and run:

```powershell
git --version
python --version          # must show 3.12.x   (Windows alternative: py -3.12 --version)
node --version            # must show v22.12 or newer
```

Make sure **PostgreSQL is running**. On Windows it starts automatically as the service *postgresql-x64-NN*.

### Get the code

```powershell
git clone https://github.com/arwadsabahat1/DermaSoul-AI.git
cd DermaSoul-AI
```

The repository is private. Git will open a browser window to sign in to GitHub the first time.

---

## A. Automatic setup (Windows, recommended)

From the `DermaSoul-AI` folder, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup.ps1
```

The script will:

1. check that Python 3.12 and Node.js are installed;
2. create `backend\venv` and install all Python packages (5–15 minutes the first time);
3. create `backend\.env`, asking for your **PostgreSQL password**, and generate a secure random **JWT secret**;
4. download the two AI language models into `backend\app\ml\hf_models\` (about 680 MB) and check they load;
5. create the database `dermasoul_ai`, all tables, the educational articles, the OTC product list and the RAG search index;
6. ask for an **admin email and password** (press Enter to skip);
7. install the frontend packages.

It is safe to run the script again. Steps that are already done are skipped or refreshed.

Then **start the app**:

```powershell
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

This opens two windows (backend and frontend). Open **http://localhost:5173** in your browser.

Useful options:

```powershell
.\setup.ps1 -SkipAdmin          # do not ask for an admin account
.\setup.ps1 -SkipFrontend       # backend only
.\setup.ps1 -DbPassword "pw" -DbName "dermasoul_ai"   # give the database settings without prompts
```

---

## B. Manual setup (Windows, macOS, Linux)

Run every command from the `DermaSoul-AI` folder unless stated otherwise.

### B1. Backend Python environment

**Windows (PowerShell):**

```powershell
cd backend
py -3.12 -m venv venv              # or:  python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements-dev.txt
```

**macOS / Linux:**

```bash
cd backend
python3.12 -m venv venv
source venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements-dev.txt
```

`requirements-dev.txt` installs the app packages plus the test tools. Use `requirements.txt` if you only want to run the app.

### B2. Backend configuration (`backend/.env`)

Copy the example file:

```powershell
copy .env.example .env        # Windows
cp .env.example .env          # macOS / Linux
```

Then open `backend/.env` in a text editor and change two lines:

```ini
DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/dermasoul_ai
JWT_SECRET_KEY=<a long random string>
```

- Put your PostgreSQL password in place of `YOUR_POSTGRES_PASSWORD`. If the password contains `@ : / ? # %` or spaces, write those characters URL-encoded (for example `@` becomes `%40`).
- To generate a JWT secret, run: `python -c "import secrets; print(secrets.token_urlsafe(48))"`

Leave the other settings as they are. Never commit `.env`; it is already excluded by `.gitignore`.

### B3. AI models

The two EfficientNet image models (`.pth`) are already in the repository. The two language models (clinical NER and RAG embeddings) are downloaded once:

```powershell
python -m app.scripts.download_models
```

Expected ending:

```
  OK  NER model loads; test sentence -> ['itchy', 'red', 'rash', 'arm', 'two weeks']
  OK  embedding model loads; vector length 768
All models ready.
```

### B4. Database

```powershell
python -m app.scripts.setup_database
```

This creates the database named in `DATABASE_URL` (if it does not exist), all tables, the educational articles, the OTC products and the RAG index. Expected ending: `Database setup complete.`

### B5. Admin account (optional, recommended)

```powershell
python -m app.scripts.create_admin --email you@example.com
```

You will be asked for a password (at least 8 characters). Normal users simply register in the app.

### B6. Frontend

```powershell
cd ..\frontend          # macOS / Linux:  cd ../frontend
npm ci
```

No frontend `.env` is needed for local development. The app talks to the backend at `http://127.0.0.1:8010` by default.

### B7. Start the app

Use two terminals.

**Terminal 1, backend:**

```powershell
cd backend
.\venv\Scripts\Activate.ps1                   # macOS / Linux: source venv/bin/activate
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8010
```

Wait for `Application startup complete.`

**Terminal 2, frontend:**

```powershell
cd frontend
npm run dev
```

Open **http://localhost:5173**.

---

## C. Check that everything works

1. **Backend:** open http://127.0.0.1:8010/health. It should show `{"status":"healthy"}`.
2. **API docs:** http://127.0.0.1:8010/docs lists every endpoint.
3. **App:** go to http://localhost:5173, **register** a new account and you land on the **Skin Analysis** page.
4. **Analysis:** upload a clear JPG/PNG photo of skin, describe the symptoms (for example *"itchy red patches on my arm for 2 weeks"*) and click **Analyze**. A result with the condition, risk level, guidance and product suggestions appears. The first analysis takes a few seconds longer while the models load.
5. **Condition Library:** the article list is not empty.
6. **Admin (if created):** log in with the admin account. The **Admin** menu appears with statistics, users, products, articles and dermatologists.

### Run the automated tests (optional)

From the `backend` folder with the virtual environment active:

```powershell
# Windows PowerShell
$env:PYTHONPATH="."; python -m unittest discover -s ../tests/backend -t ../tests/backend
```

```bash
# macOS / Linux
PYTHONPATH=. python -m unittest discover -s ../tests/backend -t ../tests/backend
```

Expected: `OK` (41 tests).

The report test runner (`tests/report/run_report_tests.py`) also needs the 22-class skin dataset. Set `DERMASOUL_TEST_IMAGES` to its `test` folder, for example:

```powershell
$env:DERMASOUL_TEST_IMAGES="C:\path\to\SkinDisease\test"; python ..\tests\report\run_report_tests.py
```

---

## D. Everyday use

| Task | Command (from the project folder) |
|---|---|
| Start everything (Windows) | `powershell -ExecutionPolicy Bypass -File .\start.ps1` |
| Start backend only | `cd backend; .\venv\Scripts\Activate.ps1; python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8010` |
| Start frontend only | `cd frontend; npm run dev` |
| Create or reset an admin | `cd backend; python -m app.scripts.create_admin --email you@example.com [--reset-password]` |
| Rebuild the RAG index after editing the knowledge base | `cd backend; python -m app.scripts.setup_database` |
| Get the latest code | `git pull`, then run `setup.ps1` again if `requirements.txt` or `package.json` changed |

---

## E. Troubleshooting

| Problem | Fix |
|---|---|
| `running scripts is disabled on this system` | Start the script with `powershell -ExecutionPolicy Bypass -File .\setup.ps1`, or allow your own scripts once: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`. |
| `Python 3.12 not found` | Install Python 3.12 and tick **Add python.exe to PATH**, then open a **new** terminal. |
| `Could not connect to PostgreSQL` / `password authentication failed` | PostgreSQL is not running or the password in `backend\.env` is wrong. On Windows open **Services** and start *postgresql-x64-NN*. Fix `DATABASE_URL` and run `python -m app.scripts.setup_database` again. |
| `could not translate host name` | Check the host part of `DATABASE_URL` (normally `localhost`). |
| `pip` takes very long or fails on `torch` | It is a large download (~200 MB). Check your internet connection and run `pip install -r requirements-dev.txt` again; finished packages are not downloaded twice. |
| `download_models` fails | Usually a network problem. Run `python -m app.scripts.download_models` again; it resumes. Use `--force` to download everything again. |
| Backend log shows `Transformer NER unavailable, using fallback extractor` | The NER model is missing. Run `python -m app.scripts.download_models`. |
| `Address already in use` / port 8010 busy | Another backend is still running. Close it, or use another port (`--port 8011`) and set the same port in `PUBLIC_BASE_URL` in `backend\.env` and `VITE_DEV_PROXY_TARGET` in `frontend\.env.development.local`. |
| Frontend shows network or CORS errors | The backend is not running or runs on a different port. Check http://127.0.0.1:8010/health. If Vite started on 5174 instead of 5173, that port is already allowed in `BACKEND_CORS_ORIGINS`. |
| `npm ci` fails with an engine/version error | Install Node.js 22 LTS (22.12+) and open a new terminal. |
| Image rejected as "blurry" or "no visible skin" | That is the image quality check working. Use a sharp, well-lit close-up of the skin area. |
| Login works but pages show "session expired" after an hour | JWT tokens last 60 minutes. Log in again. |

---

## F. What is not in the repository (on purpose)

| Item | Why | How it is created |
|---|---|---|
| `backend/.env` | Contains your database password and JWT secret | Step B2 / `setup.ps1` |
| `backend/venv/`, `frontend/node_modules/` | Installed packages | Steps B1 and B6 |
| `backend/app/ml/hf_models/` | Language models (680 MB) | `python -m app.scripts.download_models` |
| `backend/app/uploads/` | Users' uploaded skin photos (private data) | Filled by the app at runtime |
| `backend/logs/` | Runtime error logs | Created by the app |
