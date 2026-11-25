"""Saves the daily research in MongoDB. Runs as root only: Claude never sees MONGO_URI.

Usage:
    store.py start <date>    marks the research of <date> as running
    store.py finish <date>   reads /data/work/<date>/output and saves it as completed or failed

Document of the `researches` collection (one per date, read by the frontend and by youtube_dark):
    date, edition (always B now; A was the complete Thursday edition, kept in the old documents),
    status (running | completed | failed), started_at, finished_at, title, summary, parts [{number, title, slug, markdown}],
    recommendations, top_opportunities, notices (what the limits cut, shown in the blog), error
"""

import json
import os
import re
import sys
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

from pymongo import ASCENDING, MongoClient

WORK_ROOT = Path(os.environ.get("WORK_ROOT", "/data/work"))
DATABASE_NAME = os.environ.get("MONGO_DATABASE", "market_trends")
COLLECTION_NAME = "researches"
PART_COUNT = 11
# The only edition now (the documents of the old complete edition keep "A")
EDITION = "B"
PART_COMPLETE_MARKER = "<!-- PARTE COMPLETA -->"
RECOMMENDATION_KEYS = [
    "most_promising",
    "overlooked_micro_niches",
    "growth_6_12_months",
    "best_balance",
    "faceless_content",
    "saas_ai",
    "adapt_to_brazil",
]


def get_collection():
    client = MongoClient(os.environ["MONGO_URI"], serverSelectionTimeoutMS=30000, tz_aware=True)
    collection = client[DATABASE_NAME][COLLECTION_NAME]
    collection.create_index([("date", ASCENDING)], unique=True)
    return collection


def slugify(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", normalized.lower()).strip("-")


def read_part(path: Path, number: int) -> dict | None:
    if not path.is_file():
        return None
    content = path.read_text(encoding="utf-8").strip()
    complete = content.endswith(PART_COMPLETE_MARKER)
    content = content.removesuffix(PART_COMPLETE_MARKER).rstrip()
    lines = content.splitlines()
    title = f"Parte {number}"
    if lines and lines[0].startswith("# "):
        title = lines[0][2:].strip()
        content = "\n".join(lines[1:]).strip()
    return {
        "number": number,
        "title": title,
        "slug": slugify(title),
        "markdown": content,
        "complete": complete,
    }


def read_highlights(path: Path) -> tuple[dict | None, str | None]:
    if not path.is_file():
        return None, "output/highlights.json não foi gerado."
    try:
        highlights = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        return None, f"output/highlights.json não é um JSON válido: {error}"
    recommendations = highlights.get("recommendations") or []
    # Accepts {"most_promising": {...}} too: the order of the brief is restored from the keys
    if isinstance(recommendations, dict):
        recommendations = [{"key": key, **recommendations[key]} for key in RECOMMENDATION_KEYS if key in recommendations]
        highlights["recommendations"] = recommendations
    if not all(isinstance(recommendation, dict) for recommendation in recommendations):
        return highlights, "highlights.json: recommendations precisa ser uma lista de objetos"
    keys = [recommendation.get("key") for recommendation in recommendations]
    if keys != RECOMMENDATION_KEYS:
        return highlights, f"highlights.json com recomendações inesperadas: {keys}"
    return highlights, None


def start(run_date: str) -> None:
    now = datetime.now(timezone.utc)
    get_collection().update_one(
        {"date": run_date},
        {
            "$set": {"status": "running", "edition": EDITION, "started_at": now, "updated_at": now},
            "$unset": {"error": "", "finished_at": ""},
        },
        upsert=True,
    )
    print(f"{run_date}: running")


def read_notices(path: Path) -> list[str]:
    if not path.is_file():
        return []
    lines = [line.strip() for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
    return list(dict.fromkeys(lines))  # a resumed run may write the same notice again


def finish(run_date: str) -> None:
    output_dir = WORK_ROOT / run_date / "output"
    parts = []
    for number in range(1, PART_COUNT + 1):
        part = read_part(output_dir / "parts" / f"part-{number:02d}.md", number)
        if part is not None:
            parts.append(part)

    highlights, highlights_error = read_highlights(output_dir / "highlights.json")
    errors = []
    if (output_dir / "FAILED").is_file():
        errors.append((output_dir / "FAILED").read_text(encoding="utf-8").strip())
    if not (output_dir / "DONE").is_file():
        errors.append("output/DONE não foi gerado.")
    missing = [number for number in range(1, PART_COUNT + 1)
               if not any(part["number"] == number and part["complete"] for part in parts)]
    if missing:
        errors.append(f"partes incompletas ou ausentes: {missing}")
    if highlights_error:
        errors.append(highlights_error)

    now = datetime.now(timezone.utc)
    document = {
        "status": "failed" if errors else "completed",
        "edition": EDITION,
        "notices": read_notices(output_dir / "NOTICE"),
        "finished_at": now,
        "updated_at": now,
        "parts": parts,
        "title": (highlights or {}).get("title") or f"Tendências de mercado — {run_date}",
        "summary": (highlights or {}).get("summary") or "",
        "recommendations": (highlights or {}).get("recommendations") or [],
        "top_opportunities": (highlights or {}).get("top_opportunities") or [],
    }
    update = {"$set": document, "$setOnInsert": {"started_at": now}}
    if errors:
        document["error"] = " | ".join(errors)
    else:
        update["$unset"] = {"error": ""}
    get_collection().update_one({"date": run_date}, update, upsert=True)
    print(f"{run_date}: {document['status']} ({len(parts)} parts){' - ' + document['error'] if errors else ''}")


def main() -> None:
    if len(sys.argv) != 3 or sys.argv[1] not in ("start", "finish"):
        sys.exit(__doc__)
    command, run_date = sys.argv[1:]
    start(run_date) if command == "start" else finish(run_date)


if __name__ == "__main__":
    main()
