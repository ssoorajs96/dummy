import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import session from "express-session";
import { createServer } from "http";
import passport from "passport";
import path from "path";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { errorHandler } from "./src/middlewares/error.middlewares.js";
import userRouter from './src/routes/user.routes.js'
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
    pingTimeout: 60000,
    cors: {
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    },
});

app.set("io", io); // using set method to mount the `io` instance on the app to avoid usage of `global`

// global middlewares
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use("/assets", express.static(path.join(__dirname, 'public/assets')));
app.use(cookieParser());

// required for passport
app.use(
    session({
        secret: crypto.randomBytes(20).toString("hex"),
        resave: true,
        saveUninitialized: true,
    })
); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
// common error handling middleware

//routes
app.use("/api/users", userRouter);
app.use(errorHandler);


export { httpServer };