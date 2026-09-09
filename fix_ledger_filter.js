const fs = require("fs");
let content = fs.readFileSync("app/(drawer)/parties/[id].tsx", "utf8");

// Replace the date filtering logic with a robust day-only comparison
const oldFilter = `      // Filter bills within range
      const fromTime = new Date(fromDate); fromTime.setHours(0, 0, 0, 0);
      const toTime = new Date(toDate); toTime.setHours(23, 59, 59, 999);
  
      const filteredBills = partyBills.filter(b => {
        const bDate = new Date(b.date);
        return bDate >= fromTime && bDate <= toTime;
      });`;

const newFilter = `      // Normalize date to YYYY-MM-DD string to avoid timezone issues
      const toDateOnly = (d: Date) => {
        return \`\${d.getFullYear()}-\${String(d.getMonth()+1).padStart(2,"0")}-\${String(d.getDate()).padStart(2,"0")}\`;
      };
      const parseBillDate = (dateStr: string): string => {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) return toDateOnly(d);
        // Try manual parse for "9 Sep 2026" format
        const months: Record<string,string> = {jan:"01",feb:"02",mar:"03",apr:"04",may:"05",jun:"06",jul:"07",aug:"08",sep:"09",oct:"10",nov:"11",dec:"12"};
        const parts = dateStr.trim().split(/[ ,]+/);
        if (parts.length >= 3) {
          const day = String(parts[0]).padStart(2,"0");
          const mon = months[parts[1].toLowerCase().slice(0,3)] || "01";
          const yr = parts[2];
          return \`\${yr}-\${mon}-\${day}\`;
        }
        return dateStr;
      };

      const fromStr = toDateOnly(fromDate);
      const toStr = toDateOnly(toDate);

      const filteredBills = partyBills.filter(b => {
        const bStr = parseBillDate(b.date);
        return bStr >= fromStr && bStr <= toStr;
      });`;

content = content.replace(oldFilter, newFilter);
fs.writeFileSync("app/(drawer)/parties/[id].tsx", content);
console.log("Done. Filter replaced:", content.includes("parseBillDate"));

