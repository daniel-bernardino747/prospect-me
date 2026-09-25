import { defineRailway, github, project, service } from "railway/iac";

export default defineRailway(() => {
  const labs = service("labs", {
    source: github("daniel-bernardino747/prospect-me", { branch: "master", checkSuites: false }),
    // Only labs/ goes to a builder (ADR-0001); the standalone server is started
    // with its assets copied beside it by the build (labs/scripts/standalone-assets.js).
    build: "npm run build -w @prospect-me/labs",
    start: "npm run serve -w @prospect-me/labs",
    // Next's standalone server binds to HOSTNAME, which the container sets to its
    // own name; "::" makes it reachable by Railway's proxy.
    replicas: { "us-east4-eqdc4a": 1 },
    domains: ["labs.teamdbsolutions.com"],
    env: { HOSTNAME: "::", PORT: "8080" },
  });

  return project("prospect-me-labs", {
    resources: [labs],
  });
});
