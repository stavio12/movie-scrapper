const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const bodyParser = require("body-parser");
const app = express();

let browser;

dotenv.config({ path: "./config.env" });

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("views", path.join(__dirname, "views"));

app.set("view engine", "ejs");

async function scrapData(url, page) {
  try {
    await page.goto(url, { waitUntil: "load", timeout: 0 });
    const html = await page.evaluate(() => document.body.innerHTML);
    const $ = cheerio.load(html);

    let title = $("h2").text();
    let release_date = $(".release_date").text();
    let overview = $(".overview > p").text();
    let userScore = $(".user_score_chart").attr("data-percent");
    let imgUrl = $("#original_header > div.poster_wrapper.false > div > div.image_content.backdrop > img").attr("src");
    let crewLength = $("div.header_info > ol > li").length;

    let crew = [];

    for (let i = 1; i <= crewLength; i++) {
      let name = $("div.header_info > ol > li:nth-child(" + i + ") > p:nth-child(1)").text();
      let role = $("div.header_info > ol > li:nth-child(" + i + ") > p.character").text();

      crew.push({
        name: name,
        role: role,
      });
    }

    browser.close();

    return {
      title,
      release_date,
      overview,
      userScore,
      imgUrl,
      crew,
    };
  } catch (error) {
    console.log(error);
  }
}

app.get("/", (req, res) => {
  res.render("search");
});

app.get("/results", async function (req, res) {
  let url = req.query.search;

  browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  let data = await scrapData(url, page);

  res.render("results", { data: data });
});

const port = process.env.PORT;

app.listen(port, () => {
  console.log("server running on port: " + port);
});
