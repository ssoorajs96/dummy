// import express from "express";
// import cors from "cors";
// import mongoose from "mongoose";
// import authRoutes from "./routes/auth.js"
// import dotenv from "dotenv";
// import helmet from "helmet";
// import multer from "multer";
// import path from "path";
// import { fileURLToPath } from "url";
// import { setAvatar } from "./controllers/user.js";
// import morgan from "morgan";
// import bodyParser from "body-parser";

// const __fileName = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__fileName);
// const app = express();
// dotenv.config();

// app.use(cors());
// app.use(express.json());
// app.use(helmet());
// app.use(morgan("common"));
// app.use(bodyParser.json({ limit: "30mb", extended: true }));
// app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
// app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
// app.use("/assets", express.static(path.join(__dirname, 'public/assets')));

// // file storage
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, "public/assets");
//     },
//     filename: function (req, file, cb) {
//         cb(null, file.originalname);
//     }
// });

// const upload = multer({ storage });

// //api routes
// app.use("/api/auth", authRoutes);
// app.post("/api/user/set-avatar/:id", upload.single("picture"), setAvatar)

// // Mongoose setup
// const PORT = process.env.PORT || 6001;
// mongoose.connect(process.env.MONGO_URL, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// }).then(() => {
//     app.listen(PORT, () => console.log(`mongo connection successfull and server port: ${PORT}`));
// }).catch((error) => console.log(`${error} did not connect`))


import dotenv from "dotenv";
import { httpServer } from "./app.js";
import connectDB from "./src/db/index.js";

dotenv.config({
    path: "./.env",
});

/**
 * Starting from Node.js v14 top-level await is available and it is only available in ES modules.
 * This means you can not use it with common js modules or Node version < 14.
 */
const majorNodeVersion = +process.env.NODE_VERSION?.split(".")[0] || 0;

const startServer = () => {
    httpServer.listen(process.env.PORT || 8080, () => {
        console.info(
            `📑 Visit the documentation at: http://localhost:${process.env.PORT || 8080
            }`
        );
        console.log("⚙️  Server is running on port: " + process.env.PORT);
    });
};

if (majorNodeVersion >= 14) {
    try {
        await connectDB();
        startServer();
    } catch (err) {
        console.log("Mongo db connect error: ", err);
    }
} else {
    connectDB()
        .then(() => {
            startServer();
        })
        .catch((err) => {
            console.log("Mongo db connect error: ", err);
        });
}