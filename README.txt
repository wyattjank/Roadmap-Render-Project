================================================================================
  ROADMAP RENDERER - Setup and Execution
================================================================================

This script reads roadmap.csv and releases.csv and generates:
  - roadmap.xlsx   (Excel: Timeline sheet with Gantt bars, Roadmap data, Releases; legend for baseline/optional)
  - roadmap.drawio (draw.io diagram with same structure and legend)

--------------------------------------------------------------------------------
1. PREREQUISITES
--------------------------------------------------------------------------------

  - Python 3.8 or newer
    Download from https://www.python.org/downloads/
    During install, check "Add Python to PATH" (Windows).

  - pip (Python package manager)
    Usually installed with Python. Verify with:
      python -m pip --version

--------------------------------------------------------------------------------
2. FOLDER STRUCTURE (required for path calls to work)
--------------------------------------------------------------------------------

Keep everything in ONE folder. The script uses the folder that contains
render.py as the working directory. All paths are relative to that folder.

  your-roadmap-folder/
    render.py          <-- main script (required)
    requirements.txt  <-- dependency list (required for pip install)
    roadmap.csv       <-- input: tasks (required)
    releases.csv      <-- input: release windows (required)
    CSV_FORMAT.md     <-- optional: documents CSV column format

  After running the script, these files are created in the SAME folder:

    roadmap.xlsx      <-- Excel output
    roadmap.drawio    <-- draw.io output

  Do not move render.py to a different folder without moving the CSV files
  with it, or the script will not find them (unless you pass full paths
  as arguments; see section 4).

--------------------------------------------------------------------------------
3. INSTALL DEPENDENCIES (first time, or on a new machine)
--------------------------------------------------------------------------------

  Open a terminal (Command Prompt, PowerShell, or terminal in your IDE) and
  go to the folder that contains render.py and requirements.txt:

    cd path\to\your-roadmap-folder

  Install the required packages:

    pip install -r requirements.txt

  This installs:
    - pandas    (data handling)
    - openpyxl  (Excel export)

--------------------------------------------------------------------------------
4. HOW TO RUN THE SCRIPT
--------------------------------------------------------------------------------

  From the folder that contains render.py:

    python render.py

  This uses the default input files (roadmap.csv and releases.csv in the
  same folder) and writes roadmap.xlsx and roadmap.drawio to the same folder.

  Other ways to run:

    python render.py roadmap.csv releases.csv
      Use custom CSV filenames in the same folder.

    python render.py "C:\full\path\to\roadmap.csv" "C:\full\path\to\releases.csv"
      Use full paths to CSVs (outputs still go to the folder containing render.py).

    python render.py --no-excel
      Generate only the draw.io file.

    python render.py --no-drawio
      Generate only the Excel file.

--------------------------------------------------------------------------------
5. EDITING THE DATA
--------------------------------------------------------------------------------

  Edit roadmap.csv and/or releases.csv in any text editor or spreadsheet app.
  See CSV_FORMAT.md for column definitions (domain, feature, task, start_date,
  end_date, notes, flag). Flag: baseline = primary offering (green accent);
  optional = optional offering (orange dashed accent).

  After saving the CSVs, run:

    python render.py

  to regenerate the Excel and draw.io files.

--------------------------------------------------------------------------------
6. TROUBLESHOOTING
--------------------------------------------------------------------------------

  "python is not recognized"
    - Reinstall Python and check "Add Python to PATH", or
    - Use: py render.py   (Windows Python launcher)

  "No module named 'pandas'" (or openpyxl)
    - Run: pip install -r requirements.txt
    - Make sure you are in the folder that contains requirements.txt.

  "Missing roadmap.csv"
    - Put roadmap.csv in the same folder as render.py, or
    - Run: python render.py "full\path\to\roadmap.csv" "full\path\to\releases.csv"

================================================================================
