"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("../app"));
const PORT = process.env.PORT || 3000;
async function startServer() {
    try {
        app_1.default.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error("Failed to start server");
        process.exit(1);
    }
}
// handle graceful shutdown
process.on("SIGINT", async () => {
    console.log("Shutting down gracefully...");
    process.exit(0);
});
startServer();
//# sourceMappingURL=server.js.map