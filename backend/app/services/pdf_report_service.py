"""
PDF Report Generation Service for DermaSoul AI

This service generates professional PDF reports for skin diagnosis consultations.
Each report includes:
1. Diagnosis Results (disease, skin type, confidence levels)
2. Medical Analysis (symptoms, duration, severity, red flags)
3. Medical Knowledge (condition explanation, care guidance)
4. OTC Recommendations (safe products with explanations)
5. When to See Doctor (professional guidance)
6. Disclaimers and AI Limitations
7. Knowledge Sources

Author: DermaSoul AI Backend Team
"""

from io import BytesIO
from datetime import datetime
from typing import Any, Optional
from xml.sax.saxutils import escape
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, black, white, grey, green, red, orange
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, 
    PageBreak, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from reportlab.lib import colors
from sqlalchemy.orm import Session
from app.models.consultation import Consultation


def _esc(value: Any) -> str:
    """Escape stored text for ReportLab Paragraph markup, so user text such as "<b>" cannot break the PDF."""
    return escape(str(value))


class PDFReportGenerator:
    """
    Generates professional PDF reports for DermaSoul AI consultations.
    
    Architecture:
    - Generates PDF entirely in memory (no disk writes during generation)
    - Uses ReportLab Platypus for high-quality layouts
    - Color-codes risk levels (green/yellow/red) for visual clarity
    - Returns PDF as bytes for streaming to client
    
    Sections Generated:
    1. Header: Title, timestamp, consultation ID
    2. Diagnosis Results: Disease, confidence, skin type
    3. Medical Analysis: Symptoms, duration, severity, red flags
    4. Knowledge Base: Condition explanation, care guidance
    5. OTC Recommendations: Safe products for the condition
    6. When to See Doctor: Professional guidance
    7. Disclaimers: AI limitations, legal notices
    """
    
    # Color palette for professional appearance
    COLORS = {
        'primary': HexColor('#2E7D32'),  # Dark green (trust, health)
        'accent': HexColor('#F57C00'),   # Orange (warning)
        'danger': HexColor('#C62828'),   # Deep red (alert)
        'light_green': HexColor('#E8F5E9'),  # Light green background
        'light_yellow': HexColor('#FFF9C4'),  # Light yellow background
        'light_red': HexColor('#FFEBEE'),  # Light red background
        'light_grey': HexColor('#F5F5F5'),  # Light grey background
        'text_dark': HexColor('#212121'),  # Very dark grey
        'text_light': HexColor('#666666'),  # Medium grey
    }
    
    # Font sizes for hierarchy
    FONT_SIZES = {
        'title': 24,
        'section': 16,
        'subsection': 12,
        'body': 10,
        'small': 8,
    }
    
    def __init__(self, pagesize=letter):
        """
        Initialize PDF generator.
        
        Args:
            pagesize: ReportLab pagesize (letter or A4)
        """
        self.pagesize = pagesize
        self.width, self.height = pagesize
        self.margin = 0.75 * inch
        self.styles = self._create_styles()
        
    def _create_styles(self) -> dict:
        """
        Create custom paragraph styles for the report.
        
        Returns:
            Dictionary of style names to ParagraphStyle objects
        """
        styles = getSampleStyleSheet()
        
        # Override and create custom styles
        custom_styles = {
            'title': ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=self.FONT_SIZES['title'],
                textColor=self.COLORS['primary'],
                spaceAfter=6,
                alignment=TA_CENTER,
                fontName='Helvetica-Bold'
            ),
            'section': ParagraphStyle(
                'CustomSection',
                parent=styles['Heading2'],
                fontSize=self.FONT_SIZES['section'],
                textColor=self.COLORS['primary'],
                spaceAfter=8,
                spaceBefore=12,
                fontName='Helvetica-Bold'
            ),
            'subsection': ParagraphStyle(
                'CustomSubsection',
                parent=styles['Heading3'],
                fontSize=self.FONT_SIZES['subsection'],
                textColor=self.COLORS['text_dark'],
                spaceAfter=6,
                spaceBefore=6,
                fontName='Helvetica-Bold'
            ),
            'body': ParagraphStyle(
                'CustomBody',
                parent=styles['BodyText'],
                fontSize=self.FONT_SIZES['body'],
                textColor=self.COLORS['text_dark'],
                spaceAfter=4,
                alignment=TA_JUSTIFY,
                fontName='Helvetica'
            ),
            'warning': ParagraphStyle(
                'Warning',
                parent=styles['BodyText'],
                fontSize=self.FONT_SIZES['body'],
                textColor=self.COLORS['danger'],
                spaceAfter=4,
                fontName='Helvetica-Bold'
            ),
            'small': ParagraphStyle(
                'Small',
                parent=styles['BodyText'],
                fontSize=self.FONT_SIZES['small'],
                textColor=self.COLORS['text_light'],
                spaceAfter=2,
                fontName='Helvetica'
            ),
        }
        
        return custom_styles
    
    def _get_risk_color(self, risk_level: Optional[str]) -> HexColor:
        """
        Map risk level to color for visual emphasis.
        
        Args:
            risk_level: Risk level string (low/medium/high/unknown)
            
        Returns:
            HexColor for the risk level
        """
        risk_map = {
            'low': self.COLORS['primary'],      # Green
            'medium': self.COLORS['accent'],    # Orange
            'high': self.COLORS['danger'],      # Red
            'unknown': self.COLORS['text_light']  # Grey
        }
        return risk_map.get((risk_level or 'unknown').lower(), self.COLORS['text_light'])
    
    def _get_risk_background(self, risk_level: Optional[str]) -> HexColor:
        """Get light background color for risk level."""
        risk_map = {
            'low': self.COLORS['light_green'],
            'medium': self.COLORS['light_yellow'],
            'high': self.COLORS['light_red'],
            'unknown': self.COLORS['light_grey']
        }
        return risk_map.get((risk_level or 'unknown').lower(), self.COLORS['light_grey'])
    
    def _create_header(self, consultation: Consultation) -> list:
        """
        Create report header section.
        
        Elements:
        - DermaSoul AI title
        - "Diagnosis Report" subtitle
        - Report date and consultation ID
        
        Args:
            consultation: Consultation database object
            
        Returns:
            List of Platypus elements for header
        """
        elements = []
        
        # Title
        elements.append(
            Paragraph("DermaSoul AI", self.styles['title'])
        )
        
        # Subtitle
        subtitle_style = ParagraphStyle(
            'Subtitle',
            parent=self.styles['body'],
            fontSize=12,
            textColor=self.COLORS['text_light'],
            spaceAfter=4,
            alignment=TA_CENTER
        )
        elements.append(
            Paragraph("Personalized Skin Diagnosis Report", subtitle_style)
        )
        
        # Report info table (date, consultation ID)
        report_date = consultation.created_at.strftime("%B %d, %Y at %I:%M %p") if consultation.created_at else "Unknown"
        consultation_id = str(consultation.id)[:8].upper() if consultation.id else "N/A"
        
        info_data = [
            ['Report Date:', report_date],
            ['Consultation ID:', consultation_id]
        ]
        
        info_table = Table(
            info_data,
            colWidths=[2*inch, 4*inch],
            style=TableStyle([
                ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
                ('ALIGN', (1, 0), (1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('TEXTCOLOR', (0, 0), (-1, -1), self.COLORS['text_light']),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ])
        )
        elements.append(info_table)
        elements.append(Spacer(1, 0.3*inch))
        
        return elements
    
    def _create_diagnosis_results(self, consultation: Consultation) -> list:
        """
        Create diagnosis results section with disease and skin type predictions.
        
        Shows:
        - Predicted disease/condition with confidence level (color-coded)
        - Skin type prediction with confidence
        - Risk level assessment
        
        Args:
            consultation: Consultation database object
            
        Returns:
            List of Platypus elements
        """
        elements = []
        
        # Section title
        elements.append(
            Paragraph("Diagnosis Results", self.styles['section'])
        )
        
        # Main diagnosis table
        disease_name = consultation.predicted_disease or "Unable to determine"
        disease_confidence = consultation.disease_confidence or 0
        disease_conf_level = consultation.disease_confidence_level or "unknown"
        risk_level = consultation.risk_level or "unknown"
        skin_type = consultation.predicted_skin_type or "Unknown"
        skin_confidence = consultation.skin_type_confidence or 0
        
        # Format confidence as percentage
        disease_conf_pct = f"{disease_confidence * 100:.1f}%" if disease_confidence else "N/A"
        skin_conf_pct = f"{skin_confidence * 100:.1f}%" if skin_confidence else "N/A"
        
        # Color code the disease confidence
        conf_color = self._get_risk_color(disease_conf_level)
        conf_bg = self._get_risk_background(disease_conf_level)
        
        diagnosis_data = [
            ['Predicted Condition', disease_name],
            ['Confidence Level', disease_conf_pct + f' ({disease_conf_level})'],
            ['Confidence Assessment', 'AI model certainty in the diagnosis'],
            ['Skin Type', f'{skin_type} (Confidence: {skin_conf_pct})'],
            ['Risk Level', risk_level.upper()],
        ]
        
        diagnosis_table = Table(
            diagnosis_data,
            colWidths=[2.5*inch, 3.5*inch],
            style=TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), self.COLORS['light_grey']),
                ('BACKGROUND', (1, 0), (1, 1), conf_bg),  # Highlight confidence row
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (1, 0), (1, 1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('TEXTCOLOR', (1, 0), (1, 1), conf_color),  # Color text by confidence
                ('TEXTCOLOR', (1, 4), (1, 4), self._get_risk_color(risk_level)),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                ('LEFTPADDING', (0, 0), (-1, -1), 5),
                ('RIGHTPADDING', (0, 0), (-1, -1), 5),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ])
        )
        
        elements.append(diagnosis_table)
        elements.append(Spacer(1, 0.2*inch))
        
        # Add confidence disclaimer
        if disease_conf_level and disease_conf_level.lower() == 'low':
            elements.append(
                Paragraph(
                    '<b>⚠️ Note:</b> This diagnosis has <b>low confidence</b>. '
                    'Please consult a healthcare professional for verification.',
                    self.styles['warning']
                )
            )
        
        elements.append(Spacer(1, 0.2*inch))
        
        return elements
    
    def _create_medical_analysis(self, consultation: Consultation) -> list:
        """
        Create medical analysis section with symptom details.
        
        Shows:
        - Extracted symptoms (list)
        - Duration of symptoms
        - Severity assessment
        - Red flags detected (if any)
        
        Args:
            consultation: Consultation database object
            
        Returns:
            List of Platypus elements
        """
        elements = []
        
        # Section title
        elements.append(
            Paragraph("Medical Analysis", self.styles['section'])
        )
        
        # Symptoms subsection
        elements.append(
            Paragraph("Reported Symptoms", self.styles['subsection'])
        )
        
        symptoms = consultation.extracted_symptoms or []
        if symptoms:
            symptoms_text = ', '.join(_esc(symptom) for symptom in symptoms)
        else:
            symptoms_text = "No specific symptoms reported"
        
        elements.append(
            Paragraph(f"<b>Symptoms:</b> {symptoms_text}", self.styles['body'])
        )
        elements.append(Spacer(1, 0.1*inch))
        
        # Duration and severity
        duration = _esc(consultation.extracted_duration or "Not specified")
        severity = _esc(consultation.inferred_severity or "Unknown")
        
        elements.append(
            Paragraph(f"<b>Duration:</b> {duration}", self.styles['body'])
        )
        elements.append(
            Paragraph(f"<b>Severity:</b> {severity}", self.styles['body'])
        )
        elements.append(Spacer(1, 0.15*inch))
        
        # Red flags subsection
        red_flags = consultation.red_flags or []
        
        elements.append(
            Paragraph("Clinical Red Flags", self.styles['subsection'])
        )
        
        if red_flags:
            red_flags_text = ', '.join(_esc(flag) for flag in red_flags)
            red_flag_style = ParagraphStyle(
                'RedFlag',
                parent=self.styles['body'],
                textColor=self.COLORS['danger'],
                fontName='Helvetica-Bold'
            )
            elements.append(
                Paragraph(f"⚠️ {red_flags_text}", red_flag_style)
            )
        else:
            elements.append(
                Paragraph("No significant red flags detected.", self.styles['body'])
            )
        
        # Doctor warning if present
        if consultation.doctor_warning:
            elements.append(Spacer(1, 0.1*inch))
            elements.append(
                Paragraph(
                    f"<b>Professional Guidance:</b> {_esc(consultation.doctor_warning)}",
                    self.styles['warning']
                )
            )
        
        elements.append(Spacer(1, 0.2*inch))
        
        return elements
    
    def _create_knowledge_section(self, consultation: Consultation) -> list:
        """
        Create medical knowledge section with condition information.
        
        Shows:
        - Condition explanation
        - Common signs/symptoms context
        - Care guidance
        
        Args:
            consultation: Consultation database object
            
        Returns:
            List of Platypus elements
        """
        elements = []
        
        # Section title
        elements.append(
            Paragraph("Medical Knowledge Base", self.styles['section'])
        )
        
        # Condition explanation
        if consultation.condition_explanation:
            elements.append(
                Paragraph("Condition Overview", self.styles['subsection'])
            )
            elements.append(
                Paragraph(_esc(consultation.condition_explanation), self.styles['body'])
            )
            elements.append(Spacer(1, 0.15*inch))
        
        # Symptom context
        if consultation.symptom_context:
            elements.append(
                Paragraph("Symptom Context", self.styles['subsection'])
            )
            elements.append(
                Paragraph(_esc(consultation.symptom_context), self.styles['body'])
            )
            elements.append(Spacer(1, 0.15*inch))
        
        # Care guidance
        if consultation.general_care_guidance:
            elements.append(
                Paragraph("General Care Guidance", self.styles['subsection'])
            )
            
            care_guidance = consultation.general_care_guidance
            for i, guidance in enumerate(care_guidance, 1):
                elements.append(
                    Paragraph(f"• {_esc(guidance)}", self.styles['body'])
                )
            elements.append(Spacer(1, 0.15*inch))
        
        # What to avoid
        if consultation.what_to_avoid:
            elements.append(
                Paragraph("What to Avoid", self.styles['subsection'])
            )
            
            for avoid_item in consultation.what_to_avoid:
                elements.append(
                    Paragraph(f"✗ {_esc(avoid_item)}", self.styles['body'])
                )
            elements.append(Spacer(1, 0.15*inch))
        
        # Safety precautions
        if consultation.safety_precautions:
            elements.append(
                Paragraph("Safety Precautions", self.styles['subsection'])
            )
            
            for precaution in consultation.safety_precautions:
                elements.append(
                    Paragraph(f"⚠️ {_esc(precaution)}", self.styles['warning'])
                )
        
        elements.append(Spacer(1, 0.2*inch))
        
        return elements
    
    def _create_recommendations_section(self, consultation: Consultation) -> list:
        """
        Create OTC product recommendations section.
        
        Shows:
        - Recommended products in table format
        - Product categories, uses, availability
        - Safety notes about allergies
        
        Args:
            consultation: Consultation database object
            
        Returns:
            List of Platypus elements
        """
        elements = []
        
        # Section title
        elements.append(
            Paragraph("Recommended OTC Products", self.styles['section'])
        )
        
        recommendations = consultation.recommendations or []
        
        if not recommendations:
            elements.append(
                Paragraph(
                    "No OTC products are recommended at this time. "
                    "Please consult a healthcare professional.",
                    self.styles['body']
                )
            )
        else:
            # Allergy filter note
            if consultation.allergy_filter_applied:
                allergy_text = "None recorded"
                if consultation.user and consultation.user.profile:
                    raw_allergies = consultation.user.profile.known_allergies
                    if isinstance(raw_allergies, str):
                        parsed_allergies = [item.strip() for item in raw_allergies.split(",") if item.strip()]
                    elif isinstance(raw_allergies, (list, tuple, set)):
                        parsed_allergies = [str(item).strip() for item in raw_allergies if str(item).strip()]
                    else:
                        parsed_allergies = []
                    allergy_text = ", ".join(_esc(a) for a in parsed_allergies) if parsed_allergies else "None recorded"

                elements.append(
                    Paragraph(
                        f"<i>Products filtered based on your known allergies: "
                        f"{allergy_text}</i>",
                        self.styles['small']
                    )
                )
                elements.append(Spacer(1, 0.1*inch))
            
            # Product table
            table_data = [
                ['Product Name', 'Category', 'Why Recommended', 'Suitable For']
            ]
            
            for rec in recommendations[:5]:  # Limit to 5 products per page
                product_name = rec.get('name', 'Unknown') if isinstance(rec, dict) else getattr(rec, 'name', 'Unknown')
                category = rec.get('category', 'General') if isinstance(rec, dict) else getattr(rec, 'category', 'General')
                reason = rec.get('reason_for_recommendation', 'Suitable treatment option') if isinstance(rec, dict) else getattr(rec, 'reason_for_recommendation', 'Suitable treatment option')
                suitable_types = rec.get('suitable_skin_types', []) if isinstance(rec, dict) else getattr(rec, 'suitable_skin_types', [])
                
                suitable_text = ', '.join(suitable_types) if suitable_types else 'All types'
                
                table_data.append([
                    product_name[:20],
                    category[:15],
                    reason[:30],
                    suitable_text
                ])
            
            rec_table = Table(
                table_data,
                colWidths=[1.5*inch, 1.2*inch, 2.3*inch, 1.5*inch],
                style=TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), self.COLORS['primary']),
                    ('TEXTCOLOR', (0, 0), (-1, 0), white),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 9),
                    ('FONTSIZE', (0, 1), (-1, -1), 8),
                    ('TOPPADDING', (0, 0), (-1, -1), 3),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                    ('LEFTPADDING', (0, 0), (-1, -1), 3),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 3),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, self.COLORS['light_grey']])
                ])
            )
            elements.append(rec_table)
            elements.append(Spacer(1, 0.1*inch))
            
            # Safety note
            if consultation.recommendation_safety_note:
                elements.append(
                    Paragraph(
                        f"<b>Safety Note:</b> {_esc(consultation.recommendation_safety_note)}",
                        self.styles['small']
                    )
                )
        
        elements.append(Spacer(1, 0.2*inch))
        
        return elements
    
    def _create_when_to_see_doctor(self, consultation: Consultation) -> list:
        """
        Create professional guidance section.
        
        Shows:
        - When to seek professional care
        - Warning signs to monitor
        - Professional notes
        
        Args:
            consultation: Consultation database object
            
        Returns:
            List of Platypus elements
        """
        elements = []
        
        # Section title
        elements.append(
            Paragraph("When to See a Healthcare Professional", self.styles['section'])
        )
        
        when_to_see = consultation.when_to_seek_doctor or (
            "Please consult a dermatologist or healthcare professional if symptoms persist, "
            "worsen, or if you have any concerns about your skin health."
        )
        
        elements.append(
            Paragraph(_esc(when_to_see), self.styles['body'])
        )
        elements.append(Spacer(1, 0.15*inch))
        
        # Professional note
        if consultation.professional_note:
            elements.append(
                Paragraph("Professional Notes", self.styles['subsection'])
            )
            elements.append(
                Paragraph(_esc(consultation.professional_note), self.styles['body'])
            )
            elements.append(Spacer(1, 0.15*inch))
        
        # Red flags section if present
        if consultation.red_flags:
            elements.append(
                Paragraph("Warning Signs Requiring Immediate Attention", self.styles['subsection'])
            )
            warning_signs = [
                "Severe pain or itching",
                "Spreading or rapid growth",
                "Bleeding or oozing",
                "Signs of infection (warmth, pus, increased redness)",
                "Significant change in size, shape, or color",
                "Symptoms affecting daily life"
            ]
            for sign in warning_signs:
                elements.append(
                    Paragraph(f"• {sign}", self.styles['body'])
                )
        
        elements.append(Spacer(1, 0.2*inch))
        
        return elements
    
    def _create_disclaimers(self) -> list:
        """
        Create disclaimers and limitations section.
        
        Includes:
        - AI limitations
        - Not medical advice notice
        - Legal disclaimers
        - Consultation recommendation
        
        Returns:
            List of Platypus elements
        """
        elements = []
        
        # Section title
        elements.append(
            Paragraph("Important Disclaimers & Limitations", self.styles['section'])
        )
        
        disclaimer_style = ParagraphStyle(
            'Disclaimer',
            parent=self.styles['small'],
            textColor=self.COLORS['text_light'],
            alignment=TA_JUSTIFY,
            spaceAfter=6
        )
        
        disclaimers = [
            "<b>Not Medical Diagnosis:</b> This report is AI-generated analysis and is NOT a medical diagnosis. "
            "It should not be used as a substitute for professional medical advice, diagnosis, or treatment.",
            
            "<b>AI Limitations:</b> The AI model's accuracy depends on image quality, lighting, and other factors. "
            "Certain skin conditions may appear similar and require professional evaluation.",
            
            "<b>Confidentiality:</b> Please keep this report confidential and protect your personal information. "
            "Do not share with unauthorized parties.",
            
            "<b>Medical Consultation:</b> Always consult with a qualified dermatologist or healthcare professional "
            "for proper diagnosis and treatment, especially for persistent or concerning symptoms.",
            
            "<b>No Emergency Care:</b> If you experience severe symptoms, allergic reactions, or signs of infection, "
            "seek immediate medical attention at an emergency room.",
        ]
        
        for disclaimer in disclaimers:
            elements.append(
                Paragraph(disclaimer, disclaimer_style)
            )
        
        elements.append(Spacer(1, 0.15*inch))
        
        return elements
    
    def generate_report(self, consultation: Consultation) -> bytes:
        """
        Generate complete PDF report as bytes.
        
        Main orchestration method that:
        1. Creates in-memory PDF buffer
        2. Generates all sections in sequence
        3. Converts to bytes
        4. Returns for streaming to client
        
        Workflow:
        - Header (title, date, ID)
        - Diagnosis Results (table with disease/confidence/risk)
        - Medical Analysis (symptoms, duration, red flags)
        - Knowledge Base (condition info, care guidance)
        - Recommendations (OTC products table)
        - When to See Doctor (professional guidance)
        - Disclaimers (AI limitations, legal notices)
        
        Args:
            consultation: Consultation database object with 40+ fields
            
        Returns:
            PDF document as bytes (suitable for file download)
            
        Raises:
            ValueError: If consultation data is invalid
            Exception: If PDF generation fails
        """
        if not consultation:
            raise ValueError("Consultation object cannot be None")
        
        # Create in-memory PDF buffer
        buffer = BytesIO()
        
        # Create PDF document
        doc = SimpleDocTemplate(
            buffer,
            pagesize=self.pagesize,
            rightMargin=self.margin,
            leftMargin=self.margin,
            topMargin=self.margin,
            bottomMargin=self.margin,
            title="DermaSoul AI Diagnosis Report",
            author="DermaSoul AI",
            subject="Skin Diagnosis Report",
            creator="DermaSoul AI System"
        )
        
        # Build elements list
        elements = []
        
        # 1. Header
        elements.extend(self._create_header(consultation))
        
        # 2. Diagnosis Results
        elements.extend(self._create_diagnosis_results(consultation))
        
        # 3. Medical Analysis
        elements.extend(self._create_medical_analysis(consultation))
        
        # Page break for better formatting
        elements.append(PageBreak())
        
        # 4. Knowledge Base
        elements.extend(self._create_knowledge_section(consultation))
        
        # 5. Recommendations
        elements.extend(self._create_recommendations_section(consultation))
        
        # 6. When to See Doctor
        elements.extend(self._create_when_to_see_doctor(consultation))
        
        # 7. Disclaimers
        elements.extend(self._create_disclaimers())
        
        # Build PDF
        doc.build(elements)
        
        # Get bytes and return
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        return pdf_bytes


def generate_pdf_filename(consultation_id: str) -> str:
    """
    Generate standardized PDF filename.
    
    Format: dermasoul_report_{consultation_id}_{timestamp}.pdf
    
    Args:
        consultation_id: UUID of consultation
        
    Returns:
        Filename string
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    short_id = str(consultation_id)[:8].lower()
    return f"dermasoul_report_{short_id}_{timestamp}.pdf"
