if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const tpToken = process.env.TP_TOKEN;
const gitlabToken = process.env.GITLAB_TOKEN;

console.log("tpToken: ", tpToken);
console.log("gitlab token: ", gitlabToken);
