const puppeteer = require('puppeteer');
const qualityPoints = require('./qualityPoints');

const formURL = 'http://lms.uaf.edu.pk/login/index.php';

async function getResult(ag) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(0);

  await page.goto(formURL, { waitUntil: 'networkidle0' });

  await page.$eval(
    '#REG',
    (input, ag) => {
      input.value = ag;

      const form = input.parentElement.parentElement;

      form.submit();
    },
    ag
  );

  await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

  const data = await parseResults(page);

  const cgpa = calcCGPA(data.results);

  data['cgpa'] = cgpa;

  await browser.close();

  return data;
}

async function parseResults(page) {
  const [infoTable, resultTable] = await page.$$('table');
  if (!infoTable) return;
  const [studentAg, studentName] = await infoTable.$$eval('tr', (rows) =>
    rows.map((row) => row.lastElementChild.textContent.trim().toLowerCase())
  );

  const results = await resultTable.$$eval('tr', (rows) => {
    const headingRow = rows.slice(0, 1)[0];
    const dataRows = rows.slice(1, rows.length);

    const headings = Array.from(headingRow.querySelectorAll('th')).map((th) =>
      th.textContent.trim().toLowerCase()
    );

    const results = [];

    dataRows.forEach((row) => {
      const tdContents = Array.from(row.querySelectorAll('td')).map((td) =>
        td.textContent.trim().toLowerCase()
      );

      const data = {};

      headings.forEach((heading, i) => {
        data[heading] = tdContents[i];
      });

      results.push(data);
    });

    return results;
  });

  return { studentName, studentAg, results };
}

function calcCGPA(results) {
  const qPs = results.map((result) => {
    const creditHours = result['credit hours'][0];
    const marks = result['total'];

    const currentSubjectPointList = qualityPoints[creditHours];
    const currentSubjectVaraibleMarks = Object.keys(currentSubjectPointList)
      .sort()
      .map((x) => parseInt(x));

    const fullPointMarks =
      currentSubjectVaraibleMarks[currentSubjectVaraibleMarks.length - 1];
    const onePointmarks = currentSubjectVaraibleMarks[0];

    let qp = 0;

    if (marks >= fullPointMarks) qp = (creditHours * 20) / 5;
    else if (marks < onePointmarks) qp = 0;
    else qp = currentSubjectPointList[marks];

    return qp;
  });

  const totalCreditHours = results.reduce(
    (total, result) => total + parseInt(result['credit hours'][0]),
    0
  );
  const totalQPs = qPs.reduce((total, qp) => total + qp);

  const cgpa = (totalQPs / totalCreditHours).toFixed(2);

  return cgpa;
}

module.exports = { getResult };
