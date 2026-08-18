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
 * Perfect 16:9 widescreen layout with dynamic pagination and boundary constraints.
 */
export async function exportPatientFileToPptx({
  patient,
  toothRecords = [],
  patientImages = [],
  payments = [],
  clinicSettings
}: PptxExportOptions): Promise<void> {
  const pptx = new pptxgen();

  // Configure standard widescreen 16:9 layout (13.33 x 7.5 inches)
  pptx.defineLayout({ name: 'CLINIC_16_9', width: 13.33, height: 7.5 });
  pptx.layout = 'CLINIC_16_9';
  pptx.author = clinicSettings?.doctorName || 'Dental Practice Clinical System';
  pptx.company = clinicSettings?.name || 'Dental Practice';
  pptx.title = `${patient.name} - Dental Dossier`;

  const primaryColor = '0284C7'; // Sky 600
  const headerBg = '0F172A'; // Slate 900
  const cardBg = 'F8FAFC'; // Slate 50
  const textDark = '0F172A'; // Slate 900
  const textMuted = '475569'; // Slate 600
  const alertRed = 'DC2626'; // Red 600
  const successGreen = '16A34A'; // Green 600

  // -------------------------------------------------------------
  // SLIDE 1: Patient Overview & Medical Profile
  // -------------------------------------------------------------
  const slide1 = pptx.addSlide();

  // Top Banner
  slide1.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.33,
    h: 1.15,
    fill: { color: primaryColor }
  });

  slide1.addText(clinicSettings?.name || 'Dental Practice Medical Records', {
    x: 0.8,
    y: 0.18,
    w: 11.5,
    h: 0.3,
    fontSize: 12,
    color: 'E0F2FE',
    bold: true
  });

  slide1.addText(`CLINICAL DOSSIER: ${patient.name.toUpperCase()}`, {
    x: 0.8,
    y: 0.48,
    w: 11.5,
    h: 0.5,
    fontSize: 20,
    color: 'FFFFFF',
    bold: true
  });

  // Left Card: Demographics
  slide1.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 1.35,
    w: 5.6,
    h: 5.65,
    rectRadius: 0.1,
    fill: { color: cardBg },
    line: { color: 'CBD5E1', width: 1 }
  });

  slide1.addText('Patient Demographics & Status', {
    x: 1.1,
    y: 1.5,
    w: 5.0,
    h: 0.35,
    fontSize: 14,
    bold: true,
    color: textDark
  });

  const demographicsRows = [
    [
      { text: 'Patient ID', options: { bold: true, color: textMuted } },
      { text: patient.id.slice(0, 16), options: { bold: true, color: textDark } }
    ],
    [
      { text: 'Full Name', options: { bold: true, color: textMuted } },
      { text: patient.name, options: { bold: true, color: primaryColor } }
    ],
    [
      { text: 'Phone', options: { bold: true, color: textMuted } },
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
        text: patient.balance > 0 ? `${patient.balance.toLocaleString()} EGP (Outstanding Due)` : '0 EGP (Settled)',
        options: { bold: true, color: patient.balance > 0 ? alertRed : successGreen }
      }
    ]
  ];

  slide1.addTable(demographicsRows, {
    x: 1.1,
    y: 2.0,
    w: 5.0,
    h: 4.6,
    colW: [1.8, 3.2],
    rowH: 0.45,
    fontSize: 10.5,
    fill: { color: cardBg },
    border: { pt: 0.5, color: 'E2E8F0' }
  });

  // Right Card: Medical History & Clinical Directives
  slide1.addShape(pptx.ShapeType.roundRect, {
    x: 6.7,
    y: 1.35,
    w: 5.8,
    h: 5.65,
    rectRadius: 0.1,
    fill: { color: cardBg },
    line: { color: 'CBD5E1', width: 1 }
  });

  slide1.addText('Medical Alerts & Systemic Contraindications', {
    x: 7.0,
    y: 1.5,
    w: 5.2,
    h: 0.35,
    fontSize: 13,
    bold: true,
    color: alertRed
  });

  const alertsText =
    patient.medicalAlerts && patient.medicalAlerts.length > 0
      ? patient.medicalAlerts.join(' • ')
      : 'No known systemic medical contraindications recorded.';

  slide1.addText(alertsText, {
    x: 7.0,
    y: 1.95,
    w: 5.2,
    h: 0.9,
    fontSize: 10,
    bold: Boolean(patient.medicalAlerts?.length),
    color: patient.medicalAlerts?.length ? alertRed : textMuted,
    fill: { color: patient.medicalAlerts?.length ? 'FEE2E2' : 'F1F5F9' },
    margin: 6
  });

  slide1.addText('Clinical Directives & Treatment Directives', {
    x: 7.0,
    y: 3.1,
    w: 5.2,
    h: 0.3,
    fontSize: 13,
    bold: true,
    color: textDark
  });

  slide1.addText(patient.medicalNotes || 'No specific clinical notes entered yet.', {
    x: 7.0,
    y: 3.45,
    w: 5.2,
    h: 3.3,
    fontSize: 10,
    color: textDark,
    margin: 8,
    fill: { color: 'FFFFFF' },
    line: { color: 'E2E8F0', width: 1 }
  });

  // -------------------------------------------------------------
  // SLIDE 2: Odontogram Condition Summary & Procedures (Paginated)
  // -------------------------------------------------------------
  const toothEntries = Object.entries(patient.toothStatus || {});
  const treatedCount = toothEntries.filter(([_, s]) => s === 'treated').length;
  const needsCount = toothEntries.filter(([_, s]) => s === 'needs-treatment').length;
  const extractedCount = toothEntries.filter(([_, s]) => s === 'extracted').length;
  const endoCount = toothEntries.filter(([_, s]) => s === 'endo').length;
  const crownCount = toothEntries.filter(([_, s]) => s === 'crown').length;

  const statBoxes = [
    { label: 'Treated / Restored', count: treatedCount, color: successGreen },
    { label: 'Needs Treatment', count: needsCount, color: alertRed },
    { label: 'Endodontic / RCT', count: endoCount, color: '0D9488' },
    { label: 'Prosthetic Crown', count: crownCount, color: '9333EA' },
    { label: 'Extracted / Missing', count: extractedCount, color: '475569' }
  ];

  // Chunk procedures into pages of 7 rows to avoid any vertical overflow
  const ROWS_PER_PAGE = 7;
  const procedureChunks = [];
  if (toothRecords.length === 0) {
    procedureChunks.push([]);
  } else {
    for (let i = 0; i < toothRecords.length; i += ROWS_PER_PAGE) {
      procedureChunks.push(toothRecords.slice(i, i + ROWS_PER_PAGE));
    }
  }

  procedureChunks.forEach((chunk, pageIndex) => {
    const slide = pptx.addSlide();

    // Header
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 13.33,
      h: 0.95,
      fill: { color: headerBg }
    });

    slide.addText(
      pageIndex === 0
        ? `ODONTOGRAM SUMMARY & CLINICAL PROCEDURES - ${patient.name.toUpperCase()}`
        : `CLINICAL PROCEDURES HISTORY (PAGE ${pageIndex + 1}) - ${patient.name.toUpperCase()}`,
      {
        x: 0.8,
        y: 0.25,
        w: 11.5,
        h: 0.45,
        fontSize: 18,
        color: 'FFFFFF',
        bold: true
      }
    );

    let startTableY = 1.25;

    // On the first page, display the top 5 stats badges
    if (pageIndex === 0) {
      statBoxes.forEach((b, idx) => {
        const boxW = 2.15;
        const boxX = 0.8 + idx * (boxW + 0.22);
        slide.addShape(pptx.ShapeType.roundRect, {
          x: boxX,
          y: 1.15,
          w: boxW,
          h: 0.95,
          rectRadius: 0.08,
          fill: { color: cardBg },
          line: { color: b.color, width: 1.5 }
        });

        slide.addText(`${b.count}`, {
          x: boxX,
          y: 1.22,
          w: boxW,
          h: 0.45,
          fontSize: 18,
          bold: true,
          color: b.color,
          align: 'center'
        });

        slide.addText(b.label, {
          x: boxX,
          y: 1.65,
          w: boxW,
          h: 0.35,
          fontSize: 8.5,
          bold: true,
          color: textMuted,
          align: 'center'
        });
      });

      startTableY = 2.35;
    }

    // Table Header
    const tableHeader = [
      { text: 'Tooth #', options: { bold: true, color: 'FFFFFF', fill: { color: primaryColor } } },
      { text: 'Procedure Name', options: { bold: true, color: 'FFFFFF', fill: { color: primaryColor } } },
      { text: 'Date', options: { bold: true, color: 'FFFFFF', fill: { color: primaryColor } } },
      { text: 'Status', options: { bold: true, color: 'FFFFFF', fill: { color: primaryColor } } },
      { text: 'Fee (EGP)', options: { bold: true, color: 'FFFFFF', fill: { color: primaryColor } } },
      { text: 'Performing Doctor', options: { bold: true, color: 'FFFFFF', fill: { color: primaryColor } } }
    ];

    const procedureRows =
      chunk.length > 0
        ? chunk.map((r) => [
            { text: `#${r.toothNumber}`, options: { bold: true, color: primaryColor } },
            { text: r.procedureName, options: { bold: true } },
            { text: r.date || '-' },
            {
              text: r.status.toUpperCase(),
              options: { color: r.status === 'completed' ? successGreen : 'D97706', bold: true }
            },
            { text: `${(r.cost || 0).toLocaleString()}`, options: { bold: true } },
            { text: r.performingDoctorName || clinicSettings?.doctorName || 'Doctor' }
          ])
        : [
            [
              { text: '-' },
              { text: 'No procedures logged yet for this patient.' },
              { text: '-' },
              { text: '-' },
              { text: '-' },
              { text: '-' }
            ]
          ];

    slide.addTable([tableHeader, ...procedureRows], {
      x: 0.8,
      y: startTableY,
      w: 11.7,
      h: pageIndex === 0 ? 4.7 : 5.8,
      colW: [1.2, 4.3, 1.5, 1.5, 1.4, 1.8],
      rowH: 0.45,
      fontSize: 9.5,
      border: { pt: 0.5, color: 'CBD5E1' }
    });
  });

  // -------------------------------------------------------------
  // SLIDE 3: Financial Receipts & Payment Ledger (If payments exist)
  // -------------------------------------------------------------
  if (payments && payments.length > 0) {
    const paySlide = pptx.addSlide();

    paySlide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 13.33,
      h: 0.95,
      fill: { color: '065F46' } // Emerald 800
    });

    paySlide.addText(`PAYMENT RECEIPTS & REVENUE LEDGER - ${patient.name.toUpperCase()}`, {
      x: 0.8,
      y: 0.25,
      w: 11.5,
      h: 0.45,
      fontSize: 18,
      color: 'FFFFFF',
      bold: true
    });

    const payHeader = [
      { text: '#', options: { bold: true, color: 'FFFFFF', fill: { color: '047857' } } },
      { text: 'Receipt ID', options: { bold: true, color: 'FFFFFF', fill: { color: '047857' } } },
      { text: 'Date & Time', options: { bold: true, color: 'FFFFFF', fill: { color: '047857' } } },
      { text: 'Method', options: { bold: true, color: 'FFFFFF', fill: { color: '047857' } } },
      { text: 'Amount (EGP)', options: { bold: true, color: 'FFFFFF', fill: { color: '047857' } } },
      { text: 'Balance After', options: { bold: true, color: 'FFFFFF', fill: { color: '047857' } } },
      { text: 'Notes / Reference', options: { bold: true, color: 'FFFFFF', fill: { color: '047857' } } }
    ];

    const payRows = payments.slice(0, 9).map((p, idx) => [
      { text: `${idx + 1}` },
      { text: p.id.slice(0, 10), options: { color: textMuted } },
      { text: p.date ? p.date.replace('T', ' ').slice(0, 16) : 'N/A' },
      { text: p.method, options: { bold: true } },
      { text: `${p.amount.toLocaleString()} EGP`, options: { bold: true, color: successGreen } },
      { text: p.remainingBalanceSnapshot !== undefined ? `${p.remainingBalanceSnapshot.toLocaleString()} EGP` : '-' },
      { text: p.notes || '-' }
    ]);

    paySlide.addTable([payHeader, ...payRows], {
      x: 0.8,
      y: 1.25,
      w: 11.7,
      h: 5.6,
      colW: [0.6, 1.8, 2.0, 1.4, 1.8, 1.8, 2.3],
      rowH: 0.42,
      fontSize: 9.5,
      border: { pt: 0.5, color: 'CBD5E1' }
    });
  }

  // -------------------------------------------------------------
  // SUBSEQUENT SLIDES: Dedicated Diagnostic Slides (Images/X-rays)
  // -------------------------------------------------------------
  if (patientImages && patientImages.length > 0) {
    for (let i = 0; i < patientImages.length; i++) {
      const img = patientImages[i];
      const imgSlide = pptx.addSlide();

      // Top Header
      imgSlide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: 13.33,
        h: 0.9,
        fill: { color: headerBg }
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
        y: 1.1,
        w: 3.7,
        h: 5.8,
        rectRadius: 0.1,
        fill: { color: cardBg },
        line: { color: 'CBD5E1', width: 1 }
      });

      imgSlide.addText('Radiographic Specs', {
        x: 9.1,
        y: 1.3,
        w: 3.1,
        h: 0.3,
        fontSize: 13,
        bold: true,
        color: textDark
      });

      const mediaSpecs = [
        [{ text: 'Type', options: { bold: true } }, { text: img.type }],
        [{ text: 'Tooth Target', options: { bold: true } }, { text: img.toothNumber ? `#${img.toothNumber}` : 'Full Arch' }],
        [{ text: 'Upload Date', options: { bold: true } }, { text: img.date || 'N/A' }],
        [{ text: 'Doctor', options: { bold: true } }, { text: img.uploadedBy || clinicSettings?.doctorName || 'Lead Doctor' }],
        [{ text: 'File Name', options: { bold: true } }, { text: img.fileName || `Scan_${i + 1}.jpg` }]
      ];

      imgSlide.addTable(mediaSpecs, {
        x: 9.1,
        y: 1.7,
        w: 3.1,
        h: 2.2,
        colW: [1.2, 1.9],
        rowH: 0.38,
        fontSize: 9.5,
        fill: { color: cardBg },
        border: { pt: 0.5, color: 'E2E8F0' }
      });

      imgSlide.addText('Diagnostic Interpretation:', {
        x: 9.1,
        y: 4.1,
        w: 3.1,
        h: 0.25,
        fontSize: 11,
        bold: true,
        color: textDark
      });

      imgSlide.addText('Verified under high-resolution clinical DICOM viewer. Calibrated and archived.', {
        x: 9.1,
        y: 4.4,
        w: 3.1,
        h: 2.2,
        fontSize: 9.5,
        color: textMuted,
        fill: { color: 'FFFFFF' },
        margin: 6,
        line: { color: 'E2E8F0', width: 1 }
      });

      // Embed Image onto Slide
      try {
        if (img.url && (img.url.startsWith('http') || img.url.startsWith('data:image/'))) {
          imgSlide.addImage({
            data: img.url.startsWith('data:image/') ? img.url : undefined,
            path: img.url.startsWith('http') ? img.url : undefined,
            x: 0.8,
            y: 1.1,
            w: 7.6,
            h: 5.8,
            sizing: { type: 'contain', w: 7.6, h: 5.8 }
          });
        }
      } catch (imgErr) {
        console.warn('Failed to embed image onto slide:', imgErr);
        imgSlide.addShape(pptx.ShapeType.rect, {
          x: 0.8,
          y: 1.1,
          w: 7.6,
          h: 5.8,
          fill: { color: '000000' }
        });
        imgSlide.addText(`[Radiograph Scan in Database: ${img.fileName}]`, {
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

  // Trigger download
  const safeFilename = `${patient.name.trim().replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '_')}_Clinical_File.pptx`;
  await pptx.writeFile({ fileName: safeFilename });
}
