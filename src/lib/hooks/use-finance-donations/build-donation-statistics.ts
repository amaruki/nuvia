import type { Donation, DonationStatistics } from "@/types/finance";

/**
 * Statistics are derived client-side from the aggregate window rows — never
 * invented and never fetched from a separate endpoint. Money figures count
 * completed donations only (that is what was actually raised); the trend
 * and breakdowns report every row so pledged/pending gifts stay visible.
 */
export function buildDonationStatistics(donations: Donation[]): DonationStatistics {
  const completed = donations.filter((donation) => donation.status === "completed");
  const completedAmount = completed.reduce((sum, donation) => sum + donation.amount, 0);
  const completedCount = completed.length;

  const now = new Date();
  const thisMonthAmount = completed
    .filter(
      (donation) =>
        donation.donationDate.getFullYear() === now.getFullYear() &&
        donation.donationDate.getMonth() === now.getMonth(),
    )
    .reduce((sum, donation) => sum + donation.amount, 0);

  // Donors are matched by email (case-insensitive): the store has no user
  // FK, so the email address is the only donor identity available.
  const donors = new Map<string, { email: string; recurring: boolean }>();
  for (const donation of donations) {
    const key = donation.donorEmail.trim().toLowerCase();
    const existing = donors.get(key);
    donors.set(key, {
      email: key,
      recurring: (existing?.recurring ?? false) || donation.donationType === "recurring",
    });
  }

  const byMonth = new Map<string, { amount: number; count: number }>();
  for (const donation of donations) {
    const key = `${donation.donationDate.getFullYear()}-${String(donation.donationDate.getMonth() + 1).padStart(2, "0")}`;
    const bucket = byMonth.get(key) ?? { amount: 0, count: 0 };
    bucket.amount += donation.amount;
    bucket.count += 1;
    byMonth.set(key, bucket);
  }

  const byCampaign = new Map<string, { amount: number; count: number }>();
  for (const donation of donations) {
    const key = donation.campaign ?? "General";
    const bucket = byCampaign.get(key) ?? { amount: 0, count: 0 };
    bucket.amount += donation.amount;
    bucket.count += 1;
    byCampaign.set(key, bucket);
  }

  const byDonorType = new Map<string, { amount: number; count: number }>();
  for (const donation of donations) {
    const bucket = byDonorType.get(donation.donorType) ?? { amount: 0, count: 0 };
    bucket.amount += donation.amount;
    bucket.count += 1;
    byDonorType.set(donation.donorType, bucket);
  }

  return {
    totalDonations: donations.length,
    totalAmount: completedAmount,
    completedAmount,
    pendingAmount: donations
      .filter((donation) => donation.status === "pending")
      .reduce((sum, donation) => sum + donation.amount, 0),
    pledgedAmount: donations
      .filter((donation) => donation.status === "pledged")
      .reduce((sum, donation) => sum + donation.amount, 0),
    thisMonthAmount,
    averageDonation: completedCount > 0 ? completedAmount / completedCount : 0,
    donorCount: donors.size,
    recurringDonorCount: Array.from(donors.values()).filter((donor) => donor.recurring).length,
    monthlyTrend: Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, bucket]) => ({ month, amount: bucket.amount, count: bucket.count })),
    campaignBreakdown: Array.from(byCampaign.entries())
      .map(([campaignName, bucket]) => ({
        campaignId: campaignName.toLowerCase().replace(/\s+/g, "-"),
        campaignName,
        amount: bucket.amount,
        count: bucket.count,
      }))
      .sort((a, b) => b.amount - a.amount),
    donorTypeBreakdown: Array.from(byDonorType.entries()).map(([donorType, bucket]) => ({
      donorType,
      amount: bucket.amount,
      count: bucket.count,
    })),
  };
}
