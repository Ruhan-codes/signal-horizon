from __future__ import annotations

import csv
import hashlib
import re
from collections import defaultdict
from datetime import datetime
from functools import lru_cache
from pathlib import Path
from typing import Any

try:
    import pymupdf as fitz
except ImportError:
    import fitz

DATE_PATTERN = re.compile(r"\b\d{1,2}-[A-Za-z]{3}-\d{4}\b")
WORK_ID_PATTERN = re.compile(r"WS/\s*MP\w+/\d{4}-\d{4}/\d+")
AMOUNT_PATTERN = re.compile(r"^\s*[\d,]+(?:\.\d+)?\s*$")
HOUSE_NAMES = ["Lok Sabha", "Rajya Sabha"]

OFFICIAL_TOTALS = {
    "Lok Sabha": {
        "works_recommended": 102758,
        "works_sanctioned": 35000,
        "works_completed": 33870,
        "total_expenditure_records": 82452,
    },
    "Rajya Sabha": {
        "works_recommended": 24662,
        "works_sanctioned": 19203,
        "works_completed": 9855,
        "total_expenditure_records": 24887,
    },
}


def _clean(value: Any) -> str:
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value).replace("\xa0", " ").replace("\t", " ")).strip()


def _date(value: str) -> str | None:
    val = _clean(value)
    if not val or val.upper() in {"NA", "N/A", "-", "NULL"}:
        return None
    try:
        return datetime.strptime(val, "%d-%b-%Y").date().isoformat()
    except ValueError:
        return val


def _money(value: str) -> float:
    try:
        return float(_clean(value).replace(",", ""))
    except (TypeError, ValueError):
        return 0.0


def _stable_id(*values: Any) -> int:
    digest = hashlib.sha1("|".join(str(v) for v in values).encode("utf-8")).hexdigest()[:12]
    return int(digest, 16) % 2_000_000_000


def _clean_mp_name(name: str) -> str:
    cleaned = re.sub(r"\s*\(\d{4}-\d{2}\).*", "", name).strip()
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned


_TITLES = {"shri", "shrimati", "smt", "smtn", "dr", "mr", "mrs", "ms", "prof", "adv", "sardar", "sdr", "kum", "kumari", "mo", "md", "haj"}


def _norm_mp_key(name: str) -> str:
    """Normalize an MP name for cross-dataset matching (drops titles, dots, suffixes)."""
    key = re.sub(r"\([^)]*\)", " ", name.lower())
    key = key.replace(".", " ").replace("-", " ")
    tokens = [t for t in key.split() if t and t not in _TITLES]
    return " ".join(tokens)


def _parse_allocations_pdf(path: Path) -> list[dict[str, Any]]:
    is_rs = path.parent.name == "Rajya Sabha"
    house_name = path.parent.name
    records = []

    with fitz.open(path) as doc:
        for pno in range(len(doc)):
            page = doc[pno]
            words = page.get_text("words")
            min_y = 86.0 if is_rs else 96.0
            sr_words = [w for w in words if w[0] < 85 and w[4].isdigit() and (w[1] >= min_y if pno == 0 else True)]
            sr_words.sort(key=lambda w: w[1])

            for i, sr_w in enumerate(sr_words):
                sr = int(sr_w[4])
                y_top = sr_w[1] - 3.0
                y_bottom = sr_words[i + 1][1] - 3.0 if i + 1 < len(sr_words) else 9999.0
                row_words = [w for w in words if y_top <= w[1] < y_bottom]

                if any(w[4] in ["Grand", "Total"] for w in row_words):
                    cutoff_y = min(w[1] for w in row_words if w[4] in ["Grand", "Total"])
                    row_words = [w for w in row_words if w[1] < cutoff_y]

                c_state = [w[4] for w in sorted([w for w in row_words if 85 <= w[0] < (200 if is_rs else 250)], key=lambda w: (w[1], w[0]))]
                c_mp = [w[4] for w in sorted([w for w in row_words if (200 if is_rs else 250) <= w[0] < (480 if is_rs else 500)], key=lambda w: (w[1], w[0]))]

                if is_rs:
                    c_const = []
                    c_amt = [w[4] for w in sorted([w for w in row_words if w[0] >= 580], key=lambda w: (w[1], w[0]))]
                else:
                    c_const = [w[4] for w in sorted([w for w in row_words if 500 <= w[0] < 670], key=lambda w: (w[1], w[0]))]
                    c_amt = [w[4] for w in sorted([w for w in row_words if w[0] >= 670], key=lambda w: (w[1], w[0]))]

                state = _clean(" ".join(c_state))
                mp = _clean_mp_name(" ".join(c_mp))
                const = _clean(" ".join(c_const))
                amt_str = "".join(c_amt).replace(",", "").strip()
                try:
                    amt = float(amt_str)
                except (ValueError, TypeError):
                    amt = 0.0

                rec_id = (2 if is_rs else 1) * 10000 + sr
                records.append({
                    "id": rec_id,
                    "mp_name": mp,
                    "constituency": const,
                    "state": state,
                    "house": house_name,
                    "allocated_cr": round(amt / 10_000_000, 4),
                    "source_file": str(path.name),
                })
    return records


def _parse_calamities_pdf(path: Path) -> list[dict[str, Any]]:
    house_name = path.parent.name
    is_rs = house_name == "Rajya Sabha"
    records = []

    with fitz.open(path) as doc:
        page = doc[0]
        blocks = page.get_text("blocks")
        for b in blocks:
            text = b[4].strip()
            lines = [l.strip() for l in text.splitlines() if l.strip()]
            if lines and lines[0].isdigit() and len(lines) >= 5:
                sr = int(lines[0])
                date_idx = next((i for i, l in enumerate(lines) if DATE_PATTERN.fullmatch(l)), -1)
                if date_idx > 2:
                    calamity_name = lines[2]
                    mp_name = _clean_mp_name(" ".join(lines[3:date_idx]))
                    date_str = _date(lines[date_idx])
                    amt_str = lines[date_idx + 1].replace(",", "").strip()
                    try:
                        amt = float(amt_str)
                    except (ValueError, TypeError):
                        amt = 0.0

                    rec_id = (2 if is_rs else 1) * 10000 + sr
                    records.append({
                        "id": rec_id,
                        "mp_name": mp_name,
                        "constituency": "",
                        "event_name": calamity_name,
                        "amount_cr": round(amt / 10_000_000, 4),
                        "date_consented": date_str,
                        "house": house_name,
                        "source_file": str(path.name),
                    })
    return records


def _parse_recommended_csv(path: Path) -> list[dict[str, Any]]:
    records = []
    with path.open("r", encoding="utf-8-sig", errors="replace", newline="") as handle:
        for idx, row in enumerate(csv.DictReader(handle), start=1):
            work = _clean(row.get("WORK", ""))
            mp_name = _clean(row.get("Hon'ble Members of Parliament", ""))
            if not work or not mp_name or mp_name == "\xa0" or "Grand Total" in row.get("Sr. No.", ""):
                continue

            work_id = work.split("-", 1)[0].strip()
            cost_cr = _money(row.get("RECOMMENDED AMOUNT   ( ₹ )", "")) / 10_000_000

            records.append({
                "id": idx,
                "work_id": work_id,
                "mp_name": mp_name,
                "constituency": _clean(row.get("Constituency", "")),
                "state": _clean(row.get("State", "")),
                "work_name": _clean(row.get("Work description", "")) or work,
                "sector": _clean(row.get("Work category", "")) or "Normal/Others",
                "status": "RECOMMENDED",
                "cost_cr": round(cost_cr, 4),
                "recommended_date": _date(row.get("Recommended date", "")),
                "sanction_date": _date(row.get("Sanction Date", "")),
                "house": "Lok Sabha",
                "source_file": str(path.name),
            })
    return records


def _parse_works_pdf_sample(path: Path, status: str, max_pages: int = 15) -> list[dict[str, Any]]:
    house_name = path.parent.name
    is_rs = house_name == "Rajya Sabha"
    records = []

    with fitz.open(path) as doc:
        for pno in range(min(len(doc), max_pages)):
            page = doc[pno]
            words = page.get_text("words")
            sr_words = [w for w in words if w[0] < 70 and w[4].isdigit() and (w[1] > 95 if pno == 0 else w[1] > 60)]
            sr_words.sort(key=lambda w: w[1])

            for i, sr_w in enumerate(sr_words):
                sr = int(sr_w[4])
                y_top = sr_w[1] - 3.0
                y_bottom = sr_words[i + 1][1] - 3.0 if i + 1 < len(sr_words) else 9999.0
                row_words = [w for w in words if y_top <= w[1] < y_bottom]

                mp_words = [w[4] for w in sorted([w for w in row_words if 500 <= w[0] < 680 and not w[4].startswith("(") and w[4] not in ["Elected", "Nominated", "MP"]], key=lambda w: (w[1], w[0]))]
                mp_name = _clean_mp_name(" ".join(mp_words))

                work_words = [w[4] for w in sorted([w for w in row_words if 130 <= w[0] < 350], key=lambda w: (w[1], w[0]))]
                work_desc = _clean(" ".join(work_words))

                rec_id = (2 if is_rs else 1) * 1_000_000 + sr
                records.append({
                    "id": rec_id,
                    "mp_name": mp_name,
                    "work_name": work_desc or f"Public Work #{sr}",
                    "sector": "Normal/Others",
                    "status": status,
                    "cost_cr": 0.0,
                    "house": house_name,
                    "source_file": str(path.name),
                    "source_page": pno + 1,
                })
    return records


def _parse_expenditures_sample(path: Path, max_pages: int = 15) -> list[dict[str, Any]]:
    house_name = path.parent.name
    is_rs = house_name == "Rajya Sabha"
    records = []

    with fitz.open(path) as doc:
        for pno in range(min(len(doc), max_pages)):
            page = doc[pno]
            words = page.get_text("words")
            sr_words = [w for w in words if w[0] < 70 and w[4].isdigit() and (w[1] > 95 if pno == 0 else w[1] > 60)]
            sr_words.sort(key=lambda w: w[1])

            for i, sr_w in enumerate(sr_words):
                sr = int(sr_w[4])
                y_top = sr_w[1] - 3.0
                y_bottom = sr_words[i + 1][1] - 3.0 if i + 1 < len(sr_words) else 9999.0
                row_words = [w for w in words if y_top <= w[1] < y_bottom]

                wid_words = [w[4] for w in sorted([w for w in row_words if 200 <= w[0] < 360], key=lambda w: (w[1], w[0]))]
                wid = "".join(wid_words).replace(" ", "")

                wname_words = [w[4] for w in sorted([w for w in row_words if 130 <= w[0] < 220], key=lambda w: (w[1], w[0]))]
                wname = _clean(" ".join(wname_words))

                date_match = next((w[4] for w in row_words if DATE_PATTERN.fullmatch(w[4])), None)
                vend_words = [w[4] for w in sorted([w for w in row_words if 740 <= w[0] < 900], key=lambda w: (w[1], w[0]))]
                vend = _clean(" ".join(vend_words))

                rec_id = (2 if is_rs else 1) * 1_000_000 + sr
                records.append({
                    "id": rec_id,
                    "work_name": wname or wid or f"Expenditure #{sr}",
                    "vendor_name": vend or "Executing Agency",
                    "amount_disbursed": 0.0,
                    "date_disbursed": _date(date_match or ""),
                    "house": house_name,
                    "source_file": str(path.name),
                    "source_page": pno + 1,
                })
    return records


class EsakshiRepository:
    def __init__(self, root: Path):
        self.root = root
        self.allocations: list[dict[str, Any]] = []
        self.calamities: list[dict[str, Any]] = []
        self.works: list[dict[str, Any]] = []
        self.expenditures: list[dict[str, Any]] = []
        self.mp_work_stats: dict[str, dict[str, int]] = defaultdict(lambda: {"rec": 0, "sanc": 0, "comp": 0})
        self._load()

    def _load(self) -> None:
        for house in HOUSE_NAMES:
            folder = self.root / house
            alloc_file = folder / "Allocated Limit for Honble MPs.pdf"
            if alloc_file.exists():
                self.allocations.extend(_parse_allocations_pdf(alloc_file))

            calamity_file = folder / "Amount consented for Calamity.pdf"
            if calamity_file.exists():
                self.calamities.extend(_parse_calamities_pdf(calamity_file))

        # Enrich calamity records with MP constituency and state
        alloc_lookup = {
            a["mp_name"].strip().lower(): a
            for a in self.allocations
        }
        for c in self.calamities:
            c_name = c["mp_name"].strip().lower()
            match = alloc_lookup.get(c_name)
            if not match:
                # Fuzzy/token match
                for a_name, a_val in alloc_lookup.items():
                    if len(c_name) > 5 and (c_name in a_name or a_name in c_name):
                        match = a_val
                        break
            if match:
                c["constituency"] = match.get("constituency") or match.get("state") or ""

        ls_csv = self.root / "Lok Sabha" / "Works Recommended.csv"
        if ls_csv.exists():
            csv_works = _parse_recommended_csv(ls_csv)
            self.works.extend(csv_works)

        rs_rec = self.root / "Rajya Sabha" / "Works Recommended.pdf"
        if rs_rec.exists():
            self.works.extend(_parse_works_pdf_sample(rs_rec, "RECOMMENDED", max_pages=15))

        # Ingest granular open-source MPLADS records (village, block, IDA agency)
        granular_csv = Path(__file__).resolve().parents[1] / "india-mplads-works-main" / "csv" / "MPLADS.csv"
        if granular_csv.exists():
            try:
                with granular_csv.open("r", encoding="utf-8", errors="replace") as h:
                    reader = csv.DictReader(h, delimiter=";")
                    for idx, row in enumerate(reader, start=500_000):
                        mp = _clean(row.get("MP NAME", ""))
                        if not mp:
                            continue
                        amt_str = row.get("ALLOCATION AMOUNT", "0").strip()
                        try:
                            cost_cr = round(float(amt_str) / 10_000_000, 4)
                        except (ValueError, TypeError):
                            cost_cr = 0.0

                        status_val = (row.get("STATUS") or "RECOMMENDED").upper()
                        self.works.append({
                            "id": idx,
                            "mp_name": mp,
                            "work_name": _clean(row.get("WORK", "")) or f"Public Civil Project #{idx}",
                            "sector": _clean(row.get("CATEGORY", "")) or "Normal/Others",
                            "status": status_val,
                            "cost_cr": cost_cr,
                            "house": _clean(row.get("HOUSE", "")) or "Lok Sabha",
                            "constituency": _clean(row.get("CONSTITUENCY", "")),
                            "state": _clean(row.get("STATE", "")),
                            "recommended_date": _date(row.get("RECOMMENDED DATE", "")),
                            "village": _clean(row.get("VILLAGE", "")) or None,
                            "block": _clean(row.get("BLOCK", "")) or None,
                            "city": _clean(row.get("CITY", "")) or None,
                            "ida": _clean(row.get("IDA", "")) or None,
                            "ida_approval": _clean(row.get("IDA APPROVAL", "")) or None,
                            "source_file": "india-mplads-works/MPLADS.csv",
                        })
            except Exception as e:
                print(f"Granular MPLADS ingestion notice: {e}")

        for house in HOUSE_NAMES:
            folder = self.root / house
            for status in ("Sanctioned", "Completed"):
                w_file = folder / f"Works {status}.pdf"
                if w_file.exists():
                    self.works.extend(_parse_works_pdf_sample(w_file, status.upper(), max_pages=10))

            exp_file = folder / "Expenditure on Completed and On-going Works as on Date.pdf"
            if exp_file.exists():
                self.expenditures.extend(_parse_expenditures_sample(exp_file, max_pages=10))

        # Build per-MP work statistics from ALL ingested works (both houses)
        for w in self.works:
            mp_key = _norm_mp_key(w["mp_name"])
            if not mp_key:
                continue
            status = (w.get("status") or "").upper()
            self.mp_work_stats[mp_key]["rec"] += 1
            if status in {"SANCTIONED", "COMPLETED", "ONGOING"} or w.get("sanction_date"):
                self.mp_work_stats[mp_key]["sanc"] += 1
            if status == "COMPLETED":
                self.mp_work_stats[mp_key]["comp"] += 1

    def _house_filter(self, records: list[dict[str, Any]], house: str | None) -> list[dict[str, Any]]:
        if not house or house == "ALL":
            return records
        normalized = "Lok Sabha" if house.upper() in {"LS", "LOK SABHA"} else "Rajya Sabha"
        return [r for r in records if r.get("house") == normalized]

    def summary(self, house: str | None = None) -> dict[str, Any]:
        norm_house = None if not house or house == "ALL" else ("Lok Sabha" if house.upper() in {"LS", "LOK SABHA"} else "Rajya Sabha")

        allocations = self._house_filter(self.allocations, house)
        calamities = self._house_filter(self.calamities, house)

        if norm_house is None:
            rec_count = OFFICIAL_TOTALS["Lok Sabha"]["works_recommended"] + OFFICIAL_TOTALS["Rajya Sabha"]["works_recommended"]
            sanc_count = OFFICIAL_TOTALS["Lok Sabha"]["works_sanctioned"] + OFFICIAL_TOTALS["Rajya Sabha"]["works_sanctioned"]
            comp_count = OFFICIAL_TOTALS["Lok Sabha"]["works_completed"] + OFFICIAL_TOTALS["Rajya Sabha"]["works_completed"]
        else:
            rec_count = OFFICIAL_TOTALS[norm_house]["works_recommended"]
            sanc_count = OFFICIAL_TOTALS[norm_house]["works_sanctioned"]
            comp_count = OFFICIAL_TOTALS[norm_house]["works_completed"]

        return {
            "total_allocated_cr": round(sum(item["allocated_cr"] for item in allocations), 2),
            "total_mps": len(allocations),
            "works_recommended": rec_count,
            "works_sanctioned": sanc_count,
            "works_completed": comp_count,
            "total_calamity_cr": round(sum(item["amount_cr"] for item in calamities), 2),
            "model_status": "DATA-DERIVED RISK BANDS",
        }

    def allocation_view(self, house: str | None = None, query: str = "", state: str = "ALL") -> list[dict[str, Any]]:
        records = self._house_filter(self.allocations, house)
        result = []

        for item in records:
            if state != "ALL" and item["state"] != state:
                continue
            haystack = f"{item['mp_name']} {item['constituency']}".lower()
            if query and query.lower() not in haystack:
                continue

            mp_key = _norm_mp_key(item["mp_name"])
            stats = self.mp_work_stats.get(mp_key, {"rec": 0, "sanc": 0, "comp": 0})

            sanc = stats["sanc"]
            rec = stats["rec"]

            if rec > 0:
                utilization = round((sanc / rec) * 100, 1)
            else:
                utilization = 0.0

            risk_score = max(0, min(100, round(100 - utilization)))
            risk_badge = "Low" if risk_score < 25 else "Medium" if risk_score < 45 else "Review Required"

            result.append({
                **item,
                "utilization_pct": utilization,
                "risk_score": risk_score,
                "risk_badge": risk_badge,
                "recommended_count": rec,
                "sanctioned_count": sanc,
                "completed_count": stats.get("comp", 0),
            })

        return result

    def works_view(self, house: str | None = None, query: str = "", mp: str = "") -> list[dict[str, Any]]:
        records = self._house_filter(self.works, house)
        if mp:
            mp_lower = mp.strip().lower()
            records = [r for r in records if mp_lower in r.get("mp_name", "").lower() or r.get("mp_name", "").lower() in mp_lower]
        if query:
            q = query.lower()
            records = [r for r in records if q in str(r).lower()]
        return records[:200]

    def calamity_view(self, house: str | None = None) -> list[dict[str, Any]]:
        return self._house_filter(self.calamities, house)

    def expenditure_view(self, house: str | None = None) -> list[dict[str, Any]]:
        return self._house_filter(self.expenditures, house)[:200]


@lru_cache(maxsize=1)
def get_repository() -> EsakshiRepository:
    return EsakshiRepository(Path(__file__).resolve().parents[1] / "eSAKSHI")

