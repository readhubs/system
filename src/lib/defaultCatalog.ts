import { ProcedureCatalogItem } from '../types';

export const DEFAULT_PROCEDURES_CATALOG: ProcedureCatalogItem[] = [
  { id: 'proc_1', name: 'Dental Examination & Consultation', category: 'General', defaultPrice: 200 },
  { id: 'proc_2', name: 'Scaling & Polishing (Teeth Cleaning)', category: 'Preventive', defaultPrice: 500 },
  { id: 'proc_3', name: 'Composite Filling (Class I / II / V)', category: 'Restorative', defaultPrice: 650 },
  { id: 'proc_4', name: 'Root Canal Treatment (Endo)', category: 'Endodontics', defaultPrice: 1800 },
  { id: 'proc_5', name: 'Simple Tooth Extraction', category: 'Surgery', defaultPrice: 400 },
  { id: 'proc_6', name: 'Surgical Extraction / Impacted Molar', category: 'Surgery', defaultPrice: 1500 },
  { id: 'proc_7', name: 'Zirconia Crown Restoration', category: 'Prosthodontics', defaultPrice: 2500 },
  { id: 'proc_8', name: 'Porcelain Laminate Veneer', category: 'Cosmetic', defaultPrice: 3000 },
  { id: 'proc_9', name: 'Post & Core Restoration', category: 'Restorative', defaultPrice: 800 },
  { id: 'proc_10', name: 'Dental Implant Placement', category: 'Implantology', defaultPrice: 8000 },
  { id: 'proc_11', name: 'In-Office Teeth Whitening (Bleaching)', category: 'Cosmetic', defaultPrice: 3000 },
  { id: 'proc_12', name: 'Pediatric Pulpotomy & Stainless Steel Crown', category: 'Pediatric', defaultPrice: 750 }
];
