type PublicTool = {
  name: string;
  description: string;
  inputSchema: { type: "object"; properties: Record<string, unknown>; additionalProperties: false };
  annotations: { readOnlyHint: true };
  execute: (input: unknown) => Promise<unknown>;
};
type ModelContext = { registerTool: (tool: PublicTool) => void | Promise<void> };

export async function registerPublicAgentTools(): Promise<void> {
  const context = (document as Document & { modelContext?: ModelContext }).modelContext
    ?? (navigator as Navigator & { modelContext?: ModelContext }).modelContext;
  if (!context?.registerTool) return;
  const pages = [
    { name: "Services", url: "https://alazab.com/services" },
    { name: "Luxury finishing", url: "https://alazab.com/services/luxury-finishing" },
    { name: "General supplies", url: "https://alazab.com/services/general-supplies" },
    { name: "UberFix maintenance", url: "https://alazab.com/services/uberfix" },
    { name: "Brand identity", url: "https://alazab.com/services/brand-identity" },
    { name: "Public projects", url: "https://alazab.com/projects-gallery" },
    { name: "Contact", url: "https://alazab.com/contact" },
  ];
  await context.registerTool({
    name: "list_alazab_public_pages",
    description: "Return official public Alazab service, project and contact links. No private data or write actions.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    execute: async (input) => {
      if (input === null || typeof input !== "object" || Array.isArray(input) || Object.keys(input).length !== 0) {
        throw new Error("Expected an empty object");
      }
      return { pages };
    },
  });
}
