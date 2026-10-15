import {
  acknowledgeDemoAlert,
  commitDemoImport,
  createDemoBudget,
  createDemoImportPreview,
  deleteDemoBudget,
  demoUser,
  getDemoBudget,
  getDemoImport,
  getDemoImportPending,
  listDemoAlerts,
  listDemoBillingRecords,
  listDemoBudgets,
  listDemoImports,
  listDemoRecommendations,
  markDemoImportFailed,
  refreshDemoInsights,
  updateDemoBudget,
} from "@/lib/demo/store";
import type { DataBackend } from "@/lib/data/types";

export function createDemoBackend(): DataBackend {
  const userId = demoUser.id;
  return {
    kind: "demo",
    user: {
      id: demoUser.id,
      email: demoUser.email,
      displayName: demoUser.displayName,
      preferredCurrency: demoUser.preferredCurrency,
    },
    async listImports() {
      return listDemoImports(userId);
    },
    async getImport(id) {
      return getDemoImport(id, userId);
    },
    async getImportPending(id) {
      return getDemoImportPending(id);
    },
    async createImportPreview(input) {
      return createDemoImportPreview({ ...input, userId });
    },
    async markImportFailed(id, message) {
      return markDemoImportFailed(id, message, userId);
    },
    async commitImport(id) {
      return commitDemoImport(id, userId);
    },
    async listBillingRecords() {
      return listDemoBillingRecords(userId);
    },
    async listBudgets() {
      return listDemoBudgets(userId);
    },
    async getBudget(id) {
      return getDemoBudget(id, userId);
    },
    async createBudget(input) {
      return createDemoBudget(input, userId);
    },
    async updateBudget(id, input) {
      return updateDemoBudget(id, input, userId);
    },
    async deleteBudget(id) {
      return deleteDemoBudget(id, userId);
    },
    async listAlerts() {
      return listDemoAlerts(userId);
    },
    async acknowledgeAlert(id) {
      return acknowledgeDemoAlert(id, userId);
    },
    async listRecommendations() {
      return listDemoRecommendations(userId);
    },
    async refreshInsights(importId = null) {
      return refreshDemoInsights(userId, importId);
    },
  };
}
