from __future__ import annotations

from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "deliverables"
OUT_DIR.mkdir(exist_ok=True)
OUT_PATH = OUT_DIR / "UpKeep_SSO_Charter_Pack.docx"


def set_cell_text(cell, text: str, bold_prefix: str | None = None) -> None:
    cell.text = ""
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.line_spacing = 1.1
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    run = p.add_run(text)
    run.font.name = "Calibri"
    run._element.rPr.rFonts.set(qn("w:ascii"), "Calibri")
    run._element.rPr.rFonts.set(qn("w:hAnsi"), "Calibri")
    run.font.size = Pt(11)
    if bold_prefix and text.startswith(bold_prefix):
        run.bold = True


def set_table_geometry(table, widths_in):
    table.autofit = False
    tbl = table._tbl
    tblPr = tbl.tblPr
    tblW = tblPr.find(qn("w:tblW"))
    if tblW is None:
        tblW = OxmlElement("w:tblW")
        tblPr.append(tblW)
    tblW.set(qn("w:w"), "9360")
    tblW.set(qn("w:type"), "dxa")

    tblInd = tblPr.find(qn("w:tblInd"))
    if tblInd is None:
        tblInd = OxmlElement("w:tblInd")
        tblPr.append(tblInd)
    tblInd.set(qn("w:w"), "120")
    tblInd.set(qn("w:type"), "dxa")

    tblLayout = tblPr.find(qn("w:tblLayout"))
    if tblLayout is None:
        tblLayout = OxmlElement("w:tblLayout")
        tblPr.append(tblLayout)
    tblLayout.set(qn("w:type"), "fixed")

    tblGrid = tbl.tblGrid
    for child in list(tblGrid):
        tblGrid.remove(child)
    for width in widths_in:
        gridCol = OxmlElement("w:gridCol")
        gridCol.set(qn("w:w"), str(int(width * 1440)))
        tblGrid.append(gridCol)

    for row in table.rows:
        for cell, width in zip(row.cells, widths_in):
            tcPr = cell._tc.get_or_add_tcPr()
            tcW = tcPr.find(qn("w:tcW"))
            if tcW is None:
                tcW = OxmlElement("w:tcW")
                tcPr.append(tcW)
            tcW.set(qn("w:w"), str(int(width * 1440)))
            tcW.set(qn("w:type"), "dxa")


def set_document_defaults(doc: Document) -> None:
    section = doc.sections[0]
    section.page_width = Inches(8.5)
    section.page_height = Inches(11)
    section.top_margin = Inches(1)
    section.bottom_margin = Inches(1)
    section.left_margin = Inches(1)
    section.right_margin = Inches(1)
    section.header_distance = Inches(0.492)
    section.footer_distance = Inches(0.492)

    normal = doc.styles["Normal"]
    normal.font.name = "Calibri"
    normal._element.rPr.rFonts.set(qn("w:ascii"), "Calibri")
    normal._element.rPr.rFonts.set(qn("w:hAnsi"), "Calibri")
    normal.font.size = Pt(11)

    for name, size, color_hex, before, after in [
        ("Heading 1", 16, "2E74B5", 16, 8),
        ("Heading 2", 13, "2E74B5", 12, 6),
        ("Heading 3", 12, "1F4D78", 8, 4),
    ]:
        style = doc.styles[name]
        style.font.name = "Calibri"
        style._element.rPr.rFonts.set(qn("w:ascii"), "Calibri")
        style._element.rPr.rFonts.set(qn("w:hAnsi"), "Calibri")
        style.font.size = Pt(size)
        style.font.bold = False
        style.font.color.rgb = RGBColor.from_string(color_hex)
        style.paragraph_format.space_before = Pt(before)
        style.paragraph_format.space_after = Pt(after)
        style.paragraph_format.line_spacing = 1.1


def add_title(doc: Document, title: str, subtitle: str) -> None:
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.0
    run = p.add_run(title)
    run.font.name = "Calibri"
    run._element.rPr.rFonts.set(qn("w:ascii"), "Calibri")
    run._element.rPr.rFonts.set(qn("w:hAnsi"), "Calibri")
    run.font.size = Pt(20)
    run.font.bold = True
    run.font.color.rgb = RGBColor.from_string("1F4D78")

    p2 = doc.add_paragraph()
    p2.paragraph_format.space_before = Pt(0)
    p2.paragraph_format.space_after = Pt(10)
    p2.paragraph_format.line_spacing = 1.1
    run2 = p2.add_run(subtitle)
    run2.font.name = "Calibri"
    run2._element.rPr.rFonts.set(qn("w:ascii"), "Calibri")
    run2._element.rPr.rFonts.set(qn("w:hAnsi"), "Calibri")
    run2.font.size = Pt(11)
    run2.font.color.rgb = RGBColor.from_string("555555")


def add_bullet(doc: Document, text: str) -> None:
    p = doc.add_paragraph(style="List Bullet")
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.15
    run = p.add_run(text)
    run.font.name = "Calibri"
    run._element.rPr.rFonts.set(qn("w:ascii"), "Calibri")
    run._element.rPr.rFonts.set(qn("w:hAnsi"), "Calibri")
    run.font.size = Pt(11)


def add_numbered(doc: Document, text: str) -> None:
    p = doc.add_paragraph(style="List Number")
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.15
    run = p.add_run(text)
    run.font.name = "Calibri"
    run._element.rPr.rFonts.set(qn("w:ascii"), "Calibri")
    run._element.rPr.rFonts.set(qn("w:hAnsi"), "Calibri")
    run.font.size = Pt(11)


def add_section_heading(doc: Document, text: str, level: int = 1) -> None:
    p = doc.add_paragraph(style=f"Heading {level}")
    p.add_run(text)


def add_label_detail_table(doc: Document, rows: list[tuple[str, str]], widths=(1.875, 4.625)) -> None:
    table = doc.add_table(rows=len(rows), cols=2)
    table.style = "Table Grid"
    set_table_geometry(table, widths)
    for row, (label, value) in zip(table.rows, rows):
        row.cells[0].text = ""
        row.cells[1].text = ""
        for idx, (cell, text) in enumerate(zip(row.cells, (label, value))):
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.1
            run = p.add_run(text)
            run.font.name = "Calibri"
            run._element.rPr.rFonts.set(qn("w:ascii"), "Calibri")
            run._element.rPr.rFonts.set(qn("w:hAnsi"), "Calibri")
            run.font.size = Pt(11)
            if idx == 0:
                run.bold = True
                run.font.color.rgb = RGBColor.from_string("1F4D78")
    return table


def add_two_column_table(doc: Document, rows: list[tuple[str, str, str]], widths=(1.55, 2.25, 2.70)) -> None:
    table = doc.add_table(rows=len(rows) + 1, cols=3)
    table.style = "Table Grid"
    set_table_geometry(table, widths)
    headers = ["Workstream", "Owner", "What happens here"]
    for cell, text in zip(table.rows[0].cells, headers):
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_after = Pt(0)
        run = p.add_run(text)
        run.bold = True
        run.font.name = "Calibri"
        run._element.rPr.rFonts.set(qn("w:ascii"), "Calibri")
        run._element.rPr.rFonts.set(qn("w:hAnsi"), "Calibri")
        run.font.size = Pt(11)
        run.font.color.rgb = RGBColor.from_string("1F4D78")
    for row, values in zip(table.rows[1:], rows):
        for cell, text in zip(row.cells, values):
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.1
            run = p.add_run(text)
            run.font.name = "Calibri"
            run._element.rPr.rFonts.set(qn("w:ascii"), "Calibri")
            run._element.rPr.rFonts.set(qn("w:hAnsi"), "Calibri")
            run.font.size = Pt(11)
    return table


def build_document() -> Document:
    doc = Document()
    set_document_defaults(doc)

    footer = doc.sections[0].footer
    fp = footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    fp.paragraph_format.space_before = Pt(0)
    fp.paragraph_format.space_after = Pt(0)
    footer_run = fp.add_run("UpKeep SSO Upgrade Charter Pack")
    footer_run.font.name = "Calibri"
    footer_run._element.rPr.rFonts.set(qn("w:ascii"), "Calibri")
    footer_run._element.rPr.rFonts.set(qn("w:hAnsi"), "Calibri")
    footer_run.font.size = Pt(9)
    footer_run.font.color.rgb = RGBColor.from_string("666666")

    add_title(
        doc,
        "UpKeep SSO Charter Pack",
        "Initial charter and working documents for the UpKeep SSO rollout, the Entra setup request, and the SolarWinds incident record.",
    )

    add_section_heading(doc, "1. Executive Charter", level=1)
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.1
    p.add_run(
        "Purpose: align the UpKeep SSO rollout around a phased Entra-based migration with clear ownership for the technical setup, user readiness, support readiness, and vendor coordination."
    )

    add_section_heading(doc, "Charter Statement", level=2)
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.add_run(
        "We are upgrading UpKeep authentication from local passwords to Microsoft Entra ID single sign-on. The rollout will be phased so the pilot group can validate the login path, support process, and account matching before broader enablement."
    )

    add_section_heading(doc, "Objectives", level=2)
    add_bullet(doc, "Move UpKeep sign-in to Entra ID SSO.")
    add_bullet(doc, "Reduce password friction and password-reset support.")
    add_bullet(doc, "Improve security by using company-managed credentials.")
    add_bullet(doc, "Maintain a controlled fallback path until the rollout is stable.")

    add_section_heading(doc, "Scope", level=2)
    add_bullet(doc, "In scope: Entra app configuration, SAML claims, certificate, metadata, and pilot validation.")
    add_bullet(doc, "In scope: user readiness, helpdesk preparation, and rollout communications.")
    add_bullet(doc, "Out of scope: redesigning UpKeep workflows or changing unrelated identity systems.")

    add_section_heading(doc, "Charter Snapshot", level=2)
    add_label_detail_table(
        doc,
        [
            ("Project", "UpKeep SSO upgrade"),
            ("Objective", "Move UpKeep authentication to Entra ID SSO with a controlled pilot and cutover."),
            ("Primary tool request", "Entra ID enterprise app configuration for UpKeep SAML sign-in."),
            ("Request path", "SolarWinds Service Desk incident #20298"),
            ("Incident status", "Assigned to Jen Solla, priority Medium, submitted by Brent Soper."),
            ("Schedule stance", "User readiness and IT coordination can proceed in parallel with the Entra setup."),
        ],
    )

    add_section_heading(doc, "2. Stakeholders and Decision Rights", level=1)
    add_two_column_table(
        doc,
        [
            ("Entra setup", "IT / identity team", "Create and validate the enterprise app, claims, certificate, and metadata."),
            ("User readiness", "Brent Soper", "Identify users, coordinate remediation, and prepare the rollout list."),
            ("Helpdesk prep", "Service desk lead", "Get first-login support notes and issue handling ready."),
            ("Vendor coordination", "Brent Soper", "Schedule a working session with UpKeep if input is needed."),
        ],
    )

    add_section_heading(doc, "Decision Rights", level=2)
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.1
    p.add_run(
        "IT owns the technical implementation decisions for Entra. Brent owns rollout coordination, user readiness, and vendor scheduling support."
    )

    add_section_heading(doc, "3. Success Criteria", level=1)
    for item in [
        "A pilot user can sign in to UpKeep through Entra without escalation.",
        "The helpdesk has a clear first-response path for login issues.",
        "UpKeep and Entra claim mapping match on the expected user identity field.",
        "The team has enough confidence to move from pilot into phased rollout.",
    ]:
        add_numbered(doc, item)

    add_section_heading(doc, "4. Entra Setup Request", level=1)
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.1
    p.add_run(
        "This is the only technical build work requested in the ticket. Please make the final implementation decisions on the Entra side."
    )
    for item in [
        "Create or update the UpKeep enterprise app in Entra ID.",
        "Configure the SAML SSO settings required by UpKeep.",
        "Set NameID and claims mapping, likely to the user email address.",
        "Upload or configure the signing certificate.",
        "Verify the reply URL, ACS URL, and entity ID values.",
        "Test sign-in end to end with a pilot account.",
        "Confirm any final setup details needed for cutover.",
    ]:
        add_bullet(doc, item)

    add_section_heading(doc, "5. Assumptions and Risks", level=1)
    for item in [
        "We will use a pilot-first rollout followed by phased waves.",
        "Some users may need remediation before they can be switched to SSO.",
        "Mobile login guidance may need to be handled separately from browser login guidance.",
        "If UpKeep input is needed, a working session can be scheduled rather than forcing an email-only exchange.",
        "Native login remains the fallback until the rollout is stable.",
    ]:
        add_bullet(doc, item)

    add_section_heading(doc, "6. Open Decisions", level=1)
    for item in [
        "Final Entra app ownership and change window.",
        "Whether any pilot users need pre-work before the app is enabled.",
        "Exact support handoff to helpdesk during first login.",
        "Whether UpKeep vendor participation is needed for metadata or test validation.",
    ]:
        add_bullet(doc, item)

    add_section_heading(doc, "7. Immediate Next Actions", level=1)
    for item in [
        "Hand the Entra setup ticket to the identity owner.",
        "Share the rollout draft communications with the broader stakeholder group.",
        "Schedule the UpKeep working session if the identity team wants vendor support.",
        "Confirm the pilot list and helpdesk coverage so the rollout can start cleanly.",
    ]:
        add_bullet(doc, item)

    return doc


def main() -> None:
    doc = build_document()
    doc.save(OUT_PATH)
    print(str(OUT_PATH))


if __name__ == "__main__":
    main()
