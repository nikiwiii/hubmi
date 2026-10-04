import io
import logging
import re
import unicodedata
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from pathlib import Path
from app.schemas import APPLICATION_STATUS_LABELS, ApplicationOut, CallField, CallOut

logger = logging.getLogger("idea_creator.documents")
# fpdf2 subsets the embedded font on every render and fontTools logs each step at INFO.
logging.getLogger("fontTools").setLevel(logging.WARNING)

FONTS_DIR = Path(__file__).resolve().parent.parent / "assets" / "fonts"
try:
    from zoneinfo import ZoneInfo
    LOCAL_TZ = ZoneInfo("Europe/Warsaw")
except Exception:
    LOCAL_TZ = timezone(timedelta(hours=2), name="Europe/Warsaw")
PDF_MAGIC = b"%PDF-"


class TemplateError(Exception):
    """The uploaded template cannot be used; the message is shown to the admin."""


def extract_pdf_text(data: bytes) -> str:
    """Plain text of all pages; raises TemplateError for invalid or scanned (text-less) PDFs."""
    from pypdf import PdfReader
    from pypdf.errors import PdfReadError

    if not data.startswith(PDF_MAGIC):
        raise TemplateError("Plik nie jest poprawnym dokumentem PDF.")
    try:
        reader = PdfReader(io.BytesIO(data))
        pages = [page.extract_text() or "" for page in reader.pages]
    except (PdfReadError, ValueError, KeyError) as e:
        logger.warning("PDF text extraction failed: %s", type(e).__name__)
        raise TemplateError("Nie udało się odczytać pliku PDF.") from e

    text = "\n\n".join(p.strip() for p in pages if p.strip())
    if len(text) < 50:
        raise TemplateError(
            "PDF nie zawiera tekstu do odczytania (np. jest skanem). Dodaj pola wniosku ręcznie."
        )
    return text


def _format_dt(value: str | datetime | None) -> str:
    if not value:
        return "-"
    dt = value if isinstance(value, datetime) else datetime.fromisoformat(value)
    return dt.astimezone(LOCAL_TZ).strftime("%d.%m.%Y %H:%M")


def render_application_pdf(call: CallOut, application: ApplicationOut) -> bytes:
    """Clean PDF with all call fields in template order (empty answers are marked)."""
    from fpdf import FPDF

    pdf = FPDF(format="A4")
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.set_margins(18, 18, 18)
    pdf.add_font("DejaVu", "", str(FONTS_DIR / "DejaVuSans.ttf"))
    pdf.add_font("DejaVu", "B", str(FONTS_DIR / "DejaVuSans-Bold.ttf"))
    pdf.set_title(f"Wniosek - {call.title}")
    pdf.add_page()
    width = pdf.epw

    pdf.set_font("DejaVu", "B", 16)
    pdf.multi_cell(width, 8, call.title, new_x="LMARGIN", new_y="NEXT", align="L")
    pdf.ln(2)

    pdf.set_font("DejaVu", "", 9)
    pdf.set_text_color(90, 90, 90)
    meta = [
        ("Wnioskodawca", application.author_name or "-"),
        ("Pomysł", application.idea_title or "-"),
        ("Status", APPLICATION_STATUS_LABELS[application.status]),
        ("Data złożenia", _format_dt(application.submitted_at)),
        ("Nr wniosku", application.id),
    ]
    for label, value in meta:
        pdf.multi_cell(width, 5, f"{label}: {value}", new_x="LMARGIN", new_y="NEXT", align="L")
    pdf.set_text_color(0, 0, 0)
    pdf.ln(4)

    section = None
    for field in call.fields:
        if field.section and field.section != section:
            section = field.section
            pdf.ln(2)
            pdf.set_font("DejaVu", "B", 12)
            pdf.multi_cell(width, 7, section, new_x="LMARGIN", new_y="NEXT", align="L")
            pdf.set_draw_color(200, 200, 200)
            pdf.line(pdf.l_margin, pdf.get_y(), pdf.l_margin + width, pdf.get_y())
            pdf.ln(2)

        label = field.label + (" *" if field.required else "")
        pdf.set_font("DejaVu", "B", 10)
        pdf.multi_cell(width, 5.5, label, new_x="LMARGIN", new_y="NEXT", align="L")

        answer = application.answers.get(field.id, "").strip()
        if answer:
            pdf.set_font("DejaVu", "", 10)
            pdf.multi_cell(width, 5.5, answer, new_x="LMARGIN", new_y="NEXT", align="L")
        else:
            pdf.set_font("DejaVu", "", 9)
            pdf.set_text_color(150, 150, 150)
            pdf.multi_cell(width, 5.5, "(brak odpowiedzi)", new_x="LMARGIN", new_y="NEXT", align="L")
            pdf.set_text_color(0, 0, 0)
        pdf.ln(3)

    return bytes(pdf.output())


# ---------- Filling the original template ----------

DEJAVU_FILE = str(FONTS_DIR / "DejaVuSans.ttf")
# Carlito is the open, metric-compatible substitute for Calibri (the forms' body font).
# Calibri itself cannot be redistributed.
CARLITO_FILE = str(FONTS_DIR / "Carlito-Regular.ttf")
_FILL_RUN_RE = re.compile(r"(?:[.\u2026·_] *){4,}")
_HYPHENS_RE = re.compile(r"[\u2010\u2011\u2012\u2013\u2014]")
_FIELD_START_RE = re.compile(r"^(\d+\.|[a-z]\.|o)\s", re.IGNORECASE)


def _norm(text: str) -> str:
    text = _HYPHENS_RE.sub("-", text).lower().replace("ł", "l")
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    return re.sub(r" +", " ", re.sub(r"[^a-z0-9]+", " ", text)).strip()


def _contains(haystack: str, needle: str) -> bool:
    """Needle as a phrase, or its first words when the form adds words in between."""
    if not needle:
        return False
    words = needle.split()
    candidates = [" ".join(words[:count]) for count in range(len(words), 2, -1)]
    if len(words) <= 2:
        candidates.append(needle)
    return any(
        re.search(rf"(?<![a-z0-9]){re.escape(phrase)}(?![a-z0-9])", haystack) for phrase in candidates
    )


def _search_keys(label: str) -> list[str]:
    """Phrases to look for, most specific first. Parenthetical hints like '(osoba fizyczna)' are dropped."""
    plain = re.sub(r"\s*\([^)]*\)", "", _HYPHENS_RE.sub("-", label)).strip()
    parts = [part.strip() for part in re.split(r"\s+-\s+", plain) if part.strip()]
    keys = []
    if len(parts) > 1:
        keys.append(_norm(parts[-1]))
    keys.append(_norm(plain))
    return [key for key in keys if key]


@dataclass
class _Line:
    page_index: int
    bbox: "object"
    text: str
    size: float
    font: str


def _lines(doc) -> list[_Line]:
    import pymupdf

    found = []
    for index, page in enumerate(doc):
        for block in page.get_text("dict")["blocks"]:
            if block.get("type") != 0:
                continue
            for line in block["lines"]:
                spans = [span for span in line["spans"] if span["text"].strip() and span["bbox"][0] < page.rect.width]
                if not spans:
                    continue
                text = "".join(span["text"] for span in line["spans"]).strip()
                if not text or _FILL_RUN_RE.fullmatch(text):
                    continue
                rect = pymupdf.Rect(spans[0]["bbox"])
                for span in spans[1:]:
                    rect.include_rect(span["bbox"])
                body = max(spans, key=lambda span: span["bbox"][2] - span["bbox"][0])
                found.append(_Line(index, rect, text, body["size"], body["font"]))
    found.sort(key=lambda line: (line.page_index, line.bbox.y0, line.bbox.x0))
    return found


def _font_for(lines: list[_Line]) -> tuple[str, str]:
    """Body typeface of the template. Calibri (and Calibri Light) map to Carlito."""
    counts: dict[str, int] = {}
    for line in lines:
        if line.size >= 10:
            counts[line.font] = counts.get(line.font, 0) + 1
    dominant = max(counts, key=counts.get, default="")
    if "calibri" in dominant.lower():
        return CARLITO_FILE, "carlito"
    if "dejavu" in dominant.lower():
        return DEJAVU_FILE, "dejavu"
    return CARLITO_FILE, "carlito"


def _content_right(page) -> float:
    return page.rect.x1 - 48


def _wrap(text: str, width: float, size: float, font) -> list[str]:
    lines: list[str] = []
    for paragraph in text.splitlines() or [""]:
        words = paragraph.split()
        if not words:
            lines.append("")
            continue
        current = ""
        for word in words:
            trial = f"{current} {word}".strip()
            if font.text_length(trial, fontsize=size) <= width:
                current = trial
            else:
                if current:
                    lines.append(current)
                current = word
        if current:
            lines.append(current)
    return lines


def _dot_x(line: _Line, font) -> "float | None":
    """Start of a dotted/underscored blank on the label's own line."""
    match = None
    for candidate in _FILL_RUN_RE.finditer(line.text):
        if _norm(line.text[: candidate.start()]).strip():
            match = candidate
    if match is None:
        return None
    return line.bbox.x0 + font.text_length(line.text[: match.start()], fontsize=line.size) + 2


def _find_line(keys: list[str], lines: list[_Line], start: int) -> "int | None":
    for index in range(start, len(lines)):
        haystack = _norm(lines[index].text)
        if any(_contains(haystack, key) for key in keys):
            return index
    return None


def _is_new_block(text: str) -> bool:
    if _FIELD_START_RE.match(text):
        return True
    letters = re.sub(r"[^A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]", "", text)
    return bool(letters) and letters.isupper() and len(text) < 45


def _prompt_end(lines: list[_Line], index: int) -> int:
    """Last line of the question's instruction, before the next field or section heading."""
    anchor = lines[index]
    end = index
    for cursor in range(index + 1, len(lines)):
        line = lines[cursor]
        if line.page_index != anchor.page_index:
            break
        if line.bbox.y0 - lines[end].bbox.y1 > 26 or _is_new_block(line.text):
            break
        end = cursor
    return end


def _write_lines(page, x: float, baseline: float, rows: list[str], size: float, leading: float, fontname: str) -> None:
    for offset, row in enumerate(rows):
        page.insert_text((x, baseline + offset * leading), row, fontname=fontname, fontsize=size, color=(0.1, 0.1, 0.1))


def _place(page, line: _Line, answer: str, following: "_Line | None", font, fontname: str) -> bool:
    """Writes one answer in the template's size. Returns False when it does not fit."""
    import pymupdf

    size = line.size if 9 <= line.size <= 14 else 12
    right = _content_right(page)
    dot_x = _dot_x(line, font)
    if dot_x is not None and right - dot_x > 30:
        # Cover only the dotted blank, then write in the template size.
        rect = pymupdf.Rect(dot_x, line.bbox.y0 + 0.4, min(line.bbox.x1, right), line.bbox.y1 - 0.2)
        rows = _wrap(answer, rect.width, size, font)
        if len(rows) == 1:
            page.draw_rect(rect, color=None, fill=(1, 1, 1), width=0)
            _write_lines(page, rect.x0, line.bbox.y1 - size * 0.22, rows, size, size, fontname)
            return True

    room = right - line.bbox.x1 - 10
    if room > 36 and font.text_length(answer, fontsize=size) <= room:
        baseline = line.bbox.y1 - size * 0.22
        _write_lines(page, line.bbox.x1 + 8, baseline, [answer], size, size, fontname)
        return True

    if following is None or following.page_index != line.page_index:
        return False
    top = line.bbox.y1 + 2
    bottom = following.bbox.y0 - 3
    if bottom - top < size:
        return False
    width = right - line.bbox.x0
    leading = size * 1.35
    rows = _wrap(answer, width, size, font)
    if len(rows) * leading > bottom - top + 1:
        return False
    _write_lines(page, line.bbox.x0, top + size * 0.8, rows, size, leading, fontname)
    return True


def fill_template_pdf(template: bytes, call: CallOut, application: ApplicationOut) -> bytes | None:
    """Writes the answers into the original template, in its body typeface and size.

    Short answers go on the field's own line. Longer ones use the free space under the question.
    Answers that fit neither are listed on a final page in the same typeface.
    Returns None when nothing could be placed.
    """
    import pymupdf

    doc = pymupdf.open(stream=template, filetype="pdf")
    lines = _lines(doc)
    font_file, font_name = _font_for(lines)
    font = pymupdf.Font(fontfile=font_file)
    for page in doc:
        page.insert_font(fontname=font_name, fontfile=font_file)

    cursor = 0
    placed = 0
    leftover: list[tuple[CallField, str]] = []
    for field in call.fields:
        answer = application.answers.get(field.id, "").strip()
        if not answer:
            continue
        index = _find_line(_search_keys(field.label), lines, cursor)
        if index is None:
            leftover.append((field, answer))
            continue
        end = _prompt_end(lines, index)
        heading = lines[index]
        # Prefer the question's own line; only then the free space under its instruction.
        wrote = _place(doc[heading.page_index], heading, answer, None, font, font_name)
        if not wrote:
            anchor = lines[end]
            following = lines[end + 1] if end + 1 < len(lines) else None
            wrote = _place(doc[anchor.page_index], anchor, answer, following, font, font_name)
        if wrote:
            placed += 1
            cursor = index + 1
        else:
            leftover.append((field, answer))

    if placed == 0:
        doc.close()
        return None

    if leftover:
        page = doc.new_page()
        page.insert_font(fontname=font_name, fontfile=font_file)
        rows = ["Pola, które nie zmieściły się w układzie wzoru", ""]
        for field, answer in leftover:
            rows.append(field.label)
            rows.extend(_wrap(answer, page.rect.width - 96, 12, font))
            rows.append("")
        _write_lines(page, 48, 64, rows[:70], 12, 16, font_name)

    data = doc.tobytes()
    doc.close()
    return data


def build_application_pdf(call: CallOut, application: ApplicationOut) -> bytes:
    """Filled original template, or the generated document when the template cannot be filled."""
    template = _download_template(call.template_url)
    if template:
        try:
            filled = fill_template_pdf(template, call, application)
        except Exception:
            logger.warning("Filling the template failed; using the generated document.", exc_info=True)
            filled = None
        if filled:
            return filled
    return render_application_pdf(call, application)


def _download_template(url: str | None) -> bytes | None:
    if not url:
        return None
    try:
        import httpx

        response = httpx.get(url, timeout=20, follow_redirects=True)
    except Exception as exc:
        logger.warning("Template download failed: %s", type(exc).__name__)
        return None
    if response.status_code != 200 or not response.content.startswith(PDF_MAGIC):
        logger.warning("Template URL did not return a PDF (status %s).", response.status_code)
        return None
    return response.content
