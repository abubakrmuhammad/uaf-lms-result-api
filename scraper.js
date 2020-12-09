const puppeteer = require('puppeteer');

module.exports = (async function () {
  const browser = await puppeteer.launch({ headless: false });
  const page = (await browser.pages())[0];
  page.setDefaultTimeout(0);

  const formURL = 'http://lms.uaf.edu.pk/login/index.php';

  async function getResult(ag) {
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

    await page.waitForNavigation();

    return await parseResults();
  }

  async function parseResults() {
    const [infoTable, resultTable] = await page.$$('table');
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

  return { getResult };
})();
