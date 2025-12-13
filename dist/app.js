"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const error_handler_1 = require("./middleware/error-handler");
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), ".env") });
const payment_route_1 = __importDefault(require("./routes/payment.route"));
const utils_1 = require("./utils");
const app = (0, express_1.default)();
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: [
        "http://196.201.214.200",
        "http://196.201.214.206",
        "http://196.201.213.114",
        "http://196.201.214.207",
        "http://196.201.214.208",
        "http://196.201.213.44",
        "http://196.201.212.127",
        "http://196.201.212.138",
        "http://196.201.212.129",
        "http://196.201.212.136",
        "http://196.201.212.74",
        "http://196.201.212.69",
        `${process.env.NODE_ENV === "dev" ? "http://localhost:3000" : process.env.APP_URL}`,
    ],
    credentials: true,
}));
// routes
app.get("/health", utils_1.utils.tryCatchBlock(async (req, res) => {
    await utils_1.utils.healthCheck();
    return res.status(200).send({
        message: "Health check endpoint success.",
    });
}));
app.use("/v1/pay", payment_route_1.default);
// errorHandler
app.use(error_handler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map