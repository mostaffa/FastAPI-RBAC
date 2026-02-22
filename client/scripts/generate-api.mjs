import { generate } from "openapi-typescript-codegen"

await generate({
  input: "https://dev.mostafaothman.com/api/openapi.json",
  output: "./src/api",
  httpClient: "fetch",
  useOptions: true,
  useUnionTypes: true,
  exportCore: true,
})

console.log("API client generated successfully.")
