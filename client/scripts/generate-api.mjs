import { generate } from "openapi-typescript-codegen"

await generate({
  input: "http://localhost:4001/api/openapi.json",
  output: "./src/api",
  httpClient: "fetch",
  useOptions: true,
  useUnionTypes: true,
  exportCore: true,
})

console.log("API client generated successfully.")
