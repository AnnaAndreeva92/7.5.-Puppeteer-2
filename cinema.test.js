const { clickElement, putText, getText } = require("./lib/commands.js");
const puppeteer = require("puppeteer");
const {
  selectDateTime,
  orderTickets,
  checkSeatIsTaken,
} = require("./lib/util");

let page;
let tomorrow = "nav.page-nav > a:nth-child(2)"; //Билеты на завтра
let oneWeek = "nav.page-nav > a:nth-child(7)"; //Билеты через неделю
let movieTime = '[data-seance-id= "175"]'; //10:00 Терминатор-заржавел
let ticketHint = "p.ticket__hint";
let confirmingText =
  "Покажите QR-код нашему контроллеру для подтверждения бронирования.";

beforeEach(async () => {
  page = await browser.newPage();
  await page.goto("http://qamid.tmweb.ru/client/index.php");
});

afterEach(() => {
  page.close();
});

describe("Booking tickets", () => {
  test("ticket booking standard", async () => {
    const title = await page.title();
    console.log("Page title: " + title);
    await clickElement(page, tomorrow);
    await clickElement(page, movieTime);
    await orderTickets(page, 2, 4);
    const actual = await getText(page, ticketHint);
    expect(actual).toContain(confirmingText);
  });
});

test("Should order three tickets for Movie-1 in a week", async () => {
  await selectDateTime(page, oneWeek, movieTime);
  await orderTickets(page, 6, 8, 9, 10);
  const actual = await getText(page, ticketHint);
  expect(actual).toContain(confirmingText);
});

test("Should try to order ticket for Movie-1 if seat is taken already", async () => {
  await expect(async () => {
    await selectDateTime(page, tomorrow, movieTime);
    await orderTickets(page, 2, 4);
  }).rejects.toThrowError("Seat(s) is taken");
});
test("Check if the place is taken after ordering ", async () => {
  let row = 2;
  let seat = 10;
  await selectDateTime(page, oneWeek, movieTime);
  await orderTickets(page, row, seat);
  await page.goto("http://qamid.tmweb.ru/client/index.php");
  await selectDateTime(page, oneWeek, movieTime);
  await checkSeatIsTaken(page, row, seat);
  const classExist = await page.$eval(
    `div.buying-scheme__wrapper > div:nth-child(${row}) > span:nth-child(${seat})`,
    (el) => el.classList.contains("buying-scheme__chair_taken")
  );
  expect(classExist).toEqual(true);
});
