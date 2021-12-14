import express from "express";
import puppeteer from "puppeteer";
import * as path from "path";
import cors from "cors";
import * as fs from "fs";

const app = express();

app.use(cors());
app.use(express.json());

type ScreenshotUpdate = {
  sources: string[];
  url: string;
  sizes: { width: number; height: number }[];
};

const browserPromise = puppeteer.launch();

app.post("/update", async (req, res) => {
  const body: ScreenshotUpdate = req.body;
  const browser = await browserPromise;
  const page = await browser.newPage();
  const screenshots: {
    screenshot: string;
    source: string;
    size: { width: number; height: number };
    url: string;
  }[] = [];

  try {
    for (const size of body.sizes) {
      await page.setViewport(size);

      for (const source of body.sources) {
        const location = new URL(body.url, source);
        await page.setCookie({
          name: "CookieConsent",
          value: "true",
          domain: location.host,
          path: "/",
          expires: 9999999999,
          httpOnly: false,
          secure: true,
          sameSite: "Lax",
        });
        await page.goto(location.toString());
        await page.evaluate(() => {
          return new Promise((resolve) => {
            window.scrollTo({
              behavior: "smooth",
              top: document.scrollingElement?.scrollHeight,
            });
            setTimeout(() => {
              window.scrollTo({ top: 0 });
              resolve(null);
            }, 1000);
          });
        });
        await page.waitForTimeout(1000);

        const screenshotName =
          Buffer.from(JSON.stringify({ source, url: body.url, size }))
            .toString("base64")
            .replace("/", ",") + ".png";

        await page.screenshot({
          path: path.join(__dirname, "screenshots", screenshotName),
          fullPage: true,
        });
      }
    }

    res.json(await getStoredShots());
  } catch (e) {
    console.error(e);
    res.status(500);
    res.json(e);
  } finally {
    page.close();
  }
});

async function getStoredShots() {
  const shotNames = await fs.promises.readdir(
    path.join(__dirname, "screenshots")
  );

  return shotNames.map((file) => {
    const name = file.split(".")[0].replace(",", "/");
    const json = JSON.parse(Buffer.from(name, "base64").toString("utf-8"));

    return { ...json, screenshot: file };
  });
}

app.get("/stored-screenshots", async (req, res) => {
  res.json(await getStoredShots());
});
app.use("/screenshots", express.static(path.join(__dirname, "screenshots")));

app.post("/diff", (req) => {
  const body: ScreenshotUpdate = req.body;
});

app.listen(5001);
