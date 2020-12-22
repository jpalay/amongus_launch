// These should be at the top of the file
import Bundler from "parcel-bundler";
import path from "path";

import express from "express";

const app = express();
const port = 4000 || process.env.PORT;

// replace the call to app.get with:
const bundler = new Bundler(path.join(__dirname, "../src/client/index.html"));
app.use(bundler.middleware());

app.use(express.static('../assets'))

app.listen(port, () => {
  // tslint:disable-next-line:no-console
  console.log(`server started at http://localhost:${port}`);
});
