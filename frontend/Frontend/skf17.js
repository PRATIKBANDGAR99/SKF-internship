import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import skfLogo from './skf-logo.jpg';
import { 
  supabase, 
  isSupabaseConfigured, 
  fetchInspectionRecords, 
  saveInspectionRecord, 
  uploadPdfToStorage 
} from './supabaseClient';

const CloudIcon = ({ size = 15, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', ...style }}>
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
  </svg>
);

/**
 * Merges a generated PDF blob (page 1 report sheet) with an attached external PDF (blob, ArrayBuffer or URL)
 * @param {Blob|Uint8Array|ArrayBuffer} basePdfBlob - The generated inspection report sheet PDF
 * @param {Blob|File|string} attachedPdf - Attached PDF file, blob, or URL
 * @returns {Promise<Blob>} Merged PDF blob
 */
async function mergePdfWithAttachment(basePdfBlob, attachedPdf) {
  if (!attachedPdf) return basePdfBlob;
  try {
    const baseBytes = await basePdfBlob.arrayBuffer();
    let attachedBytes;

    if (typeof attachedPdf === 'string') {
      const resp = await fetch(attachedPdf);
      attachedBytes = await resp.arrayBuffer();
    } else if (attachedPdf instanceof Blob || attachedPdf instanceof File) {
      attachedBytes = await attachedPdf.arrayBuffer();
    } else if (attachedPdf instanceof ArrayBuffer) {
      attachedBytes = attachedPdf;
    } else {
      return basePdfBlob;
    }

    const mergedDoc = await PDFDocument.create();
    const doc1 = await PDFDocument.load(baseBytes);
    const doc2 = await PDFDocument.load(attachedBytes);

    const pages1 = await mergedDoc.copyPages(doc1, doc1.getPageIndices());
    pages1.forEach((p) => mergedDoc.addPage(p));

    const pages2 = await mergedDoc.copyPages(doc2, doc2.getPageIndices());
    pages2.forEach((p) => mergedDoc.addPage(p));

    const mergedPdfBytes = await mergedDoc.save();
    return new Blob([mergedPdfBytes], { type: 'application/pdf' });
  } catch (err) {
    console.error('Failed to merge PDFs:', err);
    return basePdfBlob; // fallback to base report sheet if merge fails
  }
}

// ==========================================
// 1. UTILITY FUNCTIONS, ICONS & CONSTANTS
// ==========================================

const EyeIcon = ({ size = 15, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', ...style }}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const PrintIcon = ({ size = 15, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', ...style }}>
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);

const DownloadIcon = ({ size = 15, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', ...style }}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const ReportIcon = ({ size = 18, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', ...style }}>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const DocumentIcon = ({ size = 16, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', ...style }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const CloseIcon = ({ size = 14, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', ...style }}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CheckIcon = ({ size = 16, color = "#16a34a", strokeWidth = 2.5, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', ...style }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CrossIcon = ({ size = 16, color = "#dc2626", strokeWidth = 2.5, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', ...style }}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SvgCheckbox = ({ checked = false, size = 13, color = "#000", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ verticalAlign: 'middle', display: 'inline-block', ...style }}>
    <rect x="0.75" y="0.75" width="14.5" height="14.5" rx="2" stroke={color} strokeWidth="1.5" fill="#fff" />
    {checked && (
      <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    )}
  </svg>
);

const SpinnerIcon = ({ size = 32, color = "#005a9c", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite', verticalAlign: 'middle', ...style }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const BackspaceIcon = ({ size = 14, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', ...style }}>
    <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
    <line x1="18" y1="9" x2="12" y2="15" />
    <line x1="12" y1="9" x2="18" y2="15" />
  </svg>
);

const loadHtml2Pdf = () => {
  return new Promise((resolve, reject) => {
    if (window.html2pdf) return resolve(window.html2pdf);
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => resolve(window.html2pdf);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

export const formatDateToDDMMYY = (dateStr) => {
  if (!dateStr) return '';
  const str = String(dateStr).trim();
  // YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    const [, yyyy, mm, dd] = isoMatch;
    const yy = yyyy.slice(-2);
    return `${dd.padStart(2, '0')}/${mm.padStart(2, '0')}/${yy}`;
  }
  // DD/MM/YYYY or DD-MM-YYYY
  const fullYearMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (fullYearMatch) {
    const [, dd, mm, yyyy] = fullYearMatch;
    return `${dd.padStart(2, '0')}/${mm.padStart(2, '0')}/${yyyy.slice(-2)}`;
  }
  // DD/MM/YY or DD-MM-YY
  const shortYearMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2})$/);
  if (shortYearMatch) {
    const [, dd, mm, yy] = shortYearMatch;
    return `${dd.padStart(2, '0')}/${mm.padStart(2, '0')}/${yy}`;
  }
  return str;
};

const defaultInitialTableData = [
  { id: 1, parameter: 'Track Diameter', symbol: 'Di', tol: '', isDoubleRow: true, samplesRow1: ['', '', '', '', ''], samplesRow2: ['', '', '', '', ''] },
  { id: 2, parameter: 'Track Ovality', symbol: 'VDi', tol: '', samples: ['', '', '', '', ''] },
  { id: 3, parameter: 'Land Diameter', symbol: 'Dk', tol: '', samples: ['', '', '', '', ''] },
  { id: 4, parameter: 'Track Angle', symbol: 'β', tol: '', samples: ['', '', '', '', ''] },
  { id: 5, parameter: 'Track Angle Variation', symbol: 'Vβ', tol: '', samples: ['', '', '', '', ''] },
  { id: 6, parameter: 'Track 3 Point', symbol: 'V3di', tol: '', samples: ['', '', '', '', ''] },
  { id: 7, parameter: 'Track Form (Crowning)', symbol: 'Pi', tol: '', samples: ['', '', '', '', ''] },
  { id: 8, parameter: 'Grinding Burns', symbol: '', tol: '', isVisualOption: true, samples: ['', '', '', '', ''] },
  { id: 9, isVisualGroup: true, isFirstInGroup: true, parameter: '• Visual Inspection', subParameter: 'No Slots/Step on Track', samples: ['', '', '', '', ''] },
  { id: 10, isVisualGroup: true, isFirstInGroup: false, parameter: '• Visual Inspection', subParameter: 'No marks on OD/Face/Track', samples: ['', '', '', '', ''] },
  { id: 11, isVkrGroup: true, isFirstInGroup: true, subParameter: 'Mdi - L1', tol: '', samples: ['', '', '', '', ''] },
  { id: 12, isVkrGroup: true, isFirstInGroup: false, subParameter: 'L2', tol: '', samples: ['', '', '', '', ''] },
  { id: 13, isVkrGroup: true, isFirstInGroup: false, subParameter: 'L3', tol: '', samples: ['', '', '', '', ''] }
];

const defaultOuterRingTrackGrindingTableData = [
  { id: 'tg-or-1', parameter: 'Track Diameter', symbol: 'de', tol: '', isDoubleRow: true, samplesRow1: ['', '', '', '', ''], samplesRow2: ['', '', '', '', ''] },
  { id: 'tg-or-2', parameter: 'Track Ovality', symbol: 'Vde', tol: '', samples: ['', '', '', '', ''] },
  { id: 'tg-or-3', parameter: 'Track Angle', symbol: 'α', tol: '', samples: ['', '', '', '', ''] },
  { id: 'tg-or-4', parameter: 'Track Angle Variation', symbol: 'Vα', tol: '', samples: ['', '', '', '', ''] },
  { id: 'tg-or-5', parameter: 'Track 3 Point', symbol: 'V3de', tol: '', samples: ['', '', '', '', ''] },
  { id: 'tg-or-6', parameter: 'Wall Thickness', symbol: 'VEe', tol: '', samples: ['', '', '', '', ''] },
  { id: 'tg-or-7', parameter: 'Track Form (Crowning)', symbol: 'Pe', tol: '', samples: ['', '', '', '', ''] },
  { id: 'tg-or-8', parameter: 'Grinding Burns', symbol: '', tol: '', isVisualOption: true, samples: ['', '', '', '', ''] },
  { id: 'tg-or-9', isVisualGroup: true, isFirstInGroup: true, parameter: '• Visual Inspection', subParameter: 'No Slots/Step on Track', samples: ['', '', '', '', ''] },
  { id: 'tg-or-10', isVisualGroup: true, isFirstInGroup: false, parameter: '• Visual Inspection', subParameter: 'No marks on OD/Face/Track', samples: ['', '', '', '', ''] },
  { id: 'tg-or-11', isVkrGroup: true, isFirstInGroup: true, subParameter: 'Mde - L1', tol: '', samples: ['', '', '', '', ''] },
  { id: 'tg-or-12', isVkrGroup: true, isFirstInGroup: false, subParameter: 'L2', tol: '', samples: ['', '', '', '', ''] },
  { id: 'tg-or-13', isVkrGroup: true, isFirstInGroup: false, subParameter: 'L3', tol: '', samples: ['', '', '', '', ''] }
];

const defaultBoreGrindingTableData = [
  {
    id: 'bg-1',
    parameter: 'Bore Diameter',
    symbol: 'Ød _____ mm',
    isDiagonal: true,
    tol: { top: '', bottom: '' },
    samples: [
      { top: '', bottom: '' },
      { top: '', bottom: '' },
      { top: '', bottom: '' },
      { top: '', bottom: '' },
      { top: '', bottom: '' }
    ]
  },
  { id: 'bg-2', parameter: 'Bore Ovality', symbol: 'Vd', tol: '', samples: ['', '', '', '', ''] },
  { id: 'bg-3', parameter: 'Bore Taper', symbol: 'Vdm', tol: '', samples: ['', '', '', '', ''] },
  { id: 'bg-4', parameter: 'Bore 3 Point', symbol: 'V3d', tol: '', samples: ['', '', '', '', ''] },
  { id: 'bg-5', parameter: 'Bore Center Diameter', symbol: 'dm', tol: '', samples: ['', '', '', '', ''] },
  { id: 'bg-6', parameter: 'Side Wobble', symbol: 'Ks', tol: '', samples: ['', '', '', '', ''] },
  { id: 'bg-7', parameter: 'Radial Run Out', symbol: 'VEi', tol: '', samples: ['', '', '', '', ''] },
  { id: 'bg-8', parameter: 'Surface Roughness', symbol: 'Ra', tol: '', samples: ['', '', '', '', ''] },
  { id: 'bg-9', parameter: 'Grinding Burns', symbol: '–', tol: '', isVisualOption: true, samples: ['', '', '', '', ''] },
  { id: 'bg-10', isVisualGroup: true, isFirstInGroup: true, parameter: 'Visual Inspection', subParameter: 'No Face marks', samples: ['', '', '', '', ''] },
  { id: 'bg-11', isVisualGroup: true, isFirstInGroup: false, parameter: 'Visual Inspection', subParameter: 'No chatter / damage on bore', samples: ['', '', '', '', ''] }
];

const defaultOuterRingTrackHoningTableData = [
  { id: 'th-or-1', parameter: 'Cup Height (Outer Ring)', symbol: 'Te', tol: '', samples: ['', '', '', '', ''] },
  { id: 'th-or-2', parameter: 'Track Angle', symbol: 'α', tol: '', samples: ['', '', '', '', ''] },
  { id: 'th-or-3', parameter: 'Surface Roughness', symbol: 'Ra', tol: '', samples: ['', '', '', '', ''] },
  { id: 'th-or-4', parameter: 'Track Angle Form (Crowning)', symbol: 'Pe', tol: '', samples: ['', '', '', '', ''] },
  { id: 'th-or-5', isVisualGroup: true, isFirstInGroup: true, groupRowSpan: 2, parameter: 'Visual Inspection', subParameter: 'No marks on Face / OD', samples: ['', '', '', '', ''] },
  { id: 'th-or-6', isVisualGroup: true, isFirstInGroup: false, parameter: 'Visual Inspection', subParameter: 'No chatter / ridge on Track', samples: ['', '', '', '', ''] },
  { 
    id: 'th-or-7', 
    isHoningVkrGroup: true, 
    isFirstInGroup: true, 
    parameter: 'Track VKR (µm/s)', 
    symbol: 'L , M , H\nor\nW Parameters', 
    tol: '', 
    samples: ['', '', '', '', ''] 
  },
  { 
    id: 'th-or-8', 
    isHoningVkrGroup: true, 
    isFirstInGroup: false, 
    tol: '', 
    samples: ['', '', '', '', ''] 
  },
  { 
    id: 'th-or-9', 
    isHoningVkrGroup: true, 
    isFirstInGroup: false, 
    tol: '', 
    samples: ['', '', '', '', ''] 
  }
];

const defaultTrackHoningTableData = defaultOuterRingTrackHoningTableData;

const defaultInnerRingTrackHoningTableData = [
  { id: 'th-ir-1', parameter: 'Track Angle', symbol: 'β', tol: '', samples: ['', '', '', '', ''] },
  { id: 'th-ir-2', parameter: 'Surface Roughness', symbol: 'Ra', tol: '', samples: ['', '', '', '', ''] },
  { id: 'th-ir-3', parameter: 'Track Form (Crowning)', symbol: 'Pi', tol: '', samples: ['', '', '', '', ''] },
  { id: 'th-ir-4', isVisualGroup: true, isFirstInGroup: true, groupRowSpan: 3, parameter: 'Visual Inspection', subParameter: 'No marks on Face / OD', samples: ['', '', '', '', ''] },
  { id: 'th-ir-5', isVisualGroup: true, isFirstInGroup: false, parameter: 'Visual Inspection', subParameter: 'No chatter / ridge on Track', samples: ['', '', '', '', ''] },
  { id: 'th-ir-6', isVisualGroup: true, isFirstInGroup: false, parameter: 'Visual Inspection', subParameter: 'No damage on flange', samples: ['', '', '', '', ''] },
  { 
    id: 'th-ir-7', 
    isHoningVkrGroup: true, 
    isFirstInGroup: true, 
    parameter: 'Track VKR (µm/s)', 
    symbol: 'L , M , H\nor\nW Parameters', 
    tol: '', 
    samples: ['', '', '', '', ''] 
  },
  { 
    id: 'th-ir-8', 
    isHoningVkrGroup: true, 
    isFirstInGroup: false, 
    tol: '', 
    samples: ['', '', '', '', ''] 
  },
  { 
    id: 'th-ir-9', 
    isHoningVkrGroup: true, 
    isFirstInGroup: false, 
    tol: '', 
    samples: ['', '', '', '', ''] 
  }
];

const defaultFlangeGrindingTableData = [
  {
    id: 'fg-1',
    parameter: 'Flange Thickness',
    symbol: 'S3',
    isDiagonal: true,
    tol: { top: '', bottom: '' },
    samples: [
      { top: '', bottom: '' },
      { top: '', bottom: '' },
      { top: '', bottom: '' },
      { top: '', bottom: '' },
      { top: '', bottom: '' }
    ]
  },
  { id: 'fg-2', parameter: 'Flange Thickness Variation', symbol: 'VS3', tol: '', samples: ['', '', '', '', ''] },
  { id: 'fg-3', parameter: 'Flange Taper / angle', symbol: 'B/T (Υ)', tol: '', samples: ['', '', '', '', ''] },
  { id: 'fg-4', parameter: 'Flange Form', symbol: 'Pf', tol: '', samples: ['', '', '', '', ''] },
  { id: 'fg-5', parameter: 'Surface Roughness', symbol: 'Ra', tol: '', samples: ['', '', '', '', ''] },
  { id: 'fg-6', parameter: 'Grinding Burns', symbol: '–', tol: '', isVisualOption: true, samples: ['', '', '', '', ''] },
  { id: 'fg-7', parameter: 'Flange waviness (VKR)', symbol: 'As per D11', isSpanSymbolTol: true, tol: '', samples: ['', '', '', '', ''] },
  { id: 'fg-8', isVisualGroup: true, isFirstInGroup: true, groupRowSpan: 3, parameter: 'Visual Inspection', subParameter: 'No chatter on flange', samples: ['', '', '', '', ''] },
  { id: 'fg-9', isVisualGroup: true, isFirstInGroup: false, parameter: 'Visual Inspection', subParameter: 'No step on flange', samples: ['', '', '', '', ''] },
  { id: 'fg-10', isVisualGroup: true, isFirstInGroup: false, parameter: 'Visual Inspection', subParameter: 'No cut marks on flange', samples: ['', '', '', '', ''] }
];

const defaultAssemblyTableData = [
  {
    id: 'as-1',
    parameter: 'CONE HEIGHT',
    symbol: 'Ti',
    sampleSize: '',
    isDiagonalTol: true,
    tol: { top: '', bottom: '' },
    samples: ['', '', '', '', '']
  },
  {
    id: 'as-2',
    parameter: 'CAGE CLEARANCE',
    symbol: 'Gcr',
    sampleSize: '',
    isDiagonalTol: true,
    tol: { top: '', bottom: '' },
    samples: ['', '', '', '', '']
  },
  {
    id: 'as-3',
    parameter: 'OD DIAMETER',
    symbol: 'D',
    sampleSize: '',
    isDiagonalTol: true,
    tol: { top: '', bottom: '' },
    samples: ['', '', '', '', '']
  },
  {
    id: 'as-4',
    parameter: 'BEARING VIBRATION',
    symbol: '-',
    sampleSize: '',
    isVibrationRow: true,
    isStackedTol: true,
    tol: { top: '', bottom: '' },
    samples: [
      { sub1: { top: '', bottom: '' }, sub2: { top: '', bottom: '' } },
      { sub1: { top: '', bottom: '' }, sub2: { top: '', bottom: '' } },
      { sub1: { top: '', bottom: '' }, sub2: { top: '', bottom: '' } },
      { sub1: { top: '', bottom: '' }, sub2: { top: '', bottom: '' } },
      { sub1: { top: '', bottom: '' }, sub2: { top: '', bottom: '' } }
    ]
  },
  {
    id: 'as-5',
    parameter: 'MISSING ROLLER CHECK',
    symbol: '-',
    sampleSize: '',
    isVisualOption: true,
    isStackedTol: true,
    tol: '',
    samples: ['', '', '', '', '']
  },
  {
    id: 'as-6',
    parameter: 'WASHING UNIT',
    symbol: '-',
    sampleSize: '',
    isVisualOption: true,
    tol: '',
    samples: ['', '', '', '', '']
  },
  {
    id: 'as-7',
    parameter: 'OILING UNIT',
    symbol: '-',
    sampleSize: '',
    isVisualOption: true,
    tol: '',
    samples: ['', '', '', '', '']
  },
  {
    id: 'as-8',
    parameter: 'VISUAL CHECK\n(No marks on rollers/cages/rings)',
    symbol: '-',
    sampleSize: '',
    isVisualOption: true,
    tol: '',
    samples: ['', '', '', '', '']
  }
];

const defaultQualityEquipmentsTableData = [
  // Inner Ring
  { id: 'qe-ir-hdr', isSectionHeader: true, sectionTitle: 'Inner Ring:' },
  { id: 'qe-ir-1', section: 'Inner Ring', srNo: '1', equipmentName: 'NDT', parameterChecked: 'Hardness Inspection', outlierAvailable: '', verificationOutlier: '', releaseProduction: '', spanAcross: false, spanText: '' },
  { id: 'qe-ir-2', section: 'Inner Ring', srNo: '2', equipmentName: 'ABG', parameterChecked: 'Bore diameter', outlierAvailable: '', verificationOutlier: '', releaseProduction: '', spanAcross: false, spanText: '' },
  
  // Outer Ring
  { id: 'qe-or-hdr', isSectionHeader: true, sectionTitle: 'Outer Ring:' },
  { id: 'qe-or-1', section: 'Outer Ring', srNo: '1', equipmentName: 'NDT', parameterChecked: 'Hardness Inspection', outlierAvailable: '', verificationOutlier: '', releaseProduction: '', spanAcross: false, spanText: '' },
  { id: 'qe-or-2', section: 'Outer Ring', srNo: '2', equipmentName: 'MMA', parameterChecked: 'Cup Height', outlierAvailable: '', verificationOutlier: '', releaseProduction: '', spanAcross: false, spanText: '' },
  { id: 'qe-or-3', section: 'Outer Ring', srNo: '3', equipmentName: 'MMA', parameterChecked: 'Outer diameter', outlierAvailable: '', verificationOutlier: '', releaseProduction: '', spanAcross: false, spanText: '' },
  
  // Assembly
  { id: 'qe-as-hdr', isSectionHeader: true, sectionTitle: 'Assembly:' },
  { id: 'qe-as-1', section: 'Assembly', srNo: '1', equipmentName: 'XHF', parameterChecked: 'Cone height', outlierAvailable: '', verificationOutlier: '', releaseProduction: '', spanAcross: false, spanText: '' },
  { id: 'qe-as-2', section: 'Assembly', srNo: '2', equipmentName: 'MVR 110', parameterChecked: 'Noise Inspection', outlierAvailable: '', verificationOutlier: '', releaseProduction: '', spanAcross: false, spanText: '' },
  { id: 'qe-as-3', section: 'Assembly', srNo: '3', equipmentName: 'Weight Pokayoke', parameterChecked: 'Missing Roller Check', outlierAvailable: '', verificationOutlier: '', releaseProduction: '', spanAcross: false, spanText: '' }
];

const defaultMarkingTableData = [
  { id: 'mk-1', parameter: '• Visual Inspection', isVisualGroup: true, isFirstInGroup: true, groupRowSpan: 3, criteria: 'No missing letters', isMarkingOnly: true, samples: ['', '', '', '', ''] },
  { id: 'mk-2', parameter: '• Visual Inspection', isVisualGroup: true, isFirstInGroup: false, criteria: 'Marking clarity', isMarkingOnly: true, samples: ['', '', '', '', ''] },
  { id: 'mk-3', parameter: '• Visual Inspection', isVisualGroup: true, isFirstInGroup: false, criteria: 'Centering of letters & Orientation', isMarkingOnly: true, samples: ['', '', '', '', ''] }
];

const parseVibrationSample = (val) => {
  if (!val) return { sub1: { top: '', bottom: '' }, sub2: { top: '', bottom: '' } };
  if (typeof val === 'object' && !Array.isArray(val)) {
    return {
      sub1: {
        top: val.sub1?.top ?? val.top1 ?? (val.sub1 && typeof val.sub1 !== 'object' ? String(val.sub1) : ''),
        bottom: val.sub1?.bottom ?? val.bottom1 ?? ''
      },
      sub2: {
        top: val.sub2?.top ?? val.top2 ?? (val.sub2 && typeof val.sub2 !== 'object' ? String(val.sub2) : ''),
        bottom: val.sub2?.bottom ?? val.bottom2 ?? ''
      }
    };
  }
  if (Array.isArray(val)) {
    return {
      sub1: { top: val[0]?.top ?? val[0] ?? '', bottom: val[0]?.bottom ?? '' },
      sub2: { top: val[1]?.top ?? val[1] ?? '', bottom: val[1]?.bottom ?? '' }
    };
  }
  return { sub1: { top: String(val), bottom: '' }, sub2: { top: '', bottom: '' } };
};

const isQualityEquipmentsForm = (formKey = '', op = '') => {
  const upperKey = (formKey || '').toUpperCase();
  const upperOp = (op || '').toUpperCase();
  return (
    upperKey.includes('TRB/17') ||
    upperKey === 'SKF/QA/TRB/17' ||
    upperOp.includes('QUALITY EQUIPMENT') ||
    upperOp.includes('QUALITY EQUIPMENTS')
  );
};

const isAssemblyForm = (formKey = '', op = '') => {
  if (isQualityEquipmentsForm(formKey, op)) return false;
  const upperKey = (formKey || '').toUpperCase();
  const upperOp = (op || '').toUpperCase();
  return (
    upperKey.includes('TRB/09') ||
    upperKey === 'SKF/QA/TRB/09' ||
    upperOp === 'ASSEMBLY' ||
    upperOp.includes('ASSEMBLY OFF')
  );
};

const isMarkingForm = (formKey = '', op = '', ringSection = '') => {
  if (isQualityEquipmentsForm(formKey, op)) return false;
  if (isAssemblyForm(formKey, op)) return false;
  const upperKey = (formKey || '').toUpperCase();
  const upperOp = (op || '').toUpperCase();
  return (
    upperKey.includes('TRB/08') ||
    upperKey === 'SKF/QA/TRB/08' ||
    upperKey === 'SKF/QA/TRB/08-1' ||
    upperKey === 'SKF/QA/TRB/08-2' ||
    upperKey === 'SKF/QA/TRB/08-OR' ||
    upperKey === 'SKF/QA/TRB/08-IR' ||
    upperOp === 'MARKING' ||
    upperOp.includes('ETCHING') ||
    upperOp.includes('MARKING')
  );
};

const isFlangeGrindingForm = (formKey = '', op = '') => {
  const upperKey = (formKey || '').toUpperCase();
  const upperOp = (op || '').toUpperCase();
  return (
    upperKey.includes('TRB/04') ||
    upperKey === 'SKF/QA/TRB/04' ||
    upperOp.includes('FLANGE')
  );
};

const isBoreGrindingForm = (formKey = '', op = '') => {
  const upperKey = (formKey || '').toUpperCase();
  const upperOp = (op || '').toUpperCase();
  return (
    upperKey.includes('TRB/03') ||
    upperKey === 'SKF/QA/TRB/03-1' ||
    upperKey === 'SKF/QA/TRB/03-2' ||
    upperOp.includes('BORE')
  );
};

const isInnerRingTrackHoningForm = (formKey = '', op = '', ringSection = '') => {
  const upperKey = (formKey || '').toUpperCase();
  const upperOp = (op || '').toUpperCase();
  const upperRing = (ringSection || '').toUpperCase();

  if (upperKey.includes('TRB/05') || upperKey === 'SKF/QA/TRB/05') return true;
  if (upperKey.includes('TRB/07')) return false;
  if (upperRing.includes('OUTER')) return false;
  if (upperRing.includes('INNER') && upperOp.includes('HON')) return true;
  if (upperOp.includes('HON') && !upperRing.includes('OUTER')) return true;
  return false;
};

const isOuterRingTrackHoningForm = (formKey = '', op = '', ringSection = '') => {
  const upperKey = (formKey || '').toUpperCase();
  const upperOp = (op || '').toUpperCase();
  const upperRing = (ringSection || '').toUpperCase();

  if (upperKey.includes('TRB/07') || upperKey === 'SKF/QA/TRB/07-1' || upperKey === 'SKF/QA/TRB/07-2') return true;
  if (upperKey.includes('TRB/05')) return false;
  if (upperRing.includes('INNER')) return false;
  if (upperRing.includes('OUTER') && upperOp.includes('HON')) return true;
  return false;
};

const isTrackHoningForm = (formKey = '', op = '', ringSection = '') => {
  return isInnerRingTrackHoningForm(formKey, op, ringSection) || isOuterRingTrackHoningForm(formKey, op, ringSection);
};

const getRingSectionFromFormKey = (formKey = '', fallback = '') => {
  if (!formKey) return fallback;
  const upper = formKey.toUpperCase();
  if (upper.includes('09') || upper.includes('17')) return 'ASSEMBLY';
  if (
    upper.includes('06') ||
    upper.includes('07') ||
    upper === 'SKF/QA/TRB/08' ||
    upper.includes('08-2') ||
    upper.includes('08-OR')
  ) {
    return 'OUTER RING';
  }
  if (
    upper.includes('02') ||
    upper.includes('03') ||
    upper.includes('04') ||
    upper.includes('05') ||
    upper === 'SKF/QA/TRB/08-1' ||
    upper.includes('08-IR')
  ) {
    return 'INNER RING';
  }
  return fallback;
};

const isOuterRingTrackGrinding = (formKey = '', op = '', ringSection = '') => {
  const upperKey = (formKey || '').toUpperCase();
  const upperOp = (op || '').toUpperCase();
  const upperRing = (ringSection || '').toUpperCase();

  return (
    upperKey.includes('TRB/06') ||
    upperKey === 'SKF/QA/TRB/06-1' ||
    upperKey === 'SKF/QA/TRB/06-2' ||
    (upperRing.includes('OUTER') && !upperOp.includes('HON') && !upperOp.includes('BORE') && !upperOp.includes('FLANGE') && !isMarkingForm(formKey, op, ringSection))
  );
};

const getTableDataForForm = (formKey = '', op = '', ringSection = '') => {
  if (isQualityEquipmentsForm(formKey, op)) {
    return JSON.parse(JSON.stringify(defaultQualityEquipmentsTableData));
  }
  if (isAssemblyForm(formKey, op)) {
    return JSON.parse(JSON.stringify(defaultAssemblyTableData));
  }
  if (isMarkingForm(formKey, op, ringSection)) {
    return JSON.parse(JSON.stringify(defaultMarkingTableData));
  }
  if (isFlangeGrindingForm(formKey, op)) {
    return JSON.parse(JSON.stringify(defaultFlangeGrindingTableData));
  }
  if (isBoreGrindingForm(formKey, op)) {
    return JSON.parse(JSON.stringify(defaultBoreGrindingTableData));
  }
  if (isInnerRingTrackHoningForm(formKey, op, ringSection)) {
    return JSON.parse(JSON.stringify(defaultInnerRingTrackHoningTableData));
  }
  if (isOuterRingTrackHoningForm(formKey, op, ringSection)) {
    return JSON.parse(JSON.stringify(defaultOuterRingTrackHoningTableData));
  }
  if (isOuterRingTrackGrinding(formKey, op, ringSection)) {
    return JSON.parse(JSON.stringify(defaultOuterRingTrackGrindingTableData));
  }
  return JSON.parse(JSON.stringify(defaultInitialTableData));
};

const initialDatabase = [
  {
    id: 'REC-868',
    date: '2025-09-10',
    section: 'TRB',
    channel: 'CH2',
    ringSection: 'INNER RING',
    machine: '2342344',
    formatNo: 'SKF/QA/TRB/02',
    operation: 'TRACK GRINDING',
    type: '',
    shift: 'I',
    inspector: '',
    status: 'YES',
    formData: {
      formatNo: 'SKF/QA/TRB/02',
      revisionNo: '',
      revDate: '',
      prepBy: '',
      appdBy: '',
      grinding: 'INNER RING',
      channelNo: 'CH2',
      tv: '',
      mv: '',
      type: '',
      operation: 'TRACK GRINDING',
      date: '2025-09-10',
      shift: 'I',
      machineNo: '2342344',
      machineReleased: 'YES',
      inspectorSignature: '',
      inspectorName: '',
      supervisorSignature: '',
      supervisorName: '',
      reasonSelected: null
    },
    tableData: defaultInitialTableData,
    pdfUrl: null
  },
  {
    id: 'REC-869',
    date: '2025-09-11',
    section: 'TRB',
    channel: 'CH4',
    ringSection: 'OUTER RING',
    machine: '543210',
    formatNo: 'SKF/QA/TRB/07',
    operation: 'TRACK HONNING',
    type: '32008X',
    shift: 'I',
    inspector: 'RS',
    status: 'YES',
    formData: {
      formatNo: 'SKF/QA/TRB/07',
      revisionNo: '01',
      revDate: '25/08',
      prepBy: 'RS',
      appdBy: 'MK',
      grinding: 'OUTER RING',
      channelNo: 'CH4',
      tv: '14.25',
      mv: '14.22',
      type: '32008X',
      operation: 'TRACK HONNING',
      date: '2025-09-11',
      shift: 'I',
      machineNo: '543210',
      machineReleased: 'YES',
      inspectorSignature: '',
      inspectorName: 'RS',
      supervisorSignature: '',
      supervisorName: 'MK',
      reasonSelected: 1
    },
    tableData: [
      { id: 'th-1', parameter: 'Cup Height (Outer Ring)', symbol: 'Te', tol: '±0.02', samples: ['14.24', '14.25', '14.23', '14.25', '14.24'] },
      { id: 'th-2', parameter: 'Track Angle', symbol: 'α', tol: 'nul', samples: ['nul', 'nul', 'nul', 'nul', 'nul'] },
      { id: 'th-3', parameter: 'Surface Roughness', symbol: 'Ra', tol: '0.15', samples: ['0.12', '0.14', '0.11', '0.13', '0.12'] },
      { id: 'th-4', parameter: 'Track Angle Form (Crowning)', symbol: 'Pe', tol: 'nul', samples: ['nul', 'nul', 'nul', 'nul', 'nul'] },
      { id: 'th-5', isVisualGroup: true, isFirstInGroup: true, parameter: '•Visual Inspection', subParameter: 'No marks on Face / OD', samples: ['✓', '✓', '✓', '✓', '✓'] },
      { id: 'th-6', isVisualGroup: true, isFirstInGroup: false, parameter: '•Visual Inspection', subParameter: 'No chatter / ridge on Track', samples: ['✓', '✓', '✓', '✓', '✓'] },
      {
        id: 'th-7',
        isHoningVkrGroup: true,
        isFirstInGroup: true,
        parameter: 'Track VKR (µm/s)',
        symbol: 'L , M , H\nor\nW Parameters',
        tol: '1.5',
        samples: ['1.2', '1.1', '1.3', '1.2', '1.1']
      },
      {
        id: 'th-8',
        isHoningVkrGroup: true,
        isFirstInGroup: false,
        tol: 'nul',
        samples: ['nul', 'nul', 'nul', 'nul', 'nul']
      },
      {
        id: 'th-9',
        isHoningVkrGroup: true,
        isFirstInGroup: false,
        tol: 'nul',
        samples: ['nul', 'nul', 'nul', 'nul', 'nul']
      }
    ],
    pdfUrl: null
  },
  {
    id: 'REC-870',
    date: '2025-09-12',
    section: 'TRB',
    channel: 'CH1',
    ringSection: 'INNER RING',
    machine: '109283',
    formatNo: 'SKF/QA/TRB/03',
    operation: 'BORE GRINDING (1)',
    type: '32008X',
    shift: 'I',
    inspector: 'AG',
    status: 'YES',
    formData: {
      formatNo: 'SKF/QA/TRB/03',
      revisionNo: '02',
      revDate: '15/09',
      prepBy: 'AG',
      appdBy: 'MK',
      grinding: 'INNER RING',
      channelNo: 'CH1',
      tv: '50.00',
      mv: '49.98',
      type: '32008X',
      operation: 'BORE GRINDING (1)',
      date: '2025-09-12',
      shift: 'I',
      machineNo: '109283',
      machineReleased: 'YES',
      inspectorSignature: '',
      inspectorName: 'AG',
      supervisorSignature: '',
      supervisorName: 'MK',
      reasonSelected: 1
    },
    tableData: [
      {
        id: 'bg-1',
        parameter: 'Bore Diameter',
        symbol: 'Ød _____ mm',
        isDiagonal: true,
        tol: { top: '0', bottom: '-12' },
        samples: [
          { top: '-10', bottom: '-12' },
          { top: '-9', bottom: '-11' },
          { top: '-8', bottom: '-12' },
          { top: '-7', bottom: '-8' },
          { top: '-5', bottom: '-7' }
        ]
      },
      { id: 'bg-2', parameter: 'Bore Ovality', symbol: 'Vd', tol: '0.005', samples: ['0.002', '0.003', '0.002', '0.002', '0.003'] },
      { id: 'bg-3', parameter: 'Bore Taper', symbol: 'Vdm', tol: '0.006', samples: ['0.002', '0.003', '0.001', '0.002', '0.002'] },
      { id: 'bg-4', parameter: 'Bore 3 Point', symbol: 'V3d', tol: '0.004', samples: ['0.002', '0.001', '0.002', '0.001', '0.002'] },
      { id: 'bg-5', parameter: 'Bore Center Diameter', symbol: 'dm', tol: '50.00 ±0.010', samples: ['50.001', '50.002', '49.999', '50.000', '50.002'] },
      { id: 'bg-6', parameter: 'Side Wobble', symbol: 'Ks', tol: '0.008', samples: ['0.003', '0.002', '0.004', '0.003', '0.002'] },
      { id: 'bg-7', parameter: 'Radial Run Out', symbol: 'VEi', tol: '0.005', samples: ['0.002', '0.001', '0.002', '0.002', '0.001'] },
      { id: 'bg-8', parameter: 'Surface Roughness', symbol: 'Ra', tol: '0.40', samples: ['0.28', '0.32', '0.30', '0.29', '0.31'] },
      { id: 'bg-9', parameter: 'Grinding Burns', symbol: '–', tol: '', isVisualOption: true, samples: ['✓', '✓', '✓', '✓', '✓'] },
      { id: 'bg-10', isVisualGroup: true, isFirstInGroup: true, parameter: 'Visual Inspection', subParameter: 'No Face marks', samples: ['✓', '✓', '✓', '✓', '✓'] },
      { id: 'bg-11', isVisualGroup: true, isFirstInGroup: false, parameter: 'Visual Inspection', subParameter: 'No chatter / damage on bore', samples: ['✓', '✓', '✓', '✓', '✓'] }
    ],
    pdfUrl: null
  },
  {
    id: 'REC-871',
    date: '2025-09-13',
    section: 'TRB',
    channel: 'CH3',
    ringSection: 'INNER RING',
    machine: '345678',
    formatNo: 'SKF/QA/TRB/04',
    operation: 'FLANGE GRINDING',
    type: '32008X',
    shift: 'I',
    inspector: 'RS',
    status: 'YES',
    formData: {
      formatNo: 'SKF/QA/TRB/04',
      revisionNo: '01',
      revDate: '20/09',
      prepBy: 'RS',
      appdBy: 'MK',
      grinding: 'INNER RING',
      channelNo: 'CH3',
      tv: '18.50',
      mv: '18.48',
      type: '32008X',
      operation: 'FLANGE GRINDING',
      date: '2025-09-13',
      shift: 'I',
      machineNo: '345678',
      machineReleased: 'YES',
      inspectorSignature: '',
      inspectorName: 'RS',
      supervisorSignature: '',
      supervisorName: 'MK',
      reasonSelected: 1
    },
    tableData: [
      {
        id: 'fg-1',
        parameter: 'Flange Thickness',
        symbol: 'S3',
        isDiagonal: true,
        tol: { top: '+20', bottom: '-20' },
        samples: [
          { top: '+5', bottom: '-8' },
          { top: '+8', bottom: '-10' },
          { top: '+6', bottom: '-7' },
          { top: '+10', bottom: '-9' },
          { top: '+4', bottom: '-6' }
        ]
      },
      { id: 'fg-2', parameter: 'Flange Thickness Variation', symbol: 'VS3', tol: '8', samples: ['4', '5', '3', '4', '5'] },
      { id: 'fg-3', parameter: 'Flange Taper / angle', symbol: 'B/T (Υ)', tol: '0 / -4', samples: ['-1', '-2', '-1', '-3', '-2'] },
      { id: 'fg-4', parameter: 'Flange Form', symbol: 'Pf', tol: '-1.10 / 1.00', samples: ['0.4', '0.6', '0.5', '0.3', '0.5'] },
      { id: 'fg-5', parameter: 'Surface Roughness', symbol: 'Ra', tol: '0.30', samples: ['0.22', '0.25', '0.20', '0.24', '0.21'] },
      { id: 'fg-6', parameter: 'Grinding Burns', symbol: '–', tol: '', isVisualOption: true, samples: ['✓', '✓', '✓', '✓', '✓'] },
      { id: 'fg-7', parameter: 'Flange waviness (VKR)', symbol: 'As per D11', isSpanSymbolTol: true, tol: '', samples: ['✓', '✓', '✓', '✓', '✓'] },
      { id: 'fg-8', isVisualGroup: true, isFirstInGroup: true, groupRowSpan: 3, parameter: 'Visual Inspection', subParameter: 'No chatter on flange', samples: ['✓', '✓', '✓', '✓', '✓'] },
      { id: 'fg-9', isVisualGroup: true, isFirstInGroup: false, parameter: 'Visual Inspection', subParameter: 'No step on flange', samples: ['✓', '✓', '✓', '✓', '✓'] },
      { id: 'fg-10', isVisualGroup: true, isFirstInGroup: false, parameter: 'Visual Inspection', subParameter: 'No cut marks on flange', samples: ['✓', '✓', '✓', '✓', '✓'] }
    ],
    pdfUrl: null
  },
  {
    id: 'REC-872',
    date: '2025-09-14',
    section: 'TRB',
    channel: 'CH2',
    ringSection: 'INNER RING',
    machine: '678901',
    formatNo: 'SKF/QA/TRB/05',
    operation: 'TRACK HONNING',
    type: '32008X',
    shift: 'I',
    inspector: 'AG',
    status: 'YES',
    formData: {
      formatNo: 'SKF/QA/TRB/05',
      revisionNo: '01',
      revDate: '22/09',
      prepBy: 'AG',
      appdBy: 'MK',
      grinding: 'INNER RING',
      channelNo: 'CH2',
      tv: '16.80',
      mv: '16.78',
      type: '32008X',
      operation: 'TRACK HONNING',
      date: '2025-09-14',
      shift: 'I',
      machineNo: '678901',
      machineReleased: 'YES',
      inspectorSignature: '',
      inspectorName: 'AG',
      supervisorSignature: '',
      supervisorName: 'MK',
      reasonSelected: 1
    },
    tableData: [
      { id: 'th-ir-1', parameter: 'Track Angle', symbol: 'β', tol: 'nul', samples: ['nul', 'nul', 'nul', 'nul', 'nul'] },
      { id: 'th-ir-2', parameter: 'Surface Roughness', symbol: 'Ra', tol: '0.15', samples: ['0.12', '0.14', '0.11', '0.13', '0.12'] },
      { id: 'th-ir-3', parameter: 'Track Form (Crowning)', symbol: 'Pi', tol: 'nul', samples: ['nul', 'nul', 'nul', 'nul', 'nul'] },
      { id: 'th-ir-4', isVisualGroup: true, isFirstInGroup: true, groupRowSpan: 3, parameter: 'Visual Inspection', subParameter: 'No marks on Face / OD', samples: ['✓', '✓', '✓', '✓', '✓'] },
      { id: 'th-ir-5', isVisualGroup: true, isFirstInGroup: false, parameter: 'Visual Inspection', subParameter: 'No chatter / ridge on Track', samples: ['✓', '✓', '✓', '✓', '✓'] },
      { id: 'th-ir-6', isVisualGroup: true, isFirstInGroup: false, parameter: 'Visual Inspection', subParameter: 'No damage on flange', samples: ['✓', '✓', '✓', '✓', '✓'] },
      {
        id: 'th-ir-7',
        isHoningVkrGroup: true,
        isFirstInGroup: true,
        parameter: 'Track VKR (µm/s)',
        symbol: 'L , M , H\nor\nW Parameters',
        tol: '1.5',
        samples: ['1.2', '1.1', '1.3', '1.2', '1.1']
      },
      {
        id: 'th-ir-8',
        isHoningVkrGroup: true,
        isFirstInGroup: false,
        tol: 'nul',
        samples: ['nul', 'nul', 'nul', 'nul', 'nul']
      },
      {
        id: 'th-ir-9',
        isHoningVkrGroup: true,
        isFirstInGroup: false,
        tol: 'nul',
        samples: ['nul', 'nul', 'nul', 'nul', 'nul']
      }
    ],
    pdfUrl: null
  },
  {
    id: 'REC-875',
    date: '01/09/26',
    section: 'TRB',
    channel: 'T6',
    ringSection: 'ASSEMBLY',
    machine: 'T6',
    formatNo: 'SKF/QA/TRB/09',
    operation: 'ASSEMBLY',
    type: '32210',
    shift: 'II',
    inspector: 'AVS',
    status: 'YES',
    formData: {
      formatNo: 'SKF/QA/TRB/09',
      revisionNo: '1',
      revDate: '14/07',
      prepBy: 'AVS',
      appdBy: 'SS',
      grinding: 'ASSEMBLY',
      channelNo: 'T6',
      tv: '',
      mv: '40',
      coneHeightMV: '40',
      type: '32210',
      operation: 'ASSEMBLY',
      date: '01/09/26',
      shift: 'II',
      machineNo: '',
      machineReleased: 'YES',
      inspectorSignature: 'SS',
      inspectorName: 'AVS',
      supervisorSignature: 'Sudarshan Shinde',
      supervisorName: 'Sudarshan Shinde',
      reasonSelected: 1
    },
    tableData: [
      {
        id: 'as-1',
        parameter: 'CONE HEIGHT',
        symbol: 'Ti',
        sampleSize: '5',
        isDiagonalTol: true,
        tol: { top: '0', bottom: '100' },
        samples: ['70', '72', '62', '73', '76']
      },
      {
        id: 'as-2',
        parameter: 'CAGE CLEARANCE',
        symbol: 'Gcr',
        sampleSize: '5',
        isDiagonalTol: true,
        tol: { top: '100', bottom: '350' },
        samples: ['280', '280', '240', '210', '240']
      },
      {
        id: 'as-3',
        parameter: 'OD DIAMETER',
        symbol: 'D',
        sampleSize: '5',
        isDiagonalTol: true,
        tol: { top: '-3', bottom: '-12' },
        samples: ['-7', '-6', '-4', '-7', '-5']
      },
      {
        id: 'as-4',
        parameter: 'BEARING VIBRATION',
        symbol: '-',
        sampleSize: '10',
        isVibrationRow: true,
        isStackedTol: true,
        tol: { top: 'Q', bottom: '66' },
        samples: [
          { sub1: { top: 'Q', bottom: '66' }, sub2: { top: 'Q', bottom: '66' } },
          { sub1: { top: 'Q', bottom: '66' }, sub2: { top: 'Q', bottom: '66' } },
          { sub1: { top: 'Q', bottom: '66' }, sub2: { top: 'Q', bottom: '66' } },
          { sub1: { top: 'Q', bottom: '66' }, sub2: { top: 'Q', bottom: '66' } },
          { sub1: { top: 'Q', bottom: '66' }, sub2: { top: 'Q', bottom: '66' } }
        ]
      },
      {
        id: 'as-5',
        parameter: 'MISSING ROLLER CHECK',
        symbol: '-',
        sampleSize: '1',
        isVisualOption: true,
        isStackedTol: true,
        tol: 'Min. 405\nMax. 411',
        samples: ['408.5', 'nul', 'nul', 'nul', 'nul']
      },
      {
        id: 'as-6',
        parameter: 'WASHING UNIT',
        symbol: '-',
        sampleSize: '-',
        isVisualOption: true,
        tol: '',
        samples: ['✓', 'nul', 'nul', 'nul', 'nul']
      },
      {
        id: 'as-7',
        parameter: 'OILING UNIT',
        symbol: '-',
        sampleSize: '-',
        isVisualOption: true,
        tol: '',
        samples: ['✓', 'nul', 'nul', 'nul', 'nul']
      },
      {
        id: 'as-8',
        parameter: 'VISUAL CHECK\n(No marks on rollers/cages/rings)',
        symbol: '-',
        sampleSize: '5',
        isVisualOption: true,
        tol: '',
        samples: ['✓', '✓', '✓', '✓', '✓']
      }
    ],
    pdfUrl: null
  },
  {
    id: 'REC-876',
    date: '2026-09-03',
    section: 'TRB',
    channel: 'T-6',
    ringSection: 'Assembly',
    machine: '-',
    formatNo: 'SKF/QA/TRB/17',
    operation: 'QUALITY EQUIPMENTS',
    type: '33110',
    shift: 'I',
    inspector: 'Bhaskar',
    status: 'YES',
    formData: {
      formatNo: 'SKF/QA/TRB/17',
      revisionNo: '1',
      revDate: '14/07',
      prepBy: 'AVS',
      appdBy: 'SS',
      grinding: 'Assembly',
      channelNo: 'T-6',
      type: '33110',
      operation: 'QUALITY EQUIPMENTS',
      date: '03/09/26',
      shift: 'I',
      machineNo: '-',
      machineReleased: 'YES',
      setupApproval: 'Approved',
      inspectorSignature: 'Bhaskar',
      inspectorName: 'Bhaskar',
      supervisorSignature: '',
      supervisorName: '',
      reasonSelected: 1
    },
    tableData: [
      { id: 'qe-ir-hdr', isSectionHeader: true, sectionTitle: 'Inner Ring:' },
      { id: 'qe-ir-1', section: 'Inner Ring', srNo: '1', equipmentName: 'NDT', parameterChecked: 'Hardness Inspection', outlierAvailable: 'Yes', verificationOutlier: 'Yes', releaseProduction: 'Yes' },
      { id: 'qe-ir-2', section: 'Inner Ring', srNo: '2', equipmentName: 'ABG', parameterChecked: 'Bore diameter', outlierAvailable: 'Yes', verificationOutlier: 'Yes', releaseProduction: 'Yes' },
      
      { id: 'qe-or-hdr', isSectionHeader: true, sectionTitle: 'Outer Ring:' },
      { id: 'qe-or-1', section: 'Outer Ring', srNo: '1', equipmentName: 'NDT', parameterChecked: 'Hardness Inspection', outlierAvailable: 'NO', verificationOutlier: 'NO', releaseProduction: 'NO' },
      { id: 'qe-or-2', section: 'Outer Ring', srNo: '2', equipmentName: 'MMA', parameterChecked: 'Cup Height', outlierAvailable: 'Yes', verificationOutlier: 'Yes', releaseProduction: 'Yes' },
      { id: 'qe-or-3', section: 'Outer Ring', srNo: '3', equipmentName: 'MMA', parameterChecked: 'Outer diameter', outlierAvailable: '100% Checked by F.O.D', verificationOutlier: '', releaseProduction: '', spanAcross: true, spanText: '100% Checked by F.O.D' },
      
      { id: 'qe-as-hdr', isSectionHeader: true, sectionTitle: 'Assembly:' },
      { id: 'qe-as-1', section: 'Assembly', srNo: '1', equipmentName: 'XHF', parameterChecked: 'Cone height', outlierAvailable: 'Yes', verificationOutlier: 'Yes', releaseProduction: 'Yes' },
      { id: 'qe-as-2', section: 'Assembly', srNo: '2', equipmentName: 'MVR 110', parameterChecked: 'Noise Inspection', outlierAvailable: 'Yes', verificationOutlier: 'Yes', releaseProduction: 'Yes' },
      { id: 'qe-as-3', section: 'Assembly', srNo: '3', equipmentName: 'Weight Pokayoke', parameterChecked: 'Missing Roller Check', outlierAvailable: 'Yes', verificationOutlier: 'Yes', releaseProduction: 'Yes' }
    ],
    pdfUrl: null
  },
  {
    id: 'REC-877',
    date: '03/09/26',
    section: 'TRB',
    channel: 'T-6',
    ringSection: 'Outer Ring',
    machine: '-',
    formatNo: 'SKF/QA/TRB/08',
    operation: 'MARKING',
    type: '33110 (T6 14 2467)',
    shift: 'I',
    inspector: 'Santosh',
    status: 'YES',
    formData: {
      formatNo: 'SKF/QA/TRB/08',
      revisionNo: '1',
      revDate: '14/07',
      prepBy: 'AVS',
      appdBy: 'SS',
      grinding: 'OUTER RING',
      channelNo: 'T-6',
      tv: '',
      mv: '',
      type: '33110 (T6 14 2467)',
      operation: 'ETCHING / MARKING',
      date: '03/09/26',
      shift: 'I',
      machineNo: '-',
      machineReleased: 'YES',
      inspectorSignature: 'Santosh',
      inspectorName: 'Santosh',
      supervisorSignature: '',
      supervisorName: '',
      reasonSelected: 1
    },
    tableData: [
      { id: 'mk-1', parameter: '• Visual Inspection', isVisualGroup: true, isFirstInGroup: true, groupRowSpan: 3, criteria: 'No missing letters', isMarkingOnly: true, samples: ['✓', '✓', '✓', '✓', '✓'] },
      { id: 'mk-2', parameter: '• Visual Inspection', isVisualGroup: true, isFirstInGroup: false, criteria: 'Marking clarity', isMarkingOnly: true, samples: ['✓', '✓', '✓', '✓', '✓'] },
      { id: 'mk-3', parameter: '• Visual Inspection', isVisualGroup: true, isFirstInGroup: false, criteria: 'Centering of letters & Orientation', isMarkingOnly: true, samples: ['✓', '✓', '✓', '✓', '✓'] }
    ],
    pdfUrl: null
  }
];

const FORM_METADATA = {
  'SKF/QA/TRB/02': { formatNo: 'SKF/QA/TRB/02', operation: 'TRACK GRINDING' },
  'SKF/QA/TRB/03-1': { formatNo: 'SKF/QA/TRB/03', operation: 'BORE GRINDING (1)' },
  'SKF/QA/TRB/03-2': { formatNo: 'SKF/QA/TRB/03', operation: 'BORE GRINDING (2)' },
  'SKF/QA/TRB/04': { formatNo: 'SKF/QA/TRB/04', operation: 'FLANGE GRINDING' },
  'SKF/QA/TRB/05': { formatNo: 'SKF/QA/TRB/05', operation: 'TRACK HONNING' },
  'SKF/QA/TRB/06-1': { formatNo: 'SKF/QA/TRB/06', operation: 'TRACK GRINDING (1)' },
  'SKF/QA/TRB/06-2': { formatNo: 'SKF/QA/TRB/06', operation: 'TRACK GRINDING (2)' },
  'SKF/QA/TRB/07-1': { formatNo: 'SKF/QA/TRB/07', operation: 'TRACK HONNING (1)' },
  'SKF/QA/TRB/07-2': { formatNo: 'SKF/QA/TRB/07', operation: 'TRACK HONNING (2)' },
  'SKF/QA/TRB/08': { formatNo: 'SKF/QA/TRB/08', operation: 'MARKING' },
  'SKF/QA/TRB/08-OR': { formatNo: 'SKF/QA/TRB/08', operation: 'MARKING' },
  'SKF/QA/TRB/08-IR': { formatNo: 'SKF/QA/TRB/08', operation: 'MARKING' },
  'SKF/QA/TRB/08-1': { formatNo: 'SKF/QA/TRB/08', operation: 'MARKING' },
  'SKF/QA/TRB/08-2': { formatNo: 'SKF/QA/TRB/08', operation: 'MARKING' },
  'SKF/QA/TRB/09': { formatNo: 'SKF/QA/TRB/09', operation: 'ASSEMBLY' },
  'SKF/QA/TRB/17': { formatNo: 'SKF/QA/TRB/17', operation: 'QUALITY EQUIPMENTS' }
};

const parseDiagonalValue = (val) => {
  if (!val && val !== 0) return { top: '', bottom: '' };
  if (typeof val === 'object' && val !== null) {
    return { top: val.top ?? '', bottom: val.bottom ?? '' };
  }
  const str = String(val).trim();
  if (str.includes('/')) {
    const parts = str.split('/');
    return { top: parts[0].trim(), bottom: parts.slice(1).join('/').trim() };
  }
  if (str.includes('\n')) {
    const parts = str.split('\n');
    return { top: parts[0].trim(), bottom: parts.slice(1).join('\n').trim() };
  }
  return { top: str, bottom: '' };
};

function ReportDocumentView({ record, isPrintMode = false, isPdfMode = false }) {
  const formData = record.formData || {
    formatNo: record.formatNo || '',
    revisionNo: record.revisionNo || '',
    revDate: record.revDate || '',
    prepBy: record.prepBy || '',
    appdBy: record.appdBy || '',
    grinding: record.ringSection || record.grinding || '',
    channelNo: record.channel || record.channelNo || '',
    tv: record.tv || '',
    mv: record.mv || '',
    coneHeightMV: record.coneHeightMV || record.mv || '',
    type: record.type || '',
    operation: record.operation || '',
    date: record.date || '',
    shift: record.shift || '',
    machineNo: record.machine || record.machineNo || '',
    machineReleased: record.status || record.machineReleased || '',
    inspectorName: record.inspector || record.inspectorName || '',
    supervisorName: record.supervisorName || '',
    inspectorSignature: record.inspectorSignature || '',
    supervisorSignature: record.supervisorSignature || '',
    reasonSelected: record.reasonSelected || null
  };

  const isQualityEquipments = isQualityEquipmentsForm(record?.formatNo || formData.formatNo, record?.operation || formData.operation);
  const isAssembly = !isQualityEquipments && isAssemblyForm(record?.formatNo || formData.formatNo, record?.operation || formData.operation);
  const isMarking = !isQualityEquipments && !isAssembly && isMarkingForm(record?.formatNo || formData.formatNo, record?.operation || formData.operation, record?.ringSection || formData.grinding);
  const isFlangeGrinding = !isQualityEquipments && !isAssembly && !isMarking && ((record?.operation || formData.operation || '').toUpperCase().includes('FLANGE') ||
    (record?.formatNo || formData.formatNo || '').includes('TRB/04'));
  const isBoreGrinding = !isQualityEquipments && !isAssembly && !isMarking && ((record?.operation || formData.operation || '').toUpperCase().includes('BORE') ||
    (record?.formatNo || formData.formatNo || '').includes('TRB/03'));
  const isInnerHoning = !isQualityEquipments && !isAssembly && !isMarking && isInnerRingTrackHoningForm(
    record?.formatNo || formData.formatNo || '',
    record?.operation || formData.operation || '',
    record?.ringSection || formData.grinding || ''
  );
  const isOuterHoning = !isQualityEquipments && !isAssembly && !isMarking && isOuterRingTrackHoningForm(
    record?.formatNo || formData.formatNo || '',
    record?.operation || formData.operation || '',
    record?.ringSection || formData.grinding || ''
  );
  const isHoning = isInnerHoning || isOuterHoning;
  const isOuterGrinding = !isQualityEquipments && !isAssembly && !isMarking && ((record?.formatNo || formData.formatNo || '').includes('TRB/06') ||
    ((record?.ringSection || formData.grinding || '').toUpperCase().includes('OUTER') && !isHoning && !isBoreGrinding && !isFlangeGrinding));
  const fallbackTableData = isQualityEquipments
    ? defaultQualityEquipmentsTableData
    : (isAssembly
      ? defaultAssemblyTableData
      : (isMarking
        ? defaultMarkingTableData
        : (isFlangeGrinding
          ? defaultFlangeGrindingTableData
          : (isBoreGrinding
            ? defaultBoreGrindingTableData
            : (isInnerHoning
              ? defaultInnerRingTrackHoningTableData
              : (isOuterHoning
                ? defaultOuterRingTrackHoningTableData
                : (isOuterGrinding ? defaultOuterRingTrackGrindingTableData : defaultInitialTableData)))))));
  const tableData = record.tableData || fallbackTableData;

  const reasons = [
    { id: 1, label: "1) Type Change" },
    { id: 2, label: "2) Major Breakdown" },
    { id: 3, label: isQualityEquipments ? "3) Shift Change" : "3) Shut Down" },
    { id: 4, label: "4) Major Tooling Change" },
    { id: 5, label: isQualityEquipments ? "5) Man / Machine Change" : "5) Material Change" }
  ];

  const tableCellStyle = {
    border: '1px solid #000',
    padding: '0px',
    height: '28px',
    textAlign: 'center',
    verticalAlign: 'middle',
    fontSize: '11.5px',
    position: 'relative',
    boxSizing: 'border-box'
  };

  const renderSampleValue = (val) => {
    const isTick = val === '✓' || val === 'tick' || val === 'TICK' || val === 'v' || val === 'V';
    const isCross = val === '✗' || val === 'cross' || val === 'CROSS' || val === 'x' || val === 'X';
    const isSlash = val === 'nul' || val === 'NUL' || val === 'slash' || val === 'SLASH' || val === '/' || val === 'null' || val === 'NULL';

    if (isTick) {
      return <CheckIcon size={16} color="#16a34a" strokeWidth={2.8} />;
    }
    if (isCross) {
      return <CrossIcon size={16} color="#dc2626" strokeWidth={2.8} />;
    }
    if (isSlash) {
      return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <svg style={{ width: '100%', height: '100%', display: 'block' }} viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="0" y1="100" x2="100" y2="0" stroke="#000" strokeWidth="1.6" />
          </svg>
        </div>
      );
    }
    return <span style={{ fontSize: '11.5px', fontWeight: 'bold' }}>{val || ''}</span>;
  };

  return (
    <div
      style={{
        fontFamily: 'Arial, sans-serif',
        color: '#000',
        backgroundColor: '#fff',
        padding: isPdfMode ? '6px 8px' : '12px',
        border: '2px solid #000',
        width: '100%',
        maxWidth: isPdfMode ? 'none' : (isPrintMode ? '100%' : '760px'),
        margin: isPdfMode ? '0' : '0 auto',
        boxSizing: 'border-box'
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }} border="1">
        <tbody>
          <tr>
            <td rowSpan="4" style={{ padding: '0', textAlign: 'center', width: '22%', verticalAlign: 'middle', boxSizing: 'border-box' }}>
              <div style={{ borderBottom: '1px solid #000', padding: '6px 0' }}>
                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '900', fontFamily: 'Impact, sans-serif', letterSpacing: '1px' }}>SKF</h1>
              </div>
              <div style={{ borderBottom: '1px solid #000', padding: '4px 0', fontSize: '10px', fontWeight: 'bold' }}>
                SKF INDIA LTD,<br />TRB - ABU
              </div>
              <div style={{ padding: '4px 0', fontSize: '10px', fontWeight: 'bold' }}>
                ABU QA-HB
              </div>
            </td>
            <td rowSpan="4" style={{ textAlign: 'center', fontSize: isQualityEquipments ? '17px' : '19px', fontWeight: 'bold', width: '46%', verticalAlign: 'middle', letterSpacing: '0.5px', boxSizing: 'border-box' }}>
              {isQualityEquipments ? 'FIRST OFF INSPECTION QUALITY EQUIPMENTS' : 'FIRST OFF INSPECTION'}
            </td>
            <td style={{ fontSize: '11px', padding: '4px 6px', width: '18%', fontWeight: 'bold', boxSizing: 'border-box' }}>Format No.:</td>
            <td style={{ fontSize: '11px', padding: '4px 6px', width: '14%', fontWeight: 'bold', wordBreak: 'break-all', boxSizing: 'border-box' }}>{formData.formatNo}</td>
          </tr>
          <tr>
            <td style={{ fontSize: '11px', padding: '4px 6px', fontWeight: 'bold', boxSizing: 'border-box' }}>Revision No.:</td>
            <td style={{ fontSize: '11px', padding: '4px 6px', fontWeight: 'bold', boxSizing: 'border-box' }}>1</td>
          </tr>
          <tr>
            <td style={{ fontSize: '11px', padding: '4px 6px', fontWeight: 'bold', boxSizing: 'border-box' }}>Rev. Date:( YY/MM) :</td>
            <td style={{ fontSize: '11px', padding: '4px 6px', fontWeight: 'bold', boxSizing: 'border-box' }}>14/07</td>
          </tr>
          <tr>
            <td style={{ fontSize: '11px', padding: '4px 6px', fontWeight: 'bold', boxSizing: 'border-box' }}>Prep. By: AVS</td>
            <td style={{ fontSize: '11px', padding: '4px 6px', fontWeight: 'bold', boxSizing: 'border-box' }}>Appd By: SS</td>
          </tr>
        </tbody>
      </table>

      {isQualityEquipments ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: 'none', fontSize: '11.5px', tableLayout: 'fixed' }} border="1">
          <tbody>
            <tr>
              <td style={{ width: '33.33%', padding: '5px 8px', boxSizing: 'border-box' }}>
                <b>Type :-</b> {formData.type || ''}
              </td>
              <td style={{ width: '33.33%', padding: '5px 8px', boxSizing: 'border-box' }}>
                <b>Date :-</b> {formatDateToDDMMYY(formData.date)}
              </td>
              <td style={{ width: '33.33%', padding: '5px 8px', boxSizing: 'border-box' }}>
                <b>Channel :-</b> {formData.channelNo || ''}
              </td>
            </tr>
          </tbody>
        </table>
      ) : isAssembly ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: 'none', fontSize: '11.5px', tableLayout: 'fixed' }} border="1">
          <tbody>
            <tr>
              <td style={{ width: '60%', padding: '5px 8px', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span><b>ASSEMBLY</b></span>
                  <div><b>Cone Height MV =</b> {formData.coneHeightMV || formData.mv || ''}</div>
                </div>
              </td>
              <td style={{ width: '40%', padding: '5px 8px', boxSizing: 'border-box' }}>
                <b>DATE :</b> {formatDateToDDMMYY(formData.date)}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '5px 8px', boxSizing: 'border-box' }}>
                <b>CHANNEL NO :</b> {formData.channelNo}
              </td>
              <td style={{ padding: '5px 8px', boxSizing: 'border-box' }}>
                <b>SHIFT :</b> {formData.shift}
              </td>
            </tr>
            <tr>
              <td colSpan="2" style={{ padding: '5px 8px', boxSizing: 'border-box' }}>
                <b>TYPE :</b> {formData.type}
              </td>
            </tr>
          </tbody>
        </table>
      ) : isMarking ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: 'none', fontSize: '11.5px', tableLayout: 'fixed' }} border="1">
          <tbody>
            <tr>
              <td style={{ width: '60%', padding: '5px 8px', boxSizing: 'border-box' }}>
                <span><b>GRINDING :</b> {formData.grinding || ''}</span>
              </td>
              <td style={{ width: '40%', padding: '5px 8px', boxSizing: 'border-box' }}>
                <b>DATE :</b> {formatDateToDDMMYY(formData.date)}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '5px 8px', boxSizing: 'border-box' }}>
                <b>CHANNEL NO. :</b> {formData.channelNo}
              </td>
              <td style={{ padding: '5px 8px', boxSizing: 'border-box' }}>
                <b>SHIFT :</b> {formData.shift}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '5px 8px', boxSizing: 'border-box' }}>
                <b>TYPE :</b> {formData.type}
              </td>
              <td style={{ padding: '5px 8px', boxSizing: 'border-box' }}>
                <b>OPERATION :</b> {formData.operation || 'MARKING'}
              </td>
            </tr>
          </tbody>
        </table>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: 'none', fontSize: '11.5px', tableLayout: 'fixed' }} border="1">
          <tbody>
            <tr>
              <td style={{ width: '60%', padding: '5px 8px', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span><b>GRINDING :</b> {formData.grinding}</span>
                  <div><b>T.V =</b> {formData.tv}</div>
                </div>
              </td>
              <td style={{ width: '40%', padding: '5px 8px', boxSizing: 'border-box' }}>
                <b>DATE :</b> {formatDateToDDMMYY(formData.date)}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '5px 8px', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span><b>CHANNEL NO. :</b> {formData.channelNo}</span>
                  <div><b>M.V =</b> {formData.mv}</div>
                </div>
              </td>
              <td style={{ padding: '5px 8px', boxSizing: 'border-box' }}>
                <b>SHIFT :</b> {formData.shift}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '5px 8px', boxSizing: 'border-box' }}>
                <b>TYPE :</b> {formData.type}
              </td>
              <td style={{ padding: '5px 8px', boxSizing: 'border-box' }}>
                <b>MACHINE NO. :</b> {formData.machineNo}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '4px 8px', boxSizing: 'border-box' }}><b>OPERATION :</b> {formData.operation}</td>
              <td style={{ padding: '4px 8px', boxSizing: 'border-box' }}></td>
            </tr>
          </tbody>
        </table>
      )}

      {isQualityEquipments ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: 'none', textAlign: 'center', fontSize: '11px', border: '1px solid #000', tableLayout: 'fixed' }} border="1">
          <thead>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <th rowSpan="2" style={{ ...tableCellStyle, width: '9%', fontWeight: 'bold' }}>Sr. No.</th>
              <th rowSpan="2" style={{ ...tableCellStyle, width: '20%', fontWeight: 'bold' }}>Equipment Name</th>
              <th rowSpan="2" style={{ ...tableCellStyle, width: '26%', fontWeight: 'bold' }}>Parameter Checked</th>
              <th style={{ ...tableCellStyle, width: '15%', fontWeight: 'bold', fontSize: '10.5px' }}>Outlier Master Available</th>
              <th style={{ ...tableCellStyle, width: '15%', fontWeight: 'bold', fontSize: '10.5px' }}>Verification with Outlier Master</th>
              <th style={{ ...tableCellStyle, width: '15%', fontWeight: 'bold', fontSize: '10.5px' }}>Release for Production</th>
            </tr>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <th style={{ ...tableCellStyle, fontWeight: 'bold', fontSize: '10.5px' }}>Yes / No</th>
              <th style={{ ...tableCellStyle, fontWeight: 'bold', fontSize: '10.5px' }}>Yes / No</th>
              <th style={{ ...tableCellStyle, fontWeight: 'bold', fontSize: '10.5px' }}>Yes / No</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, rIdx) => {
              if (row.isSectionHeader) {
                return (
                  <tr key={row.id || `qe-hdr-${rIdx}`}>
                    <td colSpan="6" style={{ ...tableCellStyle, textAlign: 'left', padding: '4px 8px', fontWeight: 'bold', backgroundColor: '#f3f4f6' }}>
                      {row.sectionTitle}
                    </td>
                  </tr>
                );
              }
              if (row.spanAcross || row.spanText) {
                return (
                  <tr key={row.id || `qe-row-${rIdx}`}>
                    <td style={{ ...tableCellStyle, width: '9%' }}>{row.srNo}</td>
                    <td style={{ ...tableCellStyle, width: '20%', fontWeight: 'bold', textAlign: 'left', padding: '3px 6px' }}>{row.equipmentName}</td>
                    <td style={{ ...tableCellStyle, width: '26%', textAlign: 'left', padding: '3px 6px' }}>{row.parameterChecked}</td>
                    <td colSpan="3" style={{ ...tableCellStyle, fontWeight: 'bold', padding: '3px 6px' }}>
                      {row.spanText || row.outlierAvailable || ''}
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={row.id || `qe-row-${rIdx}`}>
                  <td style={{ ...tableCellStyle, width: '9%' }}>{row.srNo}</td>
                  <td style={{ ...tableCellStyle, width: '20%', fontWeight: 'bold', textAlign: 'left', padding: '3px 6px' }}>{row.equipmentName}</td>
                  <td style={{ ...tableCellStyle, width: '26%', textAlign: 'left', padding: '3px 6px' }}>{row.parameterChecked}</td>
                  <td style={{ ...tableCellStyle, width: '15%' }}>{renderSampleValue(row.outlierAvailable)}</td>
                  <td style={{ ...tableCellStyle, width: '15%' }}>{renderSampleValue(row.verificationOutlier)}</td>
                  <td style={{ ...tableCellStyle, width: '15%' }}>{renderSampleValue(row.releaseProduction)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : isMarking ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: 'none', textAlign: 'center', fontSize: '11.5px', border: '1px solid #000', tableLayout: 'fixed' }} border="1">
          <thead>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <th rowSpan="2" style={{ ...tableCellStyle, width: '28%', fontWeight: 'bold', padding: '4px' }}>PARAMETER</th>
              <th rowSpan="2" style={{ ...tableCellStyle, width: '37%', fontWeight: 'bold', padding: '4px' }}>CRITERIA</th>
              <th colSpan="5" style={{ ...tableCellStyle, width: '35%', fontWeight: 'bold', padding: '4px 0' }}>SAMPLE NO.</th>
            </tr>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <th style={{ ...tableCellStyle, width: '7%', fontWeight: 'bold' }}>1</th>
              <th style={{ ...tableCellStyle, width: '7%', fontWeight: 'bold' }}>2</th>
              <th style={{ ...tableCellStyle, width: '7%', fontWeight: 'bold' }}>3</th>
              <th style={{ ...tableCellStyle, width: '7%', fontWeight: 'bold' }}>4</th>
              <th style={{ ...tableCellStyle, width: '7%', fontWeight: 'bold' }}>5</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, rIdx) => {
              const samples = row.samples || ['', '', '', '', ''];
              return (
                <tr key={row.id || `mk-row-${rIdx}`}>
                  {rIdx === 0 && (
                    <td rowSpan={tableData.length} style={{ ...tableCellStyle, width: '28%', textAlign: 'left', padding: '6px 10px', fontWeight: 'bold', verticalAlign: 'middle' }}>
                      {row.parameter || '• Visual Inspection'}
                    </td>
                  )}
                  <td style={{ ...tableCellStyle, width: '37%', textAlign: 'left', padding: '6px 10px', fontWeight: 'bold' }}>
                    {row.criteria || row.subParameter || ''}
                  </td>
                  {samples.map((val, sIdx) => (
                    <td key={`mk-sample-${sIdx}`} style={{ ...tableCellStyle, width: '7%', position: 'relative' }}>
                      {renderSampleValue(val)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: 'none', textAlign: 'center', fontSize: '11.5px', border: '1px solid #000', tableLayout: 'fixed' }} border="1">
        <thead>
          <tr style={{ backgroundColor: '#f9fafb' }}>
            <th rowSpan="2" style={{ ...tableCellStyle, width: isAssembly ? '25%' : '28%', fontWeight: 'bold', padding: '4px', boxSizing: 'border-box' }}>PARAMETER</th>
            <th rowSpan="2" style={{ ...tableCellStyle, width: isAssembly ? '11%' : '14%', fontWeight: 'bold', boxSizing: 'border-box' }}>SYMBOL</th>
            <th rowSpan="2" style={{ ...tableCellStyle, width: '13%', fontWeight: 'bold', fontSize: '11.5px', boxSizing: 'border-box' }}>TOL (µm)</th>
            {isAssembly && (
              <th rowSpan="2" style={{ ...tableCellStyle, width: '11%', fontWeight: 'bold', fontSize: '11px', boxSizing: 'border-box' }}>SAMPLE SIZE</th>
            )}
            <th colSpan="5" style={{ ...tableCellStyle, width: isAssembly ? '40%' : '45%', fontWeight: 'bold', fontSize: '11.5px', padding: '4px 0', boxSizing: 'border-box' }}>{isAssembly ? 'READINGS' : 'SAMPLE NO.'}</th>
          </tr>
          <tr style={{ backgroundColor: '#f9fafb' }}>
            <th style={{ ...tableCellStyle, width: isAssembly ? '8%' : '9%', fontWeight: 'bold', boxSizing: 'border-box' }}>1</th>
            <th style={{ ...tableCellStyle, width: isAssembly ? '8%' : '9%', fontWeight: 'bold', boxSizing: 'border-box' }}>2</th>
            <th style={{ ...tableCellStyle, width: isAssembly ? '8%' : '9%', fontWeight: 'bold', boxSizing: 'border-box' }}>3</th>
            <th style={{ ...tableCellStyle, width: isAssembly ? '8%' : '9%', fontWeight: 'bold', boxSizing: 'border-box' }}>4</th>
            <th style={{ ...tableCellStyle, width: isAssembly ? '8%' : '9%', fontWeight: 'bold', boxSizing: 'border-box' }}>5</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row) => {
            if (row.isDoubleRow) {
              const r1 = row.samplesRow1 || ['', '', '', '', ''];
              const r2 = row.samplesRow2 || ['', '', '', '', ''];
              return (
                <React.Fragment key={`doc-double-row-${row.id}`}>
                  <tr>
                    <td rowSpan="2" style={{ ...tableCellStyle, width: isAssembly ? '25%' : '28%', textAlign: 'left', padding: '4px 6px', fontWeight: 'bold', boxSizing: 'border-box' }}>{row.parameter}</td>
                    <td rowSpan="2" style={{ ...tableCellStyle, width: isAssembly ? '11%' : '14%', fontWeight: 'bold', boxSizing: 'border-box' }}>{row.symbol}</td>
                    <td rowSpan="2" style={{ ...tableCellStyle, width: '13%', boxSizing: 'border-box' }}>{renderSampleValue(row.tol)}</td>
                    {isAssembly && (
                      <td rowSpan="2" style={{ ...tableCellStyle, width: '11%', fontWeight: 'bold', boxSizing: 'border-box' }}>
                        {row.sampleSize || ''}
                      </td>
                    )}
                    {r1.map((val, sIdx) => (
                      <td key={`r1-${sIdx}`} style={{ ...tableCellStyle, width: isAssembly ? '8%' : '9%', position: 'relative', boxSizing: 'border-box' }}>
                        {renderSampleValue(val)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    {r2.map((val, sIdx) => (
                      <td key={`r2-${sIdx}`} style={{ ...tableCellStyle, width: isAssembly ? '8%' : '9%', position: 'relative', boxSizing: 'border-box' }}>
                        {renderSampleValue(val)}
                      </td>
                    ))}
                  </tr>
                </React.Fragment>
              );
            }

            if (row.isVibrationRow) {
              const tolVal = parseDiagonalValue(row.tol);
              return (
                <tr key={`doc-row-${row.id}`}>
                  <td style={{ ...tableCellStyle, width: isAssembly ? '25%' : '28%', textAlign: 'left', padding: '4px 6px', fontWeight: 'bold', boxSizing: 'border-box' }}>
                    {row.parameter}
                  </td>
                  <td style={{ ...tableCellStyle, width: isAssembly ? '11%' : '14%', fontWeight: 'bold', boxSizing: 'border-box' }}>
                    {row.symbol}
                  </td>
                  <td style={{ ...tableCellStyle, width: '13%', position: 'relative', padding: 0, boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '30px' }}>
                      <span style={{ fontSize: '10.5px', fontWeight: 'bold', lineHeight: '13px' }}>{tolVal.top || 'Q'}</span>
                      <span style={{ fontSize: '10.5px', fontWeight: 'bold', lineHeight: '13px' }}>{tolVal.bottom || '66'}</span>
                    </div>
                  </td>
                  {isAssembly && (
                    <td style={{ ...tableCellStyle, width: '11%', fontWeight: 'bold', boxSizing: 'border-box' }}>
                      {row.sampleSize || '10'}
                    </td>
                  )}
                  {(row.samples || []).map((val, sIdx) => {
                    const vib = parseVibrationSample(val);
                    return (
                      <td key={sIdx} style={{ ...tableCellStyle, width: isAssembly ? '8%' : '9%', padding: 0, boxSizing: 'border-box' }}>
                        <div style={{ display: 'flex', width: '100%', height: '100%', minHeight: '30px' }}>
                          <div style={{ width: '50%', borderRight: '1px solid #000', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <span style={{ borderBottom: '0.5px solid #888', fontSize: '9.5px', fontWeight: 'bold', lineHeight: '14px', textAlign: 'center' }}>{vib.sub1.top || ''}</span>
                            <span style={{ fontSize: '9.5px', fontWeight: 'bold', lineHeight: '14px', textAlign: 'center' }}>{vib.sub1.bottom || ''}</span>
                          </div>
                          <div style={{ width: '50%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <span style={{ borderBottom: '0.5px solid #888', fontSize: '9.5px', fontWeight: 'bold', lineHeight: '14px', textAlign: 'center' }}>{vib.sub2.top || ''}</span>
                            <span style={{ fontSize: '9.5px', fontWeight: 'bold', lineHeight: '14px', textAlign: 'center' }}>{vib.sub2.bottom || ''}</span>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            }

            if (row.isDiagonalTol) {
              const tolVal = parseDiagonalValue(row.tol);
              const isTolNull = (tolVal.top === 'nul' || tolVal.top === 'NUL') && (tolVal.bottom === 'nul' || tolVal.bottom === 'NUL');
              return (
                <tr key={`doc-row-${row.id}`}>
                  <td style={{ ...tableCellStyle, width: isAssembly ? '25%' : '28%', textAlign: 'left', padding: '4px 6px', fontWeight: 'bold', boxSizing: 'border-box' }}>
                    {row.parameter}
                  </td>
                  <td style={{ ...tableCellStyle, width: isAssembly ? '11%' : '14%', fontWeight: 'bold', boxSizing: 'border-box' }}>
                    {row.symbol}
                  </td>
                  <td style={{ ...tableCellStyle, width: '13%', position: 'relative', padding: 0, boxSizing: 'border-box' }}>
                    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '28px' }}>
                      <svg
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                      >
                        <line x1="0" y1="100" x2="100" y2="0" stroke="#000" strokeWidth="1.2" />
                      </svg>
                      {!isTolNull && (
                        <>
                          <span style={{ position: 'absolute', top: '1px', left: '3px', fontSize: '10.5px', fontWeight: 'bold', lineHeight: 1 }}>
                            {tolVal.top}
                          </span>
                          <span style={{ position: 'absolute', bottom: '1px', right: '3px', fontSize: '10.5px', fontWeight: 'bold', lineHeight: 1 }}>
                            {tolVal.bottom}
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                  {isAssembly && (
                    <td style={{ ...tableCellStyle, width: '11%', fontWeight: 'bold', boxSizing: 'border-box' }}>
                      {row.sampleSize || ''}
                    </td>
                  )}
                  {(row.samples || []).map((val, sIdx) => (
                    <td key={sIdx} style={{ ...tableCellStyle, width: isAssembly ? '8%' : '9%', position: 'relative', boxSizing: 'border-box' }}>
                      {renderSampleValue(val)}
                    </td>
                  ))}
                </tr>
              );
            }

            if (row.isDiagonal || row.isDiagonalSplit) {
              const tolVal = parseDiagonalValue(row.tol);
              const isTolNull = (tolVal.top === 'nul' || tolVal.top === 'NUL') && (tolVal.bottom === 'nul' || tolVal.bottom === 'NUL');
              return (
                <tr key={`doc-row-${row.id}`}>
                  <td style={{ ...tableCellStyle, width: isAssembly ? '25%' : '28%', textAlign: 'left', padding: '4px 6px', fontWeight: 'bold', boxSizing: 'border-box' }}>
                    {row.parameter}
                  </td>
                  <td style={{ ...tableCellStyle, width: isAssembly ? '11%' : '14%', fontWeight: 'bold', boxSizing: 'border-box' }}>
                    {row.symbol}
                  </td>
                  <td style={{ ...tableCellStyle, width: '13%', position: 'relative', padding: 0, boxSizing: 'border-box' }}>
                    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '28px' }}>
                      <svg
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                      >
                        <line x1="0" y1="100" x2="100" y2="0" stroke="#000" strokeWidth="1.2" />
                      </svg>
                      {!isTolNull && (
                        <>
                          <span style={{ position: 'absolute', top: '1px', left: '3px', fontSize: '10.5px', fontWeight: 'bold', lineHeight: 1 }}>
                            {tolVal.top}
                          </span>
                          <span style={{ position: 'absolute', bottom: '1px', right: '3px', fontSize: '10.5px', fontWeight: 'bold', lineHeight: 1 }}>
                            {tolVal.bottom}
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                  {isAssembly && (
                    <td style={{ ...tableCellStyle, width: '11%', fontWeight: 'bold', boxSizing: 'border-box' }}>
                      {row.sampleSize || ''}
                    </td>
                  )}
                  {(row.samples || []).map((val, sIdx) => {
                    const dVal = parseDiagonalValue(val);
                    const isNull = (dVal.top === 'nul' || dVal.top === 'NUL') && (dVal.bottom === 'nul' || dVal.bottom === 'NUL');
                    return (
                      <td key={sIdx} style={{ ...tableCellStyle, width: isAssembly ? '8%' : '9%', position: 'relative', padding: 0, boxSizing: 'border-box' }}>
                        <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '28px' }}>
                          <svg
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                          >
                            <line x1="0" y1="100" x2="100" y2="0" stroke="#000" strokeWidth="1.2" />
                          </svg>
                          {!isNull && (
                            <>
                              <span style={{ position: 'absolute', top: '1px', left: '3px', fontSize: '10.5px', fontWeight: 'bold', lineHeight: 1 }}>
                                {dVal.top}
                              </span>
                              <span style={{ position: 'absolute', bottom: '1px', right: '3px', fontSize: '10.5px', fontWeight: 'bold', lineHeight: 1 }}>
                                {dVal.bottom}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            }

            if (row.isSpanSymbolTol) {
              return (
                <tr key={`doc-row-${row.id}`}>
                  <td style={{ ...tableCellStyle, width: isAssembly ? '25%' : '28%', textAlign: 'left', padding: '4px 6px', fontWeight: 'bold', boxSizing: 'border-box' }}>
                    {row.parameter}
                  </td>
                  <td colSpan="2" style={{ ...tableCellStyle, width: '27%', fontWeight: 'bold', boxSizing: 'border-box' }}>
                    {row.symbol}
                  </td>
                  {isAssembly && (
                    <td style={{ ...tableCellStyle, width: '11%', fontWeight: 'bold', boxSizing: 'border-box' }}>
                      {row.sampleSize || ''}
                    </td>
                  )}
                  {row.samples.map((val, sIdx) => (
                    <td key={sIdx} style={{ ...tableCellStyle, width: isAssembly ? '8%' : '9%', position: 'relative', boxSizing: 'border-box' }}>
                      {renderSampleValue(val)}
                    </td>
                  ))}
                </tr>
              );
            }

            if (row.isVisualGroup) {
              return (
                <tr key={`doc-row-${row.id}`}>
                  {row.isFirstInGroup && (
                    <td rowSpan={row.groupRowSpan || 2} style={{ ...tableCellStyle, width: isAssembly ? '25%' : '28%', textAlign: 'left', padding: '4px 6px', fontWeight: 'bold', boxSizing: 'border-box' }}>
                      {row.parameter || '• Visual Inspection'}
                    </td>
                  )}
                  <td colSpan="2" style={{ ...tableCellStyle, width: '27%', textAlign: 'left', padding: '4px 6px', fontWeight: 'bold', boxSizing: 'border-box' }}>
                    {row.subParameter}
                  </td>
                  {isAssembly && (
                    <td style={{ ...tableCellStyle, width: '11%', fontWeight: 'bold', boxSizing: 'border-box' }}>
                      {row.sampleSize || ''}
                    </td>
                  )}
                  {row.samples.map((val, sIdx) => (
                    <td key={sIdx} style={{ ...tableCellStyle, width: isAssembly ? '8%' : '9%', position: 'relative', boxSizing: 'border-box' }}>
                      {renderSampleValue(val)}
                    </td>
                  ))}
                </tr>
              );
            }

            if (row.isVkrGroup) {
              return (
                <tr key={`doc-row-${row.id}`}>
                  {row.isFirstInGroup && (
                    <td rowSpan="3" style={{ ...tableCellStyle, width: isAssembly ? '25%' : '28%', textAlign: 'left', padding: '4px 6px', fontWeight: 'bold', boxSizing: 'border-box' }}>
                      • Track VKR (µm/s)
                    </td>
                  )}
                  <td style={{ ...tableCellStyle, width: isAssembly ? '11%' : '14%', textAlign: 'left', padding: '4px 6px', fontWeight: 'bold', boxSizing: 'border-box' }}>{row.subParameter}</td>
                  <td style={{ ...tableCellStyle, width: '13%', position: 'relative', boxSizing: 'border-box' }}>{renderSampleValue(row.tol)}</td>
                  {isAssembly && (
                    <td style={{ ...tableCellStyle, width: '11%', fontWeight: 'bold', boxSizing: 'border-box' }}>
                      {row.sampleSize || ''}
                    </td>
                  )}
                  {row.samples.map((val, sIdx) => (
                    <td key={sIdx} style={{ ...tableCellStyle, width: isAssembly ? '8%' : '9%', position: 'relative', boxSizing: 'border-box' }}>
                      {renderSampleValue(val)}
                    </td>
                  ))}
                </tr>
              );
            }

            if (row.isHoningVkrGroup) {
              return (
                <tr key={`doc-row-${row.id}`}>
                  {row.isFirstInGroup && (
                    <>
                      <td rowSpan="3" style={{ ...tableCellStyle, width: isAssembly ? '25%' : '28%', textAlign: 'left', padding: '4px 6px', fontWeight: 'bold', boxSizing: 'border-box' }}>
                        {row.parameter || 'Track VKR (µm/s)'}
                      </td>
                      <td rowSpan="3" style={{ ...tableCellStyle, width: isAssembly ? '11%' : '14%', fontWeight: 'bold', boxSizing: 'border-box', whiteSpace: 'pre-line', lineHeight: '1.4' }}>
                        {row.symbol || "L , M , H\nor\nW Parameters"}
                      </td>
                    </>
                  )}
                  <td style={{ ...tableCellStyle, width: '13%', position: 'relative', boxSizing: 'border-box' }}>
                    {renderSampleValue(row.tol)}
                  </td>
                  {isAssembly && (
                    <td style={{ ...tableCellStyle, width: '11%', fontWeight: 'bold', boxSizing: 'border-box' }}>
                      {row.sampleSize || ''}
                    </td>
                  )}
                  {row.samples.map((val, sIdx) => (
                    <td key={sIdx} style={{ ...tableCellStyle, width: isAssembly ? '8%' : '9%', position: 'relative', boxSizing: 'border-box' }}>
                      {renderSampleValue(val)}
                    </td>
                  ))}
                </tr>
              );
            }

            return (
              <tr key={`doc-row-${row.id}`}>
                <td style={{ ...tableCellStyle, width: isAssembly ? '25%' : '28%', textAlign: 'left', padding: '4px 6px', fontWeight: 'bold', whiteSpace: 'pre-line', boxSizing: 'border-box' }}>{row.parameter}</td>
                <td style={{ ...tableCellStyle, width: isAssembly ? '11%' : '14%', fontWeight: 'bold', boxSizing: 'border-box' }}>{row.symbol}</td>
                <td style={{ ...tableCellStyle, width: '13%', position: 'relative', boxSizing: 'border-box', whiteSpace: 'pre-line', fontSize: row.isStackedTol ? '10px' : '11.5px', lineHeight: '1.2' }}>{renderSampleValue(row.tol)}</td>
                {isAssembly && (
                  <td style={{ ...tableCellStyle, width: '11%', fontWeight: 'bold', boxSizing: 'border-box' }}>
                    {row.sampleSize || ''}
                  </td>
                )}
                {row.samples.map((val, sIdx) => (
                  <td key={sIdx} style={{ ...tableCellStyle, width: isAssembly ? '8%' : '9%', position: 'relative', boxSizing: 'border-box' }}>
                    {renderSampleValue(val)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      )}

      {isAssembly && (
        <div style={{ border: '1px solid #000', borderTop: 'none', padding: '4px 10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px', fontSize: '11.5px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <b style={{ fontSize: '12px' }}>OK</b>
            <div style={{ width: '38px', height: '20px', border: '1.5px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckIcon size={14} color="#16a34a" strokeWidth={3} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <b style={{ fontSize: '12px' }}>NOT OK</b>
            <div style={{ width: '38px', height: '20px', border: '1.5px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CrossIcon size={14} color="#dc2626" strokeWidth={3} />
            </div>
          </div>
        </div>
      )}

      {isQualityEquipments ? (
        <div style={{ border: '1px solid #000', borderTop: 'none', padding: '5px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '15px', boxSizing: 'border-box' }}>
          <b>Setup Approval :-</b>
          <span style={{ fontWeight: 'bold', textDecoration: (formData.setupApproval === 'Approved' || formData.machineReleased === 'YES') ? 'underline' : 'none' }}>
            {formData.setupApproval || (formData.machineReleased === 'YES' ? 'Approved' : (formData.machineReleased === 'NO' ? 'Not Approved' : 'Approved / Not Approved'))}
          </span>
        </div>
      ) : (
        <div style={{ border: '1px solid #000', borderTop: 'none', padding: '5px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' }}>
          <b>{isAssembly ? 'ASSEMBLY PROCESS RELEASED FOR PRODUCTION :' : 'Machine Released for Production :'}</b>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <b>YES / NO</b>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', color: formData.machineReleased === 'YES' ? 'green' : '#64748b' }}>
              <SvgCheckbox checked={formData.machineReleased === 'YES'} color={formData.machineReleased === 'YES' ? 'green' : '#64748b'} /> YES
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', color: formData.machineReleased === 'NO' ? 'red' : '#64748b' }}>
              <SvgCheckbox checked={formData.machineReleased === 'NO'} color={formData.machineReleased === 'NO' ? 'red' : '#64748b'} /> NO
            </span>
          </div>
        </div>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse", borderTop: "none", fontSize: "11px", tableLayout: 'fixed' }} border="1">
        <tbody>
          <tr>
            <td style={{ padding: "6px 8px", verticalAlign: "top", width: "38%", boxSizing: 'border-box' }}>
              {reasons.map((reason) => (
                <div key={reason.id} style={{ marginBottom: "2px", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1px 4px" }}>
                  <span style={{ fontSize: '10.5px' }}>{reason.label}</span>
                  <SvgCheckbox checked={formData.reasonSelected === reason.id} size={13} />
                </div>
              ))}
            </td>
            <td style={{ verticalAlign: "top", padding: "0", width: "62%", boxSizing: 'border-box' }}>
              <table style={{ width: "100%", borderCollapse: "collapse", margin: 0, tableLayout: 'fixed' }} border="1">
                <tbody>
                  <tr style={{ height: "24px", textAlign: "center" }}>
                    <td style={{ width: "34%", padding: "3px", boxSizing: 'border-box' }}></td>
                    <td style={{ width: "33%", padding: "3px", fontWeight: "bold", boxSizing: 'border-box' }}>Inspector</td>
                    <td style={{ width: "33%", padding: "3px", fontWeight: "bold", boxSizing: 'border-box' }}>{(isAssembly || isQualityEquipments) ? 'Setter / Supervisor' : 'Supervisor'}</td>
                  </tr>
                  <tr style={{ height: "26px", textAlign: "center" }}>
                    <td style={{ fontWeight: "bold", padding: "3px 5px", textAlign: "left", boxSizing: 'border-box' }}>Signature</td>
                    <td style={{ padding: "3px", boxSizing: 'border-box' }}>{formData.inspectorSignature || ''}</td>
                    <td style={{ padding: "3px", boxSizing: 'border-box' }}>{formData.supervisorSignature || ''}</td>
                  </tr>
                  <tr style={{ height: "26px", textAlign: "center" }}>
                    <td style={{ fontWeight: "bold", padding: "3px 5px", textAlign: "left", boxSizing: 'border-box' }}>Name</td>
                    <td style={{ padding: "3px", fontWeight: 'bold', boxSizing: 'border-box' }}>{formData.inspectorName || ''}</td>
                    <td style={{ padding: "3px", fontWeight: 'bold', boxSizing: 'border-box' }}>{formData.supervisorName || ''}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td colSpan="2" style={{ padding: "5px 8px", fontSize: "10px", boxSizing: 'border-box' }}>
              • In respect of all the parameters, conforming status of parameter shall be indicated by √ sign and non-confirming status by X sign
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ==========================================
// 2. SUB-COMPONENTS
// ==========================================

function ReasonAndAuthorizationSection({ formData, setFormData }) {
  const isQE = isQualityEquipmentsForm(formData.formatNo, formData.operation);
  const reasons = [
    { id: 1, label: "1) Type Change" },
    { id: 2, label: "2) Major Breakdown" },
    { id: 3, label: isQE ? "3) Shift Change" : "3) Shut Down" },
    { id: 4, label: "4) Major Tooling Change" },
    { id: 5, label: isQE ? "5) Man / Machine Change" : "5) Material Change" }
  ];

  const handleReasonClick = (id) => {
    setFormData((prev) => ({
      ...prev,
      reasonSelected: prev.reasonSelected === id ? null : id
    }));
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div style={{ marginTop: '0px' }}>
      <table style={{ width: "100%", borderCollapse: "collapse", borderTop: "none", fontSize: "11px" }} border="1">
        <tbody>
          <tr>
            <td style={{ padding: "8px", verticalAlign: "top", width: "38%" }}>
              {reasons.map((reason) => (
                <div
                  key={reason.id}
                  onClick={() => handleReasonClick(reason.id)}
                  style={{ cursor: "pointer", marginBottom: "3px", userSelect: "none", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1px 4px" }}
                >
                  <span style={{ fontSize: '11px' }}>{reason.label}</span>
                  <SvgCheckbox checked={formData.reasonSelected === reason.id} size={14} />
                </div>
              ))}
            </td>

            <td style={{ verticalAlign: "top", padding: "0", width: "62%" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", margin: 0 }} border="1">
                <tbody>
                  <tr style={{ height: "25px", textAlign: "center" }}>
                    <td style={{ width: "34%", padding: "4px" }}></td>
                    <td style={{ width: "33%", fontWeight: "bold", padding: "4px" }}>Inspector</td>
                    <td style={{ width: "33%", fontWeight: "bold", padding: "4px" }}>Setter / Supervisor</td>
                  </tr>
                  <tr style={{ height: "35px" }}>
                    <td style={{ padding: "4px 8px", fontWeight: "bold" }}>Signature</td>
                    <td style={{ textAlign: "center", padding: "3px" }}>
                      <input
                        type="text"
                        value={formData.inspectorSignature || ''}
                        onChange={(e) => handleChange("inspectorSignature", e.target.value)}
                        placeholder="Signature"
                        style={{ width: "90%", height: "22px", textAlign: "center", border: "none", outline: "none", backgroundColor: "transparent", fontFamily: "cursive", fontSize: "14px" }}
                      />
                    </td>
                    <td style={{ textAlign: "center", padding: "3px" }}>
                      <input
                        type="text"
                        value={formData.supervisorSignature || ''}
                        onChange={(e) => handleChange("supervisorSignature", e.target.value)}
                        placeholder="Signature"
                        style={{ width: "90%", height: "22px", textAlign: "center", border: "none", outline: "none", backgroundColor: "transparent", fontFamily: "cursive", fontSize: "14px" }}
                      />
                    </td>
                  </tr>
                  <tr style={{ height: "35px" }}>
                    <td style={{ padding: "4px 8px", fontWeight: "bold" }}>Name</td>
                    <td style={{ textAlign: "center", padding: "3px" }}>
                      <input
                        type="text"
                        value={formData.inspectorName || ''}
                        onChange={(e) => handleChange("inspectorName", e.target.value)}
                        placeholder="Inspector Name"
                        style={{ width: "90%", height: "22px", textAlign: "center", border: "none", outline: "none", backgroundColor: "transparent", fontSize: "13px" }}
                      />
                    </td>
                    <td style={{ textAlign: "center", padding: "3px" }}>
                      <input
                        type="text"
                        value={formData.supervisorName || ''}
                        onChange={(e) => handleChange("supervisorName", e.target.value)}
                        placeholder="Supervisor Name"
                        style={{ width: "90%", height: "22px", textAlign: "center", border: "none", outline: "none", backgroundColor: "transparent", fontSize: "13px" }}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td colSpan="2" style={{ padding: "6px 8px", fontSize: "10px" }}>
              • In respect of all the parameters, conforming status of parameter shall be indicated by √ sign and non-confirming status by X sign
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function ValueOrNullCell({
  value,
  onChange,
  style = {},
  inputStyle = {},
  placeholder = '',
  tdProps = {}
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef(null);

  const isSlash = value === 'nul' || value === 'NUL' || value === 'slash' || value === 'SLASH' || value === '/' || value === 'null' || value === 'NULL';

  const handleInputChange = (e) => {
    const v = e.target.value;
    if (v === '/' || v === '\\' || v.toLowerCase() === 'nul' || v.toLowerCase() === 'null') {
      onChange('nul');
    } else {
      onChange(v);
    }
  };

  const setNull = () => {
    onChange('nul');
    setIsFocused(false);
  };

  const clearSlashAndEdit = () => {
    onChange('');
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 50);
  };

  return (
    <td
      {...tdProps}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={(e) => {
        e.preventDefault();
        onChange(isSlash ? '' : 'nul');
      }}
      style={{
        ...style,
        padding: 0,
        position: 'relative',
        userSelect: isSlash ? 'none' : 'auto'
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          minHeight: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {isSlash ? (
          <div
            onClick={clearSlashAndEdit}
            title="Click to remove slash and type value"
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg
              style={{ width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <line
                x1="0"
                y1="100"
                x2="100"
                y2="0"
                stroke="#000"
                strokeWidth="1.6"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {isHovered && (
              <button
                type="button"
                data-html2canvas-ignore="true"
                onClick={(e) => {
                  e.stopPropagation();
                  clearSlashAndEdit();
                }}
                title="Clear slash"
                style={{
                  position: 'absolute',
                  right: '2px',
                  top: '2px',
                  width: '16px',
                  height: '16px',
                  padding: 0,
                  border: '1px solid #94a3b8',
                  borderRadius: '3px',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <CloseIcon size={10} color="#475569" />
              </button>
            )}
          </div>
        ) : (
          <>
            <input
              ref={inputRef}
              type="text"
              value={value || ''}
              onChange={handleInputChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setTimeout(() => setIsFocused(false), 200);
              }}
              placeholder={placeholder}
              style={inputStyle}
            />

            {isHovered && !isFocused && (
              <button
                type="button"
                data-html2canvas-ignore="true"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setNull();
                }}
                title="Keep cell null with a slash"
                style={{
                  position: 'absolute',
                  right: '2px',
                  top: '2px',
                  width: '16px',
                  height: '16px',
                  padding: 0,
                  border: '1px solid #cbd5e1',
                  borderRadius: '3px',
                  backgroundColor: '#f8fafc',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 5,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10">
                  <line x1="1" y1="9" x2="9" y2="1" stroke="#334155" strokeWidth="1.5" />
                </svg>
              </button>
            )}

            {isFocused && (
              <div
                data-html2canvas-ignore="true"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setNull();
                }}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 3px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 9999,
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '5px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                  padding: '3px 7px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap'
                }}
                title="Click to keep this cell null with a slash"
              >
                <span
                  style={{
                    width: '14px',
                    height: '12px',
                    border: '1px solid #000',
                    display: 'inline-block',
                    position: 'relative',
                    backgroundColor: '#fff'
                  }}
                >
                  <svg
                    style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
                    viewBox="0 0 14 12"
                    preserveAspectRatio="none"
                  >
                    <line x1="0" y1="12" x2="14" y2="0" stroke="#000" strokeWidth="1.5" />
                  </svg>
                </span>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f172a' }}>
                  Set Null (Slash)
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </td>
  );
}

function DiagonalInputCell({
  value,
  onChange,
  style = {},
  tdProps = {}
}) {
  const dVal = parseDiagonalValue(value);

  const handleTopChange = (e) => {
    const v = e.target.value;
    if (v.includes('/')) {
      const parts = v.split('/');
      onChange({ top: parts[0].trim(), bottom: parts.slice(1).join('/').trim() });
    } else {
      onChange({ top: v, bottom: dVal.bottom });
    }
  };

  const handleBottomChange = (e) => {
    const v = e.target.value;
    onChange({ top: dVal.top, bottom: v });
  };

  const isNull = (dVal.top === 'nul' || dVal.top === 'NUL') && (dVal.bottom === 'nul' || dVal.bottom === 'NUL');

  return (
    <td
      {...tdProps}
      onContextMenu={(e) => {
        e.preventDefault();
        if (isNull) {
          onChange({ top: '', bottom: '' });
        } else {
          onChange({ top: 'nul', bottom: 'nul' });
        }
      }}
      style={{
        ...style,
        padding: 0,
        position: 'relative',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          minHeight: '32px',
          display: 'flex'
        }}
      >
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <line x1="0" y1="100" x2="100" y2="0" stroke="#000" strokeWidth="1.2" />
        </svg>

        {!isNull && (
          <>
            <input
              type="text"
              value={dVal.top}
              onChange={handleTopChange}
              style={{
                position: 'absolute',
                top: '1px',
                left: '2px',
                width: '45%',
                height: '45%',
                fontSize: '11px',
                fontWeight: 'bold',
                textAlign: 'center',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                padding: 0,
                color: '#000'
              }}
            />
            <input
              type="text"
              value={dVal.bottom}
              onChange={handleBottomChange}
              style={{
                position: 'absolute',
                bottom: '1px',
                right: '2px',
                width: '45%',
                height: '45%',
                fontSize: '11px',
                fontWeight: 'bold',
                textAlign: 'center',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                padding: 0,
                color: '#000'
              }}
            />
          </>
        )}
      </div>
    </td>
  );
}

function InspectionTemplate({ printRef, formData, setFormData, tableData, setTableData, onSubmit, onAttachmentChange, attachedPdfName }) {
  const [activeVisualCell, setActiveVisualCell] = useState(null); // { rIdx, sIdx }
  const popupRef = useRef(null);
  const isQualityEquipments = isQualityEquipmentsForm(formData.formatNo, formData.operation);
  const isAssembly = !isQualityEquipments && isAssemblyForm(formData.formatNo, formData.operation);
  const isMarking = !isQualityEquipments && !isAssembly && isMarkingForm(formData.formatNo, formData.operation, formData.grinding);

  const handleQeCellChange = (rowIndex, field, value) => {
    const updatedTable = tableData.map((row, rIdx) => {
      if (rIdx === rowIndex) {
        return { ...row, [field]: value };
      }
      return row;
    });
    setTableData(updatedTable);
  };

  const handleVisualSelect = (rIdx, sIdx, val) => {
    handleSampleChange(rIdx, sIdx, val);
    setActiveVisualCell(null);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setActiveVisualCell(null);
      }
    };
    const handleKeyDown = (e) => {
      if (!activeVisualCell) return;
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        if (e.key === 'Escape' || e.key === 'Enter') {
          setActiveVisualCell(null);
        }
        return;
      }
      if (e.key === 'Escape') {
        setActiveVisualCell(null);
      } else if (e.key === '1' || e.key.toLowerCase() === 't' || e.key.toLowerCase() === 'v') {
        handleVisualSelect(activeVisualCell.rIdx, activeVisualCell.sIdx, '✓');
      } else if (e.key === '2' || e.key.toLowerCase() === 'c' || e.key.toLowerCase() === 'x') {
        handleVisualSelect(activeVisualCell.rIdx, activeVisualCell.sIdx, '✗');
      } else if (e.key === '3' || e.key.toLowerCase() === 's' || e.key.toLowerCase() === 'n' || e.key === '/') {
        handleVisualSelect(activeVisualCell.rIdx, activeVisualCell.sIdx, 'nul');
      } else if (e.key === 'Delete' || e.key === 'Backspace' || e.key === '0') {
        handleVisualSelect(activeVisualCell.rIdx, activeVisualCell.sIdx, '');
      }
    };

    if (activeVisualCell) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeVisualCell]);

  const handleSampleChange = (rowIndex, sampleIndex, value, rowNum = 1) => {
    const updatedTable = tableData.map((row, rIdx) => {
      if (rIdx !== rowIndex) return row;
      if (row.isDoubleRow) {
        const r1 = row.samplesRow1 ? [...row.samplesRow1] : ['', '', '', '', ''];
        const r2 = row.samplesRow2 ? [...row.samplesRow2] : ['', '', '', '', ''];
        if (rowNum === 1) {
          r1[sampleIndex] = value;
          return { ...row, samplesRow1: r1, samplesRow2: r2 };
        } else {
          r2[sampleIndex] = value;
          return { ...row, samplesRow1: r1, samplesRow2: r2 };
        }
      }
      if (row.samples) {
        const nextSamples = [...row.samples];
        nextSamples[sampleIndex] = value;
        return { ...row, samples: nextSamples };
      }
      return row;
    });
    setTableData(updatedTable);
  };

  const handleTolChange = (rowIndex, value) => {
    const updatedTable = tableData.map((row, rIdx) => {
      if (rIdx === rowIndex) {
        return { ...row, tol: value };
      }
      return row;
    });
    setTableData(updatedTable);
  };

  const handleSampleSizeChange = (rowIndex, value) => {
    const updatedTable = tableData.map((row, rIdx) => {
      if (rIdx === rowIndex) {
        return { ...row, sampleSize: value };
      }
      return row;
    });
    setTableData(updatedTable);
  };

  const handleVibrationChange = (rowIndex, sampleIndex, subKey, posKey, value) => {
    const updatedTable = tableData.map((row, rIdx) => {
      if (rIdx !== rowIndex) return row;
      const nextSamples = [...(row.samples || [])];
      const current = parseVibrationSample(nextSamples[sampleIndex]);
      nextSamples[sampleIndex] = {
        ...current,
        [subKey]: {
          ...current[subKey],
          [posKey]: value
        }
      };
      return { ...row, samples: nextSamples };
    });
    setTableData(updatedTable);
  };

  const cellInputStyle = {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: '13px',
    padding: '4px 0'
  };

  const tableCellStyle = {
    border: '1px solid #000',
    padding: '0px',
    height: '32px',
    textAlign: 'center',
    verticalAlign: 'middle'
  };

  const renderMarkingSampleCell = (val, rIdx, sIdx) => {
    const isCellActive = activeVisualCell?.rIdx === rIdx && activeVisualCell?.sIdx === sIdx;
    const isTick = val === '✓' || val === 'tick' || val === 'TICK' || val === 'v' || val === 'V';
    const isCross = val === '✗' || val === 'cross' || val === 'CROSS' || val === 'x' || val === 'X';
    const isSlash = val === 'nul' || val === 'NUL' || val === 'slash' || val === 'SLASH' || val === '/' || val === 'null' || val === 'NULL';

    const popupAlignStyle = sIdx >= 3
      ? { right: 0, left: 'auto', transform: 'none' }
      : sIdx <= 1
        ? { left: 0, right: 'auto', transform: 'none' }
        : { left: '50%', right: 'auto', transform: 'translateX(-50%)' };

    return (
      <td
        key={`mk-cell-${sIdx}`}
        onClick={(e) => {
          e.stopPropagation();
          setActiveVisualCell(isCellActive ? null : { rIdx, sIdx });
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          handleVisualSelect(rIdx, sIdx, isSlash ? '' : 'nul');
        }}
        style={{
          ...tableCellStyle,
          width: '7%',
          padding: 0,
          position: 'relative',
          cursor: 'pointer',
          backgroundColor: isCellActive ? '#eff6ff' : 'transparent',
          userSelect: 'none'
        }}
        title="Click to select: Check (✓), Cross (✗), or Diagonal Null (/)"
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            minHeight: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isTick && <CheckIcon size={18} color="#16a34a" strokeWidth={3} />}
          {isCross && <CrossIcon size={18} color="#dc2626" strokeWidth={3} />}
          {isSlash && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none'
              }}
            >
              <svg
                style={{ width: '100%', height: '100%', display: 'block' }}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <line
                  x1="0"
                  y1="100"
                  x2="100"
                  y2="0"
                  stroke="#000"
                  strokeWidth="1.6"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
          )}

          {isCellActive && (
            <div
              ref={popupRef}
              data-html2canvas-ignore="true"
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: 'calc(100% + 3px)',
                ...popupAlignStyle,
                zIndex: 9999,
                backgroundColor: '#ffffff',
                boxShadow: '0 8px 24px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08)',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '6px',
                width: '180px',
                textAlign: 'left'
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', padding: '3px 8px 5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Select Option
              </div>

              {/* Option 1: Tick / Check */}
              <button
                type="button"
                onClick={() => handleVisualSelect(rIdx, sIdx, '✓')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 8px',
                  border: isTick ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                  borderRadius: '5px',
                  backgroundColor: isTick ? '#ecfdf5' : '#ffffff',
                  cursor: 'pointer',
                  marginBottom: '4px',
                  textAlign: 'left'
                }}
              >
                <span style={{ width: '22px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <CheckIcon size={16} color="#16a34a" />
                </span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#15803d' }}>Check (✓)</span>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>Conforming</span>
                </div>
              </button>

              {/* Option 2: Cross */}
              <button
                type="button"
                onClick={() => handleVisualSelect(rIdx, sIdx, '✗')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 8px',
                  border: isCross ? '1.5px solid #dc2626' : '1px solid #e2e8f0',
                  borderRadius: '5px',
                  backgroundColor: isCross ? '#fef2f2' : '#ffffff',
                  cursor: 'pointer',
                  marginBottom: '4px',
                  textAlign: 'left'
                }}
              >
                <span style={{ width: '22px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <CrossIcon size={16} color="#dc2626" />
                </span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#b91c1c' }}>Cross (✗)</span>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>Non-conforming</span>
                </div>
              </button>

              {/* Option 3: Diagonal Null */}
              <button
                type="button"
                onClick={() => handleVisualSelect(rIdx, sIdx, 'nul')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 8px',
                  border: isSlash ? '1.5px solid #000000' : '1px solid #e2e8f0',
                  borderRadius: '5px',
                  backgroundColor: isSlash ? '#f1f5f9' : '#ffffff',
                  cursor: 'pointer',
                  marginBottom: '4px',
                  textAlign: 'left'
                }}
              >
                <span
                  style={{
                    width: '22px',
                    height: '18px',
                    border: '1px solid #000',
                    position: 'relative',
                    display: 'inline-block',
                    backgroundColor: '#fff'
                  }}
                >
                  <svg
                    style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
                    viewBox="0 0 20 20"
                    preserveAspectRatio="none"
                  >
                    <line x1="0" y1="20" x2="20" y2="0" stroke="#000" strokeWidth="1.8" />
                  </svg>
                </span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#000000' }}>Diagonal Null</span>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>Nul / Not Applicable</span>
                </div>
              </button>

              {/* Clear Option */}
              {val && (
                <button
                  type="button"
                  onClick={() => handleVisualSelect(rIdx, sIdx, '')}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '5px 8px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '5px',
                    backgroundColor: '#f8fafc',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ width: '22px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <BackspaceIcon size={13} color="#64748b" />
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Clear</span>
                </button>
              )}
            </div>
          )}
        </div>
      </td>
    );
  };

  const renderVisualSampleCell = (val, rIdx, sIdx) => {
    const isCellActive = activeVisualCell?.rIdx === rIdx && activeVisualCell?.sIdx === sIdx;
    const isTick = val === '✓' || val === 'tick' || val === 'TICK';
    const isCross = val === '✗' || val === 'cross' || val === 'CROSS' || val === 'x' || val === 'X';
    const isSlash = val === 'nul' || val === 'NUL' || val === 'slash' || val === 'SLASH' || val === '/' || val === 'null' || val === 'NULL';

    const popupAlignStyle = sIdx >= 3
      ? { right: 0, left: 'auto', transform: 'none' }
      : sIdx <= 1
        ? { left: 0, right: 'auto', transform: 'none' }
        : { left: '50%', right: 'auto', transform: 'translateX(-50%)' };

    return (
      <td
        key={sIdx}
        onClick={(e) => {
          e.stopPropagation();
          setActiveVisualCell(isCellActive ? null : { rIdx, sIdx });
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          handleVisualSelect(rIdx, sIdx, isSlash ? '' : 'nul');
        }}
        style={{
          ...tableCellStyle,
          width: isAssembly ? '8%' : '9%',
          padding: 0,
          position: 'relative',
          cursor: 'pointer',
          backgroundColor: isCellActive ? '#eff6ff' : 'transparent',
          userSelect: 'none'
        }}
        title="Click to select: Tick, Cross, Diagonal Slash (Nul), or enter reading (Right-click to toggle slash)"
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            minHeight: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isTick && (
            <CheckIcon size={18} color="#16a34a" />
          )}

          {isCross && (
            <CrossIcon size={18} color="#dc2626" />
          )}

          {isSlash && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none'
              }}
            >
              <svg
                style={{ width: '100%', height: '100%', display: 'block' }}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <line
                  x1="0"
                  y1="100"
                  x2="100"
                  y2="0"
                  stroke="#000"
                  strokeWidth="1.6"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
          )}

          {!isTick && !isCross && !isSlash && val && (
            <span style={{ fontSize: '11.5px', fontWeight: 'bold' }}>{val}</span>
          )}

          {isCellActive && (
            <div
              ref={popupRef}
              data-html2canvas-ignore="true"
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: 'calc(100% + 3px)',
                ...popupAlignStyle,
                zIndex: 9999,
                backgroundColor: '#ffffff',
                boxShadow: '0 8px 24px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08)',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '6px',
                width: '190px',
                textAlign: 'left'
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', padding: '3px 8px 5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Select Option
              </div>

              {/* Option 1: Tick */}
              <button
                type="button"
                onClick={() => handleVisualSelect(rIdx, sIdx, '✓')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 8px',
                  border: isTick ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                  borderRadius: '5px',
                  backgroundColor: isTick ? '#ecfdf5' : '#ffffff',
                  cursor: 'pointer',
                  marginBottom: '4px',
                  textAlign: 'left'
                }}
              >
                <span style={{ width: '22px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <CheckIcon size={16} color="#16a34a" />
                </span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#15803d' }}>Tick (✓)</span>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>Conforming</span>
                </div>
              </button>

              {/* Option 2: Cross */}
              <button
                type="button"
                onClick={() => handleVisualSelect(rIdx, sIdx, '✗')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 8px',
                  border: isCross ? '1.5px solid #dc2626' : '1px solid #e2e8f0',
                  borderRadius: '5px',
                  backgroundColor: isCross ? '#fef2f2' : '#ffffff',
                  cursor: 'pointer',
                  marginBottom: '4px',
                  textAlign: 'left'
                }}
              >
                <span style={{ width: '22px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <CrossIcon size={16} color="#dc2626" />
                </span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#b91c1c' }}>Cross (✗)</span>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>Non-conforming</span>
                </div>
              </button>

              {/* Option 3: Cell Wide Diagonal Slash (Nul) */}
              <button
                type="button"
                onClick={() => handleVisualSelect(rIdx, sIdx, 'nul')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 8px',
                  border: isSlash ? '1.5px solid #000000' : '1px solid #e2e8f0',
                  borderRadius: '5px',
                  backgroundColor: isSlash ? '#f1f5f9' : '#ffffff',
                  cursor: 'pointer',
                  marginBottom: '4px',
                  textAlign: 'left'
                }}
              >
                <span
                  style={{
                    width: '22px',
                    height: '18px',
                    border: '1px solid #000',
                    position: 'relative',
                    display: 'inline-block',
                    backgroundColor: '#fff'
                  }}
                >
                  <svg
                    style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
                    viewBox="0 0 20 20"
                    preserveAspectRatio="none"
                  >
                    <line x1="0" y1="20" x2="20" y2="0" stroke="#000" strokeWidth="1.8" />
                  </svg>
                </span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#000000' }}>Diagonal Slash</span>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>Nul / Not Applicable</span>
                </div>
              </button>

              {/* Option 4: Custom Text/Number input */}
              <div style={{ padding: '6px 2px 2px 2px', borderTop: '1px solid #e2e8f0', marginTop: '4px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>
                  Or enter reading:
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input
                    type="text"
                    value={(isTick || isCross || isSlash) ? '' : (val || '')}
                    onChange={(e) => handleSampleChange(rIdx, sIdx, e.target.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        setActiveVisualCell(null);
                      }
                    }}
                    placeholder="e.g. 408.5"
                    style={{
                      flex: 1,
                      padding: '4px 6px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      border: '1px solid #005a9c',
                      borderRadius: '4px',
                      boxSizing: 'border-box',
                      outline: 'none',
                      color: '#000'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveVisualCell(null);
                    }}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#005a9c',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>

              {/* Clear Option */}
              {(isTick || isCross || isSlash || val) && (
                <button
                  type="button"
                  onClick={() => handleVisualSelect(rIdx, sIdx, '')}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '5px 8px',
                    border: 'none',
                    borderTop: '1px solid #f1f5f9',
                    borderRadius: '4px',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    color: '#64748b',
                    textAlign: 'left',
                    marginTop: '2px'
                  }}
                >
                  <span style={{ width: '22px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <BackspaceIcon size={13} color="#64748b" />
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: '500' }}>Clear Value</span>
                </button>
              )}
            </div>
          )}
        </div>
      </td>
    );
  };

  return (
    <div>
      <div ref={printRef} style={{ maxWidth: '750px', width: '100%', margin: '0 auto', border: '2px solid #000', padding: '10px', backgroundColor: '#fff', boxSizing: 'border-box' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }} border="1">
          <tbody>
            <tr>
              <td rowSpan="4" style={{ padding: '0', textAlign: 'center', width: '22%', verticalAlign: 'middle', boxSizing: 'border-box' }}>
                <div style={{ borderBottom: '1px solid #000', padding: '6px 0' }}>
                  <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '900', fontFamily: 'Impact, sans-serif', letterSpacing: '1px' }}>SKF</h1>
                </div>
                <div style={{ borderBottom: '1px solid #000', padding: '4px 0', fontSize: '10px', fontWeight: 'bold' }}>
                  SKF INDIA LTD,<br />TRB - ABU
                </div>
                <div style={{ padding: '4px 0', fontSize: '10px', fontWeight: 'bold' }}>
                  ABU QA-HB
                </div>
              </td>
              <td rowSpan="4" style={{ textAlign: 'center', fontSize: isQualityEquipments ? '17px' : '19px', fontWeight: 'bold', width: '46%', verticalAlign: 'middle', letterSpacing: '0.5px', boxSizing: 'border-box' }}>
                {isQualityEquipments ? 'FIRST OFF INSPECTION QUALITY EQUIPMENTS' : 'FIRST OFF INSPECTION'}
              </td>
              <td style={{ fontSize: '11px', padding: '4px 6px', width: '18%', fontWeight: 'bold', boxSizing: 'border-box' }}>Format No.:</td>
              <td style={{ fontSize: '11px', padding: '4px 6px', width: '14%', fontWeight: 'bold', wordBreak: 'break-all', boxSizing: 'border-box' }}>{formData.formatNo}</td>
            </tr>
            <tr>
              <td style={{ fontSize: '11px', padding: '4px 6px', fontWeight: 'bold', boxSizing: 'border-box' }}>Revision No.:</td>
              <td style={{ fontSize: '11px', padding: '4px 6px', fontWeight: 'bold', boxSizing: 'border-box' }}>1</td>
            </tr>
            <tr>
              <td style={{ fontSize: '11px', padding: '4px 6px', fontWeight: 'bold', boxSizing: 'border-box' }}>Rev. Date:( YY/MM) :</td>
              <td style={{ fontSize: '11px', padding: '4px 6px', fontWeight: 'bold', boxSizing: 'border-box' }}>14/07</td>
            </tr>
            <tr>
              <td style={{ fontSize: '11px', padding: '4px 6px', fontWeight: 'bold', boxSizing: 'border-box' }}>
                Prep. By: AVS
              </td>
              <td style={{ fontSize: '11px', padding: '4px 6px', fontWeight: 'bold', boxSizing: 'border-box' }}>
                Appd By: SS
              </td>
            </tr>
          </tbody>
        </table>

        {/* HEADER SECTION MATCHING EXACT LAYOUT */}
        {isQualityEquipments ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: 'none', fontSize: '11.5px', tableLayout: 'fixed' }} border="1">
            <tbody>
              <tr>
                <td style={{ width: '33.33%', padding: '5px 8px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <b>Type :-</b>
                    <input
                      type="text"
                      value={formData.type || ''}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      placeholder="e.g. 33110"
                      style={{ marginLeft: '6px', width: '120px', padding: '2px 5px', border: '1px solid #ccc', borderRadius: '3px', fontWeight: 'bold' }}
                    />
                  </div>
                </td>
                <td style={{ width: '33.33%', padding: '5px 8px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <b>Date :-</b>
                    <input
                      type="text"
                      value={formData.date || ''}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      onBlur={(e) => setFormData({ ...formData, date: formatDateToDDMMYY(e.target.value) })}
                      placeholder="dd/mm/yy"
                      style={{ marginLeft: '6px', padding: '2px 5px', border: '1px solid #ccc', borderRadius: '3px', fontWeight: 'bold', width: '95px', fontSize: '11px' }}
                    />
                  </div>
                </td>
                <td style={{ width: '33.33%', padding: '5px 8px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <b>Channel :-</b>
                    <input
                      type="text"
                      value={formData.channelNo || ''}
                      onChange={(e) => setFormData({ ...formData, channelNo: e.target.value })}
                      placeholder="e.g. T-6"
                      style={{ marginLeft: '6px', width: '80px', padding: '2px 4px', border: '1px solid #ccc', borderRadius: '3px', fontWeight: 'bold' }}
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        ) : isAssembly ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: 'none', fontSize: '11.5px', tableLayout: 'fixed' }} border="1">
            <tbody>
              <tr>
                <td style={{ width: '60%', padding: '5px 8px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span><b>ASSEMBLY</b></span>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <b>Cone Height MV =</b>
                      <input
                        type="text"
                        value={formData.coneHeightMV ?? formData.mv ?? ''}
                        onChange={(e) => setFormData({ ...formData, coneHeightMV: e.target.value, mv: e.target.value })}
                        placeholder="e.g. 40"
                        style={{ marginLeft: '5px', width: '65px', padding: '2px 4px', border: '1px solid #ccc', borderRadius: '3px', fontWeight: 'bold' }}
                      />
                    </div>
                  </div>
                </td>
                <td style={{ width: '40%', padding: '5px 8px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <b>DATE :</b>
                    <input
                      type="text"
                      value={formData.date || ''}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      onBlur={(e) => setFormData({ ...formData, date: formatDateToDDMMYY(e.target.value) })}
                      placeholder="dd/mm/yy"
                      style={{ marginLeft: '6px', padding: '2px 5px', border: '1px solid #ccc', borderRadius: '3px', fontWeight: 'bold', width: '95px', fontSize: '11px' }}
                    />
                  </div>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '5px 8px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <b>CHANNEL NO :</b>
                    <input
                      type="text"
                      value={formData.channelNo || ''}
                      onChange={(e) => setFormData({ ...formData, channelNo: e.target.value })}
                      placeholder="e.g. T6"
                      style={{ marginLeft: '6px', width: '80px', padding: '2px 4px', border: '1px solid #ccc', borderRadius: '3px', fontWeight: 'bold' }}
                    />
                  </div>
                </td>
                <td style={{ padding: '5px 8px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <b>SHIFT :</b>
                    <input
                      type="text"
                      value={formData.shift || ''}
                      onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                      placeholder="e.g. II"
                      style={{ marginLeft: '6px', width: '80px', padding: '2px 4px', border: '1px solid #ccc', borderRadius: '3px', fontWeight: 'bold' }}
                    />
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan="2" style={{ padding: '5px 8px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <b>TYPE :</b>
                    <input
                      type="text"
                      value={formData.type || ''}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      placeholder="e.g. 32210"
                      style={{ marginLeft: '6px', width: '160px', padding: '2px 5px', border: '1px solid #ccc', borderRadius: '3px', fontWeight: 'bold' }}
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        ) : isMarking ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: 'none', fontSize: '11.5px', tableLayout: 'fixed' }} border="1">
            <tbody>
              <tr>
                <td style={{ width: '60%', padding: '5px 8px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span><b>GRINDING :</b></span>
                    <input
                      type="text"
                      value={formData.grinding || ''}
                      onChange={(e) => setFormData({ ...formData, grinding: e.target.value })}
                      placeholder="OUTER RING / INNER RING"
                      style={{ marginLeft: '6px', width: '220px', padding: '2px 5px', border: '1px solid #ccc', borderRadius: '3px', fontWeight: 'bold' }}
                    />
                  </div>
                </td>
                <td style={{ width: '40%', padding: '5px 8px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <b>DATE :</b>
                    <input
                      type="text"
                      value={formData.date || ''}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      onBlur={(e) => setFormData({ ...formData, date: formatDateToDDMMYY(e.target.value) })}
                      placeholder="dd/mm/yy"
                      style={{ marginLeft: '6px', padding: '2px 5px', border: '1px solid #ccc', borderRadius: '3px', fontWeight: 'bold', width: '95px', fontSize: '11px' }}
                    />
                  </div>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '5px 8px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <b>CHANNEL NO. :</b>
                    <input
                      type="text"
                      value={formData.channelNo || ''}
                      onChange={(e) => setFormData({ ...formData, channelNo: e.target.value })}
                      placeholder="e.g. T-6"
                      style={{ marginLeft: '6px', width: '80px', padding: '2px 4px', border: '1px solid #ccc', borderRadius: '3px', fontWeight: 'bold' }}
                    />
                  </div>
                </td>
                <td style={{ padding: '5px 8px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <b>SHIFT :</b>
                    <input
                      type="text"
                      value={formData.shift || ''}
                      onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                      placeholder="e.g. I"
                      style={{ marginLeft: '6px', width: '80px', padding: '2px 4px', border: '1px solid #ccc', borderRadius: '3px', fontWeight: 'bold' }}
                    />
                  </div>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '5px 8px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <b>TYPE :</b>
                    <input
                      type="text"
                      value={formData.type || ''}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      placeholder="e.g. 33110 (T6 14 2467)"
                      style={{ marginLeft: '6px', width: '220px', padding: '2px 5px', border: '1px solid #ccc', borderRadius: '3px', fontWeight: 'bold' }}
                    />
                  </div>
                </td>
                <td style={{ padding: '5px 8px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <b>OPERATION :</b>
                    <input
                      type="text"
                      value={formData.operation || 'MARKING'}
                      onChange={(e) => setFormData({ ...formData, operation: e.target.value })}
                      placeholder="MARKING"
                      style={{ marginLeft: '6px', width: '160px', padding: '2px 4px', border: '1px solid #ccc', borderRadius: '3px', fontWeight: 'bold' }}
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: 'none', fontSize: '11.5px', tableLayout: 'fixed' }} border="1">
            <tbody>
              <tr>
                <td style={{ width: '60%', padding: '5px 8px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span><b>GRINDING :</b> {formData.grinding}</span>
                    <div>
                      <b>T.V =</b>
                      <input
                        type="text"
                        value={formData.tv || ''}
                        onChange={(e) => setFormData({ ...formData, tv: e.target.value })}
                        style={{ marginLeft: '5px', width: '65px', padding: '2px 4px', border: '1px solid #ccc', borderRadius: '3px' }}
                      />
                    </div>
                  </div>
                </td>
                <td style={{ width: '40%', padding: '5px 8px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <b>DATE :</b>
                    <input
                      type="text"
                      value={formData.date || ''}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      onBlur={(e) => setFormData({ ...formData, date: formatDateToDDMMYY(e.target.value) })}
                      placeholder="dd/mm/yy"
                      style={{ marginLeft: '6px', padding: '2px 5px', border: '1px solid #ccc', borderRadius: '3px', fontWeight: 'bold', width: '95px', fontSize: '11px' }}
                    />
                  </div>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '5px 8px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span><b>CHANNEL NO. :</b> {formData.channelNo}</span>
                    <div>
                      <b>M.V =</b>
                      <input
                        type="text"
                        value={formData.mv || ''}
                        onChange={(e) => setFormData({ ...formData, mv: e.target.value })}
                        style={{ marginLeft: '5px', width: '60px', padding: '2px 4px', border: '1px solid #ccc', borderRadius: '3px' }}
                      />
                    </div>
                  </div>
                </td>
                <td style={{ padding: '5px 8px', boxSizing: 'border-box' }}>
                  <b>SHIFT :</b> {formData.shift}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '5px 8px', boxSizing: 'border-box' }}>
                  <b>TYPE :</b>
                  <input
                    type="text"
                    value={formData.type || ''}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    placeholder="Enter Type"
                    style={{ marginLeft: '5px', padding: '2px 5px', border: '1px solid #ccc', borderRadius: '3px', fontWeight: 'bold' }}
                  />
                </td>
                <td style={{ padding: '5px 8px', boxSizing: 'border-box' }}>
                  <b>MACHINE NO. :</b>
                  <input
                    type="text"
                    value={formData.machineNo || ''}
                    onChange={(e) => setFormData({ ...formData, machineNo: e.target.value })}
                    placeholder=""
                    style={{ marginLeft: '5px', padding: '2px 5px', border: '1px solid #ccc', borderRadius: '3px', fontWeight: 'bold' }}
                  />
                </td>
              </tr>
              <tr>
                <td style={{ padding: '4px 8px', boxSizing: 'border-box' }}><b>OPERATION :</b> {formData.operation}</td>
                <td style={{ padding: '4px 8px', boxSizing: 'border-box' }}></td>
              </tr>
            </tbody>
          </table>
        )}

        {/* Fully Grid-Based Editable Inspection Table */}
        {isQualityEquipments ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: 'none', textAlign: 'center', fontSize: '11px', border: '1px solid #000', tableLayout: 'fixed' }} border="1">
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th rowSpan="2" style={{ ...tableCellStyle, width: '9%', fontWeight: 'bold' }}>Sr. No.</th>
                <th rowSpan="2" style={{ ...tableCellStyle, width: '20%', fontWeight: 'bold' }}>Equipment Name</th>
                <th rowSpan="2" style={{ ...tableCellStyle, width: '26%', fontWeight: 'bold' }}>Parameter Checked</th>
                <th style={{ ...tableCellStyle, width: '15%', fontWeight: 'bold', fontSize: '10.5px' }}>Outlier Master Available</th>
                <th style={{ ...tableCellStyle, width: '15%', fontWeight: 'bold', fontSize: '10.5px' }}>Verification with Outlier Master</th>
                <th style={{ ...tableCellStyle, width: '15%', fontWeight: 'bold', fontSize: '10.5px' }}>Release for Production</th>
              </tr>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{ ...tableCellStyle, fontWeight: 'bold', fontSize: '10.5px' }}>Yes / No</th>
                <th style={{ ...tableCellStyle, fontWeight: 'bold', fontSize: '10.5px' }}>Yes / No</th>
                <th style={{ ...tableCellStyle, fontWeight: 'bold', fontSize: '10.5px' }}>Yes / No</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, rIdx) => {
                if (row.isSectionHeader) {
                  return (
                    <tr key={row.id || `qe-hdr-${rIdx}`}>
                      <td colSpan="6" style={{ ...tableCellStyle, textAlign: 'left', padding: '4px 8px', fontWeight: 'bold', backgroundColor: '#f3f4f6' }}>
                        {row.sectionTitle}
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={row.id || `qe-row-${rIdx}`}>
                    <td style={{ ...tableCellStyle, width: '9%' }}>
                      <input
                        type="text"
                        value={row.srNo || ''}
                        onChange={(e) => handleQeCellChange(rIdx, 'srNo', e.target.value)}
                        style={{ ...cellInputStyle, fontSize: '11px' }}
                      />
                    </td>
                    <td style={{ ...tableCellStyle, width: '20%', padding: '0 4px' }}>
                      <input
                        type="text"
                        value={row.equipmentName || ''}
                        onChange={(e) => handleQeCellChange(rIdx, 'equipmentName', e.target.value)}
                        style={{ ...cellInputStyle, fontWeight: 'bold', textAlign: 'left', fontSize: '11px' }}
                      />
                    </td>
                    <td style={{ ...tableCellStyle, width: '26%', padding: '0 4px' }}>
                      <input
                        type="text"
                        value={row.parameterChecked || ''}
                        onChange={(e) => handleQeCellChange(rIdx, 'parameterChecked', e.target.value)}
                        style={{ ...cellInputStyle, textAlign: 'left', fontSize: '11px' }}
                      />
                    </td>
                    {row.spanAcross ? (
                      <td colSpan="3" style={{ ...tableCellStyle, padding: '0 4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <input
                            type="text"
                            value={row.spanText || row.outlierAvailable || ''}
                            onChange={(e) => {
                              handleQeCellChange(rIdx, 'spanText', e.target.value);
                              handleQeCellChange(rIdx, 'outlierAvailable', e.target.value);
                            }}
                            placeholder="e.g. 100% Checked by F.O.D"
                            style={{ ...cellInputStyle, fontWeight: 'bold', fontSize: '11px' }}
                          />
                          <button
                            type="button"
                            onClick={() => handleQeCellChange(rIdx, 'spanAcross', false)}
                            style={{ fontSize: '9px', padding: '2px 4px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '3px', background: '#f8fafc', whiteSpace: 'nowrap' }}
                            title="Split into 3 cells"
                          >
                            Split
                          </button>
                        </div>
                      </td>
                    ) : (
                      <>
                        <td style={{ ...tableCellStyle, width: '15%' }}>
                          <input
                            type="text"
                            value={row.outlierAvailable || ''}
                            onChange={(e) => handleQeCellChange(rIdx, 'outlierAvailable', e.target.value)}
                            placeholder="Yes / No"
                            style={{ ...cellInputStyle, fontSize: '11px', fontWeight: 'bold' }}
                          />
                        </td>
                        <td style={{ ...tableCellStyle, width: '15%' }}>
                          <input
                            type="text"
                            value={row.verificationOutlier || ''}
                            onChange={(e) => handleQeCellChange(rIdx, 'verificationOutlier', e.target.value)}
                            placeholder="Yes / No"
                            style={{ ...cellInputStyle, fontSize: '11px', fontWeight: 'bold' }}
                          />
                        </td>
                        <td style={{ ...tableCellStyle, width: '15%', position: 'relative' }}>
                          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                            <input
                              type="text"
                              value={row.releaseProduction || ''}
                              onChange={(e) => handleQeCellChange(rIdx, 'releaseProduction', e.target.value)}
                              placeholder="Yes / No"
                              style={{ ...cellInputStyle, fontSize: '11px', fontWeight: 'bold' }}
                            />
                            {rIdx === 5 && (
                              <button
                                type="button"
                                onClick={() => handleQeCellChange(rIdx, 'spanAcross', true)}
                                style={{ fontSize: '8.5px', padding: '1px 3px', cursor: 'pointer', border: '1px solid #94a3b8', borderRadius: '2px', background: '#e2e8f0', marginRight: '2px', whiteSpace: 'nowrap' }}
                                title="Span text across 3 columns"
                              >
                                Span
                              </button>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : isMarking ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: 'none', textAlign: 'center', fontSize: '11.5px', border: '1px solid #000', tableLayout: 'fixed' }} border="1">
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th rowSpan="2" style={{ ...tableCellStyle, width: '28%', fontWeight: 'bold', padding: '4px' }}>PARAMETER</th>
                <th rowSpan="2" style={{ ...tableCellStyle, width: '37%', fontWeight: 'bold', padding: '4px' }}>CRITERIA</th>
                <th colSpan="5" style={{ ...tableCellStyle, width: '35%', fontWeight: 'bold', padding: '4px 0' }}>SAMPLE NO.</th>
              </tr>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{ ...tableCellStyle, width: '7%', fontWeight: 'bold' }}>1</th>
                <th style={{ ...tableCellStyle, width: '7%', fontWeight: 'bold' }}>2</th>
                <th style={{ ...tableCellStyle, width: '7%', fontWeight: 'bold' }}>3</th>
                <th style={{ ...tableCellStyle, width: '7%', fontWeight: 'bold' }}>4</th>
                <th style={{ ...tableCellStyle, width: '7%', fontWeight: 'bold' }}>5</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, rIdx) => {
                return (
                  <tr key={row.id || `mk-row-${rIdx}`}>
                    {rIdx === 0 && (
                      <td rowSpan={tableData.length} style={{ ...tableCellStyle, width: '28%', textAlign: 'left', padding: '6px 10px', fontWeight: 'bold', verticalAlign: 'middle', backgroundColor: '#fcfcfc' }}>
                        <input
                          type="text"
                          value={row.parameter || '• Visual Inspection'}
                          onChange={(e) => {
                            const updated = [...tableData];
                            updated[0] = { ...updated[0], parameter: e.target.value };
                            setTableData(updated);
                          }}
                          style={{ ...cellInputStyle, fontWeight: 'bold', textAlign: 'left' }}
                        />
                      </td>
                    )}
                    <td style={{ ...tableCellStyle, width: '37%', textAlign: 'left', padding: '4px 8px', fontWeight: 'bold' }}>
                      <input
                        type="text"
                        value={row.criteria || row.subParameter || ''}
                        onChange={(e) => {
                          const updated = [...tableData];
                          updated[rIdx] = { ...updated[rIdx], criteria: e.target.value, subParameter: e.target.value };
                          setTableData(updated);
                        }}
                        style={{ ...cellInputStyle, fontWeight: 'bold', textAlign: 'left' }}
                      />
                    </td>
                    {(row.samples || ['', '', '', '', '']).map((sVal, sIdx) => renderMarkingSampleCell(sVal, rIdx, sIdx))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: 'none', textAlign: 'center', fontSize: '11.5px', border: '1px solid #000', tableLayout: 'fixed' }} border="1">
          <thead>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <th rowSpan="2" style={{ ...tableCellStyle, width: isAssembly ? '25%' : '28%', fontWeight: 'bold', padding: '4px', boxSizing: 'border-box' }}>PARAMETER</th>
              <th rowSpan="2" style={{ ...tableCellStyle, width: isAssembly ? '11%' : '14%', fontWeight: 'bold', boxSizing: 'border-box' }}>SYMBOL</th>
              <th rowSpan="2" style={{ ...tableCellStyle, width: '13%', fontWeight: 'bold', fontSize: '11.5px', boxSizing: 'border-box' }}>TOL (µm)</th>
              {isAssembly && (
                <th rowSpan="2" style={{ ...tableCellStyle, width: '11%', fontWeight: 'bold', fontSize: '11px', boxSizing: 'border-box' }}>SAMPLE SIZE</th>
              )}
              <th colSpan="5" style={{ ...tableCellStyle, width: isAssembly ? '40%' : '45%', fontWeight: 'bold', fontSize: '11.5px', padding: '4px 0', boxSizing: 'border-box' }}>{isAssembly ? 'READINGS' : 'SAMPLE NO.'}</th>
            </tr>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <th style={{ ...tableCellStyle, width: isAssembly ? '8%' : '9%', fontWeight: 'bold', boxSizing: 'border-box' }}>1</th>
              <th style={{ ...tableCellStyle, width: isAssembly ? '8%' : '9%', fontWeight: 'bold', boxSizing: 'border-box' }}>2</th>
              <th style={{ ...tableCellStyle, width: isAssembly ? '8%' : '9%', fontWeight: 'bold', boxSizing: 'border-box' }}>3</th>
              <th style={{ ...tableCellStyle, width: isAssembly ? '8%' : '9%', fontWeight: 'bold', boxSizing: 'border-box' }}>4</th>
              <th style={{ ...tableCellStyle, width: isAssembly ? '8%' : '9%', fontWeight: 'bold', boxSizing: 'border-box' }}>5</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, rIdx) => {
              if (row.isDoubleRow) {
                const r1 = row.samplesRow1 || ['', '', '', '', ''];
                const r2 = row.samplesRow2 || ['', '', '', '', ''];
                return (
                  <React.Fragment key={`double-row-${row.id}`}>
                    <tr>
                      <td rowSpan="2" style={{ ...tableCellStyle, width: isAssembly ? '25%' : '28%', textAlign: 'left', padding: '4px 6px', fontWeight: 'bold', boxSizing: 'border-box' }}>{row.parameter}</td>
                      <td rowSpan="2" style={{ ...tableCellStyle, width: isAssembly ? '11%' : '14%', fontWeight: 'bold', boxSizing: 'border-box' }}>{row.symbol}</td>
                      <ValueOrNullCell
                        value={row.tol}
                        onChange={(newVal) => handleTolChange(rIdx, newVal)}
                        style={tableCellStyle}
                        inputStyle={cellInputStyle}
                        tdProps={{ rowSpan: 2 }}
                      />
                      {isAssembly && (
                        <td rowSpan="2" style={{ ...tableCellStyle, width: '11%', fontWeight: 'bold', boxSizing: 'border-box' }}>
                          <input
                            type="text"
                            value={row.sampleSize || ''}
                            onChange={(e) => handleSampleSizeChange(rIdx, e.target.value)}
                            style={{ width: '100%', border: 'none', textAlign: 'center', fontSize: '11.5px', fontWeight: 'bold', outline: 'none', backgroundColor: 'transparent' }}
                          />
                        </td>
                      )}
                      {r1.map((val, sIdx) => (
                        <ValueOrNullCell
                          key={`r1-${sIdx}`}
                          value={val}
                          onChange={(newVal) => handleSampleChange(rIdx, sIdx, newVal, 1)}
                          style={{ ...tableCellStyle, width: isAssembly ? '8%' : '9%' }}
                          inputStyle={cellInputStyle}
                        />
                      ))}
                    </tr>
                    <tr>
                      {r2.map((val, sIdx) => (
                        <ValueOrNullCell
                          key={`r2-${sIdx}`}
                          value={val}
                          onChange={(newVal) => handleSampleChange(rIdx, sIdx, newVal, 2)}
                          style={{ ...tableCellStyle, width: isAssembly ? '8%' : '9%' }}
                          inputStyle={cellInputStyle}
                        />
                      ))}
                    </tr>
                  </React.Fragment>
                );
              }

              if (row.isVibrationRow) {
                return (
                  <tr key={row.id}>
                    <td style={{ ...tableCellStyle, width: isAssembly ? '25%' : '28%', textAlign: 'left', padding: '4px 6px', fontWeight: 'bold', boxSizing: 'border-box' }}>
                      {row.parameter}
                    </td>
                    <td style={{ ...tableCellStyle, width: isAssembly ? '11%' : '14%', fontWeight: 'bold', boxSizing: 'border-box' }}>
                      {row.symbol}
                    </td>
                    <td style={{ ...tableCellStyle, width: '13%', padding: 0, boxSizing: 'border-box' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', minHeight: '34px' }}>
                        <input
                          type="text"
                          value={parseDiagonalValue(row.tol).top}
                          onChange={(e) => handleTolChange(rIdx, { top: e.target.value, bottom: parseDiagonalValue(row.tol).bottom })}
                          placeholder="up"
                          title="TOL Top"
                          style={{ width: '100%', height: '50%', border: 'none', borderBottom: '1px solid #ccc', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', outline: 'none', backgroundColor: 'transparent', padding: 0 }}
                        />
                        <input
                          type="text"
                          value={parseDiagonalValue(row.tol).bottom}
                          onChange={(e) => handleTolChange(rIdx, { top: parseDiagonalValue(row.tol).top, bottom: e.target.value })}
                          placeholder="dn"
                          title="TOL Down"
                          style={{ width: '100%', height: '50%', border: 'none', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', outline: 'none', backgroundColor: 'transparent', padding: 0 }}
                        />
                      </div>
                    </td>
                    {isAssembly && (
                      <td style={{ ...tableCellStyle, width: '11%', fontWeight: 'bold', boxSizing: 'border-box' }}>
                        <input
                          type="text"
                          value={row.sampleSize || ''}
                          onChange={(e) => handleSampleSizeChange(rIdx, e.target.value)}
                          style={{ width: '100%', border: 'none', textAlign: 'center', fontSize: '11.5px', fontWeight: 'bold', outline: 'none', backgroundColor: 'transparent' }}
                        />
                      </td>
                    )}
                    {(row.samples || []).map((val, sIdx) => {
                      const vib = parseVibrationSample(val);
                      return (
                        <td key={sIdx} style={{ ...tableCellStyle, width: isAssembly ? '8%' : '9%', padding: 0, height: '36px', boxSizing: 'border-box' }}>
                          <div style={{ display: 'flex', width: '100%', height: '100%' }}>
                            {/* Sub 1 */}
                            <div style={{ width: '50%', borderRight: '1px solid #000', display: 'flex', flexDirection: 'column', height: '100%' }}>
                              <input
                                type="text"
                                value={vib.sub1.top}
                                onChange={(e) => handleVibrationChange(rIdx, sIdx, 'sub1', 'top', e.target.value)}
                                placeholder="up"
                                title={`Sample ${sIdx + 1} Sub-A Up`}
                                style={{ width: '100%', height: '50%', border: 'none', borderBottom: '1px solid #ccc', textAlign: 'center', fontSize: '10px', fontWeight: 'bold', padding: 0, outline: 'none', backgroundColor: 'transparent' }}
                              />
                              <input
                                type="text"
                                value={vib.sub1.bottom}
                                onChange={(e) => handleVibrationChange(rIdx, sIdx, 'sub1', 'bottom', e.target.value)}
                                placeholder="dn"
                                title={`Sample ${sIdx + 1} Sub-A Down`}
                                style={{ width: '100%', height: '50%', border: 'none', textAlign: 'center', fontSize: '10px', fontWeight: 'bold', padding: 0, outline: 'none', backgroundColor: 'transparent' }}
                              />
                            </div>
                            {/* Sub 2 */}
                            <div style={{ width: '50%', display: 'flex', flexDirection: 'column', height: '100%' }}>
                              <input
                                type="text"
                                value={vib.sub2.top}
                                onChange={(e) => handleVibrationChange(rIdx, sIdx, 'sub2', 'top', e.target.value)}
                                placeholder="up"
                                title={`Sample ${sIdx + 1} Sub-B Up`}
                                style={{ width: '100%', height: '50%', border: 'none', borderBottom: '1px solid #ccc', textAlign: 'center', fontSize: '10px', fontWeight: 'bold', padding: 0, outline: 'none', backgroundColor: 'transparent' }}
                              />
                              <input
                                type="text"
                                value={vib.sub2.bottom}
                                onChange={(e) => handleVibrationChange(rIdx, sIdx, 'sub2', 'bottom', e.target.value)}
                                placeholder="dn"
                                title={`Sample ${sIdx + 1} Sub-B Down`}
                                style={{ width: '100%', height: '50%', border: 'none', textAlign: 'center', fontSize: '10px', fontWeight: 'bold', padding: 0, outline: 'none', backgroundColor: 'transparent' }}
                              />
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              }

              if (row.isDiagonalTol) {
                return (
                  <tr key={row.id}>
                    <td style={{ ...tableCellStyle, width: isAssembly ? '25%' : '28%', textAlign: 'left', padding: '4px 6px', fontWeight: 'bold', boxSizing: 'border-box' }}>
                      {row.parameter}
                    </td>
                    <td style={{ ...tableCellStyle, width: isAssembly ? '11%' : '14%', fontWeight: 'bold', boxSizing: 'border-box' }}>
                      {row.symbol}
                    </td>
                    <DiagonalInputCell
                      value={row.tol}
                      onChange={(newVal) => handleTolChange(rIdx, newVal)}
                      style={{ ...tableCellStyle, width: '13%' }}
                    />
                    {isAssembly && (
                      <td style={{ ...tableCellStyle, width: '11%', fontWeight: 'bold', boxSizing: 'border-box' }}>
                        <input
                          type="text"
                          value={row.sampleSize || ''}
                          onChange={(e) => handleSampleSizeChange(rIdx, e.target.value)}
                          style={{ width: '100%', border: 'none', textAlign: 'center', fontSize: '11.5px', fontWeight: 'bold', outline: 'none', backgroundColor: 'transparent' }}
                        />
                      </td>
                    )}
                    {(row.samples || []).map((val, sIdx) => (
                      <ValueOrNullCell
                        key={sIdx}
                        value={val}
                        onChange={(newVal) => handleSampleChange(rIdx, sIdx, newVal)}
                        style={{ ...tableCellStyle, width: isAssembly ? '8%' : '9%' }}
                        inputStyle={cellInputStyle}
                      />
                    ))}
                  </tr>
                );
              }

              if (row.isDiagonal || row.isDiagonalSplit) {
                return (
                  <tr key={row.id}>
                    <td style={{ ...tableCellStyle, width: isAssembly ? '25%' : '28%', textAlign: 'left', padding: '4px 6px', fontWeight: 'bold', boxSizing: 'border-box' }}>
                      {row.parameter}
                    </td>
                    <td style={{ ...tableCellStyle, width: isAssembly ? '11%' : '14%', fontWeight: 'bold', boxSizing: 'border-box' }}>
                      {row.symbol}
                    </td>
                    <DiagonalInputCell
                      value={row.tol}
                      onChange={(newVal) => handleTolChange(rIdx, newVal)}
                      style={{ ...tableCellStyle, width: '13%' }}
                    />
                    {isAssembly && (
                      <td style={{ ...tableCellStyle, width: '11%', fontWeight: 'bold', boxSizing: 'border-box' }}>
                        <input
                          type="text"
                          value={row.sampleSize || ''}
                          onChange={(e) => handleSampleSizeChange(rIdx, e.target.value)}
                          style={{ width: '100%', border: 'none', textAlign: 'center', fontSize: '11.5px', fontWeight: 'bold', outline: 'none', backgroundColor: 'transparent' }}
                        />
                      </td>
                    )}
                    {(row.samples || []).map((val, sIdx) => (
                      <DiagonalInputCell
                        key={sIdx}
                        value={val}
                        onChange={(newVal) => handleSampleChange(rIdx, sIdx, newVal)}
                        style={{ ...tableCellStyle, width: isAssembly ? '8%' : '9%' }}
                      />
                    ))}
                  </tr>
                );
              }

              if (row.isSpanSymbolTol) {
                return (
                  <tr key={row.id}>
                    <td style={{ ...tableCellStyle, width: isAssembly ? '25%' : '28%', textAlign: 'left', padding: '4px 6px', fontWeight: 'bold', boxSizing: 'border-box' }}>
                      {row.parameter}
                    </td>
                    <td colSpan="2" style={{ ...tableCellStyle, width: '27%', fontWeight: 'bold', boxSizing: 'border-box' }}>
                      {row.symbol}
                    </td>
                    {isAssembly && (
                      <td style={{ ...tableCellStyle, width: '11%', fontWeight: 'bold', boxSizing: 'border-box' }}>
                        <input
                          type="text"
                          value={row.sampleSize || ''}
                          onChange={(e) => handleSampleSizeChange(rIdx, e.target.value)}
                          style={{ width: '100%', border: 'none', textAlign: 'center', fontSize: '11.5px', fontWeight: 'bold', outline: 'none', backgroundColor: 'transparent' }}
                        />
                      </td>
                    )}
                    {row.samples.map((val, sIdx) => (
                      <ValueOrNullCell
                        key={sIdx}
                        value={val}
                        onChange={(newVal) => handleSampleChange(rIdx, sIdx, newVal)}
                        style={{ ...tableCellStyle, width: isAssembly ? '8%' : '9%' }}
                        inputStyle={cellInputStyle}
                      />
                    ))}
                  </tr>
                );
              }

              if (row.isVisualGroup) {
                return (
                  <tr key={row.id}>
                    {row.isFirstInGroup && (
                      <td rowSpan={row.groupRowSpan || 2} style={{ ...tableCellStyle, width: isAssembly ? '25%' : '28%', textAlign: 'left', padding: '4px 6px', fontWeight: 'bold', boxSizing: 'border-box' }}>
                        {row.parameter || '• Visual Inspection'}
                      </td>
                    )}
                    <td colSpan="2" style={{ ...tableCellStyle, width: '27%', textAlign: 'left', padding: '4px 6px', fontWeight: 'bold', boxSizing: 'border-box' }}>
                      {row.subParameter}
                    </td>
                    {isAssembly && (
                      <td style={{ ...tableCellStyle, width: '11%', fontWeight: 'bold', boxSizing: 'border-box' }}>
                        <input
                          type="text"
                          value={row.sampleSize || ''}
                          onChange={(e) => handleSampleSizeChange(rIdx, e.target.value)}
                          style={{ width: '100%', border: 'none', textAlign: 'center', fontSize: '11.5px', fontWeight: 'bold', outline: 'none', backgroundColor: 'transparent' }}
                        />
                      </td>
                    )}
                    {row.samples.map((val, sIdx) => renderVisualSampleCell(val, rIdx, sIdx))}
                  </tr>
                );
              }

              if (row.isVkrGroup) {
                return (
                  <tr key={row.id}>
                    {row.isFirstInGroup && (
                      <td rowSpan="3" style={{ ...tableCellStyle, width: isAssembly ? '25%' : '28%', textAlign: 'left', padding: '4px 6px', fontWeight: 'bold', boxSizing: 'border-box' }}>
                        • Track VKR (µm/s)
                      </td>
                    )}
                    <td style={{ ...tableCellStyle, width: isAssembly ? '11%' : '14%', textAlign: 'left', padding: '4px 6px', fontWeight: 'bold', boxSizing: 'border-box' }}>{row.subParameter}</td>
                    <ValueOrNullCell
                      value={row.tol}
                      onChange={(newVal) => handleTolChange(rIdx, newVal)}
                      style={{ ...tableCellStyle, width: '13%' }}
                      inputStyle={cellInputStyle}
                    />
                    {isAssembly && (
                      <td style={{ ...tableCellStyle, width: '11%', fontWeight: 'bold', boxSizing: 'border-box' }}>
                        <input
                          type="text"
                          value={row.sampleSize || ''}
                          onChange={(e) => handleSampleSizeChange(rIdx, e.target.value)}
                          style={{ width: '100%', border: 'none', textAlign: 'center', fontSize: '11.5px', fontWeight: 'bold', outline: 'none', backgroundColor: 'transparent' }}
                        />
                      </td>
                    )}
                    {row.samples.map((val, sIdx) => (
                      <ValueOrNullCell
                        key={sIdx}
                        value={val}
                        onChange={(newVal) => handleSampleChange(rIdx, sIdx, newVal)}
                        style={{ ...tableCellStyle, width: isAssembly ? '8%' : '9%' }}
                        inputStyle={cellInputStyle}
                      />
                    ))}
                  </tr>
                );
              }

              if (row.isHoningVkrGroup) {
                return (
                  <tr key={row.id}>
                    {row.isFirstInGroup && (
                      <>
                        <td rowSpan="3" style={{ ...tableCellStyle, width: isAssembly ? '25%' : '28%', textAlign: 'left', padding: '4px 6px', fontWeight: 'bold', boxSizing: 'border-box' }}>
                          {row.parameter || 'Track VKR (µm/s)'}
                        </td>
                        <td rowSpan="3" style={{ ...tableCellStyle, width: isAssembly ? '11%' : '14%', fontWeight: 'bold', boxSizing: 'border-box', whiteSpace: 'pre-line', lineHeight: '1.4' }}>
                          {row.symbol || "L , M , H\nor\nW Parameters"}
                        </td>
                      </>
                    )}
                    <ValueOrNullCell
                      value={row.tol}
                      onChange={(newVal) => handleTolChange(rIdx, newVal)}
                      style={{ ...tableCellStyle, width: '13%' }}
                      inputStyle={cellInputStyle}
                    />
                    {isAssembly && (
                      <td style={{ ...tableCellStyle, width: '11%', fontWeight: 'bold', boxSizing: 'border-box' }}>
                        <input
                          type="text"
                          value={row.sampleSize || ''}
                          onChange={(e) => handleSampleSizeChange(rIdx, e.target.value)}
                          style={{ width: '100%', border: 'none', textAlign: 'center', fontSize: '11.5px', fontWeight: 'bold', outline: 'none', backgroundColor: 'transparent' }}
                        />
                      </td>
                    )}
                    {row.samples.map((val, sIdx) => (
                      <ValueOrNullCell
                        key={sIdx}
                        value={val}
                        onChange={(newVal) => handleSampleChange(rIdx, sIdx, newVal)}
                        style={{ ...tableCellStyle, width: isAssembly ? '8%' : '9%' }}
                        inputStyle={cellInputStyle}
                      />
                    ))}
                  </tr>
                );
              }

              const isVisualCheck = row.parameter === 'Grinding Burns' || row.id === 8 || row.isVisualOption;

              return (
                <tr key={row.id}>
                  <td style={{ ...tableCellStyle, width: isAssembly ? '25%' : '28%', textAlign: 'left', padding: '4px 6px', fontWeight: 'bold', whiteSpace: 'pre-line', boxSizing: 'border-box' }}>{row.parameter}</td>
                  <td style={{ ...tableCellStyle, width: isAssembly ? '11%' : '14%', fontWeight: 'bold', boxSizing: 'border-box' }}>{row.symbol}</td>
                  {row.isStackedTol ? (
                    <td style={{ ...tableCellStyle, width: '13%', padding: 0, boxSizing: 'border-box' }}>
                      <textarea
                        value={row.tol || ''}
                        onChange={(e) => handleTolChange(rIdx, e.target.value)}
                        placeholder="Tol"
                        style={{ width: '100%', height: '100%', minHeight: '32px', border: 'none', resize: 'none', textAlign: 'center', fontSize: '10px', fontWeight: 'bold', outline: 'none', padding: '2px 0', backgroundColor: 'transparent', boxSizing: 'border-box' }}
                      />
                    </td>
                  ) : (
                    <ValueOrNullCell
                      value={row.tol}
                      onChange={(newVal) => handleTolChange(rIdx, newVal)}
                      style={{ ...tableCellStyle, width: '13%' }}
                      inputStyle={cellInputStyle}
                    />
                  )}
                  {isAssembly && (
                    <td style={{ ...tableCellStyle, width: '11%', fontWeight: 'bold', boxSizing: 'border-box' }}>
                      <input
                        type="text"
                        value={row.sampleSize || ''}
                        onChange={(e) => handleSampleSizeChange(rIdx, e.target.value)}
                        style={{ width: '100%', border: 'none', textAlign: 'center', fontSize: '11.5px', fontWeight: 'bold', outline: 'none', backgroundColor: 'transparent' }}
                      />
                    </td>
                  )}
                  {row.samples.map((val, sIdx) =>
                    isVisualCheck
                      ? renderVisualSampleCell(val, rIdx, sIdx)
                      : (
                        <ValueOrNullCell
                          key={sIdx}
                          value={val}
                          onChange={(newVal) => handleSampleChange(rIdx, sIdx, newVal)}
                          style={{ ...tableCellStyle, width: isAssembly ? '8%' : '9%' }}
                          inputStyle={cellInputStyle}
                        />
                      )
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        )}

        {isAssembly && (
          <div style={{ border: '1px solid #000', borderTop: 'none', padding: '6px 12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <b style={{ fontSize: '13px' }}>OK</b>
              <div style={{ width: '42px', height: '22px', border: '1.5px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckIcon size={16} color="#16a34a" strokeWidth={3} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <b style={{ fontSize: '13px' }}>NOT OK</b>
              <div style={{ width: '42px', height: '22px', border: '1.5px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CrossIcon size={16} color="#dc2626" strokeWidth={3} />
              </div>
            </div>
          </div>
        )}

        {isQualityEquipments ? (
          <div style={{ border: '1px solid #000', borderTop: 'none', padding: '6px 10px', fontSize: '11.5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <b>Setup Approval :-</b>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', color: 'green', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="setupApproval"
                  value="Approved"
                  checked={formData.setupApproval === 'Approved' || formData.machineReleased === 'YES'}
                  onChange={() => setFormData({ ...formData, setupApproval: 'Approved', machineReleased: 'YES' })}
                />
                Approved
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', color: 'red', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="setupApproval"
                  value="Not Approved"
                  checked={formData.setupApproval === 'Not Approved' || formData.machineReleased === 'NO'}
                  onChange={() => setFormData({ ...formData, setupApproval: 'Not Approved', machineReleased: 'NO' })}
                />
                Not Approved
              </label>
            </div>
          </div>
        ) : (
          <div style={{ border: '1px solid #000', borderTop: 'none', padding: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <b>{isAssembly ? 'ASSEMBLY PROCESS RELEASED FOR PRODUCTION :' : 'Machine Released for Production :'}</b>
            <div>
              <b style={{ marginRight: '10px' }}>YES / NO</b>
              <label style={{ marginRight: '15px', fontWeight: 'bold', color: 'green', cursor: 'pointer' }}>
                <input type="radio" name="released" value="YES" checked={formData.machineReleased === 'YES'} onChange={(e) => setFormData({ ...formData, machineReleased: e.target.value })} /> YES
              </label>
              <label style={{ fontWeight: 'bold', color: 'red', cursor: 'pointer' }}>
                <input type="radio" name="released" value="NO" checked={formData.machineReleased === 'NO'} onChange={(e) => setFormData({ ...formData, machineReleased: e.target.value })} /> NO
              </label>
            </div>
          </div>
        )}

        <ReasonAndAuthorizationSection formData={formData} setFormData={setFormData} />
      </div>

      <button onClick={() => { setActiveVisualCell(null); onSubmit(); }} style={{ width: '100%', maxWidth: '750px', display: 'block', margin: '15px auto 0 auto', padding: '10px', backgroundColor: '#005a9c', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}>
        {attachedPdfName ? `Submit Inspection Report (📎 Includes: ${attachedPdfName})` : 'Submit Inspection Report'}
      </button>
    </div>
  );
}

function FormTRB02Machine1374({ selectedFormKey, filters, setRecords, onRecordSaved, showAppAlert, attachedPdf, onClearAttachedPdf }) {
  const printRef = useRef();

  const initialRing = getRingSectionFromFormKey(selectedFormKey, filters?.ringSection || '');
  const initialMeta = selectedFormKey && FORM_METADATA[selectedFormKey];

  const [formData, setFormData] = useState({
    formatNo: initialMeta ? initialMeta.formatNo : '',
    revisionNo: '1',
    revDate: '14/07',
    prepBy: 'AVS',
    appdBy: 'SS',
    grinding: initialRing,
    channelNo: filters.channel || '',
    tv: '',
    mv: '',
    type: '',
    operation: initialMeta ? initialMeta.operation : '',
    date: formatDateToDDMMYY(filters.date) || '',
    shift: filters.shift || '',
    machineNo: filters.machine || '',
    machineReleased: '',
    inspectorSignature: '',
    inspectorName: '',
    supervisorSignature: '',
    supervisorName: '',
    reasonSelected: null
  });

  const [tableData, setTableData] = useState(() => getTableDataForForm(selectedFormKey, initialMeta?.operation || '', initialRing));

  useEffect(() => {
    const meta = FORM_METADATA[selectedFormKey];
    const computedRing = getRingSectionFromFormKey(selectedFormKey, filters.ringSection || '');
    if (meta) {
      setFormData((prev) => ({
        ...prev,
        formatNo: meta.formatNo,
        operation: meta.operation,
        grinding: computedRing || prev.grinding
      }));
      setTableData(getTableDataForForm(selectedFormKey, meta.operation, computedRing));
    } else {
      setFormData((prev) => ({
        ...prev,
        formatNo: '',
        operation: ''
      }));
      setTableData(getTableDataForForm('', '', filters.ringSection));
    }
  }, [selectedFormKey]);

  useEffect(() => {
    const computedRing = getRingSectionFromFormKey(selectedFormKey, filters.ringSection || '');
    setFormData((prev) => ({
      ...prev,
      date: filters.date ? formatDateToDDMMYY(filters.date) : prev.date,
      channelNo: filters.channel,
      grinding: computedRing || prev.grinding,
      machineNo: filters.machine,
      shift: filters.shift
    }));
    if (computedRing || filters.ringSection) {
      const meta = FORM_METADATA[selectedFormKey];
      setTableData(getTableDataForForm(selectedFormKey, meta?.operation || '', computedRing || filters.ringSection));
    }
  }, [filters]);

  const handleSubmit = async () => {
    const newRecId = `REC-${Math.floor(100 + Math.random() * 900)}`;

    let cloudAttachmentUrl = null;
    if (isSupabaseConfigured && attachedPdf?.file) {
      try {
        cloudAttachmentUrl = await uploadPdfToStorage(attachedPdf.file, `${newRecId}_attached.pdf`);
      } catch (err) {
        console.warn('Could not upload attached PDF to storage:', err);
      }
    }

    const finalFormattedDate = formatDateToDDMMYY(formData.date);

    const recFormData = {
      ...formData,
      revisionNo: '1',
      revDate: '14/07',
      prepBy: 'AVS',
      appdBy: 'SS',
      date: finalFormattedDate,
      attachmentUrl: cloudAttachmentUrl || attachedPdf?.url || null,
      attachmentName: attachedPdf?.name || null
    };

    const newRec = {
      id: newRecId,
      date: finalFormattedDate,
      section: filters.section || '',
      channel: formData.channelNo,
      ringSection: formData.grinding,
      machine: formData.machineNo,
      formatNo: formData.formatNo,
      operation: formData.operation,
      type: formData.type,
      shift: formData.shift,
      inspector: formData.inspectorName,
      status: formData.machineReleased,
      formData: recFormData,
      tableData: JSON.parse(JSON.stringify(tableData)),
      attachmentFile: attachedPdf?.file || null,
      attachmentUrl: cloudAttachmentUrl || attachedPdf?.url || null,
      attachmentName: attachedPdf?.name || null,
      pdfUrl: null
    };

    setRecords((prev) => [newRec, ...prev]);

    if (isSupabaseConfigured) {
      try {
        await saveInspectionRecord(newRec);
        if (onRecordSaved) {
          await onRecordSaved();
        }
        alert(
          attachedPdf
            ? `Inspection Form Saved & Synced with attached PDF (${attachedPdf.name})! Check "View Reports" tab to preview or download the concatenated PDF.`
            : 'Inspection Form Saved & Synced to Cloud Database! Check "View Reports" tab.'
        );
        if (onClearAttachedPdf) onClearAttachedPdf();
        return;
      } catch (err) {
        console.error('Supabase sync error:', err);
      }
    }

    if (onRecordSaved) {
      await onRecordSaved();
    }
    alert(
      attachedPdf
        ? `Inspection Form Saved with attached PDF (${attachedPdf.name})! Check "View Reports" tab to preview or download the concatenated PDF.`
        : 'Inspection Form Saved Successfully! Go to "View Reports" to Preview, Print, or Download PDF.'
    );
    if (onClearAttachedPdf) onClearAttachedPdf();
  };

  return (
    <InspectionTemplate
      printRef={printRef}
      formData={formData}
      setFormData={setFormData}
      tableData={tableData}
      setTableData={setTableData}
      onSubmit={handleSubmit}
      attachedPdfName={attachedPdf?.name || ''}
    />
  );
}

// ==========================================
// 3. MAIN EXPORT COMPONENT
// ==========================================

export default function SKFQualityApp() {
  const [activeTab, setActiveTab] = useState('entry');
  const [selectedForm, setSelectedForm] = useState('');

  const [filterInputs, setFilterInputs] = useState({
    recordId: '',
    operation: '',
    date: '',
    section: '',
    channel: '',
    ringSection: '',
    machine: '',
    shift: ''
  });

  const [appliedFilters, setAppliedFilters] = useState({
    recordId: '',
    operation: '',
    date: '',
    section: '',
    channel: '',
    ringSection: '',
    machine: '',
    shift: ''
  });

  const [records, setRecords] = useState(initialDatabase);
  const [previewRecord, setPreviewRecord] = useState(null);
  const [printRecord, setPrintRecord] = useState(null);
  const [downloadingRecord, setDownloadingRecord] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [attachedPdf, setAttachedPdf] = useState(null);
  const pdfDownloadContainerRef = useRef(null);
  const previewContentRef = useRef(null);

  const loadRecordsFromCloud = async () => {
    if (!isSupabaseConfigured) return;
    setIsCloudSyncing(true);
    try {
      const cloudRecords = await fetchInspectionRecords();
      if (cloudRecords && cloudRecords.length > 0) {
        const mapped = cloudRecords.map((r) => ({
          id: r.id,
          date: r.date,
          section: r.section || 'TRB',
          channel: r.channel || '',
          ringSection: r.ring_section || '',
          machine: r.machine || '',
          formatNo: r.format_no || '',
          operation: r.operation || '',
          type: r.type || '',
          shift: r.shift || '',
          inspector: r.inspector || '',
          status: r.status || 'YES',
          formData: r.form_data || null,
          tableData: r.table_data || null,
          pdfUrl: r.pdf_url || null,
          attachmentUrl: r.form_data?.attachmentUrl || null,
          attachmentName: r.form_data?.attachmentName || null
        }));
        // Merge cloud records with local initial database, prioritizing cloud
        setRecords((prev) => {
          const cloudIds = new Set(mapped.map((m) => m.id));
          const remainingDefaults = prev.filter((p) => !cloudIds.has(p.id));
          return [...mapped, ...remainingDefaults];
        });
      }
    } catch (err) {
      console.error('Error fetching Supabase records:', err);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  useEffect(() => {
    loadHtml2Pdf();
    loadRecordsFromCloud();
  }, []);

  const handleClearFilters = () => {
    setFilterInputs({
      recordId: '',
      operation: '',
      date: '',
      section: '',
      channel: '',
      ringSection: '',
      machine: '',
      shift: ''
    });
    setAppliedFilters({
      recordId: '',
      operation: '',
      date: '',
      section: '',
      channel: '',
      ringSection: '',
      machine: '',
      shift: ''
    });
    setAttachedPdf(null);
  };

  const handleViewReportsClick = () => {
    setActiveTab('report');
    // Clear the filter lock so the user immediately sees all database reports
    handleClearFilters();
    loadRecordsFromCloud();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filterInputs });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a valid PDF file.');
      return;
    }

    const localPdfUrl = URL.createObjectURL(file);
    setAttachedPdf({
      file,
      name: file.name,
      url: localPdfUrl
    });
  };

  const handlePreviewRecord = (rec) => {
    setPreviewRecord(rec);
  };

  const handlePrintRecord = async (rec) => {
    if (rec.pdfUrl && !rec.formData) {
      window.open(rec.pdfUrl, '_blank');
      return;
    }

    const attachment = rec.attachmentFile || rec.attachmentUrl || rec.formData?.attachmentUrl || rec.attachedPdf;
    if (attachment) {
      try {
        setIsGeneratingPdf(true);
        setDownloadingRecord(rec);
        await loadHtml2Pdf();
        setTimeout(() => {
          requestAnimationFrame(async () => {
          try {
            const element = pdfDownloadContainerRef.current;
            if (!element || !window.html2pdf) {
              throw new Error('PDF generator element not ready');
            }
            const printOpt = {
              margin: [5, 5, 5, 5],
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2, useCORS: true, logging: false, scrollX: 0, scrollY: 0 },
              jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            const worker = window.html2pdf().set(printOpt).from(element);
            const basePdfBlob = await worker.outputPdf('blob');
            const mergedPdfBlob = await mergePdfWithAttachment(basePdfBlob, attachment);
            const blobUrl = URL.createObjectURL(mergedPdfBlob);
            const printWin = window.open(blobUrl, '_blank');
            if (printWin) {
              printWin.focus();
            }
          } catch (err) {
            console.error('Print merge error:', err);
            setPrintRecord(rec);
            setTimeout(() => window.print(), 150);
          } finally {
            setIsGeneratingPdf(false);
            setDownloadingRecord(null);
          }
          });
        }, 600);
        return;
      } catch (e) {
        console.error(e);
      }
    }

    setPrintRecord(rec);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleDownloadRecord = async (rec) => {
    if (rec.pdfUrl && !rec.formData) {
      const link = document.createElement('a');
      link.href = rec.pdfUrl;
      link.download = `Inspection_Report_${rec.id || 'Sheet'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    try {
      setIsGeneratingPdf(true);
      setDownloadingRecord(rec);
      await loadHtml2Pdf();

      setTimeout(() => {
        requestAnimationFrame(async () => {
        try {
          const element = pdfDownloadContainerRef.current;
          if (!element || !window.html2pdf) {
            throw new Error('PDF generator element not ready');
          }

          const opt = {
            margin: [5, 5, 5, 5],
            filename: `SKF_Inspection_Report_${rec.machine || rec.machineNo || rec.id || 'Sheet'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
              scale: 2,
              useCORS: true,
              logging: false,
              scrollX: 0,
              scrollY: 0
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
          };

          const worker = window.html2pdf().set(opt).from(element);
          const basePdfBlob = await worker.outputPdf('blob');

          // Concatenate uploaded PDF attachment if present
          const attachment = rec.attachmentFile || rec.attachmentUrl || rec.formData?.attachmentUrl || rec.attachedPdf;
          let finalPdfBlob = basePdfBlob;
          if (attachment) {
            try {
              finalPdfBlob = await mergePdfWithAttachment(basePdfBlob, attachment);
            } catch (mergeErr) {
              console.warn('Could not merge supplementary PDF attachment:', mergeErr);
            }
          }

          // If Supabase is configured, also save final concatenated blob to Supabase Storage
          if (isSupabaseConfigured && !rec.pdfUrl) {
            try {
              const publicUrl = await uploadPdfToStorage(finalPdfBlob, `${rec.id}.pdf`);
              if (publicUrl) {
                const updatedRec = { ...rec, pdfUrl: publicUrl };
                await saveInspectionRecord(updatedRec);
                setRecords((prev) => prev.map((item) => item.id === rec.id ? updatedRec : item));
              }
            } catch (cloudErr) {
              console.warn('Could not upload PDF to Supabase Storage, downloading locally:', cloudErr);
            }
          }

          // Trigger download of the concatenated PDF
          const downloadUrl = URL.createObjectURL(finalPdfBlob);
          const downloadLink = document.createElement('a');
          downloadLink.href = downloadUrl;
          downloadLink.download = opt.filename;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          setTimeout(() => URL.revokeObjectURL(downloadUrl), 10000);
        } catch (err) {
          console.error('PDF download error:', err);
          alert('Could not generate direct PDF file. Please use Preview -> Print -> "Save as PDF".');
        } finally {
          setIsGeneratingPdf(false);
          setDownloadingRecord(null);
        }
        });
      }, 600);
    } catch (err) {
      console.error(err);
      setIsGeneratingPdf(false);
      setDownloadingRecord(null);
    }
  };

  const handleDownloadFromPreview = async () => {
    if (!previewRecord) return;
    await handleDownloadRecord(previewRecord);
  };

  const filteredRecords = records.filter((rec) => {
    const formattedRecDate = formatDateToDDMMYY(rec.date);
    const formattedFilterDate = formatDateToDDMMYY(appliedFilters.date);
    const dateMatches = !appliedFilters.date || (formattedRecDate === formattedFilterDate) || (rec.date === appliedFilters.date);

    return (
      dateMatches &&
      (!appliedFilters.recordId || (rec.id || '').toLowerCase().includes(appliedFilters.recordId.trim().toLowerCase())) &&
      (!appliedFilters.operation || (rec.operation || '').toLowerCase().includes(appliedFilters.operation.trim().toLowerCase())) &&
      (!appliedFilters.section || rec.section === appliedFilters.section) &&
      (!appliedFilters.channel || (rec.channel || '').toLowerCase().includes(appliedFilters.channel.toLowerCase())) &&
      (!appliedFilters.ringSection || (rec.ringSection || '').toLowerCase() === appliedFilters.ringSection.toLowerCase()) &&
      (!appliedFilters.machine || (rec.machine || '').toLowerCase().includes(appliedFilters.machine.toLowerCase())) &&
      (!appliedFilters.shift || rec.shift === appliedFilters.shift)
    );
  });

  const selectStyle = {
    width: '100%',
    padding: '7px 10px',
    borderRadius: '6px',
    border: '1px solid #c4c4c4',
    backgroundColor: '#fff',
    fontSize: '13px',
    outline: 'none'
  };

  const labelStyle = {
    fontSize: '12px',
    fontWeight: 'bold',
    marginBottom: '6px',
    display: 'block',
    color: '#000'
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '15px', backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      {/* Header Bar */}
      <div style={{ backgroundColor: '#002b49', color: '#fff', padding: '14px 22px', borderRadius: '8px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', position: 'relative', boxShadow: '0 2px 10px rgba(0, 43, 73, 0.22)' }}>
        {/* Left: Bigger SKF Logo */}
        <div style={{ display: 'flex', alignItems: 'center', minWidth: '160px' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '6px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.18)' }}>
            <img
              src={skfLogo}
              alt="SKF Logo"
              style={{ height: '46px', width: 'auto', display: 'block', objectFit: 'contain' }}
            />
          </div>
        </div>

        {/* Center: Portal Title & Subtitle */}
        <div style={{ flex: 1, textAlign: 'center', minWidth: '280px', padding: '0 10px' }}>
          <h2 style={{ margin: 0, fontSize: '23px', fontWeight: 'bold', letterSpacing: '0.4px', color: '#ffffff', lineHeight: 1.25 }}>
            SKF Quality Assurance Portal
          </h2>
          <span style={{ fontSize: '13px', opacity: 0.9, display: 'block', marginTop: '4px', color: '#cbd5e1', letterSpacing: '0.2px' }}>
            First Off Inspection Management System
          </span>
        </div>

        {/* Right: Navigation Buttons */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'flex-end', minWidth: '160px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('entry')}
            style={{
              padding: '9px 20px',
              fontWeight: 'bold',
              fontSize: '13.5px',
              border: activeTab === 'entry' ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              cursor: 'pointer',
              backgroundColor: activeTab === 'entry' ? '#005a9c' : 'rgba(255,255,255,0.1)',
              color: '#ffffff',
              boxShadow: activeTab === 'entry' ? '0 2px 6px rgba(0,0,0,0.25)' : 'none',
              transition: 'all 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            Data Entry
          </button>
          <button
            type="button"
            onClick={handleViewReportsClick}
            style={{
              padding: '9px 20px',
              fontWeight: 'bold',
              fontSize: '13.5px',
              border: activeTab === 'report' ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              cursor: 'pointer',
              backgroundColor: activeTab === 'report' ? '#005a9c' : 'rgba(255,255,255,0.1)',
              color: '#ffffff',
              boxShadow: activeTab === 'report' ? '0 2px 6px rgba(0,0,0,0.25)' : 'none',
              transition: 'all 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            View Reports
          </button>
        </div>
      </div>

      {/* Data Entry & Reports Section */}
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #dcdcdc', marginBottom: '15px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#002b49', fontSize: '18px', fontWeight: 'bold' }}>
          {activeTab === 'entry' ? 'Data Entry & Reports' : 'Search Reports'}
        </h3>

        {/* Top Filters Row */}
        <div style={{ display: 'grid', gridTemplateColumns: activeTab === 'entry' ? 'repeat(5, 1fr)' : 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px 20px', alignItems: 'start' }}>
          {activeTab === 'report' && (
            <div>
              <label style={labelStyle}>Record ID:</label>
              <input
                type="text"
                name="recordId"
                placeholder="e.g. REC-868"
                value={filterInputs.recordId}
                onChange={handleFilterChange}
                onKeyDown={(e) => { if (e.key === 'Enter') handleApplyFilters(); }}
                style={selectStyle}
              />
            </div>
          )}
          {activeTab === 'report' && (
            <div>
              <label style={labelStyle}>Operation:</label>
              <select name="operation" value={filterInputs.operation} onChange={handleFilterChange} style={selectStyle}>
                <option value="">All Operations</option>
                <option value="TRACK GRINDING">Track Grinding</option>
                <option value="BORE GRINDING">Bore Grinding</option>
                <option value="FLANGE GRINDING">Flange Grinding</option>
                <option value="TRACK HONNING">Track Honing</option>
                <option value="MARKING">Marking</option>
                <option value="ASSEMBLY">Assembly</option>
                <option value="QUALITY EQUIPMENTS">Quality Equipments</option>
              </select>
            </div>
          )}
          <div>
            <label style={labelStyle}>Date:</label>
            <input type="date" name="date" value={filterInputs.date} onChange={handleFilterChange} onKeyDown={(e) => { if (e.key === 'Enter') handleApplyFilters(); }} style={{ ...selectStyle, padding: '5px 10px' }} />
          </div>
          <div>
            <label style={labelStyle}>Section (DGBB/TRB):</label>
            <select name="section" value={filterInputs.section} onChange={handleFilterChange} style={selectStyle}>
              <option value="">Choose an option</option>
              <option value="TRB">TRB</option>
              <option value="DGBB">DGBB</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Channel:</label>
            <select name="channel" value={filterInputs.channel} onChange={handleFilterChange} style={selectStyle}>
              <option value="">Choose an option</option>
              <option value="T1">T1</option>
              <option value="T2">T2</option>
              <option value="T3">T3</option>
              <option value="T4">T4</option>
              <option value="T5">T5</option>
              <option value="T6">T6</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Ring Section:</label>
            <select name="ringSection" value={filterInputs.ringSection} onChange={handleFilterChange} style={selectStyle}>
              <option value="">Choose an option</option>
              <option value="INNER RING">Inner Ring</option>
              <option value="Outer Ring">Outer Ring</option>
              <option value="Assembly">Assembly</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Machine No.:</label>
            <input
              type="text"
              name="machine"
              placeholder="Enter Your Machine No"
              value={filterInputs.machine}
              onChange={handleFilterChange}
              onKeyDown={(e) => { if (e.key === 'Enter') handleApplyFilters(); }}
              style={selectStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Shift:</label>
            <select name="shift" value={filterInputs.shift} onChange={handleFilterChange} style={selectStyle}>
              <option value="">Choose an option</option>
              <option value="I">I Shift</option>
              <option value="II">II Shift</option>
              <option value="III">III Shift</option>
            </select>
          </div>

          {activeTab === 'entry' && (
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ ...labelStyle, color: '#004080', margin: 0 }}>Upload PDF Report (Attachment):</label>
                {attachedPdf && (
                  <button
                    type="button"
                    onClick={() => setAttachedPdf(null)}
                    style={{ fontSize: '11px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Remove attached
                  </button>
                )}
              </div>
              <input type="file" accept="application/pdf" onChange={handleFileUpload} style={{ fontSize: '13px', border: 'none', padding: '2px 0' }} />
              {attachedPdf && (
                <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 'bold', marginTop: '4px', backgroundColor: '#dcfce7', padding: '3px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  📎 {attachedPdf.name} (will concatenate with report)
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '6px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleApplyFilters}
                style={{
                  padding: '7px 20px',
                  backgroundColor: '#005a9c',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                  height: '34px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#004070'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#005a9c'}
              >
                {activeTab === 'entry' ? 'Fill Report' : 'Search Report'}
              </button>
              {activeTab === 'report' && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  style={{
                    padding: '7px 12px',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer',
                    height: '34px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                  title="Reset search filters"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Embedded Select Inspection Sheet Section */}
        {activeTab === 'entry' && (
          <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#000', marginRight: '15px' }}>
              Select Inspection Sheet
            </span>
            <select
              value={selectedForm}
              onChange={(e) => setSelectedForm(e.target.value)}
              style={{ padding: '7px 12px', borderRadius: '6px', border: '1.5px solid #005a9c', fontSize: '14px', minWidth: '320px', fontWeight: '500', outline: 'none', backgroundColor: '#fff', color: '#000' }}
            >
              <option value="">Choose an option</option>
              <option value="SKF/QA/TRB/02">SKF/QA/TRB/02 - Track Grinding (Inner Ring)</option>
              <option value="SKF/QA/TRB/03-1">SKF/QA/TRB/03 - Bore Grinding (Inner Ring) (1)</option>
              <option value="SKF/QA/TRB/03-2">SKF/QA/TRB/03 - Bore Grinding (Inner Ring) (2)</option>
              <option value="SKF/QA/TRB/04">SKF/QA/TRB/04 - Flange Grinding (Inner Ring)</option>
              <option value="SKF/QA/TRB/05">SKF/QA/TRB/05 - Track Honning (Inner Ring)</option>
              <option value="SKF/QA/TRB/08-1">SKF/QA/TRB/08 - Marking (Inner Ring)</option>
              <option value="SKF/QA/TRB/06-1">SKF/QA/TRB/06 - Track Grinding (1) (Outer Ring)</option>
              <option value="SKF/QA/TRB/06-2">SKF/QA/TRB/06 - Track Grinding (2) (Outer Ring)</option>
              <option value="SKF/QA/TRB/07-1">SKF/QA/TRB/07 - Track Honning (1) (Outer Ring)</option>
              <option value="SKF/QA/TRB/07-2">SKF/QA/TRB/07 - Track Honning (2) (Outer Ring)</option>
              <option value="SKF/QA/TRB/08">SKF/QA/TRB/08 - Marking (Outer Ring)</option>
              <option value="SKF/QA/TRB/09">SKF/QA/TRB/09 - Assembly Off Inspection(1) (Assembly)</option>
              <option value="SKF/QA/TRB/17">SKF/QA/TRB/17 - Assembly of Quality Equipment (2) (Assembly)</option>
            </select>
          </div>
        )}
      </div>

      {activeTab === 'entry' ? (
        <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <FormTRB02Machine1374
            selectedFormKey={selectedForm}
            filters={appliedFilters}
            setRecords={setRecords}
            onRecordSaved={loadRecordsFromCloud}
            attachedPdf={attachedPdf}
            onClearAttachedPdf={() => setAttachedPdf(null)}
          />
        </div>
      ) : (
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: '#002b49', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ReportIcon size={20} color="#002b49" />
              Historical Inspection Reports &amp; Backdated Logs
              <span style={{ fontSize: '13px', fontWeight: 'normal', color: '#64748b', marginLeft: '6px' }}>
                ({filteredRecords.length} {filteredRecords.length === 1 ? 'report' : 'reports'} shown)
              </span>
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {(appliedFilters.recordId || appliedFilters.operation || appliedFilters.date || appliedFilters.section || appliedFilters.channel || appliedFilters.ringSection || appliedFilters.machine || appliedFilters.shift) && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  style={{
                    backgroundColor: '#f1f5f9',
                    color: '#0f172a',
                    border: '1px solid #cbd5e1',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                  title="Show all records without any filter"
                >
                  Clear Filters (Show All)
                </button>
              )}
              <button
                type="button"
                onClick={loadRecordsFromCloud}
                disabled={isCloudSyncing}
                style={{
                  backgroundColor: '#005a9c',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '4px',
                  cursor: isCloudSyncing ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: isCloudSyncing ? 0.7 : 1
                }}
                title="Fetch latest reports from Supabase"
              >
                <CloudIcon size={14} color="#fff" />
                {isCloudSyncing ? 'Syncing...' : 'Refresh Reports'}
              </button>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }} border="1">
            <thead>
              <tr style={{ backgroundColor: '#002b49', color: '#fff' }}>
                <th style={{ padding: '8px' }}>Record ID</th>
                <th style={{ padding: '8px' }}>Date</th>
                <th style={{ padding: '8px' }}>Format No</th>
                <th style={{ padding: '8px' }}>Section</th>
                <th style={{ padding: '8px' }}>Channel</th>
                <th style={{ padding: '8px' }}>Ring Section</th>
                <th style={{ padding: '8px' }}>Machine</th>
                <th style={{ padding: '8px' }}>Operation</th>
                <th style={{ padding: '8px' }}>Type</th>
                <th style={{ padding: '8px' }}>Shift</th>
                <th style={{ padding: '8px' }}>Inspector</th>
                <th style={{ padding: '8px' }}>Released</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>Print &amp; Preview</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>Download PDF</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>{rec.id}</td>
                    <td style={{ padding: '8px' }}>{formatDateToDDMMYY(rec.date)}</td>
                    <td style={{ padding: '8px' }}>{rec.formatNo}</td>
                    <td style={{ padding: '8px' }}>{rec.section}</td>
                    <td style={{ padding: '8px' }}>{rec.channel}</td>
                    <td style={{ padding: '8px' }}>{rec.ringSection}</td>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>{rec.machine}</td>
                    <td style={{ padding: '8px' }}>{rec.operation}</td>
                    <td style={{ padding: '8px' }}>{rec.type}</td>
                    <td style={{ padding: '8px' }}>{rec.shift}</td>
                    <td style={{ padding: '8px' }}>{rec.inspector}</td>
                    <td style={{ padding: '8px', color: rec.status === 'YES' ? 'green' : 'red', fontWeight: 'bold' }}>{rec.status}</td>
                    <td style={{ padding: '8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        onClick={() => handlePreviewRecord(rec)}
                        style={{
                          backgroundColor: '#005a9c',
                          color: '#fff',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          marginRight: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'background-color 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#004070'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#005a9c'}
                        title="Preview inspection report"
                      >
                        <EyeIcon size={13} color="#ffffff" /> Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePrintRecord(rec)}
                        style={{
                          backgroundColor: '#334155',
                          color: '#fff',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          transition: 'background-color 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#334155'}
                        title="Print inspection report"
                      >
                        <PrintIcon size={13} color="#ffffff" /> Print
                      </button>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        onClick={() => handleDownloadRecord(rec)}
                        style={{
                          backgroundColor: '#166534',
                          color: '#fff',
                          border: 'none',
                          padding: '5px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          transition: 'background-color 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#14532d'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#166534'}
                        title="Download as normal PDF"
                      >
                        <DownloadIcon size={13} color="#ffffff" /> Download PDF
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="14" style={{ padding: '15px', textAlign: 'center', color: '#777' }}>
                    No backdated records found matching the active global filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview Modal */}
      {previewRecord && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            boxSizing: 'border-box'
          }}
        >
          <div
            style={{
              backgroundColor: '#f1f5f9',
              borderRadius: '10px',
              width: '880px',
              maxWidth: '96vw',
              maxHeight: '94vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
              overflow: 'hidden',
              border: '1px solid #cbd5e1'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '12px 20px',
                backgroundColor: '#002b49',
                color: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <DocumentIcon size={18} color="#ffffff" style={{ marginRight: '8px' }} />
                <span style={{ fontSize: '16px', fontWeight: 'bold', marginRight: '10px' }}>
                  Inspection Report Preview: {previewRecord.id}
                </span>
                <span style={{ fontSize: '12px', opacity: 0.85, backgroundColor: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                  {previewRecord.formatNo} {previewRecord.operation ? `• ${previewRecord.operation}` : ''}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => handlePrintRecord(previewRecord)}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#002b49',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '5px',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <PrintIcon size={13} color="#002b49" /> Print
                </button>
                <button
                  type="button"
                  onClick={handleDownloadFromPreview}
                  style={{
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '5px',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <DownloadIcon size={13} color="#ffffff" /> Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewRecord(null)}
                  style={{
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginLeft: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Close Preview"
                >
                  <CloseIcon size={12} color="#ffffff" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', justifyContent: 'center', backgroundColor: '#cbd5e1' }}>
              {previewRecord.pdfUrl && !previewRecord.formData ? (
                <iframe
                  src={previewRecord.pdfUrl}
                  style={{ width: '100%', height: '650px', border: 'none', borderRadius: '4px', backgroundColor: '#fff' }}
                  title="Uploaded PDF View"
                />
              ) : (
                <div
                  ref={previewContentRef}
                  style={{
                    backgroundColor: '#ffffff',
                    width: '780px',
                    maxWidth: '100%',
                    padding: '16px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                    borderRadius: '2px',
                    boxSizing: 'border-box'
                  }}
                >
                  <ReportDocumentView record={previewRecord} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PDF Generation Overlay */}
      {isGeneratingPdf && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 20000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '24px 32px',
              borderRadius: '10px',
              textAlign: 'center',
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
              color: '#002b49',
              maxWidth: '420px'
            }}
          >
            <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'center' }}>
              <SpinnerIcon size={42} color="#005a9c" />
            </div>
            <div style={{ fontSize: '17px', fontWeight: 'bold', marginBottom: '8px' }}>
              Generating Normal SKF Inspection PDF...
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              Formatting high-resolution vector tables, checkmarks &amp; tolerances. Your download will begin shortly.
            </div>
          </div>
        </div>
      )}

      {/* Hidden container for PDF export — the ref'd div is cloned by html2pdf
          into its own 200mm-wide container, so we must NOT set width/maxWidth/margin
          on it; only the outer parent (not cloned) provides on-screen layout. */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '800px',
          backgroundColor: '#ffffff',
          zIndex: 15000,
          opacity: isGeneratingPdf && downloadingRecord ? 1 : 0,
          pointerEvents: 'none'
        }}
      >
        <div ref={pdfDownloadContainerRef} style={{ backgroundColor: '#ffffff' }}>
          {downloadingRecord && <ReportDocumentView record={downloadingRecord} isPdfMode={true} />}
        </div>
      </div>

      {/* Hidden print container for clean vector print */}
      <div id="skf-print-mount">
        {printRecord && <ReportDocumentView record={printRecord} isPrintMode={true} />}
      </div>

      {/* Media Print CSS for 100% Vector Print Quality */}
      <style>{`
        @media screen {
          #skf-print-mount {
            display: none !important;
          }
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm;
          }
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            visibility: hidden !important;
          }
          #root {
            visibility: hidden !important;
          }
          #skf-print-mount,
          #skf-print-mount * {
            visibility: visible !important;
          }
          #skf-print-mount {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            z-index: 9999999 !important;
          }
        }
      `}</style>
    </div>
  );
}
