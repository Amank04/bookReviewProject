import express from "express";
import bodyParser from "body-parser";
import moment from "moment";
import pg from "pg";
import multer from "multer";
import env from "dotenv";


const app = express();
const port = 3000;

env.config();

// Set up multer storage
const storage = multer.memoryStorage(); // Store the file in memory
const upload = multer({ storage: storage });

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function reviews() {
  const result = await db.query("SELECT * FROM books");
  const items = result.rows.map((item) => {
    // Convert date to the form: 20 Aug 2024
    item.date_read = moment(item.date_read).format('MMM DD YYYY');

    // Convert hexadecimal image data to binary
    // if (item.images) {
    //   item.imageBuffer = Buffer.from(item.images, 'hex').toString('base64');
    //   // console.log(item.imageBuffer)
    // }

    return item;
  });
  return items;
}

app.get("/", async (req, res) => {
  try {
    const items = await reviews();

    res.render("index.ejs", { items: items });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/add", (req, res) => {

  res.render("modify.ejs");
});

app.get("/delete/:id", async (req, res) => {
  // console.log(req.params.id);
  await db.query("DELETE FROM books WHERE id = $1", [req.params.id]);

  res.redirect("/");
});

app.get("/edit/:id", async (req, res) => {
  const reviewId = req.params.id;

  const items = await reviews();
  const foundObject = items.find(obj => obj.id == reviewId);
  console.log(foundObject);

  function convertDateFormat(inputDate) {
    const date = new Date(inputDate);

    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
    const day = date.getUTCDate().toString().padStart(2, '0');

    const formattedDate = `${year}-${month}-${parseInt(day) + parseInt(1)}`;

    return formattedDate;
  }

  const originalDate = foundObject.date_read;
  const formattedDate = convertDateFormat(originalDate);
  console.log(formattedDate);


  res.render("modify.ejs", { item: foundObject, date_read: formattedDate });
});

app.post("/save", upload.single('photo'), async (req, res) => {
  console.log(req.body.author);
  const input = req.body;

  // Access the uploaded file from req.file
  const imageDataBuffer = req.file.buffer;
  // console.log(imageDataBuffer);
  await db.query("INSERT INTO books (title,author,date_read,rating,notes,images) VALUES ($1,$2,$3,$4,$5,$6)", [input.title, input.author, input['date-read'], input.rating, input.notes, imageDataBuffer]);


  res.redirect("/");
});

app.post("/update/:id", upload.single('photo'), async (req, res) => {
  // console.log(req.body);
  const input = req.body;
  // console.log(input);
  const id = req.params.id;
  // console.log(id);


  if (req.file != undefined) {
    const imageDataBuffer = req.file.buffer;
    await db.query("UPDATE books SET title = $1, author = $2, date_read = $3, rating = $4, notes = $5, images = $6 WHERE id = $7", [input.title, input.author, input['date-read'], input.rating, input.notes, imageDataBuffer, id]);
  } else {
    await db.query("UPDATE books SET title = $1, author = $2, date_read = $3, rating = $4, notes = $5 WHERE id = $6", [input.title, input.author, input['date-read'], input.rating, input.notes, id]);
  }

  res.redirect("/");
});

app.post("/sort", async (req, res) => {
  // console.log(req.body);
  const sort = req.body.sort;
  console.log(sort);

  // console.log(items);
  const items = await sortReviews(sort);


  res.render("index.ejs", { items: items });
})

async function sortReviews(method) {
  let result;

  if (method == "rating") {
    result = await db.query("SELECT * FROM books ORDER BY rating DESC");
  } else if (method == "recency") {
    result = await db.query("SELECT * FROM books ORDER BY date_read DESC");
  }

  const items = result.rows.map((item) => {
    // Convert date to the form: 20 Aug 2024
    item.date_read = moment(item.date_read).format('MMM DD YYYY');

    return item;
  });
  return items;
}

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
