-- ====================================================================
-- SKF Quality Assurance Portal - Clean Demo Seed Data
-- ====================================================================
-- Run this script in pgAdmin 4 Query Tool to insert realistic,
-- professional SKF First-Off Inspection records for demonstrations.
-- ====================================================================

-- 1. Optional: Clear any old test records first (uncomment if desired)
-- TRUNCATE TABLE public.inspection_records;

-- 2. Insert Sample Record 1: TRB Channel T1 - Track Grinding (Inner Ring)
INSERT INTO public.inspection_records (
    id, date, section, channel, ring_section, machine, format_no, operation, type, shift, inspector, status, form_data, table_data
) VALUES (
    'REC-101',
    '15/09/26',
    'TRB',
    'T1',
    'Inner Ring',
    'TG-1374',
    'SKF/QA/TRB/02',
    'Track Grinding',
    '32008X',
    'I',
    'A. V. Sharma',
    'YES',
    '{
        "formatNo": "SKF/QA/TRB/02",
        "revisionNo": "01",
        "revDate": "14/07",
        "prepBy": "AVS",
        "appdBy": "SS",
        "section": "TRB",
        "channelNo": "T1",
        "grinding": "Inner Ring",
        "machineNo": "TG-1374",
        "operation": "Track Grinding",
        "type": "32008X",
        "shift": "I",
        "date": "15/09/26",
        "machineReleased": "YES",
        "inspectorName": "A. V. Sharma",
        "supervisorName": "S. Shinde",
        "reasonSelected": 1
    }'::jsonb,
    '[
        {"id": 1, "parameter": "Track Diameter", "symbol": "Di", "tol": "±0.015", "isDoubleRow": true, "samplesRow1": ["52.002", "52.001", "52.000", "52.003", "52.001"], "samplesRow2": ["52.001", "52.000", "52.002", "52.001", "52.002"]},
        {"id": 2, "parameter": "Track Ovality", "symbol": "VDi", "tol": "0.005", "samples": ["0.002", "0.001", "0.002", "0.003", "0.001"]},
        {"id": 3, "parameter": "Land Diameter", "symbol": "Dk", "tol": "±0.020", "samples": ["58.12", "58.11", "58.13", "58.12", "58.12"]},
        {"id": 4, "parameter": "Track Angle", "symbol": "β", "tol": "14° ±5''", "samples": ["14°02''", "14°01''", "14°00''", "14°03''", "14°01''"]},
        {"id": 5, "parameter": "Track Angle Variation", "symbol": "Vβ", "tol": "3''", "samples": ["1''", "2''", "1''", "2''", "1''"]},
        {"id": 6, "parameter": "Track 3 Point", "symbol": "V3di", "tol": "0.004", "samples": ["0.002", "0.001", "0.002", "0.001", "0.002"]},
        {"id": 7, "parameter": "Track Form (Crowning)", "symbol": "Pi", "tol": "0.8 - 1.2", "samples": ["1.02", "0.98", "1.05", "1.01", "0.99"]},
        {"id": 8, "parameter": "Grinding Burns", "symbol": "–", "tol": "", "isVisualOption": true, "samples": ["✓", "✓", "✓", "✓", "✓"]},
        {"id": 9, "isVisualGroup": true, "isFirstInGroup": true, "parameter": "• Visual Inspection", "subParameter": "No Slots/Step on Track", "samples": ["✓", "✓", "✓", "✓", "✓"]},
        {"id": 10, "isVisualGroup": true, "isFirstInGroup": false, "parameter": "• Visual Inspection", "subParameter": "No marks on OD/Face/Track", "samples": ["✓", "✓", "✓", "✓", "✓"]}
    ]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    date = EXCLUDED.date,
    form_data = EXCLUDED.form_data,
    table_data = EXCLUDED.table_data;

-- 3. Insert Sample Record 2: TRB Channel T2 - Bore Grinding (Inner Ring)
INSERT INTO public.inspection_records (
    id, date, section, channel, ring_section, machine, format_no, operation, type, shift, inspector, status, form_data, table_data
) VALUES (
    'REC-102',
    '15/09/26',
    'TRB',
    'T2',
    'Inner Ring',
    'BG-2041',
    'SKF/QA/TRB/03-1',
    'Bore Grinding',
    '32210',
    'II',
    'R. S. Kulkarni',
    'YES',
    '{
        "formatNo": "SKF/QA/TRB/03-1",
        "revisionNo": "02",
        "revDate": "15/08",
        "prepBy": "RSK",
        "appdBy": "MK",
        "section": "TRB",
        "channelNo": "T2",
        "grinding": "Inner Ring",
        "machineNo": "BG-2041",
        "operation": "Bore Grinding",
        "type": "32210",
        "shift": "II",
        "date": "15/09/26",
        "machineReleased": "YES",
        "inspectorName": "R. S. Kulkarni",
        "supervisorName": "M. K. Patil",
        "reasonSelected": 1
    }'::jsonb,
    '[
        {"id": "bg-1", "parameter": "Bore Diameter", "symbol": "Ød 50.00 mm", "isDiagonal": true, "tol": {"top": "0", "bottom": "-12"}, "samples": [{"top": "-8", "bottom": "-10"}, {"top": "-6", "bottom": "-9"}, {"top": "-7", "bottom": "-10"}, {"top": "-5", "bottom": "-8"}, {"top": "-6", "bottom": "-7"}]},
        {"id": "bg-2", "parameter": "Bore Ovality", "symbol": "Vd", "tol": "0.005", "samples": ["0.002", "0.002", "0.003", "0.001", "0.002"]},
        {"id": "bg-3", "parameter": "Bore Taper", "symbol": "Vdm", "tol": "0.006", "samples": ["0.002", "0.003", "0.002", "0.002", "0.001"]},
        {"id": "bg-4", "parameter": "Bore 3 Point", "symbol": "V3d", "tol": "0.004", "samples": ["0.001", "0.002", "0.001", "0.002", "0.001"]},
        {"id": "bg-5", "parameter": "Surface Roughness", "symbol": "Ra", "tol": "0.40", "samples": ["0.28", "0.31", "0.29", "0.30", "0.27"]},
        {"id": "bg-9", "parameter": "Grinding Burns", "symbol": "–", "tol": "", "isVisualOption": true, "samples": ["✓", "✓", "✓", "✓", "✓"]},
        {"id": "bg-10", "isVisualGroup": true, "isFirstInGroup": true, "parameter": "Visual Inspection", "subParameter": "No Face marks", "samples": ["✓", "✓", "✓", "✓", "✓"]},
        {"id": "bg-11", "isVisualGroup": true, "isFirstInGroup": false, "parameter": "Visual Inspection", "subParameter": "No chatter / damage on bore", "samples": ["✓", "✓", "✓", "✓", "✓"]}
    ]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    date = EXCLUDED.date,
    form_data = EXCLUDED.form_data,
    table_data = EXCLUDED.table_data;

-- 4. Insert Sample Record 3: TRB Channel T6 - Assembly Line
INSERT INTO public.inspection_records (
    id, date, section, channel, ring_section, machine, format_no, operation, type, shift, inspector, status, form_data, table_data
) VALUES (
    'REC-103',
    '15/09/26',
    'TRB',
    'T6',
    'Assembly',
    'ASM-06',
    'SKF/QA/TRB/09',
    'Assembly',
    '32210',
    'I',
    'P. Bandgar',
    'YES',
    '{
        "formatNo": "SKF/QA/TRB/09",
        "revisionNo": "01",
        "revDate": "14/07",
        "prepBy": "PB",
        "appdBy": "SS",
        "section": "TRB",
        "channelNo": "T6",
        "grinding": "Assembly",
        "machineNo": "ASM-06",
        "operation": "Assembly",
        "type": "32210",
        "shift": "I",
        "date": "15/09/26",
        "machineReleased": "YES",
        "inspectorName": "P. Bandgar",
        "supervisorName": "S. Shinde",
        "reasonSelected": 1
    }'::jsonb,
    '[
        {"id": "as-1", "parameter": "CONE HEIGHT", "symbol": "Ti", "sampleSize": "5", "isDiagonalTol": true, "tol": {"top": "0", "bottom": "100"}, "samples": ["72", "70", "68", "74", "71"]},
        {"id": "as-2", "parameter": "CAGE CLEARANCE", "symbol": "Gcr", "sampleSize": "5", "isDiagonalTol": true, "tol": {"top": "100", "bottom": "350"}, "samples": ["260", "250", "240", "270", "255"]},
        {"id": "as-3", "parameter": "OD DIAMETER", "symbol": "D", "sampleSize": "5", "isDiagonalTol": true, "tol": {"top": "-3", "bottom": "-12"}, "samples": ["-6", "-7", "-5", "-6", "-8"]},
        {"id": "as-5", "parameter": "MISSING ROLLER CHECK", "symbol": "–", "sampleSize": "1", "isVisualOption": true, "tol": "OK", "samples": ["✓", "✓", "✓", "✓", "✓"]},
        {"id": "as-6", "parameter": "WASHING UNIT", "symbol": "–", "sampleSize": "–", "isVisualOption": true, "tol": "", "samples": ["✓", "✓", "✓", "✓", "✓"]},
        {"id": "as-7", "parameter": "OILING UNIT", "symbol": "–", "sampleSize": "–", "isVisualOption": true, "tol": "", "samples": ["✓", "✓", "✓", "✓", "✓"]},
        {"id": "as-8", "parameter": "VISUAL CHECK (No marks on rollers/cages/rings)", "symbol": "–", "sampleSize": "5", "isVisualOption": true, "tol": "", "samples": ["✓", "✓", "✓", "✓", "✓"]}
    ]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    date = EXCLUDED.date,
    form_data = EXCLUDED.form_data,
    table_data = EXCLUDED.table_data;
