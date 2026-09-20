import { productionPools } from "../src/data/productionLevels";
import { validateProductionPools } from "../src/data/productionValidation";

const report = validateProductionPools(productionPools);

for (const [tier, count] of Object.entries(report.tierCounts)) console.log(`${tier.toUpperCase()}: ${count} approved production variant${count === 1 ? "" : "s"}`);
for (const failure of report.failures) console.error(`${failure.tier.toUpperCase()} ${failure.variantId}: ${failure.reason}`);
if (report.tiersBelowUsefulMinimum.length) console.warn(`Below useful minimum (3): ${report.tiersBelowUsefulMinimum.join(", ")}`);
if (report.tiersBelowPreferredMinimum.length) console.warn(`Below preferred minimum (5): ${report.tiersBelowPreferredMinimum.join(", ")}`);

if (report.failures.length || report.tiersBelowUsefulMinimum.length) process.exit(1);
