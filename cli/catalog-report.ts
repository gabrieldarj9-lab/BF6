import {
  formatCatalogMigrationReport,
  getCatalogMigrationReport,
} from "../src/data/migration/catalog-report";

const report = getCatalogMigrationReport();
console.log(formatCatalogMigrationReport(report));

if (report.totals.structuralErrors > 0) {
  process.exitCode = 1;
}
