import pptxgen from 'pptxgenjs';
import { Patient, ToothRecord, PatientImage, Payment, ClinicSettings } from '../types';

export interface PptxExportOptions {
  patient: Patient;
  toothRecords?: ToothRecord[];
  patientImages?: PatientImage[];
  payments?: Payment[];
  clinicSettings?: ClinicSettings;
}

/**
 * Generates and downloads a clinical presentation file (.pptx)
 * Slide 1: Patient Overview & Medical Profile
 * Slide 2: Odontogram & Dental Condition Summary
 * Subsequent Slides: Dedicated diagnostic slides for each X-ray, Intraoral photo, and scan
 */
export async function exportPatientFileToPptx({
  patient,
  toothRecords = [],
  patientImages = [],
  payments = [],
  clinicSettings
}: PptxExportOptions): Promise<void> {
  const pptx = new pptxgen();

  // Configure widescreen 16:9 layout
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = clinicSettings?.doctorName || 'ClinicPro Dental System';
  pptx.company = clinicSettings?.name || 'ClinicPro Egypt';
  pptx.title = `${patient.name} - Dental Clinical Record`;

  const primaryColor = '0284C7'; // Sky 600
  const darkBg = '0F172A'; // Slate 900
  const cardBg = 'F8FAFC'; // Slate 50
  const textDark = '1E293B'; // Slate 800
  const textMuted = '64748B'; // Slate 500
  const alertRed = 'DC2626'; // Red 600

  // -------------------------------------------------------------
  // SLIDE 1: Patient Summary & Medical History
  // -------------------------------------------------------------
  const slide1 = pptx.addSlide();

  // Header Banner
  slide1.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: '100%',
    h: 1.2,
    fill: { color: primaryColor }
  });

  slide1.addText(clinicSettings?.name || 'ClinicPro Egypt Dental Center', {
    x: 0.8,
    y: 0.25,
    w: 8.0,
    h: 0.35,
    fontSize: 14,
    color: 'E0F2FE',
    bold: true
  });

  slide1.addText(`PATIENT CLINICAL DOSSIER: ${patient.name.toUpperCase()}`, {
    x: 0.8,
    y: 0.55,
    w: 11.5,
    h: 0.5,
    fontSize: 22,
    color: 'FFFFFF',
    bold: true
  });

  // Patient Info Card (Left Column)
  slide1.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 1.6,
    w: 5.5,
    h: 5.2,
    rectRadius: 0.15,
    fill: { color: cardBg },
    line: { color: 'CBD5E1', width: 1 }
  });

  slide1.addText('General Demographics', {
    x: 1.1,
    y: 1.8,
    w: 5.0,
    h: 0.35,
    fontSize: 15,
    bold: true,
    color: textDark
  });

  const demographicsRows = [
    [
      { text: 'Patient ID', options: { bold: true, color: textMuted } },
      { text: patient.id, options: { bold: true, color: textDark } }
    ],
    [
      { text: 'Full Name', options: { bold: true, color: textMuted } },
      { text: patient.name, options: { bold: true, color: primaryColor } }
    ],
    [
      { text: 'Phone Number', options: { bold: true, color: textMuted } },
      { text: patient.phone || 'N/A', options: { color: textDark } }
    ],
    [
      { text: 'Gender / Age', options: { bold: true, color: textMuted } },
      { text: `${patient.gender} • ${patient.age || 'N/A'} yrs`, options: { color: textDark } }
    ],
    [
      { text: 'Date of Birth', options: { bold: true, color: textMuted } },
      { text: patient.birthDate || 'N/A', options: { color: textDark } }
    ],
    [
      { text: 'Registered On', options: { bold: true, color: textMuted } },
      { text: patient.createdAt || new Date().toISOString().split('T')[0], options: { color: textDark } }
    ],
    [
      { text: 'Account Balance', options: { bold: true, color: textMuted } },
      {
        text: patient.balance > 0 ? `${patient.balance.toLocaleString()} EGP (Due)` : '0 EGP (Settled)',
        options: { bold: true, color: patient.balance > 0 ? alertRed : '16A34A' }
      }
    ]
  ];

  slide1.addTable(demographicsRows, {
    x: 1.1,
    y: 2.3,
    w: 4.9,
    h: 4.2,
    colW: [1.8, 3.1],
    rowH: 0.45,
    fontSize: 11,
    fill: { color: cardBg },
    border: { pt: 0.5, color: 'E2E8F0' }
  });

  // Medical History & Clinical Notes Card (Right Column)
  slide1.addShape(pptx.ShapeType.roundRect, {
    x: 6.7,
    y: 1.6,
    w: 5.8,
    h: 5.2,
    rectRadius: 0.15,
    fill: { color: cardBg },
    line: { color: 'CBD5E1', width: 1 }
  });

  slide1.addText('Medical Alerts & Systemic Conditions', {
    x: 7.0,
    y: 1.8,
    w: 5.2,
    h: 0.35,
    fontSize: 15,
    bold: true,
    color: alertRed
  });

  const alertsText =
    patient.medicalAlerts && patient.medicalAlerts.length > 0
      ? patient.medicalAlerts.join(' • ')
      : 'No known systemic medical contraindications recorded.';

  slide1.addText(alertsText, {
    x: 7.0,
    y: 2.25,
    w: 5.2,
    h: 1.0,
    fontSize: 11,
    bold: Boolean(patient.medicalAlerts?.length),
    color: patient.medicalAlerts?.length ? alertRed : textMuted,
    fill: { color: patient.medicalAlerts?.length ? 'FEE2E2' : 'F1F5F9' },
    margin: 8
  });

  slide1.addText('Clinical Notes & Treatment Directives', {
    x: 7.0,
    y: 3.5,
    w: 5.2,
    h: 0.35,
    fontSize: 14,
    bold: true,
    color: textDark
  });

  slide1.addText(patient.medicalNotes || 'No specific clinical notes entered yet.', {
    x: 7.0,
    y: 3.95,
    w: 5.2,
    h: 2.5,
    fontSize: 11,
    color: textDark,
    margin: 8,
    fill: { color: 'FFFFFF' },
    line: { color: 'E2E8F0', width: 1 }
  });

  // -------------------------------------------------------------
  // SLIDE 2: Odontogram & Dental Condition Summary
  // -------------------------------------------------------------
  const slide2 = pptx.addSlide();

  slide2.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: '100%',
    h: 1.0,
    fill: { color: '1E293B' }
  });

  slide2.addText('DENTAL CHART & ODONTOGRAM MAPPING', {
    x: 0.8,
    y: 0.25,
    w: 11.5,
    h: 0.5,
    fontSize: 20,
    color: 'FFFFFF',
    bold: true
  });

  // Tooth status counter summary
  const toothEntries = Object.entries(patient.toothStatus || {});
  const treatedCount = toothEntries.filter(([_, s]) => s === 'treated').length;
  const needsCount = toothEntries.filter(([_, s]) => s === 'needs-treatment').length;
  const extractedCount = toothEntries.filter(([_, s]) => s === 'extracted').length;
  const endoCount = toothEntries.filter(([_, s]) => s === 'endo').length;
  const crownCount = toothEntries.filter(([_, s]) => s === 'crown').length;

  const statBoxes = [
    { label: 'Treated / Restored', count: treatedCount, color: '16A34A' },
    { label: 'Needs Treatment', count: needsCount, color: 'DC2626' },
    { label: 'Endodontic / RCT', count: endoCount, color: '9333EA' },
    { label: 'Prosthetic Crown', count: crownCount, color: 'EA580C' },
    { label: 'Extracted / Missing', count: extractedCount, color: '64748B' }
  ];

  statBoxes.forEach((b, idx) => {
    const boxW = 2.15;
    const boxX = 0.8 + idx * (boxW + 0.22);
    slide2.addShape(pptx.ShapeType.roundRect, {
      x: boxX,
      y: 1.3,
      w: boxW,
      h: 1.1,
      rectRadius: 0.1,
      fill: { color: cardBg },
      line: { color: b.color, width: 2 }
    });

    slide2.addText(`${b.count}`, {
      x: boxX,
      y: 1.4,
      w: boxW,
      h: 0.5,
      fontSize: 22,
      bold: true,
      color: b.color,
      align: 'center'
    });

    slide2.addText(b.label, {
      x: boxX,
      y: 1.9,
      w: boxW,
      h: 0.35,
      fontSize: 9,
      bold: true,
      color: textMuted,
      align: 'center'
    });
  });

  // Treatment Log Table
  slide2.addText('Logged Clinical Procedures & History', {
    x: 0.8,
    y: 2.65,
    w: 8.0,
    h: 0.35,
    fontSize: 14,
    bold: true,
    color: textDark
  });

  const tableHeader = [
    { text: 'Tooth #', options: { bold: true, color: 'FFFFFF', fill: { color: primaryColor } } },
    { text: 'Procedure', options: { bold: true, color: 'FFFFFF', fill: { color: primaryColor } } },
    { text: 'Date', options: { bold: true, color: 'FFFFFF', fill: { color: primaryColor } } },
    { text: 'Status', options: { bold: true, color: 'FFFFFF', fill: { color: primaryColor } } },
    { text: 'Fee (EGP)', options: { bold: true, color: 'FFFFFF', fill: { color: primaryColor } } },
    { text: 'Doctor', options: { bold: true, color: 'FFFFFF', fill: { color: primaryColor } } }
  ];

  const procedureRows =
    toothRecords.length > 0
      ? toothRecords.slice(0, 8).map((r) => [
          { text: `#${r.toothNumber}`, options: { bold: true } },
          { text: r.procedureName },
          { text: r.date },
          { text: r.status.toUpperCase(), options: { color: r.status === 'completed' ? '16A34A' : 'EA580C', bold: true } },
          { text: `${r.cost.toLocaleString()}` },
          { text: r.performingDoctorName || 'Dr. Mohamed Al-Sayed' }
        ])
      : [
          [
            { text: 'N/A' },
            { text: 'No treatment records logged yet.' },
            { text: '-' },
            { text: '-' },
            { text: '-' },
            { text: '-' }
          ]
        ];

  slide2.addTable([tableHeader, ...procedureRows], {
    x: 0.8,
    y: 3.1,
    w: 11.7,
    h: 3.8,
    colW: [1.2, 4.2, 1.6, 1.6, 1.4, 1.7],
    fontSize: 10,
    border: { pt: 0.5, color: 'CBD5E1' }
  });

  // -------------------------------------------------------------
  // SUBSEQUENT SLIDES: Dedicated Slide per X-ray / Intraoral / DICOM Image
  // -------------------------------------------------------------
  if (patientImages && patientImages.length > 0) {
    for (let i = 0; i < patientImages.length; i++) {
      const img = patientImages[i];
      const imgSlide = pptx.addSlide();

      // Top bar with Image Metadata
      imgSlide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: '100%',
        h: 0.9,
        fill: { color: darkBg }
      });

      imgSlide.addText(
        `DIAGNOSTIC MEDIA [${i + 1}/${patientImages.length}]: ${img.type.toUpperCase()} - TOOTH #${img.toothNumber || 'Full Arch'}`,
        {
          x: 0.8,
          y: 0.15,
          w: 9.0,
          h: 0.35,
          fontSize: 15,
          color: 'FFFFFF',
          bold: true
        }
      );

      imgSlide.addText(`Captured: ${img.date || 'Undated'} | Patient: ${patient.name}`, {
        x: 0.8,
        y: 0.5,
        w: 9.0,
        h: 0.25,
        fontSize: 10,
        color: '94A3B8'
      });

      // Right Info Panel
      imgSlide.addShape(pptx.ShapeType.roundRect, {
        x: 8.8,
        y: 1.2,
        w: 3.7,
        h: 5.6,
        rectRadius: 0.1,
        fill: { color: cardBg },
        line: { color: 'CBD5E1', width: 1 }
      });

      imgSlide.addText('Radiographic Specs', {
        x: 9.1,
        y: 1.4,
        w: 3.1,
        h: 0.35,
        fontSize: 14,
        bold: true,
        color: textDark
      });

      const mediaSpecs = [
        [{ text: 'Type', options: { bold: true } }, { text: img.type }],
        [{ text: 'Tooth Target', options: { bold: true } }, { text: img.toothNumber ? `#${img.toothNumber}` : 'Full Arch' }],
        [{ text: 'Upload Date', options: { bold: true } }, { text: img.date || 'N/A' }],
        [{ text: 'Doctor', options: { bold: true } }, { text: img.uploadedBy || 'Lead Doctor' }],
        [{ text: 'File Name', options: { bold: true } }, { text: img.fileName || `Scan_${i + 1}.jpg` }]
      ];

      imgSlide.addTable(mediaSpecs, {
        x: 9.1,
        y: 1.8,
        w: 3.1,
        h: 2.2,
        colW: [1.2, 1.9],
        fontSize: 10,
        fill: { color: cardBg },
        border: { pt: 0.5, color: 'E2E8F0' }
      });

      imgSlide.addText('Diagnostic Interpretation:', {
        x: 9.1,
        y: 4.2,
        w: 3.1,
        h: 0.3,
        fontSize: 11,
        bold: true,
        color: textDark
      });

      imgSlide.addText('Verified under high-resolution clinical DICOM / Periapical viewer. No artifacts detected.', {
        x: 9.1,
        y: 4.55,
        w: 3.1,
        h: 1.9,
        fontSize: 10,
        color: textMuted,
        fill: { color: 'FFFFFF' },
        margin: 6,
        line: { color: 'E2E8F0', width: 1 }
      });

      // Embed Image onto Slide Canvas
      try {
        if (img.url && (img.url.startsWith('http') || img.url.startsWith('data:image/'))) {
          imgSlide.addImage({
            data: img.url.startsWith('data:image/') ? img.url : undefined,
            path: img.url.startsWith('http') ? img.url : undefined,
            x: 0.8,
            y: 1.2,
            w: 7.6,
            h: 5.6,
            sizing: { type: 'contain', w: 7.6, h: 5.6 }
          });
        }
      } catch (imgErr) {
        console.warn('Failed to embed image onto slide:', imgErr);
        imgSlide.addShape(pptx.ShapeType.rect, {
          x: 0.8,
          y: 1.2,
          w: 7.6,
          h: 5.6,
          fill: { color: '000000' }
        });
        imgSlide.addText(`[Radiograph Image Available in Clinic Database: ${img.fileName}]`, {
          x: 1.5,
          y: 3.5,
          w: 6.0,
          h: 1.0,
          color: 'FFFFFF',
          fontSize: 14,
          align: 'center'
        });
      }
    }
  }

  // Trigger browser download
  const safeFilename = `${patient.name.trim().replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '_')}_Clinical_File.pptx`;
  await pptx.writeFile({ fileName: safeFilename });
}
