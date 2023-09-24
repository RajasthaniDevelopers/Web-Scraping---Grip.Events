import fs from "fs";
import xlsx from "xlsx";
import axios from "axios";

const baseURL = "https://api-prod.grip.events/1/container/5956";
const apiToken = "3d58cec7-a0d5-4bec-b1ff-19b6574b7f4c"; // put the fresh api token here.
const jsonDataLocation = "thing-data.json";
const formattedJSONdataLocation = "formattedData.json";

main();
const startTime = new Date();
console.log("start time", startTime);

async function fetchThings(pageCount) {
  const allThings = [];

  for (let page = 1; page <= pageCount; page++) {
    const pageURL = `${baseURL}/search?page=${page}`;

    try {
      const response = await axios.get(pageURL, {
        headers: {
          authority: "api-prod.grip.events",
          accept: "application/json",
          "accept-language": "en-gb",
          "cache-control": "No-Cache",
          "content-type": "application/json",
          "login-source": "web",
          origin: "https://matchmaking.grip.events",
          pragma: "No-Cache",
          referer:
            "https://matchmaking.grip.events/techcrunchdisrupt2023/app/home/network/list/57864",
          "sec-ch-ua":
            '"Google Chrome";v="117", "Not;A=Brand";v="8", "Chromium";v="117"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Linux"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          "user-agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
          "x-authorization": apiToken,
          "x-grip-version": "Web/22.0.6",
        },
      });

      const thingsOnPage = response.data.data.map((x) => x.id).filter((x) => x); // Assuming the results are in an array
      // console.log(thingsOnPage);
      // console.log(thingsOnPage);
      // await setTimeout(() => {}, 100000);

      // Extract and store the IDs of things on this page
      const thingIDsOnPage = thingsOnPage.map((thing) => thing);
      thingIDsOnPage.forEach((x) => {
        allThings.push(x);
      });
      console.log("added", page);
    } catch (error) {
      console.error(`Failed to fetch page ${page}: ${error.message}`);
    }
  }

  return allThings;
}

async function fetchThingDetails(thingID) {
  await waitFor_seconds(3);
  const thingURL = `${baseURL}/thing/${thingID}`;
  return new Promise((resolve, reject) => {
    axios
      .get(thingURL, {
        headers: {
          authority: "api-prod.grip.events",
          accept: "application/json",
          "accept-language": "en-gb",
          "cache-control": "No-Cache",
          "content-type": "application/json",
          "login-source": "web",
          origin: "https://matchmaking.grip.events",
          pragma: "No-Cache",
          referer:
            "https://matchmaking.grip.events/techcrunchdisrupt2023/app/profile/6949642",
          "sec-ch-ua":
            '"Google Chrome";v="117", "Not;A=Brand";v="8", "Chromium";v="117"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Linux"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          "user-agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
          "x-authorization": apiToken,
          "x-grip-version": "Web/22.0.6",
        },
      })
      .then((res) => {
        resolve(res.data.data);
      })
      .catch((err) => {
        reject(`Failed to fetch thing ${thingID}: ${err.message}`);
        console.log(`Failed to fetch thing ${thingID}: ${err.message}`);
      });
  });
}

async function main() {
  const pageCount = 488; // Replace with the total number of pages
  // const pageCount = 1;
  const allThingIDs = await fetchThings(pageCount);
  console.log("allThingIDs", allThingIDs);

  const allThingDetails = [];

  for (let i = 0; i < allThingIDs.length; i++) {
    try {
      const thingDetails = await fetchThingDetails(allThingIDs[i]);
      if (thingDetails) {
        allThingDetails.push(thingDetails);
        console.log("pushed ", thingDetails.name, "in allThingDetails");
      }
    } catch (err) {
      console.log("err", err);
    } finally {
      if (i == allThingIDs.length - 1) {
        console.log("allThingsDetails", allThingDetails.length);

        // Write allThingDetails to a JSON file
        fs.writeFileSync(
          jsonDataLocation,
          JSON.stringify(allThingDetails, null, 2)
        );
        console.log("thingDetails.json updated");
      }
    }
  }
  furtherProcess();
}

function formatJSONdata(data) {
  const result = [];
  data.forEach((item) => {
    const {
      name,
      first_name,
      last_name,
      headline,
      summary,
      job_title,
      company_name,
      location,
      location_code,
      picture_url,
      rtm_raw,
    } = item;

    const xyz = {
      name,
      first_name,
      last_name,
      headline,
      summary,
      job_title,
      company_name,
      location,
      location_code,
      picture_url,
      // details: {},
    };

    // Convert rtm_raw to details using destructuring
    for (const key in rtm_raw) {
      if (rtm_raw.hasOwnProperty(key)) {
        const formattedKey = key.replace(/^app-780-/, "").replace(/-1$/, "");
        xyz[formattedKey] = rtm_raw[key].value;
      }
    }

    result.push(xyz);
  });
  return result;
}

function furtherProcess() {
  try {
    const jsonData = JSON.parse(fs.readFileSync(jsonDataLocation, "utf8"));
    console.log("jsonData parsed");
    // Call the function to format the JSON data
    const formattedJSON = formatJSONdata(jsonData);
    fs.writeFileSync(
      formattedJSONdataLocation,
      JSON.stringify(formattedJSON, null, 2)
    );
    console.log("json data formatted");
  } catch (err) {
    console.error("Error reading or parsing JSON file:", err);
  } finally {
    (() => {
      // Read the JSON data
      const jsonData = fs.readFileSync(formattedJSONdataLocation, "utf8");
      const data = JSON.parse(jsonData);

      // Extract all unique keys from the JSON objects and replace underscores with spaces
      let allKeys = [];
      data.forEach((item) => {
        Object.keys(item).forEach((key) => {
          const normalizedKey = key.replace(/_/g, " "); // Replace underscores with spaces
          if (!allKeys.includes(normalizedKey)) {
            allKeys.push(normalizedKey);
          }
        });
      });

      // Normalize the data by ensuring all keys exist and filling missing values with null
      const normalizedData = data.map((item) => {
        const normalizedItem = {};
        allKeys.forEach((key) => {
          const originalKey = key.replace(/ /g, "_"); // Replace spaces with underscores
          normalizedItem[key] = item[originalKey] || null;
        });
        return normalizedItem;
      });

      // Create a worksheet
      const ws = xlsx.utils.json_to_sheet(normalizedData);

      // Create a workbook and add the worksheet
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Sheet 1");

      // Write to Excel file
      xlsx.writeFile(wb, "output.xlsx");
      const endTime = new Date();
      console.log(endTime);
      console.log(
        "took",
        (Date.parse(startTime) - Date.parse(endTime)) / 1000,
        "seconds"
      );
    })();
  }
}

async function waitFor_seconds() {
  return new Promise((res) => {
    setTimeout(() => {
      res();
    }, seconds * 1000);
  });
}