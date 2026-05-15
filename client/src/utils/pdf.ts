import type { Interview, User } from '../types';

const sanitize = (value: string) =>
  value
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const escapePdfText = (value: string) =>
  sanitize(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const wrapText = (value: string, maxLength = 92) => {
  const words = sanitize(value).split(' ');
  const lines: string[] = [];
  let line = '';

  words.forEach((word) => {
    const nextLine = line ? `${line} ${word}` : word;
    if (nextLine.length > maxLength) {
      if (line) {
        lines.push(line);
      }
      line = word;
    } else {
      line = nextLine;
    }
  });

  if (line) {
    lines.push(line);
  }

  return lines.length ? lines : [''];
};

const buildPages = (interview: Interview, user: User | null) => {
  const pages: string[][] = [];
  let current: string[] = [];

  const pushLine = (line = '') => {
    if (current.length >= 42) {
      pages.push(current);
      current = [];
    }
    current.push(line);
  };

  pushLine('Interview Optimization Report');
  pushLine(`Candidate: ${user?.name || 'Candidate'}`);
  pushLine(`Email: ${user?.email || 'N/A'}`);
  pushLine(`Role: ${interview.role}`);
  pushLine(`Level: ${interview.level}`);
  pushLine(`Score: ${interview.overallScore}/100`);
  pushLine(`Questions: ${interview.questions.length}`);
  pushLine(`Generated: ${new Date().toLocaleString()}`);
  pushLine('');

  interview.questions.forEach((item, index) => {
    pushLine(`Q${index + 1}. ${item.question}`);
    wrapText(`Your answer: ${item.userAnswer || 'No answer provided.'}`).forEach(pushLine);
    wrapText(`Optimized AI answer: ${item.aiAnswer}`).forEach(pushLine);
    wrapText(`Feedback: ${item.feedback || 'Submit the interview to generate feedback.'}`).forEach(pushLine);
    pushLine(`Score: ${item.score}/100`);
    pushLine('');
  });

  if (current.length) {
    pages.push(current);
  }

  return pages;
};

export const downloadInterviewPdf = (interview: Interview, user: User | null) => {
  const pages = buildPages(interview, user);
  const objects: string[] = [];
  const pageObjectIds: number[] = [];

  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push('');
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  pages.forEach((lines, pageIndex) => {
    const pageObjectId = objects.length + 1;
    const contentObjectId = pageObjectId + 1;
    pageObjectIds.push(pageObjectId);

    const textCommands = lines
      .map((line, lineIndex) => {
        const y = 780 - lineIndex * 17;
        const size = pageIndex === 0 && lineIndex === 0 ? 18 : 10;
        return `BT /F1 ${size} Tf 48 ${y} Td (${escapePdfText(line)}) Tj ET`;
      })
      .join('\n');

    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectId} 0 R >>`
    );
    objects.push(`<< /Length ${textCommands.length} >>\nstream\n${textCommands}\nendstream`);
  });

  objects[1] = `<< /Type /Pages /Kids [${pageObjectIds
    .map((id) => `${id} 0 R`)
    .join(' ')}] /Count ${pageObjectIds.length} >>`;

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const blob = new Blob([pdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${interview.role.replace(/\s+/g, '-').toLowerCase()}-interview-report.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};
