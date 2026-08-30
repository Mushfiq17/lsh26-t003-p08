export interface CSVStudentRow {
  student_id: string;
  name: string;
  class_name: string;
  optional_subject: string;
  marks: Record<string, any>;
}

export function generateCSVTemplate(): string {
  const headers = [
    'student_id',
    'name',
    'class_name',
    'optional_subject',
    'BAN_total',
    'ENG_total',
    'MAT_total',
    'PHY_theory',
    'PHY_practical',
    'CHE_theory',
    'CHE_practical',
    'BIO_theory',
    'BIO_practical',
    'OPT_total'
  ];

  const sampleRow1 = [
    'STU-101',
    'Alice Smith',
    '9-A',
    'HMT',
    '85',
    '82',
    '88',
    '55',
    '20',
    '60',
    '18',
    '58',
    '19',
    '80'
  ];

  const sampleRow2 = [
    'STU-102',
    'Bob Johnson',
    '9-A',
    'AGR',
    '72',
    '68',
    '75',
    '45',
    '16',
    '50',
    '15',
    '52',
    '17',
    '70'
  ];

  return [headers.join(','), sampleRow1.join(','), sampleRow2.join(',')].join('\n');
}

export function downloadCSVTemplate() {
  const template = generateCSVTemplate();
  const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'gradeforge_import_template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function parseStudentsCSV(csvText: string): CSVStudentRow[] {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return [];

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());

  const getCol = (rowCols: string[], names: string[]): string => {
    for (const name of names) {
      const idx = headers.indexOf(name.toLowerCase());
      if (idx !== -1 && idx < rowCols.length) {
        return rowCols[idx].trim().replace(/^"|"$/g, '');
      }
    }
    return '';
  };

  const getNum = (rowCols: string[], names: string[], defaultVal = 0): number => {
    const str = getCol(rowCols, names);
    const val = parseFloat(str);
    return isNaN(val) ? defaultVal : val;
  };

  const students: CSVStudentRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    // Basic CSV line splitting respecting quotes
    const rowCols = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
    const cleanCols = rowCols.map(c => c.trim().replace(/^"|"$/g, ''));

    const student_id = getCol(cleanCols, ['student_id', 'id']);
    const name = getCol(cleanCols, ['name', 'student_name', 'full_name']);
    const class_name = getCol(cleanCols, ['class_name', 'class']) || '9-A';
    const optional_subject = (getCol(cleanCols, ['optional_subject', 'optional', 'opt']) || 'HMT').toUpperCase();

    if (!student_id || !name) continue;

    const banTotal = getNum(cleanCols, ['ban_total', 'ban', 'bangla'], 70);
    const engTotal = getNum(cleanCols, ['eng_total', 'eng', 'english'], 70);
    const matTotal = getNum(cleanCols, ['mat_total', 'mat', 'math', 'mathematics'], 70);

    const phyTheory = getNum(cleanCols, ['phy_theory', 'phy_th', 'physics_theory'], 50);
    const phyPractical = getNum(cleanCols, ['phy_practical', 'phy_pr', 'physics_practical'], 18);

    const cheTheory = getNum(cleanCols, ['che_theory', 'che_th', 'chemistry_theory'], 50);
    const chePractical = getNum(cleanCols, ['che_practical', 'che_pr', 'chemistry_practical'], 18);

    const bioTheory = getNum(cleanCols, ['bio_theory', 'bio_th', 'biology_theory'], 50);
    const bioPractical = getNum(cleanCols, ['bio_practical', 'bio_pr', 'biology_practical'], 18);

    const optTotal = getNum(cleanCols, ['opt_total', 'opt_mark', 'optional_mark', optional_subject.toLowerCase()], 75);

    const marks: Record<string, any> = {
      BAN: { total_mark: banTotal },
      ENG: { total_mark: engTotal },
      MAT: { total_mark: matTotal },
      PHY: { theory_mark: phyTheory, practical_mark: phyPractical },
      CHE: { theory_mark: cheTheory, practical_mark: chePractical },
      BIO: { theory_mark: bioTheory, practical_mark: bioPractical }
    };

    if (optional_subject === 'HMT') {
      marks['HMT'] = { total_mark: optTotal };
    } else if (optional_subject === 'REL') {
      marks['REL'] = { total_mark: optTotal };
    } else if (optional_subject === 'AGR') {
      marks['AGR'] = { theory_mark: Math.min(optTotal, 75), practical_mark: 18 };
    }

    students.push({
      student_id,
      name,
      class_name,
      optional_subject,
      marks
    });
  }

  return students;
}
