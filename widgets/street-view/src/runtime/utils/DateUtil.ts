export const parseDate = (val: any) => {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === "number") return new Date(val); // às vezes vem como epoch
  return new Date(val.toString().replace(" ", "T")); // garante formato ISO
};